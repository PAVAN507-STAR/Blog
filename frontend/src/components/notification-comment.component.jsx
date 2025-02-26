import React from "react";
import { Link } from "react-router-dom";
import { getTimeDifference } from "../common/date";

const NotificationComment = ({ notification, onRead }) => {
  return (
    <div 
      className={`p-4 border-b border-grey flex items-start gap-3 ${
        !notification.read ? "bg-blue-50" : ""
      }`}
    >
      <Link to={`/user/${notification.from.username}`}>
        {notification.from.profile_img ? (
          <img 
            src={notification.from.profile_img} 
            alt={notification.from.fullname} 
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
            {notification.from.fullname[0]}
          </div>
        )}
      </Link>
      
      <div className="flex-grow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <p>
            <Link to={`/user/${notification.from.username}`} className="font-medium hover:underline">
              {notification.from.fullname}
            </Link>{" "}
            commented on your blog
          </p>
          
          <span className="text-sm text-dark-grey">
            {getTimeDifference(notification.createdAt)}
          </span>
        </div>
        
        <Link 
          to={`/blog/${notification.blog.blog_id}#comment-${notification.comment._id}`}
          className="mt-2 text-dark-grey hover:underline line-clamp-1"
        >
          "{notification.comment.content}"
        </Link>
        
        <Link 
          to={`/blog/${notification.blog.blog_id}`}
          className="mt-1 text-dark-grey hover:underline line-clamp-1 text-sm"
        >
          on "{notification.blog.title}"
        </Link>
      </div>
      
      {!notification.read && (
        <button 
          onClick={() => onRead(notification._id)}
          className="text-xs bg-grey px-2 py-1 rounded-full"
        >
          Mark as read
        </button>
      )}
    </div>
  );
};

export default NotificationComment; 