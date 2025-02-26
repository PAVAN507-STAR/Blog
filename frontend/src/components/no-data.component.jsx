import React from "react";
import { Link } from "react-router-dom";

const NoData = ({ 
  message = "No data found", 
  actionText = "Go Home", 
  actionLink = "/",
  icon = "fi-rr-info"
}) => {
  return (
    <div className="w-full py-10 flex flex-col items-center justify-center text-center">
      <i className={`fi ${icon} text-4xl text-dark-grey mb-4`}></i>
      <p className="text-xl font-medium mb-4">{message}</p>
      <Link to={actionLink} className="btn-dark">
        {actionText}
      </Link>
    </div>
  );
};

export default NoData; 