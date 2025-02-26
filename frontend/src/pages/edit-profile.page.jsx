import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import Animate from "../common/page-animation";
import Loader from "../components/loader.component";

const EditProfile = () => {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    fullname: "",
    bio: "",
    social_links: {
      youtube: "",
      instagram: "",
      facebook: "",
      twitter: "",
      github: "",
      website: ""
    }
  });
  
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      fetchProfile();
    } else if (isLoaded && !isSignedIn) {
      navigate("/sign-in");
    }
  }, [isLoaded, isSignedIn, user]);
  
  const fetchProfile = async () => {
    try {
      const token = await getToken();
      // Update the URL to include the current user's username
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/user/profile/${user.username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const userData = response.data.user;
      
      setProfile({
        fullname: userData.personal_info.fullname,
        bio: userData.personal_info.bio || "",
        social_links: {
          youtube: userData.social_links?.youtube || "",
          instagram: userData.social_links?.instagram || "",
          facebook: userData.social_links?.facebook || "",
          twitter: userData.social_links?.twitter || "",
          github: userData.social_links?.github || "",
          website: userData.social_links?.website || ""
        }
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to fetch profile");
      navigate("/");
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setProfile({
        ...profile,
        [parent]: {
          ...profile[parent],
          [child]: value
        }
      });
    } else {
      setProfile({
        ...profile,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const token = await getToken();
      await axios.put(
        `${import.meta.env.VITE_SERVER}/user/profile`,
        profile,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      toast.success("Profile updated successfully");
      setSaving(false);
      navigate(`/user/${user.username}`);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
      setSaving(false);
    }
  };
  
  if (loading) {
    return <Loader size="lg" />;
  }
  
  return (
    <Animate>
      <section className="max-w-3xl mx-auto py-10 px-5">
        <Toaster />
        
        <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block mb-2 font-medium">Full Name</label>
            <input
              type="text"
              name="fullname"
              value={profile.fullname}
              onChange={handleChange}
              className="w-full p-3 border border-grey rounded-md"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-medium">Bio</label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              className="w-full p-3 border border-grey rounded-md h-32 resize-none"
            ></textarea>
          </div>
          
          <h2 className="text-xl font-bold mb-4">Social Links</h2>
          
          <div className="mb-6">
            <label className="block mb-2 font-medium">YouTube</label>
            <input
              type="url"
              name="social_links.youtube"
              value={profile.social_links.youtube}
              onChange={handleChange}
              className="w-full p-3 border border-grey rounded-md"
            />
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-medium">Instagram</label>
            <input
              type="url"
              name="social_links.instagram"
              value={profile.social_links.instagram}
              onChange={handleChange}
              className="w-full p-3 border border-grey rounded-md"
            />
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-medium">Facebook</label>
            <input
              type="url"
              name="social_links.facebook"
              value={profile.social_links.facebook}
              onChange={handleChange}
              className="w-full p-3 border border-grey rounded-md"
            />
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-medium">Twitter</label>
            <input
              type="url"
              name="social_links.twitter"
              value={profile.social_links.twitter}
              onChange={handleChange}
              className="w-full p-3 border border-grey rounded-md"
            />
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-medium">GitHub</label>
            <input
              type="url"
              name="social_links.github"
              value={profile.social_links.github}
              onChange={handleChange}
              className="w-full p-3 border border-grey rounded-md"
            />
          </div>
          
          <div className="mb-8">
            <label className="block mb-2 font-medium">Website</label>
            <input
              type="url"
              name="social_links.website"
              value={profile.social_links.website}
              onChange={handleChange}
              className="w-full p-3 border border-grey rounded-md"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(`/user/${user.username}`)}
              className="btn-light"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="btn-dark"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </Animate>
  );
};

export default EditProfile;
