import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 text-center">
      <i className="fas fa-exclamation-triangle text-warning display-1"></i>
      <h1 className="mt-3">404 - Page Not Found</h1>
      <p className="text-muted">The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary mt-3">
        <i className="fas fa-home"></i> Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
