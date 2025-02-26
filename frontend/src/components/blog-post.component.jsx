import React from "react";
import { Link } from "react-router-dom";
import { formatDate } from "../common/date";

const BlogPostCard = ({ blog }) => {
  if (!blog) return null;
  
  const {
    _id,
    title,
    des,
    banner,
    tags = [],
    author,
    createdAt,
    likes = 0,
    comments = 0,
    views = 0
  } = blog;
  
  // Default author data if missing
  const authorData = author || {
    username: "unknown",
    fullname: "Unknown Author",
    profile_img: "https://via.placeholder.com/100"
  };
  
  return (
    <div className="border border-grey rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {banner && (
        <Link to={`/blog/${_id}`} className="block">
          <img 
            src={banner} 
            alt={title} 
            className="w-full h-48 object-cover"
          />
        </Link>
      )}
      
      <div className="p-4">
        <div className="flex items-center mb-3">
          <Link to={`/profile/${authorData.username}`} className="flex items-center">
            <img 
              src={authorData.profile_img} 
              alt={authorData.fullname} 
              className="w-8 h-8 rounded-full mr-2"
            />
            <span className="text-dark-grey">{authorData.fullname}</span>
          </Link>
          <span className="mx-2 text-dark-grey">•</span>
          <span className="text-dark-grey">{formatDate(createdAt)}</span>
        </div>
        
        <Link to={`/blog/${_id}`}>
          <h3 className="text-xl font-bold mb-2 line-clamp-2">{title}</h3>
          <p className="text-dark-grey mb-3 line-clamp-3">{des}</p>
        </Link>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.slice(0, 3).map((tag, index) => (
            <Link 
              key={index} 
              to={`/search/tag/${tag}`}
              className="text-sm bg-grey/30 px-3 py-1 rounded-full text-dark-grey hover:bg-grey/50"
            >
              {tag}
            </Link>
          ))}
        </div>
        
        <div className="flex text-dark-grey text-sm">
          <span className="mr-4">
            <i className="fi fi-rr-eye mr-1"></i>
            {views}
          </span>
          <span className="mr-4">
            <i className="fi fi-rr-heart mr-1"></i>
            {likes}
          </span>
          <span>
            <i className="fi fi-rr-comment mr-1"></i>
            {comments}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BlogPostCard;
