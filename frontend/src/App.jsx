import React, { createContext, useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ClerkProvider, SignIn, SignUp, useAuth, useUser, useClerk } from "@clerk/clerk-react";
import { neobrutalism } from "@clerk/themes";
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
import CompleteProfile from "./pages/CompleteProfile";
import Loader from "./components/loader.component";
import AdminDashboard from "./components/AdminDashboard";
import SignOutRedirect from "./components/SignOutRedirect";
import AdminContext from "./components/AdminContext";

export const UserContext = createContext({});

const AuthWrapper = ({ children, adminRequired = false, authorRequired = false }) => {
  const { isLoaded, userId } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userType, setUserType] = useState("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (userId) {
        try {
          let token = "";
          if (window.Clerk && window.Clerk.session) {
            token = await window.Clerk.session.getToken();
          }
          if (!token) throw new Error("Failed to get authentication token");

          const response = await axios.post(
            `${import.meta.env.VITE_SERVER}/user/check-admin`,
            { clerk_id: userId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          setIsAdmin(response.data.isAdmin);
          setUserType(response.data.userType || "user");
        } catch (error) {
          console.error("User check failed:", error);
        }
      }
      setLoading(false);
    };
    checkUserStatus();
  }, [userId]);

  if (!loading) {
    if (authorRequired && !(isAdmin || userType === "author")) {
      return <Navigate to="/" replace />;
    }
    if (adminRequired && !isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return (
    <AdminContext.Provider value={{ isAdmin }}>
      <UserContext.Provider
        value={{
          blogToEdit: null,
          setBlogToEdit: () => {},
          isAdmin,
          userType,
        }}
      >
        {children}
      </UserContext.Provider>
    </AdminContext.Provider>
  );
};

const AppContent = () => {
  const { signOut } = useClerk();
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const { isLoaded: authLoaded, userId } = useAuth();
  const location = useLocation();

  const [blogToEdit, setBlogToEdit] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [userType, setUserType] = useState("user");

  // Determine if the user needs to complete their profile.
  const needsProfileCompletion =
    isSignedIn &&
    user &&
    !(user.publicMetadata?.user_type || user.unsafeMetadata?.user_type) &&
    location.pathname !== "/complete-profile";

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (userLoaded && authLoaded && isSignedIn && userId) {
        try {
          const token = await window.Clerk.session.getToken();
          const response = await axios.post(
            `${import.meta.env.VITE_SERVER}/user/check-admin`,
            { clerk_id: userId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
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

  // Sync user data on sign-in (only once)
  useEffect(() => {
    const syncUser = async () => {
      if (userLoaded && authLoaded && isSignedIn && userId && !hasSynced) {
        try {
          const token = await window.Clerk.session.getToken();
          const fullName = user?.fullName || user?.emailAddresses[0]?.emailAddress;
          const userTypeFromMetadata = user.publicMetadata?.user_type || user.unsafeMetadata?.user_type || "user";
          console.log(userTypeFromMetadata)

          const response = await axios.post(
            `${import.meta.env.VITE_SERVER}/user/sync`,
            {
              clerk_id: userId,
              email: user.emailAddresses[0].emailAddress,
              fullname: fullName,
              username: user.username || (user.firstName?.toLowerCase() + (userId.slice(-4) || "")),
              profileImage: user.imageUrl,
              user_type: userTypeFromMetadata,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setUserType(response.data.user?.user_type || "user");
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

  // Clear sync state on sign out.
  useEffect(() => {
    if (!isSignedIn && hasSynced) {
      setHasSynced(false);
    }
  }, [isSignedIn]);

  return (
    <>
      {needsProfileCompletion && <Navigate to="/complete-profile" replace />}
      <AdminContext.Provider value={{ isAdmin }}>
        <UserContext.Provider value={{ blogToEdit, setBlogToEdit, isAdmin, userType }}>
          <Navbar />
          <Toaster />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/sign-in/*"
              element={
                isSignedIn ? <Navigate to="/" replace /> : <SignIn routing="path" path="/sign-in" />
              }
            />
            <Route
              path="/sign-up/*"
              element={
                isSignedIn ? (
                  <Navigate to="/" replace />
                ) : (
                  <SignUp
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                    fallbackRedirectUrl="/"
                    appearance={{
                      baseTheme: neobrutalism,
                      variables: {
                        colorPrimary: "#000000",
                        colorBackground: "#ffffff",
                        colorText: "#000000",
                      },
                    }}
                    signUpConfig={{
                      customFields: [
                        {
                          label: "Sign up as",
                          field: "user_type",
                          type: "radio",
                          options: [
                            { label: "User", value: "user" },
                            { label: "Author", value: "author" },
                          ],
                        },
                      ],
                    }}
                  />
                )
              }
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
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </UserContext.Provider>
      </AdminContext.Provider>
    </>
  );
};

const App = () => {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      navigate={(to) => window.history.pushState(null, "", to)}
      appearance={{
        baseTheme: neobrutalism,
        variables: {
          colorPrimary: "#000000",
          colorBackground: "#ffffff",
          colorText: "#000000",
        },
      }}
    >
      <AppContent />
    </ClerkProvider>
  );
};

export default App;
