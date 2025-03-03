import { Routes, Route, Navigate } from "react-router-dom";
import { createContext, useState, useEffect } from "react";
import { ClerkProvider, SignIn, SignUp, useAuth, useUser, useClerk } from "@clerk/clerk-react";
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
import SearchPage from "./pages/search.page";
import PageNotFound from "./pages/404.page";
import Loader from "./components/loader.component";
import AdminDashboard from "./components/AdminDashboard";
import SignOutRedirect from "./components/SignOutRedirect";
import AdminContext from "./components/AdminContext";
export const UserContext = createContext({});

const AuthWrapper = ({ children, adminRequired = false }) => {
  const { isLoaded, userId } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (userId) {
        try {
          let token = '';
          if (window.Clerk && window.Clerk.session) {
            token = await window.Clerk.session.getToken();
          }
          
          if (!token) {
            throw new Error("Failed to get authentication token");
          }
          
          // Use POST endpoint instead of GET
          const response = await axios.post(
            `${import.meta.env.VITE_SERVER}/user/check-admin`,
            { clerk_id: userId },
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          setIsAdmin(response.data.isAdmin);
        } catch (error) {
          console.error("Admin check failed:", error);
        }
      }
      setLoading(false);
    };
    checkAdminStatus();
  }, [userId]);
  if (!isLoaded || loading) return <Loader size="lg" />;
  if (!userId) return <Navigate to="/sign-in" replace />;
  if (adminRequired && !isAdmin) return <Navigate to="/" replace />;
  return children;
};

const AppContent = () => {
  const { signOut } = useClerk();
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const { isLoaded: authLoaded, userId } = useAuth();
  
  const [blogToEdit, setBlogToEdit] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  // Check admin status separately from sync
useEffect(() => {
  const checkAdminStatus = async () => {
    if (userLoaded && authLoaded && isSignedIn && userId) {
      try {
        const token = await window.Clerk.session.getToken();
        
        // Use POST endpoint instead of GET
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER}/user/check-admin`,
          { clerk_id: userId },
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        setIsAdmin(response.data.isAdmin);
      } catch (error) {
        console.error("Admin check failed:", error);
      }
    }
  };
  
  checkAdminStatus();
}, [userLoaded, authLoaded, isSignedIn, userId]);

  // Only sync user on sign-in, not on every refresh
  useEffect(() => {
    const syncUser = async () => {
      // Only sync when user first signs in and hasn't been synced yet
      if (userLoaded && authLoaded && isSignedIn && userId && !hasSynced) {
        try {
          const token = await window.Clerk.session.getToken();
          const fullName = user?.fullName || user?.emailAddresses[0]?.emailAddress;
          
          console.log("Syncing user with clerk_id:", userId);
          
          const response = await axios.post(
            `${import.meta.env.VITE_SERVER}/user/sync`,
            {
              clerk_id: userId,
              email: user.emailAddresses[0].emailAddress,
              fullname: fullName,
              username: user.username || (user.firstName?.toLowerCase() + (userId.slice(-4) || '')),
              profileImage: user.imageUrl
            },
            {
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              }
            }
          );
          
          console.log("User sync response:", response.data);
          
          // Mark as synced so we don't sync again on refresh
          setHasSynced(true);
          
          if (response.data.user?.blocked) {
            toast.error("Your account has been blocked. Please contact support.");
            await signOut();
          }
        } catch (error) {
          console.error("Error syncing user:", error);
          toast.error("Failed to sync user data");
        }
      }
    };
    syncUser();
  }, [userLoaded, authLoaded, isSignedIn, userId, user, signOut, hasSynced]);

  // Clear sync state on sign out
  useEffect(() => {
    if (!isSignedIn && hasSynced) {
      setHasSynced(false);
    }
  }, [isSignedIn]);

  return (
    <AdminContext.Provider value={{ isAdmin }}>
      <UserContext.Provider value={{ blogToEdit, setBlogToEdit }}>
        <Navbar />
        <Toaster />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/sign-in/*"
            element={isSignedIn ? <Navigate to="/" replace /> : <SignIn routing="path" path="/sign-in" />}
          />
          <Route
            path="/sign-up/*"
            element={isSignedIn ? <Navigate to="/" replace /> : <SignUp routing="path" path="/sign-up" />}
          />
          <Route path="/sign-out" element={<SignOutRedirect />} />
          <Route path="/blog/:blog_id" element={<BlogPage />} />
          <Route path="/user/:username" element={<Profile />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/search/:query" element={<SearchPage />} />
          <Route path="/search/tag/:tag" element={<SearchPage />} />
          <Route path="/admin" element={<AuthWrapper adminRequired><AdminDashboard /></AuthWrapper>} />
          <Route path="/dashboard" element={<AuthWrapper><Dashboard /></AuthWrapper>} />
          <Route path="/editor" element={<AuthWrapper><Editor /></AuthWrapper>} />
          <Route path="/editor/:blog_id" element={<AuthWrapper><Editor /></AuthWrapper>} />
          <Route path="/manage-blogs" element={<AuthWrapper><ManageBlogs /></AuthWrapper>} />
          <Route path="/edit-profile" element={<AuthWrapper><EditProfile /></AuthWrapper>} />
          <Route path="/change-password" element={<AuthWrapper><ChangePassword /></AuthWrapper>} />
          <Route path="/notifications" element={<AuthWrapper><Notifications /></AuthWrapper>} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </UserContext.Provider>
    </AdminContext.Provider>
  );
};

const App = () => {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      navigate={(to) => window.history.pushState(null, '', to)}
    >
      <AppContent />
    </ClerkProvider>
  );
};

export default App;