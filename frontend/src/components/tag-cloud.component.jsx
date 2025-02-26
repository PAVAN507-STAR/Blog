import React from "react";
import { Link } from "react-router-dom";

const TagCloud = ({ tags }) => {
  return (
    <div className="border border-grey rounded-lg p-4">
      <h3 className="text-xl font-bold mb-4">Popular Tags</h3>
      
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Link 
            key={index} 
            to={`/search/tag/${tag.name}`}
            className="text-sm bg-grey px-3 py-1 rounded-full text-dark-grey hover:bg-black hover:text-white transition-colors"
          >
            #{tag.name}
            {tag.count && <span className="ml-1">({tag.count})</span>}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TagCloud; 