import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import Animate from "../common/page-animation";
import Loader from "../components/loader.component";
import BlogInteraction from "../components/blog-interaction.component";
import Comments from "../components/comments.component";
import BlogPostCard from "../components/blog-post.component";
import NoBannerBlogPost from "../components/no-banner-blog-post.component";
import NoData from "../components/no-data.component";
import { formatDate } from "../common/date";

const BlogPage = () => {
  const { blog_id } = useParams();
  const { isLoaded, isSignedIn, user } = useUser();
  
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  
  useEffect(() => {
    if (blog_id) {
      fetchBlog();
    }
  }, [blog_id]);
  
  const fetchBlog = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/blog/${blog_id}`
      );
      
      // Parse the content if it's a string
      const blogData = response.data.blog;
      if (typeof blogData.content === 'string') {
        try {
          blogData.content = JSON.parse(blogData.content);
        } catch (e) {
          console.error('Error parsing blog content:', e);
          blogData.content = [];
        }
      }
      
      setBlog(blogData);
      setLoading(false);
      
      // Fetch related blogs
      if (blogData.tags && blogData.tags.length > 0) {
        fetchRelatedBlogs(blogData.tags[0]);
      }
    } catch (error) {
      console.error("Error fetching blog:", error);
      toast.error("Failed to fetch blog");
      setLoading(false);
    }
  };
  
  const fetchRelatedBlogs = async (tag) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/related-blogs?tag=${tag}&blog_id=${blog_id}`
      );
      
      setRelatedBlogs(response.data.blogs);
    } catch (error) {
      console.error("Error fetching related blogs:", error);
    }
  };
  
  if (loading) {
    return <Loader size="lg" />;
  }
  
  if (!blog) {
    return <NoData 
      message="Blog not found" 
      icon="fi-rr-file-xmark"
      actionText="Go Home"
      actionLink="/"
    />;
  }
  
  return (
    <Animate>
      <Toaster />
      
      <article className="max-w-5xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>
        <p className="text-dark-grey mb-6">{blog.des}</p>
        
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/user/${blog.author.personal_info.username}`} className="flex items-center gap-2">
            {blog.author.personal_info.profile_img ? (
              <img 
                src={blog.author.personal_info.profile_img} 
                alt={blog.author.personal_info.fullname} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {blog.author.personal_info.fullname[0]}
              </div>
            )}
            <div>
              <p className="font-medium">{blog.author.personal_info.fullname}</p>
              <p className="text-sm text-dark-grey">@{blog.author.personal_info.username}</p>
            </div>
          </Link>
          
          <span className="text-dark-grey">•</span>
          
          <span className="text-dark-grey">{formatDate(blog.publishedAt)}</span>
          
          <span className="text-dark-grey">•</span>
          
          <span className="text-dark-grey">{blog.activity.read_time} min read</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {blog.tags.map((tag, i) => (
            <Link 
              key={i} 
              to={`/search/tag/${tag}`}
              className="text-sm bg-grey px-3 py-1 rounded-full text-dark-grey hover:bg-black hover:text-white transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
        
        {blog.banner && (
          <img 
            src={blog.banner} 
            alt={blog.title}
            className="w-full max-h-[500px] object-cover rounded-lg mb-8"
          />
        )}
        
        <div className="blog-content">
          {blog.content.map((block, index) => (
            <div key={block.id || index}>
              {block.type === 'paragraph' && <p>{block.data.text}</p>}
              {/* Add other content type handlers as needed */}
            </div>
          ))}
        </div>
        
        <BlogInteraction blog={blog} setBlog={setBlog} />
        
        <Comments blog={blog} setBlog={setBlog} />
        
        {relatedBlogs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Blogs</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedBlogs.map(blog => (
                blog.banner ? (
                  <BlogPostCard key={blog._id} blog={blog} />
                ) : (
                  <NoBannerBlogPost key={blog._id} blog={blog} />
                )
              ))}
            </div>
          </div>
        )}
      </article>
    </Animate>
  );
};

export default BlogPage;
