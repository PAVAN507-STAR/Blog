import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import Animate from "../common/page-animation";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import NoBannerBlogPost from "../components/no-banner-blog-post.component";
import UserCard from "../components/user-card.component";
import TagCloud from "../components/tag-cloud.component";
import NoData from "../components/no-data.component";
import LoadMore from "../components/load-more.component";
import InPageNavigation from "../components/inpage-navigation.component";
import SearchBar from "../components/search-bar.component";

const Search = () => {
  const { query, tag } = useParams();
  
  const [blogs, setBlogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  useEffect(() => {
    if (tag) {
      fetchByTag();
    } else if (query) {
      fetchResults();
    } else {
      fetchPopularTags();
    }
  }, [query, tag]);
  
  const fetchResults = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1);
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/search?query=${query}&page=${loadMore ? page + 1 : 1}&type=${activeTab === 0 ? 'blogs' : 'users'}`
      );
      
      if (loadMore) {
        if (activeTab === 0) {
          setBlogs([...blogs, ...response.data.blogs]);
        } else {
          setUsers([...users, ...response.data.users]);
        }
        setPage(page + 1);
        setHasMore(response.data.hasMore);
        setLoadingMore(false);
      } else {
        setBlogs(response.data.blogs);
        setUsers(response.data.users);
        setTags(response.data.tags);
        setHasMore(response.data.hasMore);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Failed to search");
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  const fetchByTag = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(1);
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/search/tag/${tag}?page=${loadMore ? page + 1 : 1}`
      );
      
      if (loadMore) {
        setBlogs([...blogs, ...response.data.blogs]);
        setPage(page + 1);
        setHasMore(response.data.hasMore);
        setLoadingMore(false);
      } else {
        setBlogs(response.data.blogs);
        setHasMore(response.data.hasMore);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching by tag:", error);
      toast.error("Failed to fetch blogs by tag");
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  const fetchPopularTags = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_SERVER}/popular-tags`);
      setTags(response.data.tags);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching popular tags:", error);
      toast.error("Failed to fetch popular tags");
      setLoading(false);
    }
  };
  
  const loadMore = () => {
    if (tag) {
      fetchByTag(true);
    } else {
      fetchResults(true);
    }
  };
  
  const handleTabChange = (index) => {
    setActiveTab(index);
    setHasMore(true);
    setPage(1);
    fetchResults();
  };
  
  if (loading) {
    return <Loader size="lg" />;
  }
  
  return (
    <Animate>
      <Toaster />
      
      <section className="max-w-5xl mx-auto p-4">
        <div className="mb-8">
          <SearchBar placeholder="Search blogs, users, or tags..." />
        </div>
        
        {tag ? (
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">#{tag}</h1>
            <p className="text-dark-grey">{blogs.length} blogs found</p>
          </div>
        ) : query ? (
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Search results for "{query}"</h1>
          </div>
        ) : (
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Explore</h1>
          </div>
        )}
        
        {tag ? (
          blogs.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {blogs.map(blog => (
                blog.banner ? (
                  <BlogPostCard key={blog._id} blog={blog} />
                ) : (
                  <NoBannerBlogPost key={blog._id} blog={blog} />
                )
              ))}
              
              <LoadMore 
                onClick={loadMore} 
                loading={loadingMore} 
                hasMore={hasMore} 
              />
            </div>
          ) : (
            <NoData 
              message={`No blogs found with tag #${tag}`} 
              icon="fi-rr-file"
              actionText="Explore other tags"
              actionLink="/search"
            />
          )
        ) : query ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <InPageNavigation 
                navItems={["Blogs", "Users"]} 
                defaultActiveIndex={activeTab}
              >
                <div>
                  {blogs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                      {blogs.map(blog => (
                        blog.banner ? (
                          <BlogPostCard key={blog._id} blog={blog} />
                        ) : (
                          <NoBannerBlogPost key={blog._id} blog={blog} />
                        )
                      ))}
                      
                      <LoadMore 
                        onClick={loadMore} 
                        loading={loadingMore} 
                        hasMore={hasMore && activeTab === 0} 
                      />
                    </div>
                  ) : (
                    <NoData 
                      message={`No blogs found for "${query}"`} 
                      icon="fi-rr-file"
                      actionText={null}
                    />
                  )}
                </div>
                
                <div>
                  {users.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                      {users.map(user => (
                        <UserCard key={user._id} user={user} />
                      ))}
                      
                      <LoadMore 
                        onClick={loadMore} 
                        loading={loadingMore} 
                        hasMore={hasMore && activeTab === 1} 
                      />
                    </div>
                  ) : (
                    <NoData 
                      message={`No users found for "${query}"`} 
                      icon="fi-rr-user"
                      actionText={null}
                    />
                  )}
                </div>
              </InPageNavigation>
            </div>
            
            <div>
              <TagCloud tags={tags} />
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4">Popular Tags</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag, index) => (
                <div key={index} className="border border-grey rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold mb-2">#{tag.name}</h3>
                  <p className="text-dark-grey mb-4">{tag.count} blogs</p>
                  <a href={`/search/tag/${tag.name}`} className="text-blue-500 hover:underline">
                    View blogs
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </Animate>
  );
};

export default Search;
