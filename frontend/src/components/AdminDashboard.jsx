import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Animate from "../common/page-animation";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import InPageNavigation from "../components/inpage-navigation.component";

const AdminDashboard = () => {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  // The parent's activeTab state will be a string (e.g., "users" or "blogs")
  const [activeTab, setActiveTab] = useState("users");

  // Navigation items for the admin dashboard
  const navigationItems = [
    { name: "Users", id: "users" },
    { name: "Blogs", id: "blogs" }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let token = '';
      if (user && typeof user.getToken === 'function') {
        token = await user.getToken();
      } else if (window.Clerk && window.Clerk.session) {
        token = await window.Clerk.session.getToken();
      }
      
      if (!token) {
        throw new Error("Failed to get authentication token");
      }

      const [usersResponse, blogsResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_SERVER}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_SERVER}/admin/blogs`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setUsers(usersResponse.data.users);
      setBlogs(blogsResponse.data.blogs);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch admin data");
      setLoading(false);
    }
  };

  const handleToggleBlock = async (userId) => {
    try {
      let token = '';
      if (user && typeof user.getToken === 'function') {
        token = await user.getToken();
      } else if (window.Clerk && window.Clerk.session) {
        token = await window.Clerk.session.getToken();
      }
      
      if (!token) {
        throw new Error("Failed to get authentication token");
      }

      await axios.post(
        `${import.meta.env.VITE_SERVER}/admin/users/${userId}/toggle-block`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
      toast.success("User status updated successfully");
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    
    try {
      let token = '';
      if (user && typeof user.getToken === 'function') {
        token = await user.getToken();
      } else if (window.Clerk && window.Clerk.session) {
        token = await window.Clerk.session.getToken();
      }
      
      if (!token) {
        throw new Error("Failed to get authentication token");
      }

      await axios.delete(
        `${import.meta.env.VITE_SERVER}/admin/blogs/${blogId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
      toast.success("Blog deleted successfully");
    } catch (error) {
      toast.error("Failed to delete blog");
    }
  };

  return (
    <Animate>
      <div className="max-w-[1200px] mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
        <InPageNavigation 
          navItems={navigationItems}
          defaultActiveIndex={0}
          setActiveTab={setActiveTab}
        />
        
        {loading ? (
          <Loader />
        ) : (
          activeTab === "users" ? (
            <div className="mt-8">
              <div className="space-y-4">
                {users.map(userItem => (
                  <div key={userItem._id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{userItem.personal_info.fullname}</h3>
                      <p className="text-sm text-gray-600">@{userItem.personal_info.username}</p>
                    </div>
                    <button
                      onClick={() => handleToggleBlock(userItem._id)}
                      className="px-6 py-3 text-red rounded flex items-center gap-2 bg-red-500  hover:bg-red-600 text-red transition-colors"
                    >
                      {userItem.isBlocked ? (
                        <>
                          <i className="fi fi-rr-check text-2xl"></i>
                          Unblock
                        </>
                      ) : (
                        <>
                          <i className="fi fi-rr-ban text-2xl"></i>
                          Block
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <div className="grid gap-6">
                {blogs.map(blog => (
                  <div key={blog._id} className="relative">
                    <BlogPostCard blog={blog} />
                    <button
                      onClick={() => handleDeleteBlog(blog._id)}
                      className="absolute bottom-2 right-2 bg-red-500 text-red p-3 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <i className="fi fi-rr-trash text-3xl"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </Animate>
  );
};

export default AdminDashboard;
