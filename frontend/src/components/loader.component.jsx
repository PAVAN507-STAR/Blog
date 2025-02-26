import React from "react";

const Loader = ({ size = "md" }) => {
  let sizeClass = "w-6 h-6";
  
  if (size === "sm") sizeClass = "w-4 h-4";
  if (size === "lg") sizeClass = "w-12 h-12";
  
  return (
    <div className="flex justify-center items-center h-full w-full">
      <div className={`${sizeClass} border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin`}></div>
    </div>
  );
};

export default Loader;