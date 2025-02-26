import React from "react";
import { Link } from "react-router-dom";
import { formatDate } from "../common/date";

const ManageBlogCard = ({ blog, onEdit, onDelete }) => {
  return (
    <div className="border border-grey rounded-md overflow-hidden mb-4">
      <div className="flex flex-col md:flex-row">
        {blog.banner && (
          <div className="md:w-1/4">
            <img
              src={blog.banner}
              alt={blog.title}
              className="w-full h-40 md:h-full object-cover"
            />
          </div>
        )}
        
        <div className={`p-4 ${blog.banner ? "md:w-3/4" : "w-full"}`}>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-medium">{blog.title}</h3>
            
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(blog)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
              >
                <i className="fi fi-rr-edit"></i>
              </button>
              
              <button
                onClick={() => onDelete(blog._id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full"
              >
                <i className="fi fi-rr-trash"></i>
              </button>
            </div>
          </div>
          
          <p className="text-dark-grey mb-4 line-clamp-2">{blog.des}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags.map((tag, i) => (
              <span key={i} className="bg-grey px-2 py-1 rounded-full text-xs text-dark-grey">
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex justify-between items-center text-dark-grey text-sm">
            <div>
              <span className={`${blog.draft ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"} px-2 py-1 rounded-full`}>
                {blog.draft ? "Draft" : "Published"}
              </span>
              <span className="ml-2">
                {formatDate(blog.createdAt)}
              </span>
            </div>
            
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <i className="fi fi-rr-heart"></i>
                {blog.activity.total_likes}
              </span>
              
              <span className="flex items-center gap-1">
                <i className="fi fi-rr-comment"></i>
                {blog.activity.total_comments}
              </span>
              
              <span className="flex items-center gap-1">
                <i className="fi fi-rr-eye"></i>
                {blog.activity.total_reads}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageBlogCard;
