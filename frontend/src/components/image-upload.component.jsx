import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import axios from "axios";

// Initialize Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const ImageUpload = ({ onImageUpload, label = "Upload Image", user }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Check file type
    if (!file.type.includes("image")) {
      return toast.error("Please upload an image file");
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Image size should be less than 2MB");
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      // Get the token from Clerk if user is available
      let headers = {
        "Content-Type": "multipart/form-data"
      };
      
      if (user) {
        let token = '';
        if (typeof user.getToken === 'function') {
          token = await user.getToken();
        } else if (window.Clerk && window.Clerk.session) {
          token = await window.Clerk.session.getToken();
        }
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
      
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER}/upload-image`,
        formData,
        { headers }
      );
      
      onImageUpload(response.data.imageUrl);
      setUploading(false);
      setProgress(0);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      setUploading(false);
    }
  };
  
  return (
    <div className="w-full">
      <label className="btn-dark inline-block cursor-pointer">
        {uploading ? `Uploading... ${progress}%` : label}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
};

export default ImageUpload; 