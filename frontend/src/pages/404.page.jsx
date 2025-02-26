import React from "react";
import { Link } from "react-router-dom";
import Animate from "../common/page-animation";

const PageNotFound = () => {
  return (
    <Animate>
      <section className="h-cover flex flex-col items-center justify-center">
        <h1 className="text-9xl font-bold text-grey">404</h1>
        <p className="text-2xl font-medium mb-8">Page Not Found</p>
        <p className="text-dark-grey mb-8 text-center max-w-md">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link to="/" className="btn-dark">
          Go Home
        </Link>
      </section>
    </Animate>
  );
};

export default PageNotFound;
