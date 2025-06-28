import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./Navbar.css";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  const closeNavbar = () => {
    const navbar = document.getElementById("navbarNav");
    if (navbar.classList.contains("show")) {
      navbar.classList.remove("show");
    }
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm sticky-top">
      <div className="container-fluid">
        {/* Navbar brand (hidden or optional now) */}
        <Link className="navbar-brand d-lg-none" to="/">BlogSphere</Link>

        {/* Toggler button */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible content */}
        <div className="collapse navbar-collapse justify-content-center" id="navbarNav">
          <ul className="navbar-nav d-flex flex-row align-items-center gap-3">

            {/* Blog Icon (Clickable to Home) */}
            <li className="nav-item">
              <Link className="nav-link" to="/" onClick={closeNavbar} title="Home">
                <i className="fas fa-blog fa-lg text-primary"></i>
              </Link>
            </li>

            {/* Add Post */}
            <li className="nav-item">
              <Link className="nav-link" to="/add-post" onClick={closeNavbar} title="Add Post">
                <i className="fas fa-plus-circle fa-lg text-success"></i>
              </Link>
            </li>

            {/* User Dropdown */}
            <li className="nav-item dropdown" ref={dropdownRef}>
              <span
                className="nav-link"
                style={{ cursor: "pointer" }}
                onClick={toggleDropdown}
              >
                <i className="fas fa-user-circle fa-lg text-dark"></i>
              </span>

              {dropdownOpen && (
                <ul className="dropdown-menu show position-absolute mt-1" style={{ zIndex: 1000 }}>
                  <li>
                    <Link className="dropdown-item" to="/login" onClick={() => { closeNavbar(); setDropdownOpen(false); }}>
                      <i className="fas fa-sign-in-alt me-2"></i> Login
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/profile" onClick={() => { closeNavbar(); setDropdownOpen(false); }}>
                      <i className="fas fa-user me-2"></i> Profile
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
