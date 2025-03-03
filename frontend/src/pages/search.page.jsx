import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import Animate from "../common/page-animation";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import NoData from "../components/no-data.component";
import LoadMore from "../components/load-more.component";
import SearchBar from "../components/search-bar.component";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const { tag } = useParams(); // Extract tag from URL params if present
  const location = useLocation();
  const navigate = useNavigate();
  
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  useEffect(() => {
    // Reset state when search params or URL path changes
    setBlogs([]);
    setPage(1);
    setHasMore(true);
    
    // Get parameters from URL
    const searchQuery = searchParams.get('query');
    const searchTag = tag || searchParams.get('tag');
    
    if (searchQuery || searchTag) {
      fetchResults(searchQuery, searchTag, 1);
    } else {
      setLoading(false);
    }
  }, [searchParams, tag, location.pathname]);

  const fetchResults = async (query, tag, pageNum = page) => {
    try {
      setLoading(pageNum === 1);
      setLoadingMore(pageNum > 1);
      
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/search`,
        {
          params: {
            query: query || undefined,
            tag: tag || undefined,
            page: pageNum
          }
        }
      );
      
      if (pageNum === 1) {
        setBlogs(response.data.blogs || []);
      } else {
        setBlogs(prevBlogs => [...prevBlogs, ...(response.data.blogs || [])]);
      }
      
      setHasMore(response.data.hasMore || false);
      setPage(pageNum);
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Failed to search blogs");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (searchQuery) => {
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const loadMoreBlogs = () => {
    const nextPage = page + 1;
    const searchQuery = searchParams.get('query');
    const searchTag = tag || searchParams.get('tag');
    fetchResults(searchQuery, searchTag, nextPage);
  };

  // Determine the current search type and value for display
  const currentTag = tag || searchParams.get('tag');
  const currentQuery = searchParams.get('query');
  
  return (
    <Animate>
      <Toaster />
      
      <section className="max-w-5xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">
            {currentQuery ? `Search results for "${currentQuery}"` : 
             currentTag ? `Posts tagged with "${currentTag}"` : 
             "Search Blogs"}
          </h1>
          <div className="max-w-xl">
            <SearchBar 
              defaultValue={currentQuery} 
              onSearch={handleSearch}
              placeholder="Search for blogs, topics, or authors..."
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader size="lg" />
          </div>
        ) : blogs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6">
              {blogs.map(blog => (
                <BlogPostCard 
                  key={blog._id || blog.blog_id} 
                  blog={blog} 
                  variant="compact"
                />
              ))}
            </div>
            
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <LoadMore 
                  onClick={loadMoreBlogs} 
                  loading={loadingMore}
                />
              </div>
            )}
          </>
        ) : (
          <NoData 
            message={currentQuery ? `No results found for "${currentQuery}"` : 
                    currentTag ? `No posts found with tag "${currentTag}"` : 
                    "Enter a search term to find blogs"}
            icon="fi-rr-search"
            actionText="Try different keywords"
            actionLink="/search"
          />
        )}
      </section>
    </Animate>
  );
};

export default SearchPage;