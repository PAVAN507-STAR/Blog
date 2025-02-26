import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SearchBar = ({ placeholder = "Search blogs..." }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search/${query.trim()}`);
      setQuery("");
    }
  };
  
  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          className="w-full p-3 pl-10 border border-grey rounded-md"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        
        <i className="fi fi-rr-search absolute left-3 top-1/2 -translate-y-1/2 text-dark-grey"></i>
        
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-grey"
        >
          <i className="fi fi-rr-arrow-right"></i>
        </button>
      </div>
    </form>
  );
};

export default SearchBar; 