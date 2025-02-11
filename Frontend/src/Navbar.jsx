import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Navbar = () => {
    // Function to close navbar after clicking a link (for mobile views)
    const closeNavbar = () => {
        const navbar = document.getElementById("navbarNav");
        if (navbar.classList.contains("show")) {
            navbar.classList.remove("show");
        }
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/" onClick={closeNavbar}>
                    <i className="fas fa-blog"></i> Blog Sphere
                </Link>
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
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link" to="/add-post" onClick={closeNavbar}>
                                <i className="fas fa-plus-circle"></i> Add Post
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/login" onClick={closeNavbar}>
                                <i className="fas fa-sign-in-alt"></i> Login
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/logout" onClick={closeNavbar}>
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </Link>
                        </li>
                    </ul>
                    <div className="d-flex">
                        <input
                            type="text"
                            id="txtSearch"
                            className="form-control form-control-sm"
                            placeholder="Search"
                        />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
