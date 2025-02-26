import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Image from "@editorjs/image";
import Embed from "@editorjs/embed";
import Quote from "@editorjs/quote";
import CodeTool from "@editorjs/code";
import Animate from "../common/page-animation";
import Loader from "../components/loader.component";
import { UserContext } from "../App";

const Editor = () => {
  const { blog_id } = useParams();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();
  const { blogToEdit } = useContext(UserContext);
  
  const [blog, setBlog] = useState({
    title: "",
    banner: "",
    content: [],
    tags: [],
    des: "",
    draft: true
  });
  
  const [editorInstance, setEditorInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      if (blog_id) {
        fetchBlog();
      } else if (blogToEdit) {
        setBlog(blogToEdit);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [isLoaded, isSignedIn, blog_id, blogToEdit]);
  
  useEffect(() => {
    if (!loading && !editorInstance) {
      initEditor();
    }
    
    return () => {
      if (editorInstance) {
        editorInstance.destroy();
      }
    };
  }, [loading]);
  
  const fetchBlog = async () => {
    try {
      const token = await user.getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER}/blog/${blog_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setBlog(response.data.blog);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching blog:", error);
      toast.error("Failed to fetch blog");
      navigate("/dashboard/blogs");
    }
  };
  
  const initEditor = () => {
    const editor = new EditorJS({
      holder: "editor",
      data: {
        blocks: blog.content.length ? blog.content : []
      },
      tools: {
        header: Header,
        list: List,
        image: {
          class: Image,
          config: {
            uploader: {
              uploadByFile: async (file) => {
                try {
                  const formData = new FormData();
                  formData.append("image", file);
                  
                  // Get the token from Clerk using the correct method
                  let token = '';
                  if (user && typeof user.getToken === 'function') {
                    token = await user.getToken();
                  } else if (window.Clerk && window.Clerk.session) {
                    token = await window.Clerk.session.getToken();
                  }
                  
                  const response = await axios.post(
                    `${import.meta.env.VITE_SERVER}/upload-image`,
                    formData,
                    {
                      headers: {
                        "Content-Type": "multipart/form-data",
                        "Authorization": token ? `Bearer ${token}` : ''
                      },
                    }
                  );
                  
                  return {
                    success: 1,
                    file: {
                      url: response.data.imageUrl,
                    },
                  };
                } catch (error) {
                  console.error("Image upload error:", error);
                  return {
                    success: 0,
                    file: {
                      url: "",
                    },
                  };
                }
              },
            },
          },
        },
        embed: Embed,
        quote: Quote,
        code: CodeTool,
      },
      placeholder: "Let's write an awesome story!",
    });
    
    setEditorInstance(editor);
  };
  
  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    
    if (file) {
      try {
        const formData = new FormData();
        formData.append("image", file);
        
        let token = '';
        if (user && typeof user.getToken === 'function') {
          token = await user.getToken();
        } else if (window.Clerk && window.Clerk.session) {
          token = await window.Clerk.session.getToken();
        }
        
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER}/upload-image`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "Authorization": token ? `Bearer ${token}` : ''
            },
          }
        );
        
        setBlog({ ...blog, banner: response.data.imageUrl });
        toast.success("Banner uploaded successfully");
      } catch (error) {
        console.error("Banner upload error:", error);
        toast.error("Failed to upload banner");
      }
    }
  };
  
  const handleTitleChange = (e) => {
    setBlog({ ...blog, title: e.target.value });
  };
  
  const handleDescriptionChange = (e) => {
    setBlog({ ...blog, des: e.target.value });
  };
  
  const handleTagsChange = (e) => {
    const tags = e.target.value.split(",").map(tag => tag.trim());
    setBlog({ ...blog, tags });
  };
  
  const publishBlog = async (isDraft = false) => {
    try {
      if (!blog.title) {
        return toast.error("Please provide a blog title");
      }
      
      if (!blog.des) {
        return toast.error("Please provide a blog description");
      }
      
      if (!blog.tags.length) {
        return toast.error("Please provide at least one tag");
      }
      
      if (!blog.banner) {
        return toast.error("Please upload a banner image");
      }
      
      setPublishing(true);
      
      let editorData = { blocks: [] };
      
      // Check if editorInstance exists and has a save method
      if (editorInstance && typeof editorInstance.save === 'function') {
        editorData = await editorInstance.save();
      } else {
        console.warn("Editor instance not properly initialized, using empty content");
        // If we have existing content, use it
        if (blog.content && blog.content.length) {
          editorData.blocks = blog.content;
        }
      }
      
      // Get the token from Clerk using the correct method
      let token = '';
      if (user && typeof user.getToken === 'function') {
        token = await user.getToken();
      } else if (window.Clerk && window.Clerk.session) {
        token = await window.Clerk.session.getToken();
      }
      
      if (!token) {
        throw new Error("Failed to get authentication token");
      }
      
      const blogData = {
        ...blog,
        content: editorData.blocks,
        draft: isDraft,
        blog_id: blog_id || undefined
      };
      
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER}/blog`,
        blogData,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        }
      );
      
      setPublishing(false);
      
      if (response.data.blog_id) {
        toast.success(isDraft ? "Draft saved successfully" : "Blog published successfully");
        navigate(`/blog/${response.data.blog_id}`);
      } else {
        toast.success(isDraft ? "Draft updated successfully" : "Blog updated successfully");
        navigate(`/blog/${blog_id}`);
      }
    } catch (error) {
      console.error("Publishing error:", error);
      toast.error("Failed to publish blog");
      setPublishing(false);
    }
  };
  
  if (!isLoaded || loading) {
    return <Loader size="lg" />;
  }
  
  if (!isSignedIn) {
    return (
      <div className="h-cover flex flex-col items-center justify-center">
        <p className="text-2xl font-bold mb-4">Please sign in to create or edit blogs</p>
        <Link to="/sign-in" className="btn-dark">
          Sign In
        </Link>
      </div>
    );
  }
  
  return (
    <Animate>
      <section className="max-w-5xl mx-auto py-10 px-5">
        <Toaster />
        
        <div className="mb-8">
          <input
            type="text"
            placeholder="Blog Title"
            className="text-4xl font-bold w-full outline-none mb-4"
            value={blog.title}
            onChange={handleTitleChange}
          />
          
          <textarea
            placeholder="Blog Description (max 200 characters)"
            className="w-full h-20 outline-none resize-none mb-4"
            maxLength={200}
            value={blog.des}
            onChange={handleDescriptionChange}
          ></textarea>
          
          <input
            type="text"
            placeholder="Tags (comma separated)"
            className="w-full outline-none mb-4"
            value={blog.tags.join(", ")}
            onChange={handleTagsChange}
          />
          
          <div className="relative w-full h-72 bg-grey rounded-md overflow-hidden mb-8">
            {blog.banner ? (
              <img
                src={blog.banner}
                alt="Blog Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-dark-grey">Upload Banner Image</p>
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              id="banner-upload"
              hidden
              onChange={handleBannerUpload}
            />
            
            <label
              htmlFor="banner-upload"
              className="absolute bottom-4 right-4 bg-white p-2 rounded-md cursor-pointer"
            >
              <i className="fi fi-rr-picture"></i>
            </label>
          </div>
        </div>
        
        <div id="editor" className="min-h-[500px]"></div>
        
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => publishBlog(true)}
            className="btn-light"
            disabled={publishing}
          >
            {publishing ? "Saving..." : "Save as Draft"}
          </button>
          
          <button
            onClick={() => publishBlog(false)}
            className="btn-dark"
            disabled={publishing}
          >
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </section>
    </Animate>
  );
};

export default Editor;
