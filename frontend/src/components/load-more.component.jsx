import React from "react";

const LoadMore = ({ onClick, loading, hasMore }) => {
  if (!hasMore) return null;
  
  return (
    <div className="flex justify-center my-8">
      <button 
        onClick={onClick}
        disabled={loading}
        className="btn-dark flex items-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Loading...
          </>
        ) : (
          <>
            <i className="fi fi-rr-refresh"></i>
            Load More
          </>
        )}
      </button>
    </div>
  );
};

export default LoadMore;
