import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import Animate from "../common/page-animation";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import NoBannerBlogPost from "../components/no-banner-blog-post.component";
import SearchBar from "../components/search-bar.component";
import TagCloud from "../components/tag-cloud.component";
import LoadMore from "../components/load-more.component";
import InPageNavigation from "../components/inpage-navigation.component";

const Home = () => {
  const [trendingBlogs, setTrendingBlogs] = useState([]);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  useEffect(() => {
    fetchHomeData();
  }, []);
  
  const fetchHomeData = async () => {
    try {
      setLoading(true);
      console.log("API URL:", `${import.meta.env.VITE_SERVER}/home`);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/home`
      );
      
      setTrendingBlogs(response.data.trendingBlogs);
      setRecentBlogs(response.data.recentBlogs);
      setPopularTags(response.data.popularTags);
      setHasMore(response.data.hasMore);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching home data:", error);
      toast.error("Failed to fetch blogs");
      setLoading(false);
    }
  };
  
  const loadMoreBlogs = async () => {
    try {
      setLoadingMore(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/blogs?page=${page + 1}`
      );
      
      setRecentBlogs([...recentBlogs, ...response.data.blogs]);
      setPage(page + 1);
      setHasMore(response.data.hasMore);
      setLoadingMore(false);
    } catch (error) {
      console.error("Error loading more blogs:", error);
      toast.error("Failed to load more blogs");
      setLoadingMore(false);
    }
  };
  
  if (loading) {
    return <Loader size="lg" />;
  }
  
  return (
    <Animate>
      <Toaster />
      
      <section className="max-w-5xl mx-auto p-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">BlogHub</h1>
          <p className="text-dark-grey text-lg mb-6">Discover stories, thinking, and expertise from writers on any topic.</p>
          <div className="max-w-xl mx-auto">
            <SearchBar placeholder="Search for blogs, topics, or authors..." />
          </div>
        </div>
        
        {trendingBlogs.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Trending Now</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingBlogs.map(blog => (
                <BlogPostCard key={blog._id} blog={blog} />
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <InPageNavigation navItems={["Recent", "For You"]}>
              <div>
                {recentBlogs.map(blog => (
                  blog.banner ? (
                    <BlogPostCard key={blog._id} blog={blog} />
                  ) : (
                    <NoBannerBlogPost key={blog._id} blog={blog} />
                  )
                ))}
                
                <LoadMore 
                  onClick={loadMoreBlogs} 
                  loading={loadingMore} 
                  hasMore={hasMore} 
                />
              </div>
              
              <div>
                <div className="flex flex-col items-center justify-center py-10">
                  <i className="fi fi-rr-user text-4xl text-dark-grey mb-4"></i>
                  <p className="text-xl font-medium mb-4">Sign in to see personalized recommendations</p>
                  <Link to="/sign-in" className="btn-dark">
                    Sign In
                  </Link>
                </div>
              </div>
            </InPageNavigation>
          </div>
          
          <div>
            <TagCloud tags={popularTags} />
            
            <div className="border border-grey rounded-lg p-4 mt-6">
              <h3 className="text-xl font-bold mb-4">Start Writing</h3>
              <p className="text-dark-grey mb-4">Share your ideas with millions of readers.</p>
              <Link to="/editor" className="btn-dark w-full text-center">
                Write a Blog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Animate>
  );
};

export default Home;
