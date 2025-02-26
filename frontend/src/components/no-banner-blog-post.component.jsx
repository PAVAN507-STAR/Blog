import React from "react";
import { Link } from "react-router-dom";
import { formatDate } from "../common/date";

const NoBannerBlogPost = ({ blog }) => {
  return (
    <div className="border-b border-grey py-6">
      <div className="flex items-center gap-2 mb-3">
        <Link to={`/user/${blog.author.personal_info.username}`} className="flex items-center gap-2">
          {blog.author.personal_info.profile_img ? (
            <img
              src={blog.author.personal_info.profile_img}
              alt={blog.author.personal_info.fullname}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {blog.author.personal_info.fullname[0]}
            </div>
          )}
          <span className="text-dark-grey">{blog.author.personal_info.fullname}</span>
        </Link>
        <span className="text-dark-grey">•</span>
        <span className="text-dark-grey">{formatDate(blog.publishedAt)}</span>
      </div>
      
      <Link to={`/blog/${blog.blog_id}`}>
        <h3 className="text-2xl font-bold mb-2 hover:underline">{blog.title}</h3>
        <p className="text-dark-grey mb-3 line-clamp-2">{blog.des}</p>
      </Link>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {blog.tags.map((tag, i) => (
          <Link 
            key={i} 
            to={`/search/tag/${tag}`}
            className="text-xs bg-grey px-2 py-1 rounded-full text-dark-grey"
          >
            #{tag}
          </Link>
        ))}
      </div>
      
      <div className="flex items-center gap-4 text-dark-grey">
        <span className="flex items-center gap-1">
          <i className="fi fi-rr-heart"></i>
          {blog.activity.total_likes}
        </span>
        
        <span className="flex items-center gap-1">
          <i className="fi fi-rr-comment"></i>
          {blog.activity.total_comments}
        </span>
        
        <span className="flex items-center gap-1 ml-auto">
          <i className="fi fi-rr-book-alt"></i>
          {blog.activity.read_time} min read
        </span>
      </div>
    </div>
  );
};

export default NoBannerBlogPost; 