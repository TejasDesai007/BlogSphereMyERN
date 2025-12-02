import React from "react";
import { Link } from "react-router-dom";
import { FaExclamationTriangle, FaHome, FaCompass } from "react-icons/fa";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col items-center justify-center px-4">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-30"></div>
      
      {/* Main content */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-white/20">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <FaExclamationTriangle className="text-white text-4xl" />
          </div>
        </div>
        
        {/* Error Message */}
        <h1 className="text-4xl font-bold text-gray-800 mb-3">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for seems to have wandered off.
          Don't worry, let's get you back on track.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <FaHome />
            
          </Link>
          
          
        </div>
        
        {/* Helpful Links */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm mb-3">You might be looking for:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm hover:underline">
              Home
            </Link>
            
          </div>
        </div>
      </div>
      
      {/* Footer note */}
      <p className="mt-8 text-gray-500 text-sm">
        If you believe this is an error, please contact support.
      </p>
    </div>
  );
};

export default NotFound;