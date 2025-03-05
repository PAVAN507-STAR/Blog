import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const CompleteProfile = () => {
  const { user, isLoaded, reload } = useUser(); // Notice we also destructure reload
  const [role, setRole] = useState("user");
  const navigate = useNavigate();

  if (!isLoaded || !user) {
    return <div>Loading...</div>;
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update the user's unsafe metadata with the selected role.
      const updatedUser = await user.update({ unsafeMetadata: { user_type: role } });
      console.log("Updated user metadata:", updatedUser.unsafeMetadata);
      toast.success("Profile updated successfully");
      navigate("/");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Complete Your Profile</h2>
      <form onSubmit={handleSubmit} className="p-4 border rounded">
        <label className="block mb-2 text-lg">Select your role:</label>
        <div className="mb-4">
          <label className="mr-4">
            <input
              type="radio"
              name="role"
              value="user"
              checked={role === "user"}
              onChange={() => setRole("user")}
              className="mr-2"
            />
            User
          </label>
          <label>
            <input
              type="radio"
              name="role"
              value="author"
              checked={role === "author"}
              onChange={() => setRole("author")}
              className="mr-2"
            />
            Author
          </label>
        </div>
        <button type="submit" className="px-4 py-2 bg-black text-white rounded">
          Save
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile;
