import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Import Clerk middleware for Express
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

// Importing Schemas
import User from './Schema/User.js';
import Blog from './Schema/Blog.js';
import Comment from './Schema/Comment.js';
import Notification from './Schema/Notification.js';

// Import the user type check middleware
import { checkUserType } from './middleware/userTypeCheck.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Regex definitions
let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

// Connecting To DB
mongoose.connect(process.env.DB_URL, { autoIndex: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Generate Username if it's not unique
const generateusername = async (email) => {
  let username = email.split("@")[0];
  const notunique = await User.exists({ "personal_info.username": username });
  if (notunique) {
    username += nanoid().substring(0, 5);
  }
  return username;
};

const formatdatatosend = (user, res) => {
  // Legacy JWT signing for compatibility with some flows
  const accessToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '30d' });
  console.log("access token is :", accessToken);
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
  return {
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname
  };
};

// ------------------------------
// Public Endpoints (No Clerk middleware)
// ------------------------------

// SignUp page Route
// server.js
app.post('/signup', async (req, res) => {
  const { fullname, email, password, user_type } = req.body;
  if (fullname.length < 3 || !email.length || !passwordRegex.test(password) || !emailRegex.test(email)) {
    return res.status(403).json({ "error": "Validation failed" });
  }
  bcrypt.hash(password, 10, async (err, hashedpass) => {
    if (err) return res.status(500).json({ "error": "Error hashing password" });
    const username = await generateusername(email);
    const user = new User({
      personal_info: { fullname, email: email.trim(), password: hashedpass, username },
      user_type: user_type || 'user'
    });
    user.save()
      .then((u) => res.status(200).json(formatdatatosend(u, res)))
      .catch((err) => res.status(500).json({ "error": err.message }));
  });
});

// Signin Routing 
app.post('/signin', (req, res) => {
  const { email, password } = req.body;
  User.findOne({ 'personal_info.email': email })
    .then((user) => {
      if (!user) return res.status(403).json({ "error": "Email not found" });
      bcrypt.compare(password, user.personal_info.password, (err, result) => {
        if (err || !result) return res.status(403).json({ "error": "Incorrect password" });
        res.status(200).json(formatdatatosend(user, res));
      });
    })
    .catch((err) => res.status(500).json({ "error": err.message }));
});

app.post('/verify-token', (req, res) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ "error": "Token not provided" });
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ "error": "Invalid token" });
    User.findById(decoded.id, (err, user) => {
      if (err || !user) return res.status(403).json({ "error": "User not found" });
      return res.status(200).json({
        username: user.personal_info.username,
        fullname: user.personal_info.fullname,
        profile_img: user.personal_info.profile_img,
        accesstoken: token
      });
    });
  });
});

app.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ message: "Logged out successfully" });
});

// User register (public)
app.post('/user/register', async (req, res) => {
  try {
    const { clerkId, email, fullname, username, profileImage } = req.body;
    const existingUser = await User.findOne({ 'personal_info.email': email });
    if (existingUser) {
      return res.status(200).json({
        user: { id: existingUser._id, personal_info: existingUser.personal_info }
      });
    }
    const finalUsername = username || await generateusername(email);
    const newUser = new User({
      clerk_id: clerkId,
      personal_info: { fullname, email, username: finalUsername, profile_img: profileImage }
    });
    await newUser.save();
    res.status(201).json({
      user: { id: newUser._id, personal_info: newUser.personal_info }
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user profile (public)
app.get('/user/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ 'personal_info.username': username });
    if (!user) return res.status(404).json({ error: "User not found" });
    const blogs = await Blog.find({ author: user._id, draft: false })
      .sort({ publishedAt: -1 })
      .limit(5);
    const totalBlogs = await Blog.countDocuments({ author: user._id, draft: false });
    res.status(200).json({
      user: {
        personal_info: {
          username: user.personal_info.username,
          fullname: user.personal_info.fullname,
          profile_img: user.personal_info.profile_img,
          bio: user.personal_info.bio,
          joinedAt: user.personal_info.joinedAt
        },
        account_info: {
          total_posts: user.account_info.total_posts,
          total_reads: user.account_info.total_reads,
          total_likes: user.account_info.total_likes
        }
      },
      blogs,
      hasMore: blogs.length < totalBlogs
    });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ------------------------------
// Home Endpoint
// ------------------------------
app.get('/home', async (req, res) => {
  try {
    const trendingBlogs = await Blog.find({ draft: false })
      .sort({ 'activity.total_reads': -1 })
      .limit(6)
      .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img')
      .select('title blog_id banner activity tags publishedAt content author');
    const recentBlogs = await Blog.find({ draft: false })
      .sort({ publishedAt: -1 })
      .limit(10)
      .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img')
      .select('title blog_id banner activity tags publishedAt content author');
    const popularTags = await Blog.aggregate([
      { $match: { draft: false } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { name: "$_id", count: 1, _id: 0 } }
    ]);
    res.status(200).json({
      trendingBlogs,
      recentBlogs,
      popularTags,
      hasMore: true
    });
  } catch (error) {
    console.error('Home data error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ------------------------------
// Protected Routes Using ClerkExpressWithAuth()
// ------------------------------

app.post('/user/sync', ClerkExpressWithAuth(), async (req, res) => {
  try {
    const { clerk_id, email, username, fullname, profileImage, user_type } = req.body;
    
    if (!clerk_id) {
      console.warn("Missing clerk_id in user sync request");
      return res.status(400).json({ error: "clerk_id is required" });
    }
    
    const finalUsername = username || email?.split('@')[0] || 'user_' + Date.now();
    
    let user = await User.findOne({ clerk_id });
    
    if (!user) {
      // Create new user – use user_type if provided, defaulting to 'user'
      user = new User({ 
        clerk_id,
        personal_info: { fullname, email: email.trim(), username: finalUsername, profile_img: profileImage },
        account_info: { total_posts: 0, total_reads: 0, total_likes: 0 },
        isAdmin: false,
        user_type: user_type || 'user'
      });
      await user.save();
    } else {
      // Update existing user.
      // Preserve isAdmin and update personal info.
      const isAdmin = user.isAdmin;
      user.personal_info = {
        ...user.personal_info,
        fullname: fullname || user.personal_info.fullname,
        email: email || user.personal_info.email,
        username: finalUsername,
        profile_img: profileImage || user.personal_info.profile_img,
      };
      
      if (user_type) {
        user.user_type = user_type;
      }
      
      user.isAdmin = isAdmin;
      console.log(user)
      await user.save();
    }
    
    res.status(200).json({ 
      user: { 
        personal_info: user.personal_info, 
        blocked: user.isBlocked || false,
        isAdmin: user.isAdmin,
        user_type: user.user_type
      } 
    });
  } catch (error) {
    console.warn("User sync error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Admin Check endpoint (POST version)
app.post('/user/check-admin', async (req, res) => {
  try {
    const { clerk_id } = req.body;
    
    if (!clerk_id) {
      console.warn("Missing clerk_id in check-admin request body");
      return res.status(400).json({ error: "clerk_id is required", isAdmin: false });
    }
    
    const user = await User.findOne({ clerk_id });
    console.log("Found user:", user);
    
    res.json({ isAdmin: !!user?.isAdmin });
  } catch (error) {
    console.error("Check admin error:", error);
    res.status(500).json({ error: "Failed to check admin status" });
  }
});
// Admin Check endpoint (protected)
// Admin Check endpoint (protected)
app.get('/user/check-admin', ClerkExpressWithAuth(), async (req, res) => {
  try {
    // Log the auth object to debug
    console.log("Auth object:", req.auth);
    
    // Get the clerk_id from the auth object
    const clerkId = req.auth.userId;
    
    if (!clerkId) {
      console.warn("Missing clerk_id in check-admin request");
      return res.status(400).json({ error: "clerk_id is required", isAdmin: false });
    }
    
    const user = await User.findOne({ clerk_id: clerkId });
    console.log("Found user:", user);
    
    res.json({ isAdmin: !!user?.isAdmin });
  } catch (error) {
    console.error("Check admin error:", error);
    res.status(500).json({ error: "Failed to check admin status" });
  }
});

// Create or update blog (protected)
app.post('/blog', ClerkExpressWithAuth(), checkUserType(['admin', 'author']), async (req, res) => {
  try {
    const { title, banner, content, tags, des, draft, blog_id } = req.body;
    const clerkUserId = req.auth.userId;
    const user = await User.findOne({ clerk_id: clerkUserId });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (blog_id) {
      const blog = await Blog.findOneAndUpdate(
        { blog_id: blog_id },
        { title, banner, content, tags, des, draft },
        { new: true }
      );
      if (!blog) return res.status(404).json({ error: "Blog not found or permission denied" });
      return res.status(200).json({ blog_id: blog.blog_id });
    } else {
      const newBlogId = nanoid();
      const newBlog = new Blog({
        blog_id: newBlogId,
        title,
        banner,
        content,
        tags,
        des,
        draft,
        author: user._id
      });
      await newBlog.save();
      await User.findByIdAndUpdate(user._id, {
        $inc: { 'account_info.total_posts': 1 },
        $push: { blogs: newBlog._id }
      });
      return res.status(201).json({ blog_id: newBlogId });
    }
  } catch (error) {
    console.error('Blog creation/update error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's blogs (protected)
app.get('/user/blogs', ClerkExpressWithAuth(), checkUserType(['admin', 'author']), async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const clerkUserId = req.auth.userId;
    const user = await User.findOne({ clerk_id: clerkUserId });
    if (!user) return res.status(404).json({ error: "User not found" });
    let query = { author: user._id };
    if (filter === 'published') query.draft = false;
    else if (filter === 'draft') query.draft = true;
    const blogs = await Blog.find(query).sort({ publishedAt: -1 });
    res.status(200).json({ blogs });
  } catch (error) {
    console.error('Get user blogs error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a comment to a blog (protected)
app.post('/blog/:blog_id/comments', ClerkExpressWithAuth(), async (req, res) => {
  try {
    const { blog_id } = req.params;
    const { content, parent_comment } = req.body;
    const clerkUserId = req.auth.userId;
    const user = await User.findOne({ clerk_id: clerkUserId });
    if (!user) return res.status(404).json({ error: "User not found" });
    const blog = await Blog.findOne({ blog_id });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    const comment = new Comment({
      blog: blog._id,
      blog_id: blog._id,
      blog_author: blog.author,
      comment: content,
      commented_by: user._id,
      isReply: !!parent_comment,
      parent_comment: parent_comment || null
    });
    await comment.save();
    if (parent_comment) {
      await Comment.findByIdAndUpdate(parent_comment, { $push: { replies: comment._id } });
    }
    await comment.populate({
      path: 'commented_by',
      select: 'personal_info.fullname personal_info.username personal_info.profile_img clerk_id'
    });
    await Blog.findByIdAndUpdate(blog._id, {
      $inc: { 'activity.total_comments': 1 },
      $push: { comments: comment._id }
    });
    res.status(201).json({ comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a comment (protected)
app.delete('/blog/comment/:comment_id', ClerkExpressWithAuth(), async (req, res) => {
  try {
    const { comment_id } = req.params;
    const clerkUserId = req.auth.userId;
    const user = await User.findOne({ clerk_id: clerkUserId });
    if (!user) return res.status(404).json({ error: "User not found" });
    const comment = await Comment.findById(comment_id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    const blog = await Blog.findById(comment.blog_id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    const isCommentAuthor = comment.commented_by.equals(user._id);
    const isBlogAuthor = blog.author.equals(user._id);
    if (!isCommentAuthor && !isBlogAuthor) return res.status(403).json({ error: "Permission denied" });
    let replyCount = 0;
    if (!comment.parent_id) {
      replyCount = await Comment.countDocuments({ parent_comment: comment._id });
    }
    await Comment.findByIdAndDelete(comment_id);
    if (!comment.parent_id) {
      await Comment.deleteMany({ parent_comment: comment_id });
    }
    const decrementCount = comment.parent_id ? 1 : 1 + replyCount;
    await Blog.findByIdAndUpdate(comment.blog_id, {
      $inc: { 'activity.total_comments': -decrementCount },
      $pull: { comments: comment._id }
    });
    res.status(200).json({ message: "Comment deleted successfully", deletedCount: decrementCount });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Save a blog (protected)
app.post('/user/save-blog/:blog_id', ClerkExpressWithAuth(), async (req, res) => {
  try {
    const { blog_id } = req.params;
    const clerkUserId = req.auth.userId;
    const user = await User.findOne({ clerk_id: clerkUserId });
    if (!user) return res.status(404).json({ error: "User not found" });
    const blog = await Blog.findOne({ blog_id });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    const isAlreadySaved = await User.findOne({
      _id: user._id,
      'saved_blogs.blog_id': blog_id
    });
    if (isAlreadySaved) return res.status(400).json({ error: "Blog already saved" });
    await User.findByIdAndUpdate(user._id, { $push: { saved_blogs: blog._id } });
    res.status(200).json({ saved: true });
  } catch (error) {
    console.error('Save blog error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Unsave a blog (protected)
app.delete('/user/unsave-blog/:blog_id', ClerkExpressWithAuth(), async (req, res) => {
  try {
    const { blog_id } = req.params;
    const clerkUserId = req.auth.userId;
    const user = await User.findOne({ clerk_id: clerkUserId });
    if (!user) return res.status(404).json({ error: "User not found" });
    const blog = await Blog.findOne({ blog_id });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    await User.findByIdAndUpdate(user._id, { $pull: { saved_blogs: blog._id } });
    res.status(200).json({ message: "Blog unsaved successfully" });
  } catch (error) {
    console.error('Unsave blog error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check if a blog is saved by the user (protected)
app.get('/user/saved-blog/:blog_id', ClerkExpressWithAuth(), async (req, res) => {
  try {
    const { blog_id } = req.params;
    const clerkUserId = req.auth.userId;
    const user = await User.findOne({ clerk_id: clerkUserId });
    if (!user) return res.status(404).json({ error: "User not found" });
    const blog = await Blog.findOne({ blog_id });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    const isSaved = user.saved_blogs.includes(blog._id);
    res.status(200).json({ isSaved });
  } catch (error) {
    console.error('Check saved blog error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all saved blogs for a user (protected)
app.get('/user/saved-blogs', ClerkExpressWithAuth(), async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const user = await User.findOne({ clerk_id: clerkUserId });
    if (!user) return res.status(404).json({ error: "User not found" });
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    await user.populate({
      path: 'saved_blogs',
      options: { skip, limit, sort: { publishedAt: -1 } },
      populate: { path: 'author', select: 'personal_info.fullname personal_info.username personal_info.profile_img' }
    });
    const totalSavedBlogs = user.saved_blogs.length;
    res.status(200).json({
      blogs: user.saved_blogs,
      hasMore: skip + user.saved_blogs.length < totalSavedBlogs
    });
  } catch (error) {
    console.error('Get saved blogs error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Blog like/unlike routes (protected)
app.post('/blog/:blog_id/:action', ClerkExpressWithAuth(), async (req, res) => {
  try {
    const { blog_id, action } = req.params;
    const clerkUserId = req.auth.userId;
    const user = await User.findOne({ clerk_id: clerkUserId });
    if (!user) return res.status(404).json({ error: "User not found" });
    const blog = await Blog.findOne({ blog_id });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    const isLiked = user.liked_blogs.includes(blog._id);
    if (action === 'like' && isLiked) return res.status(400).json({ error: "Blog already liked" });
    if (action === 'unlike' && !isLiked) return res.status(400).json({ error: "Blog not liked yet" });
    if (action === 'like') {
      await Promise.all([
        Blog.findByIdAndUpdate(blog._id, { $inc: { 'activity.total_likes': 1 } }),
        User.findByIdAndUpdate(user._id, { $addToSet: { liked_blogs: blog._id } })
      ]);
    } else {
      await Promise.all([
        Blog.findByIdAndUpdate(blog._id, { $inc: { 'activity.total_likes': -1 } }),
        User.findByIdAndUpdate(user._id, { $pull: { liked_blogs: blog._id } })
      ]);
    }
    const updatedBlog = await Blog.findById(blog._id);
    res.status(200).json({
      message: action === 'like' ? "Blog liked successfully" : "Blog unliked successfully",
      totalLikes: updatedBlog.activity.total_likes
    });
  } catch (error) {
    console.error('Like/Unlike blog error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check if a blog is liked by the user (protected)
app.get('/blog/:blog_id/liked', ClerkExpressWithAuth(), async (req, res) => {
  try {
    const { blog_id } = req.params;
    const clerkUserId = req.auth.userId;
    const user = await User.findOne({ clerk_id: clerkUserId });
    if (!user) return res.status(404).json({ error: "User not found" });
    const blog = await Blog.findOne({ blog_id });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    const isLiked = user.liked_blogs.includes(blog._id);
    res.status(200).json({
      isLiked,
      totalLikes: blog.activity.total_likes || 0
    });
  } catch (error) {
    console.error('Check liked blog error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/blogs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Adjust as needed
    const skip = (page - 1) * limit;
    
    // Fetch blogs that are not drafts and sort by published date
    const blogs = await Blog.find({ draft: false })
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img');
    
    const totalBlogs = await Blog.countDocuments({ draft: false });
    res.status(200).json({
      blogs,
      hasMore: skip + blogs.length < totalBlogs
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user stats (protected)
app.get('/user/stats', ClerkExpressWithAuth(), async (req, res) => {
  try {
    const clerkUserId = req.auth.userId;
    const user = await User.findOne({ clerk_id: clerkUserId });
    if (!user) return res.status(404).json({ error: "User not found" });
    const totalBlogs = await Blog.countDocuments({ author: user._id });
    const blogs = await Blog.find({ author: user._id });
    const totalViews = blogs.reduce((sum, blog) => sum + (blog.activity?.total_reads || 0), 0);
    const totalLikes = blogs.reduce((sum, blog) => sum + (blog.activity?.total_likes || 0), 0);
    const totalComments = blogs.reduce((sum, blog) => sum + (blog.activity?.total_comments || 0), 0);
    const savedBlogsCount = user.saved_blogs?.length || 0;
    res.status(200).json({
      total_posts: totalBlogs,
      total_reads: totalViews,
      total_likes: totalLikes,
      total_comments: totalComments,
      saved_blogs: savedBlogsCount
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const isAdmin = async (req, res, next) => {
  try {
    // Get the clerk_id from the auth object
    const clerkId = req.auth.userId;
    
    if (!clerkId) {
      // Try to get the clerk_id from the request headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Extract the token
      const token = authHeader.substring(7);
      
      try {
        // Verify the token manually
        const decoded = jwt.decode(token);
        if (decoded && decoded.sub) {
          // Check if the user with this ID is an admin
          const user = await User.findOne({ clerk_id: decoded.sub });
          if (!user?.isAdmin) {
            return res.status(403).json({ error: "Admin access required" });
          }
          // Add the user to the request for later use
          req.user = user;
          return next();
        }
      } catch (tokenError) {
        console.error("Token verification error:", tokenError);
        return res.status(401).json({ error: "Invalid token" });
      }
    }
    
    // If we have the clerkId from req.auth
    const user = await User.findOne({ clerk_id: clerkId });
    if (!user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    // Add the user to the request for later use
    req.user = user;
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Admin Routes (protected)
app.get('/admin/users', ClerkExpressWithAuth(), isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-clerk_id');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get('/admin/blogs', ClerkExpressWithAuth(), isAdmin, async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img');
    res.status(200).json({ blogs });
  } catch (error) {
    console.error('Fetch admin blogs error:', error);
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});


app.post('/admin/users/:userId/toggle-block', ClerkExpressWithAuth(), isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully` });
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle user block status" });
  }
});

app.delete('/admin/blogs/:blogId', ClerkExpressWithAuth(), isAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.blogId);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    await User.findByIdAndUpdate(blog.author, {
      $inc: { 'account_info.total_posts': -1 },
      $pull: { blogs: blog._id }
    });
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

app.listen(port, () => {
  console.log("Running on ", port);
});

