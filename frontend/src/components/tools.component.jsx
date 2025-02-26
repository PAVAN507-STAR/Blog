import React from "react";

const Tools = ({ children, title, icon }) => {
  return (
    <div className="border border-grey rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        {icon && <i className={`fi ${icon} text-xl`}></i>}
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      
      {children}
    </div>
  );
};

export default Tools;
