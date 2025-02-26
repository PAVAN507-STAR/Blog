import React, { useState, useEffect } from "react";

const InPageNavigation = ({ navItems, defaultActiveIndex = 0, children }) => {
  const [activeTab, setActiveTab] = useState(defaultActiveIndex);
  
  useEffect(() => {
    setActiveTab(defaultActiveIndex);
  }, [defaultActiveIndex]);
  
  return (
    <div>
      <div className="border-b border-grey mb-8 flex overflow-x-auto hide-scrollbar">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 whitespace-nowrap ${
              activeTab === index ? "border-b-2 border-black font-medium" : "text-dark-grey"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      
      {Array.isArray(children) ? children[activeTab] : children}
    </div>
  );
};

export default InPageNavigation;
