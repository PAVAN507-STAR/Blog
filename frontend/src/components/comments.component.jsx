import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import CommentCard from "./comment-card.component";
import CommentField from "./comment-field.component";
import NoData from "./no-data.component";
import LoadMore from "./load-more.component";

const Comments = ({ blog, setBlog }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  useEffect(() => {
    if (blog) {
      fetchComments();
    }
  }, [blog]);
  
  const fetchComments = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/blog/comments/${blog._id}?page=${loadMore ? page + 1 : 1}`
      );
      
      if (loadMore) {
        setComments([...comments, ...response.data.comments]);
        setPage(page + 1);
        setHasMore(response.data.hasMore);
        setLoadingMore(false);
      } else {
        setComments(response.data.comments);
        setHasMore(response.data.hasMore);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to fetch comments");
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  const handleAddComment = async (content) => {
    if (!isSignedIn) {
      toast.error("Please sign in to comment");
      return;
    }
    
    try {
      const token = await user.getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER}/blog/comment/${blog._id}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Add new comment to the list
      setComments([response.data.comment, ...comments]);
      
      // Update blog comment count
      setBlog({
        ...blog,
        activity: {
          ...blog.activity,
          total_comments: blog.activity.total_comments + 1
        }
      });
      
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };
  
  const handleReply = async (parentId, content) => {
    if (!isSignedIn) {
      toast.error("Please sign in to reply");
      return;
    }
    
    try {
      const token = await user.getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER}/blog/comment/${blog._id}`,
        { content, parent_id: parentId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Update comments with the new reply
      const updatedComments = comments.map(comment => {
        if (comment._id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), response.data.comment]
          };
        }
        return comment;
      });
      
      setComments(updatedComments);
      
      // Update blog comment count
      setBlog({
        ...blog,
        activity: {
          ...blog.activity,
          total_comments: blog.activity.total_comments + 1
        }
      });
      
      toast.success("Reply added successfully");
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    }
  };
  
  const handleEdit = async (commentId, content) => {
    try {
      const token = await user.getToken();
      const response = await axios.put(
        `${import.meta.env.VITE_SERVER}/blog/comment/${commentId}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Update comments with edited content
      const updatedComments = comments.map(comment => {
        if (comment._id === commentId) {
          return { ...comment, content, edited: true };
        }
        
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply => {
            if (reply._id === commentId) {
              return { ...reply, content, edited: true };
            }
            return reply;
          });
          
          return { ...comment, replies: updatedReplies };
        }
        
        return comment;
      });
      
      setComments(updatedComments);
      toast.success("Comment updated successfully");
    } catch (error) {
      console.error("Error editing comment:", error);
      toast.error("Failed to edit comment");
    }
  };
  
  const handleDelete = async (commentId) => {
    try {
      const token = await user.getToken();
      await axios.delete(
        `${import.meta.env.VITE_SERVER}/blog/comment/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Remove deleted comment from state
      const updatedComments = comments.filter(comment => comment._id !== commentId);
      
      // Also check for replies
      const updatedWithRepliesFiltered = updatedComments.map(comment => {
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.filter(reply => reply._id !== commentId)
          };
        }
        return comment;
      });
      
      setComments(updatedWithRepliesFiltered);
      
      // Update blog comment count
      setBlog({
        ...blog,
        activity: {
          ...blog.activity,
          total_comments: blog.activity.total_comments - 1
        }
      });
      
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };
  
  if (loading) {
    return <div className="my-8 text-center">Loading comments...</div>;
  }
  
  return (
    <div className="my-8">
      <h3 className="text-2xl font-bold mb-6">Comments ({blog.activity.total_comments})</h3>
      
      <CommentField onSubmit={handleAddComment} />
      
      <div className="mt-8">
        {comments.length > 0 ? (
          <>
            {comments.map(comment => (
              <CommentCard
                key={comment._id}
                comment={comment}
                blog={blog}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            
            <LoadMore 
              onClick={() => fetchComments(true)} 
              loading={loadingMore} 
              hasMore={hasMore} 
            />
          </>
        ) : (
          <NoData 
            message="No comments yet. Be the first to comment!" 
            icon="fi-rr-comment"
            actionText={null}
          />
        )}
      </div>
    </div>
  );
};

export default Comments;
