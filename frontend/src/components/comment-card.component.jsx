import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { getTimeDifference } from "../common/date";
import CommentField from "./comment-field.component";

const CommentCard = ({ 
  comment, 
  blog, 
  onReply, 
  onEdit, 
  onDelete, 
  isReply = false 
}) => {
  const { isSignedIn, user } = useUser();
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyField, setShowReplyField] = useState(false);
  const [showEditField, setShowEditField] = useState(false);
  
  const isAuthor = isSignedIn && user.id === comment.user.clerk_id;
  const isBlogAuthor = isSignedIn && user.id === blog.author.clerk_id;
  
  const handleReply = (content) => {
    onReply(comment._id, content);
    setShowReplyField(false);
  };
  
  const handleEdit = (content) => {
    onEdit(comment._id, content);
    setShowEditField(false);
  };
  
  return (
    <div 
      id={`comment-${comment._id}`}
      className={`mb-6 ${isReply ? "ml-12 mt-4" : "border-b border-grey pb-6"}`}
    >
      <div className="flex gap-3">
        <Link to={`/user/${comment.user.username}`}>
          {comment.user.profile_img ? (
            <img 
              src={comment.user.profile_img} 
              alt={comment.user.fullname} 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {comment.user.fullname[0]}
            </div>
          )}
        </Link>
        
        <div className="flex-grow">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Link to={`/user/${comment.user.username}`} className="font-medium hover:underline">
              {comment.user.fullname}
            </Link>
            
            {comment.user.clerk_id === blog.author.clerk_id && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Author
              </span>
            )}
            
            <span className="text-dark-grey text-sm">
              {getTimeDifference(comment.createdAt)}
            </span>
            
            {comment.edited && (
              <span className="text-dark-grey text-xs italic">
                (edited)
              </span>
            )}
          </div>
          
          {showEditField ? (
            <CommentField 
              defaultValue={comment.content}
              onSubmit={handleEdit}
              onCancel={() => setShowEditField(false)}
              buttonText="Update"
            />
          ) : (
            <p className="mb-3">{comment.content}</p>
          )}
          
          <div className="flex gap-4 text-dark-grey text-sm">
            {isSignedIn && !showEditField && (
              <button 
                onClick={() => setShowReplyField(!showReplyField)}
                className="hover:text-black"
              >
                Reply
              </button>
            )}
            
            {isAuthor && !showEditField && (
              <button 
                onClick={() => setShowEditField(true)}
                className="hover:text-black"
              >
                Edit
              </button>
            )}
            
            {(isAuthor || isBlogAuthor) && !showEditField && (
              <button 
                onClick={() => onDelete(comment._id)}
                className="hover:text-red-500"
              >
                Delete
              </button>
            )}
          </div>
          
          {showReplyField && (
            <div className="mt-4">
              <CommentField 
                onSubmit={handleReply}
                onCancel={() => setShowReplyField(false)}
                placeholder="Write a reply..."
                buttonText="Reply"
              />
            </div>
          )}
          
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              {!showReplies ? (
                <button 
                  onClick={() => setShowReplies(true)}
                  className="text-blue-500 text-sm flex items-center gap-1"
                >
                  <i className="fi fi-rr-comment-dots"></i>
                  {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setShowReplies(false)}
                    className="text-blue-500 text-sm mb-4 flex items-center gap-1"
                  >
                    <i className="fi fi-rr-comment-dots"></i>
                    Hide replies
                  </button>
                  
                  {comment.replies.map((reply) => (
                    <CommentCard 
                      key={reply._id}
                      comment={reply}
                      blog={blog}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isReply={true}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
