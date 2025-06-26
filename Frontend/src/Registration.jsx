import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Registration = () => {
    const navigate = useNavigate();

    // State for form inputs
    const [formData, setFormData] = useState({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState({});
    const [usernameMsg, setUsernameMsg] = useState(""); // For username availability message
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    
    // Handle input change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Validate form before submission
    const validateForm = () => {
        let errors = {};
        if (!formData.email) errors.email = "Email is required";
        if (!formData.username) errors.username = "Username is required";
        if (!formData.password) errors.password = "Password is required";
        if (formData.password.length < 8)
            errors.password = "Password must be at least 8 characters long";
        if (formData.password !== formData.confirmPassword)
            errors.confirmPassword = "Passwords do not match";
        return errors;
    };

    // Check username availability
    const checkUsername = async () => {
        if (formData.username.trim() === "") {
            setUsernameMsg("Username cannot be empty.");
            return;
        }

        // Uncomment this to check username availability via API
        /*
        try {
          const response = await fetch(`http://localhost:8082/ValidatedUsername?username=${formData.username}`);
          const data = await response.json();
    
          if (data.status === "Valid") {
            setUsernameMsg("Username is available.");
          } else if (data.status === "Invalid") {
            setUsernameMsg("Username is already taken.");
          } else {
            setUsernameMsg("Error checking username.");
          }
        } catch (error) {
          setUsernameMsg("Error checking username. Please try again.");
        }
        */
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        setErrors(errors);

        if (Object.keys(errors).length === 0) {
            if (window.confirm("Are you sure you want to register?")) {
                try {
                    const response = await fetch(`${BASE_URL}/api/users/register`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(formData),
                    });


                    const data = await response.json(); // Read JSON response from server

                    if (response.ok) {
                        alert("Registration successful!");
                        navigate("/Login");
                    } else {
                        alert(data.message || "Registration failed! Try again."); // Show backend error message
                    }
                } catch (error) {
                    console.error("Error registering user:", error);
                    alert("Something went wrong! Please check your connection and try again.");
                }
            }
        }

    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4 shadow" style={{ width: "400px" }}>
                <h5 className="card-title text-center">
                    <i className="fas fa-blog"></i> Blog Sphere
                </h5>
                <p className="text-center">Enter Your Details Here!</p>

                <form onSubmit={handleSubmit}>
                    {/* Email */}
                    <div className="mb-3">
                        <label className="form-label">Email:</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control form-control-sm"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && <small className="text-danger">{errors.email}</small>}
                    </div>

                    {/* Username */}
                    <div className="mb-3">
                        <label className="form-label">Username:</label>
                        <input
                            type="text"
                            name="username"
                            className="form-control form-control-sm"
                            value={formData.username}
                            onChange={handleChange}
                            onBlur={checkUsername}
                        />
                        <small className={usernameMsg.includes("taken") ? "text-danger" : "text-success"}>
                            {usernameMsg}
                        </small>
                        {errors.username && <small className="text-danger">{errors.username}</small>}
                    </div>

                    {/* Password */}
                    <div className="mb-3">
                        <label className="form-label">Password:</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control form-control-sm"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        {errors.password && <small className="text-danger">{errors.password}</small>}
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-3">
                        <label className="form-label">Confirm Password:</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="form-control form-control-sm"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                        {errors.confirmPassword && (
                            <small className="text-danger">{errors.confirmPassword}</small>
                        )}
                    </div>

                    {/* Register Button */}
                    <div className="text-center">
                        <button type="submit" className="btn btn-success">
                            Proceed
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Registration;
