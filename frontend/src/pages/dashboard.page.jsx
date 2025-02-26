import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import Animate from "../common/page-animation";
import Loader from "../components/loader.component";
import NoData from "../components/no-data.component";
import InPageNavigation from "../components/inpage-navigation.component";
import Tools from "../components/tools.component";
import ManageBlogs from "./manage-blogs.page";

const Dashboard = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  
  const [stats, setStats] = useState({
    totalBlogs: 0,
    publishedBlogs: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchStats();
    }
  }, [isLoaded, isSignedIn]);
  
  const fetchStats = async () => {
    try {
      // Get token from Clerk using the correct method
      let token = '';
      if (user && typeof user.getToken === 'function') {
        token = await user.getToken();
      } else if (window.Clerk && window.Clerk.session) {
        token = await window.Clerk.session.getToken();
      }
      
      if (!token) {
        throw new Error("Failed to get authentication token");
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/user/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setStats(response.data.stats);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to fetch dashboard stats");
      setLoading(false);
    }
  };
  
  if (!isLoaded) {
    return <Loader size="lg" />;
  }
  
  if (!isSignedIn) {
    return <NoData 
      message="Please sign in to access your dashboard" 
      icon="fi-rr-user"
      actionText="Sign In"
      actionLink="/sign-in"
    />;
  }
  
  if (loading) {
    return <Loader size="lg" />;
  }
  
  return (
    <Animate>
      <Toaster />
      
      <section className="max-w-5xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Total Blogs</h3>
            <p className="text-3xl font-bold">{stats.totalBlogs}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Published Blogs</h3>
            <p className="text-3xl font-bold">{stats.publishedBlogs}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Total Views</h3>
            <p className="text-3xl font-bold">{stats.totalViews}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Total Likes</h3>
            <p className="text-3xl font-bold">{stats.totalLikes}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Total Comments</h3>
            <p className="text-3xl font-bold">{stats.totalComments}</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Blogs</h2>
          <Link to="/editor" className="btn-dark">
            Write New Blog
          </Link>
        </div>
        
        <ManageBlogs />
      </section>
    </Animate>
  );
};

export default Dashboard;
