import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import Animate from "../common/page-animation";
import Loader from "../components/loader.component";
import { UserContext } from "../App";
import ManageBlogCard from "../components/manage-blogcard.component";
import NoData from "../components/no-data.component";
import InPageNavigation from "../components/inpage-navigation.component";
import Tools from "../components/tools.component";

const ManageBlogs = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { isLoaded, isSignedIn, user } = useUser();
  const { setBlogToEdit } = useContext(UserContext);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchBlogs();
    }
  }, [isLoaded, isSignedIn, filter]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
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
        `${import.meta.env.VITE_SERVER}/user/blogs?filter=${filter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setBlogs(response.data.blogs);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to fetch blogs");
      setLoading(false);
    }
  };

  const handleEdit = (blog) => {
    setBlogToEdit(blog);
    navigate("/editor");
  };
  
  const handleDelete = async (blogId) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    
    try {
      const token = await user.getToken();
      await axios.delete(
        `${import.meta.env.VITE_SERVER}/blog/${blogId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setBlogs(blogs.filter(blog => blog._id !== blogId));
      toast.success("Blog deleted successfully");
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Failed to delete blog");
    }
  };

  if (loading) {
    return <Loader size="lg" />;
  }

  return (
    <Animate>
      <Toaster />
      
      <section className="max-w-5xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Blogs</h1>
          
          <Link to="/editor" className="btn-dark">
            <i className="fi fi-rr-file-edit mr-2"></i>
            Write New Blog
          </Link>
        </div>
        
        <Tools title="Filter Blogs" icon="fi-rr-filter">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-full ${
                filter === "all" ? "bg-black text-white" : "bg-grey text-dark-grey"
              }`}
            >
              All
            </button>
            
            <button 
              onClick={() => setFilter("published")}
              className={`px-4 py-2 rounded-full ${
                filter === "published" ? "bg-black text-white" : "bg-grey text-dark-grey"
              }`}
            >
              Published
            </button>
            
            <button 
              onClick={() => setFilter("draft")}
              className={`px-4 py-2 rounded-full ${
                filter === "draft" ? "bg-black text-white" : "bg-grey text-dark-grey"
              }`}
            >
              Drafts
            </button>
          </div>
        </Tools>
        
        <div className="mb-8">
          <InPageNavigation 
            navItems={["All", "Published", "Drafts"]}
            activeTab={filter === "all" ? 0 : filter === "published" ? 1 : 2}
            onTabChange={(index) => {
              setFilter(index === 0 ? "all" : index === 1 ? "published" : "draft");
            }}
          >
            {blogs.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {blogs.map(blog => (
                  <ManageBlogCard 
                    key={blog._id} 
                    blog={blog} 
                    onEdit={() => handleEdit(blog)}
                    onDelete={() => handleDelete(blog._id)}
                  />
                ))}
              </div>
            ) : (
              <NoData 
                message={`No ${filter === "all" ? "" : filter} blogs found`} 
                icon="fi-rr-file"
                actionText="Write Your First Blog"
                actionLink="/editor"
              />
            )}
          </InPageNavigation>
        </div>
      </section>
    </Animate>
  );
};

export default ManageBlogs;
