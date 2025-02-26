import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken'
import cors from 'cors'
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Importing Schemas
import User from './Schema/User.js';
import Blog from './Schema/Blog.js';
import Comment from './Schema/Comment.js';
import Notification from './Schema/Notification.js';

const app = express();
const port = process.env.PORT || 5001;

app.use(cors())
app.use(express.json());
dotenv.config();

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

//Token Verification Jargon Logic
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
  
    if (!token) {
      return res.status(401).json({ "error": "Access denied, no token provided" });
    }
  
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) return res.status(403).json({ "error": "Invalid token" });
  
      req.user = decoded; 
      next();
    });
  };
  
//Connecting To DB
mongoose.connect(process.env.DB_URL, { autoIndex: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Clerk token verification middleware
const verifyClerkToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }
    
    // In a real implementation, you would verify the token with Clerk's API
    // For this mock server, we'll just accept any token
    req.user = { sub: 'user_mock_id' }; // Mock user ID
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

//Generate Username if it's not unique
const generateusername = async(email)=>{
    let username = email.split("@")[0];

    let notunique = await User.exists({"personal_info.username":username}).then((result)=>result);
    
    notunique?username+=nanoid().substring(0,5):"";
    return username
}

const formatdatatosend = (user, res) => {
    const accessToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '30d' });
    console.log("access token is :",accessToken)
    res.cookie('token', accessToken, {
      httpOnly: true,   // Prevents client-side JavaScript from accessing the token
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'strict',  // Prevents CSRF attacks
      maxAge: 30 * 24 * 60 * 60 * 1000  // Token expiry (30 days)
    });
  
    return {
      profile_img: user.personal_info.profile_img,
      username: user.personal_info.username,
      fullname: user.personal_info.fullname
    };
  }
  
//SignUp page Route
app.post('/signup', async (req, res) => {
    let { fullname, email, password } = req.body;
  
    // Validation
    if (fullname.length < 3 || !email.length || !passwordRegex.test(password) || !emailRegex.test(email)) {
      return res.status(403).json({ "error": "Validation failed" });
    }
  
    bcrypt.hash(password, 10, async (err, hashedpass) => {
      if (err) return res.status(500).json({ "error": "Error hashing password" });
  
      let username = await generateusername(email);
  
      let user = new User({
        personal_info: { fullname, email: email.trim(), password: hashedpass, username }
      });
  
      user.save()
        .then((u) => res.status(200).json(formatdatatosend(u, res)))
        .catch((err) => res.status(500).json({ "error": err.message }));
    });
  });

//Signinn Routing 
app.post('/signin', (req, res) => {
    let { email, password } = req.body;
  
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
  
    if (!token) {
      return res.status(401).json({ "error": "Token not provided" });
    }
  
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).json({ "error": "Invalid token" });
      }
  
      // Fetch user details if needed
      User.findById(decoded.id, (err, user) => {
        if (err || !user) {
          return res.status(403).json({ "error": "User not found" });
        }
  
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
  
// User routes
app.post('/user/register', async (req, res) => {
  try {
    const { clerkId, email, fullname, username, profileImage } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 'personal_info.email': email });
    
    if (existingUser) {
      return res.status(200).json({
        user: {
          id: existingUser._id,
          personal_info: existingUser.personal_info
        }
      });
    }
    
    // Create new user
    const finalUsername = username || await generateusername(email);
    
    const newUser = new User({
      clerk_id: clerkId,
      personal_info: {
        fullname,
        email,
        username: finalUsername,
        profile_img: profileImage
      }
    });
    
    await newUser.save();
    
    res.status(201).json({
      user: {
        id: newUser._id,
        personal_info: newUser.personal_info
      }
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user profile
app.get('/user/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ 'personal_info.username': username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's blogs
    const blogs = await Blog.find({ 
      author: user._id,
      draft: false
    })
    .sort({ publishedAt: -1 })
    .limit(5);

    const totalBlogs = await Blog.countDocuments({ 
      author: user._id,
      draft: false
    });

    res.status(200).json({
      // Return data in nested form so the frontend code "profile.personal_info" works
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

// Blog routes
// Create or update blog
app.post('/blog', verifyClerkToken, async (req, res) => {
  console.log("Blog route called");
  try {
    const { title, banner, content, tags, des, draft, blog_id } = req.body;
    const clerkUserId = req.user.sub;
    
    // Find user by Clerk ID
    const user = await User.findOne({ clerk_id: clerkUserId });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (blog_id) {
      // Update existing blog
      const blog = await Blog.findOneAndUpdate(
        { blog_id, author: user._id },
        { title, banner, content, tags, des, draft },
        { new: true }
      );
      
      if (!blog) {
        return res.status(404).json({ error: "Blog not found or you don't have permission to edit" });
      }
      
      return res.status(200).json({ blog });
    } else {
      // Create new blog
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
      
      // Update user's blog count
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

// Get user's blogs
app.get('/user/blogs', verifyClerkToken, async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const clerkUserId = req.user.sub;
    
    // Find user by Clerk ID
    const user = await User.findOne({ clerk_id: clerkUserId });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    let query = { author: user._id };
    
    if (filter === 'published') {
      query.draft = false;
    } else if (filter === 'draft') {
      query.draft = true;
    }
    
    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1 });
    
    res.status(200).json({ blogs });
  } catch (error) {
    console.error('Get user blogs error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get blog by ID
app.get('/blog/:blog_id', async (req, res) => {
  try {
    const { blog_id } = req.params;
    
    const blog = await Blog.findOne({ blog_id })
      .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img');
    
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    
    // Increment read count
    await Blog.findOneAndUpdate(
      { blog_id },
      { $inc: { 'activity.total_reads': 1 } }
    );
    
    // Also increment author's total reads
    await User.findByIdAndUpdate(
      blog.author._id,
      { $inc: { 'account_info.total_reads': 1 } }
    );
    
    res.status(200).json({ blog });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete blog
app.delete('/blog/:blog_id', verifyClerkToken, async (req, res) => {
  try {
    const { blog_id } = req.params;
    const clerkUserId = req.user.sub;
    
    // Find user by Clerk ID
    const user = await User.findOne({ clerk_id: clerkUserId });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Find the blog
    const blog = await Blog.findOne({ blog_id, author: user._id });
    
    if (!blog) {
      return res.status(404).json({ error: "Blog not found or you don't have permission to delete" });
    }
    
    // Delete the blog
    await Blog.deleteOne({ blog_id });
    
    // Update user's blog count
    await User.findByIdAndUpdate(user._id, {
      $inc: { 'account_info.total_posts': -1 },
      $pull: { blogs: blog._id }
    });
    
    // Delete associated comments and notifications
    await Comment.deleteMany({ blog_id: blog._id });
    await Notification.deleteMany({ blog: blog._id });
    
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search blogs
app.get('/search', async (req, res) => {
  try {
    const { query, tag } = req.query;
    
    let findQuery = {};
    
    if (query) {
      findQuery = {
        draft: false,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { des: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }
        ]
      };
    } else if (tag) {
      findQuery = { draft: false, tags: tag };
    } else {
      return res.status(400).json({ error: "Search query or tag is required" });
    }
    
    const blogs = await Blog.find(findQuery)
      .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img')
      .sort({ publishedAt: -1 })
      .limit(20);
    
    res.status(200).json({ blogs });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Home page data
app.get('/home', async (req, res) => {
  try {
    // Get trending blogs (most viewed)
    const trendingBlogs = await Blog.find({ draft: false })
      .sort({ 'activity.total_reads': -1 })
      .limit(6)
      .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img');
    
    // Get recent blogs
    const recentBlogs = await Blog.find({ draft: false })
      .sort({ publishedAt: -1 })
      .limit(10)
      .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img');
    
    // Get popular tags
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

// Get more blogs for pagination
app.get('/blogs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    
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
    console.error('Get blogs error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get related blogs
app.get('/related-blogs', async (req, res) => {
  try {
    const { tag, blog_id } = req.query;
    
    if (!tag || !blog_id) {
      return res.status(400).json({ error: "Tag and blog_id are required" });
    }
    
    const relatedBlogs = await Blog.find({
      blog_id: { $ne: blog_id },
      draft: false,
      tags: tag
    })
    .limit(3)
    .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img');
    
    res.status(200).json({ blogs: relatedBlogs });
  } catch (error) {
    console.error('Related blogs error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search by tag
app.get('/search/tag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    
    const blogs = await Blog.find({
      tags: tag,
      draft: false
    })
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'personal_info.fullname personal_info.username personal_info.profile_img');
    
    const totalBlogs = await Blog.countDocuments({ tags: tag, draft: false });
    
    res.status(200).json({
      blogs,
      hasMore: skip + blogs.length < totalBlogs
    });
  } catch (error) {
    console.error('Search by tag error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's blogs for profile page
app.get('/user/blogs/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    
    const user = await User.findOne({ 'personal_info.username': username });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const blogs = await Blog.find({ 
      author: user._id,
      draft: false
    })
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit);
    
    const totalBlogs = await Blog.countDocuments({ 
      author: user._id,
      draft: false
    });
    
    res.status(200).json({
      blogs,
      hasMore: skip + blogs.length < totalBlogs
    });
  } catch (error) {
    console.error('User blogs error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User sync endpoint
app.post('/user/sync', verifyClerkToken, async (req, res) => {
  try {
    const { fullname, email, username, profileImage } = req.body;
    const clerkUserId = req.user.sub;
    
    // Check if user already exists
    let user = await User.findOne({ clerk_id: clerkUserId });
    
    if (user) {
      // Update existing user
      user.personal_info.fullname = fullname;
      user.personal_info.email = email;
      user.personal_info.username = username;
      user.personal_info.profile_img = profileImage;
      await user.save();
    } else {
      // Create new user
      user = new User({
        clerk_id: clerkUserId,
        personal_info: {
          fullname,
          email,
          username,
          profile_img: profileImage
        },
        account_info: {
          total_posts: 0,
          total_reads: 0
        },
        google_auth: false,
        blogs: []
      });
      await user.save();
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Configure Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Make sure uploads directory exists
if (!fs.existsSync('uploads/')) {
  fs.mkdirSync('uploads/');
}

// Update the upload-image endpoint
app.post('/upload-image', verifyClerkToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }
    
    const filePath = req.file.path;
    const fileName = `blog-images/${Date.now()}-${path.basename(req.file.originalname)}`;
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('blog-images')
      .upload(fileName, fileBuffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600'
      });
    
    // Delete the local file
    fs.unlinkSync(filePath);
    
    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: "Failed to upload to Supabase" });
    }
    
    // Get the public URL
    const { data: urlData } = supabase
      .storage
      .from('blog-images')
      .getPublicUrl(fileName);
    
    const imageUrl = urlData.publicUrl;
    
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

app.listen(port,()=>{
    console.log("Running on ",port)
});
