import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import SearchBar from "./search-bar.component";
import UserNavigation from "./user-navigation.component";

const Navbar = () => {
  const { isLoaded, isSignedIn } = useUser();
  const [showSearch, setShowSearch] = useState(false);
  
  return (
    <header className="border-b border-grey sticky top-0 bg-white z-10">
      <nav className="max-w-5xl mx-auto p-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold">BlogHub</Link>
        
        <div className="flex items-center gap-4">
          {showSearch ? (
            <div className="absolute top-full left-0 right-0 bg-white p-4 border-b border-grey">
              <SearchBar />
            </div>
          ) : null}
          
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-full hover:bg-grey"
          >
            <i className="fi fi-rr-search text-xl"></i>
          </button>
          
          {isLoaded && isSignedIn && (
            <>
              <Link to="/editor" className="hidden md:flex items-center gap-2 btn-dark">
                <i className="fi fi-rr-edit"></i>
                <span>Write</span>
              </Link>
              
              <Link to="/notifications" className="p-2 rounded-full hover:bg-grey relative">
                <i className="fi fi-rr-bell text-xl"></i>
              </Link>
            </>
          )}
          
          <UserNavigation />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

