import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { getTimeDifference } from "../common/date";
import CommentField from "./comment-field.component";
import axios from "axios";
import { toast } from "react-hot-toast";

const CommentCard = ({ 
  comment, 
  blog, 
  onReply, 
  onEdit, 
  onDelete, 
  isReply = false,
  depth = 0 // Add depth parameter to track nesting level
}) => {
  const { isSignedIn, user } = useUser();
  const [showReplyField, setShowReplyField] = useState(false);
  const [showEditField, setShowEditField] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  
  // Safely check if commented_by exists before accessing clerk_id
  const isAuthor = isSignedIn && user && comment.commented_by && user.id === comment.commented_by.clerk_id;
  
  // Safely check if blog.author exists before accessing clerk_id
  const isBlogAuthor = isSignedIn && user && blog?.author && user.id === blog.author.clerk_id;
  
  const fetchReplies = async () => {
    try {
      setLoadingReplies(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/blog/comment/${comment._id}/replies`
      );
      setReplies(response.data.replies);
    } catch (error) {
      console.error("Error fetching replies:", error);
      toast.error("Failed to load replies");
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleShowReplies = () => {
    if (!showReplies && replies.length === 0) {
      fetchReplies();
    }
    setShowReplies(!showReplies);
  };

  const handleReply = (content) => {
    onReply(comment._id, content);
    setShowReplyField(false);
  };
  
  const handleEdit = (content) => {
    onEdit(comment._id, content);
    setShowEditField(false);
  };
  
  // Check if commented_by exists in comment
  if (!comment.commented_by) {
    return <div className="p-4 text-red-500">Comment data is missing user information</div>;
  }
  
  return (
    <div className={`py-4 ${depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : 'border-b border-gray-100'}`}>
      <div className="flex items-start gap-3">
        <img 
          src={comment.commented_by.personal_info.profile_img} 
          className="w-8 h-8 rounded-full"
          alt={comment.commented_by.personal_info.fullname}
        />
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link 
              to={`/user/${comment.commented_by.personal_info.username}`}
              className="font-medium hover:text-blue-600"
            >
              {comment.commented_by.personal_info.fullname}
            </Link>
            
            {blog?.author && comment.commented_by.clerk_id === blog.author.clerk_id && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Author
              </span>
            )}
            
            <span className="text-sm text-gray-500">
              {getTimeDifference(comment.commentedAt)}
            </span>
            
            {comment.edited && (
              <span className="text-dark-grey text-xs italic">
                (edited)
              </span>
            )}
          </div>
          
          {showEditField ? (
            <CommentField 
              onSubmit={handleEdit} 
              defaultValue={comment.comment}
              buttonText="Save"
            />
          ) : (
            <p className="text-gray-800 mb-2">{comment.comment}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm mt-2">
            <button 
              onClick={() => setShowReplyField(!showReplyField)}
              className="text-gray-500 hover:text-gray-700"
            >
              Reply
            </button>
            
            {(isAuthor || isBlogAuthor) && (
              <>
                <button 
                  onClick={() => setShowEditField(!showEditField)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(comment._id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Delete
                </button>
              </>
            )}

            {comment.replies_count > 0 && (
              <button 
                onClick={handleShowReplies}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {loadingReplies ? 'Loading...' : `Show replies (${comment.replies_count})`}
              </button>
            )}
          </div>
          
          {showReplyField && (
            <div className="mt-3">
              <CommentField 
                onSubmit={handleReply}
                placeholder="Write a reply..."
                buttonText="Reply"
              />
            </div>
          )}

          {showReplies && replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {replies.map(reply => (
                <CommentCard
                  key={reply._id}
                  comment={reply}
                  blog={blog}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isReply={true}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentCard;