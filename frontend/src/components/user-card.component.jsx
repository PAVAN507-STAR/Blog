import React from "react";
import { Link } from "react-router-dom";

const UserCard = ({ user }) => {
  return (
    <Link to={`/user/${user.username}`} className="block">
      <div className="border border-grey rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          {user.profile_img ? (
            <img 
              src={user.profile_img} 
              alt={user.fullname} 
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {user.fullname[0]}
            </div>
          )}
          
          <div>
            <h3 className="font-medium">{user.fullname}</h3>
            <p className="text-dark-grey">@{user.username}</p>
          </div>
        </div>
        
        {user.bio && (
          <p className="mt-3 text-dark-grey line-clamp-2">{user.bio}</p>
        )}
        
        <div className="mt-3 flex gap-4">
          <span className="text-sm">
            <span className="font-medium">{user.account_info.total_posts}</span> Blogs
          </span>
          
          <span className="text-sm">
            <span className="font-medium">{user.account_info.total_reads}</span> Reads
          </span>
        </div>
      </div>
    </Link>
  );
};

export default UserCard; 