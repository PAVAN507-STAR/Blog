import React, { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const BlogInteraction = ({ blog, setBlog }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [totalLikes, setTotalLikes] = useState(blog?.activity?.total_likes || 0);
  
  useEffect(() => {
    if (isLoaded && isSignedIn && blog) {
      checkIfLiked();
      checkIfSaved();
    }
  }, [isLoaded, isSignedIn, blog]);
  
  const checkIfLiked = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/blog/${blog.blog_id}/liked`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setIsLiked(response.data.isLiked);
      setTotalLikes(response.data.totalLikes);
    } catch (error) {
      console.error("Error checking if blog is liked:", error);
    }
  };
  
  const checkIfSaved = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/user/saved-blog/${blog.blog_id}`,
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
      const endpoint = isLiked ? 'unlike' : 'like';
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER}/blog/${blog.blog_id}/${endpoint}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setIsLiked(!isLiked);
      setTotalLikes(response.data.totalLikes);
      
      setBlog({
        ...blog,
        activity: {
          ...blog.activity,
          total_likes: response.data.totalLikes
        }
      });
    } catch (error) {
      console.error("Error liking/unliking blog:", error);
      toast.error("Failed to update like status");
    }
  };
  
  const handleSave = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to save this blog");
      return;
    }
    
    try {
      const token = await getToken();
      const endpoint = isSaved ? 'unsave-blog' : 'save-blog';
      const method = isSaved ? 'delete' : 'post';
      
      const response = await axios({
        method: method,
        url: `${import.meta.env.VITE_SERVER}/user/${endpoint}/${blog.blog_id}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setIsSaved(!isSaved);
    } catch (error) {
      console.error("Error saving/unsaving blog:", error);
      toast.error("Failed to update save status");
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
        <p>{totalLikes}</p>
      </div>
    </div>
  );
};

export default BlogInteraction;
