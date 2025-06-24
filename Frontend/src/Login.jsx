import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Login = () => {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [credentials, setCredentials] = useState({
        username: "",
        password: "",
    });

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({}); // Reset errors before a new request

        try {
            const response = await fetch("http://localhost:8082/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials),
                credentials: "include", // Important for session cookies
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Logged in successfully!");

                // ✅ Store user session (Local Storage / Context API)
                sessionStorage.setItem("user", JSON.stringify(data.user));

                // ✅ Redirect to Home Page
                navigate("/");
            } else {
                setErrors({ message: data.message || "Login failed!" });
            }
        } catch (error) {
            console.error("Login error:", error);
            setErrors({ message: "Server is unreachable. Please try again later." });
        }
    };

    return (
        <div className="container">
            <div className="row justify-content-center align-items-center min-vh-100">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title text-center">
                                <i className="fas fa-blog"></i> BlogSphere
                            </h5>
                            <p className="text-center">Welcome to BlogSphere! Enter Your Credentials Below</p>

                            {errors.message && <div className="text-danger text-center">{errors.message}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">User Name:</label>
                                    <input type="text" className="form-control" name="username" value={credentials.username} onChange={handleChange} autoComplete="off" required />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Password:</label>
                                    <input type="password" className="form-control" name="password" value={credentials.password} onChange={handleChange} autoComplete="off" required />
                                </div>

                                <div className="d-grid">
                                    <button type="submit" className="btn btn-success"><i className="fas fa-sign-in-alt"></i> Proceed</button>
                                </div>
                            </form>

                            <div className="mt-3 text-center">
                                <small>Don't Have an Account? <Link to="/Registration">Register Here</Link></small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
