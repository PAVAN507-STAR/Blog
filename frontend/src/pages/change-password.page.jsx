import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Toaster, toast } from "react-hot-toast";
import Animate from "../common/page-animation";
import Loader from "../components/loader.component";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("New passwords don't match");
    }
    
    if (formData.newPassword.length < 8) {
      return toast.error("Password must be at least 8 characters long");
    }
    
    try {
      setLoading(true);
      
      // Use Clerk's password change functionality
      await user.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      toast.success("Password changed successfully");
      navigate("/settings/edit-profile");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };
  
  if (!isLoaded) {
    return <Loader size="lg" />;
  }
  
  if (!isSignedIn) {
    navigate("/sign-in");
    return null;
  }
  
  return (
    <Animate>
      <section className="max-w-md mx-auto py-10 px-5">
        <Toaster />
        
        <h1 className="text-3xl font-bold mb-8">Change Password</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block mb-2 font-medium">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full p-3 border border-grey rounded-md"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-medium">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full p-3 border border-grey rounded-md"
              required
              minLength={8}
            />
          </div>
          
          <div className="mb-8">
            <label className="block mb-2 font-medium">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-3 border border-grey rounded-md"
              required
              minLength={8}
            />
          </div>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/settings/edit-profile")}
              className="btn-light"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="btn-dark"
              disabled={loading}
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </section>
    </Animate>
  );
};

export default ChangePassword;
