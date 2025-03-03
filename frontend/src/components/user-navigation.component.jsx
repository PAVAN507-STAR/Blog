import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";

const UserNavigation = () => {
  const { isSignedIn, user } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isSignedIn && user) {
        try {
          let token = '';
          if (window.Clerk && window.Clerk.session) {
            token = await window.Clerk.session.getToken();
          }
          console.log(token);
          console.log(window.Clerk.session)
          
          if (!token) {
            throw new Error("Failed to get authentication token");
          }
  
          // Get the user ID from Clerk
          const userId = user.id;
          
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
          
          console.log("Admin check response:", response.data);
          setIsAdmin(response.data.isAdmin);
        } catch (error) {
          console.error("Admin check failed:", error);
        }
      }
    };
  
    checkAdminStatus();
  }, [isSignedIn, user]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  
  if (!isSignedIn) {
    return (
      <div className="flex gap-2">
        <Link to="/sign-in" className="btn-light">
          Sign In
        </Link>
        <Link to="/sign-up" className="btn-dark">
          Sign Up
        </Link>
      </div>
    );
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2"
      >
        {user.imageUrl ? (
          <img 
            src={user.imageUrl} 
            alt={user.fullName} 
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
            {user.fullName[0]}
          </div>
        )}
        <i className={`fi fi-rr-angle-small-down transition-transform ${showDropdown ? "rotate-180" : ""}`}></i>
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-grey rounded-md shadow-md z-10">
          <div className="p-3 border-b border-grey">
            <p className="font-medium">{user.fullName}</p>
            <p className="text-sm text-dark-grey">@{user.username}</p>
          </div>
          
          <ul>
            <li>
              <Link 
                to="/dashboard" 
                className="block px-4 py-2 hover:bg-grey transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                <i className="fi fi-rr-dashboard mr-2"></i>
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/editor" 
                className="block px-4 py-2 hover:bg-grey transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                <i className="fi fi-rr-file-edit mr-2"></i>
                Write
              </Link>
            </li>
            <li>
              <Link 
                to={`/user/${user.username}`} 
                className="block px-4 py-2 hover:bg-grey transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                <i className="fi fi-rr-user mr-2"></i>
                Profile
              </Link>
            </li>
            <li>
              <Link 
                to="/edit-profile" 
                className="block px-4 py-2 hover:bg-grey transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                <i className="fi fi-rr-settings mr-2"></i>
                Settings
              </Link>
            </li>
            {isAdmin && (
              <li>
                <Link 
                  to="/admin" 
                  className="block px-4 py-2 hover:bg-grey transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <i className="fi fi-rr-shield-check mr-2"></i>
                  Admin Dashboard
                </Link>
              </li>
            )}
            <li className="border-t border-grey">
              <button 
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-red-500 hover:bg-grey transition-colors"
              >
                <i className="fi fi-rr-sign-out mr-2"></i>
                Sign Out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserNavigation;
