import React, { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const BlogInteraction = ({ blog, setBlog }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  useEffect(() => {
    if (isLoaded && isSignedIn && blog) {
      // Safely check if user has liked the blog
      setIsLiked(blog.activity?.likes?.includes(user.id) || false);
      // Check if user has saved the blog
      checkIfSaved();
    }
  }, [isLoaded, isSignedIn, blog]);
  
  const checkIfSaved = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/user/saved-blog/${blog._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setIsSaved(response.data.isSaved);
    } catch (error) {
      console.error("Error checking if blog is saved:", error);
    }
  };
  
  const handleLike = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to like this blog");
      return;
    }
    
    try {
      const token = await getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER}/blog/like/${blog._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setIsLiked(response.data.liked);
      
      // Update blog with new like count
      setBlog({
        ...blog,
        activity: {
          ...blog.activity,
          total_likes: response.data.liked 
            ? blog.activity.total_likes + 1 
            : blog.activity.total_likes - 1,
          likes: response.data.liked
            ? [...(blog.activity.likes || []), user.id]
            : (blog.activity.likes || []).filter(id => id !== user.id)
        }
      });
      
      toast.success(response.data.liked ? "Blog liked" : "Blog unliked");
    } catch (error) {
      console.error("Error liking blog:", error);
      toast.error("Failed to like blog");
    }
  };
  
  const handleSave = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to save this blog");
      return;
    }
    
    try {
      const token = await getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER}/user/save-blog/${blog._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setIsSaved(response.data.saved);
      toast.success(response.data.saved ? "Blog saved" : "Blog unsaved");
    } catch (error) {
      console.error("Error saving blog:", error);
      toast.error("Failed to save blog");
    }
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };
  
  return (
    <div className="flex flex-col gap-4 fixed left-5 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-md">
      <button 
        onClick={handleLike}
        className={`p-2 rounded-full ${isLiked ? "text-red-500" : "text-dark-grey"} hover:bg-grey`}
      >
        <i className={`fi ${isLiked ? "fi-sr-heart" : "fi-rr-heart"}`}></i>
      </button>
      
      <button 
        onClick={handleSave}
        className={`p-2 rounded-full ${isSaved ? "text-blue-500" : "text-dark-grey"} hover:bg-grey`}
      >
        <i className={`fi ${isSaved ? "fi-sr-bookmark" : "fi-rr-bookmark"}`}></i>
      </button>
      
      <button 
        onClick={handleShare}
        className="p-2 rounded-full text-dark-grey hover:bg-grey"
      >
        <i className="fi fi-rr-share"></i>
      </button>
      
      <div className="w-full h-[1px] bg-grey my-1"></div>
      
      <div className="text-center text-sm">
        <p>{blog.activity?.total_likes || 0}</p>
      </div>
    </div>
  );
};

export default BlogInteraction;
