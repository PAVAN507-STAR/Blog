import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import Animate from "../common/page-animation";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import NoBannerBlogPost from "../components/no-banner-blog-post.component";
import NoData from "../components/no-data.component";
import InPageNavigation from "../components/inpage-navigation.component";
import LoadMore from "../components/load-more.component";

const Profile = () => {
  const { username } = useParams();
  const { isLoaded, isSignedIn, user } = useUser();
  
  const [profile, setProfile] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);
  
  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/user/profile/${username}`
      );
      
      setProfile(response.data.user);
      setBlogs(response.data.blogs || []);
      setHasMore(response.data.hasMore || false);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to fetch profile");
      setLoading(false);
    }
  };
  
  const loadMoreBlogs = async () => {
    try {
      setLoadingMore(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/user/blogs/${username}?page=${page + 1}`
      );
      
      setBlogs([...blogs, ...response.data.blogs]);
      setPage(page + 1);
      setHasMore(response.data.hasMore);
      setLoadingMore(false);
    } catch (error) {
      console.error("Error loading more blogs:", error);
      toast.error("Failed to load more blogs");
      setLoadingMore(false);
    }
  };
  
  const isOwnProfile = isSignedIn && user && user.username === username;
  
  if (loading) {
    return <Loader size="lg" />;
  }
  
  if (!profile) {
    return <NoData message="User not found" actionText="Go Home" actionLink="/" />;
  }
  
  // Ensure profile has the expected structure
  const personalInfo = profile.personal_info || {};
  const accountInfo = profile.account_info || { total_posts: 0, total_reads: 0, total_likes: 0 };
  
  return (
    <Animate>
      <Toaster />
      
      <section className="max-w-5xl mx-auto p-4">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start mb-8">
          {personalInfo.profile_img ? (
            <img 
              src={personalInfo.profile_img} 
              alt={personalInfo.fullname} 
              className="w-32 h-32 rounded-full object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl">
              {personalInfo.fullname ? personalInfo.fullname[0] : '?'}
            </div>
          )}
          
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{personalInfo.fullname || 'User'}</h1>
            <p className="text-dark-grey mb-4">@{personalInfo.username || username}</p>
            
            <div className="flex flex-wrap gap-6 justify-center md:justify-start mb-4">
              <div>
                <span className="font-bold">{accountInfo.total_posts}</span>
                <span className="text-dark-grey ml-1">Blogs</span>
              </div>
              
              <div>
                <span className="font-bold">{accountInfo.total_reads}</span>
                <span className="text-dark-grey ml-1">Reads</span>
              </div>
              
              <div>
                <span className="font-bold">{accountInfo.total_likes}</span>
                <span className="text-dark-grey ml-1">Likes</span>
              </div>
            </div>
            
            {personalInfo.bio && (
              <p className="mb-4">{personalInfo.bio}</p>
            )}
            
            {isOwnProfile && (
              <div className="flex gap-4 justify-center md:justify-start">
                <Link to="/edit-profile" className="btn-light">
                  Edit Profile
                </Link>
                <Link to="/dashboard" className="btn-dark">
                  Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <InPageNavigation navItems={["Blogs", "About"]}>
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
                  onClick={loadMoreBlogs} 
                  loading={loadingMore} 
                  hasMore={hasMore} 
                />
              </div>
            ) : (
              <NoData 
                message={isOwnProfile ? "You haven't published any blogs yet" : "This user hasn't published any blogs yet"} 
                icon="fi-rr-file"
                actionText={isOwnProfile ? "Write Your First Blog" : null}
                actionLink={isOwnProfile ? "/editor" : null}
              />
            )}
          </div>
          
          <div>
            <h3 className="text-2xl font-bold mb-4">About {personalInfo.fullname || 'User'}</h3>
            
            {personalInfo.bio ? (
              <p>{personalInfo.bio}</p>
            ) : (
              <p className="text-dark-grey">No bio available.</p>
            )}
            
            <div className="mt-6">
              <h4 className="text-xl font-bold mb-2">Joined</h4>
              <p>{profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'Unknown'}</p>
            </div>
          </div>
        </InPageNavigation>
      </section>
    </Animate>
  );
};

export default Profile;
