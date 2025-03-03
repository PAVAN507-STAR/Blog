import React, { useState, useEffect } from "react";

const InPageNavigation = ({ navItems, defaultActiveIndex = 0, children, setActiveTab }) => {
  const [localActiveIndex, setLocalActiveIndex] = useState(defaultActiveIndex);
  
  useEffect(() => {
    setLocalActiveIndex(defaultActiveIndex);
  }, [defaultActiveIndex]);

  // When the local active index changes, update the parent using the provided callback.
  useEffect(() => {
    if (setActiveTab && navItems[localActiveIndex]) {
      setActiveTab(navItems[localActiveIndex].id);
    }
  }, [localActiveIndex, navItems, setActiveTab]);

  return (
    <div>
      <div className="border-b border-grey mb-8 flex overflow-x-auto hide-scrollbar">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => setLocalActiveIndex(index)}
            className={`px-4 py-2 whitespace-nowrap ${
              localActiveIndex === index ? "border-b-2 border-black font-medium" : "text-dark-grey"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>
      
      {Array.isArray(children) ? children[localActiveIndex] : children}
    </div>
  );
};

export default InPageNavigation;
