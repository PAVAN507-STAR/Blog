import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";

const CommentField = ({ 
  onSubmit, 
  onCancel, 
  defaultValue = "", 
  placeholder = "Write a comment...",
  buttonText = "Comment"
}) => {
  const { isSignedIn, user } = useUser();
  const [content, setContent] = useState(defaultValue);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content);
      setContent("");
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="w-full">
      <textarea
        placeholder={isSignedIn ? placeholder : "Please sign in to comment"}
        className="w-full p-3 border border-grey rounded-md resize-none"
        rows="3"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={!isSignedIn}
      ></textarea>
      
      <div className="flex justify-end gap-2 mt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-grey rounded-md hover:bg-grey transition-colors"
          >
            Cancel
          </button>
        )}
        
        <button
          type="submit"
          className="btn-dark"
          disabled={!isSignedIn || !content.trim()}
        >
          {buttonText}
        </button>
      </div>
    </form>
  );
};

export default CommentField;
