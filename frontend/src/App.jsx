import { Routes, Route, Navigate } from "react-router-dom";
import { createContext, useState, useEffect } from "react";
import { ClerkProvider, SignIn, SignUp, useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import Navbar from "./components/navbar.component";
import Dashboard from "./pages/dashboard.page";
import ManageBlogs from "./pages/manage-blogs.page";
import Home from "./pages/home.page";
import Editor from "./pages/editor.pages";
import BlogPage from "./pages/blog.page";
import Profile from "./pages/profile.page";
import EditProfile from "./pages/edit-profile.page";
import ChangePassword from "./pages/change-password.page";
import Notifications from "./pages/notifications.page";
import Search from "./pages/search.page";
import PageNotFound from "./pages/404.page";

// Create a context to share user data across components
export const UserContext = createContext({});

// Auth wrapper component to handle protected routes
const AuthWrapper = ({ children }) => {
  const { isLoaded, userId } = useAuth();
  
  if (!isLoaded) return <div>Loading...</div>;
  
  if (!userId) {
    return <Navigate to="/sign-in" replace />;
  }
  
  return children;
};

const AppContent = () => {
  const [blogToEdit, setBlogToEdit] = useState(null);
  const { isLoaded, isSignedIn, user } = useUser();
  
  // Sync user with backend when they sign in
  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          // Get token from Clerk
          let token = '';
          if (typeof user.getToken === 'function') {
            token = await user.getToken();
          } else if (window.Clerk && window.Clerk.session) {
            token = await window.Clerk.session.getToken();
          }
          
          if (!token) {
            console.error("Failed to get authentication token");
            return;
          }
          
          // Send user data to backend to create/update user
          await axios.post(
            `${import.meta.env.VITE_SERVER}/user/sync`,
            {
              fullname: user.fullName,
              email: user.primaryEmailAddress?.emailAddress,
              username: user.username || user.firstName?.toLowerCase() + (user.id?.slice(-4) || ''),
              profileImage: user.imageUrl
            },
            {
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              }
            }
          );
        } catch (error) {
          console.error("Error syncing user:", error);
          toast.error("Failed to sync user data");
        }
      }
    };
    
    syncUser();
  }, [isLoaded, isSignedIn, user]);
  
  return (
    <UserContext.Provider value={{ blogToEdit, setBlogToEdit }}>
      <Navbar />
      <Toaster />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
        <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
        <Route path="/blog/:blog_id" element={<BlogPage />} />
        <Route path="/user/:username" element={<Profile />} />
        <Route path="/search" element={<Search />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={<AuthWrapper><Dashboard /></AuthWrapper>} />
        <Route path="/editor" element={<AuthWrapper><Editor /></AuthWrapper>} />
        <Route path="/editor/:blog_id" element={<AuthWrapper><Editor /></AuthWrapper>} />
        <Route path="/manage-blogs" element={<AuthWrapper><ManageBlogs /></AuthWrapper>} />
        <Route path="/edit-profile" element={<AuthWrapper><EditProfile /></AuthWrapper>} />
        <Route path="/change-password" element={<AuthWrapper><ChangePassword /></AuthWrapper>} />
        <Route path="/notifications" element={<AuthWrapper><Notifications /></AuthWrapper>} />
        
        {/* 404 route */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </UserContext.Provider>
  );
};

const App = () => {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <AppContent />
    </ClerkProvider>
  );
};

export default App;
