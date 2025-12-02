import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaBlog, FaSignInAlt, FaUser, FaLock, FaExclamationCircle, FaArrowRight, FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [credentials, setCredentials] = useState({
        username: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        // Clear error for this field when user starts typing
        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!credentials.username.trim()) {
            newErrors.username = "Username is required";
        }

        if (!credentials.password) {
            newErrors.password = "Password is required";
        } else if (credentials.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});
        setIsLoading(true);

        try {
            const response = await fetch("https://tejasblogsbackend-com.onrender.com/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials),
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Logged in successfully!");

                // Show success animation
                const button = e.target.querySelector('button[type="submit"]');
                button.innerHTML = '<i class="fas fa-check"></i> Success!';
                button.classList.remove('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'hover:from-blue-700', 'hover:to-purple-700');
                button.classList.add('bg-green-500', 'hover:bg-green-600');

                // Store user session
                sessionStorage.setItem("user", JSON.stringify(data.user));

                // Small delay for visual feedback
                setTimeout(() => {
                    navigate("/");
                }, 500);
            } else {
                setErrors({
                    message: data.message || "Invalid credentials. Please try again.",
                    password: "Invalid password"
                });
            }
        } catch (error) {
            console.error("Login error:", error);
            setErrors({
                message: "Server is unreachable. Please check your connection and try again."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-transparent to-transparent flex items-center justify-center p-4">

            <div className="w-full max-w-md">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl opacity-50"></div>

                {/* Main Card */}
                <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
                    {/* Gradient Header */}
                    <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                                <FaBlog className="text-white text-4xl" />
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-2">BlogSphere</h1>
                            <p className="text-blue-100 text-lg">Welcome back! Please sign in to continue</p>
                        </div>

                        {/* Decorative waves */}
                        <div className="absolute -bottom-6 left-0 right-0">
                            <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-12">
                                <path d="M0,0 C150,200 350,0 500,100 L500,0 L0,0 Z" fill="white" fillOpacity="0.15"></path>
                            </svg>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="p-8">
                        {/* Error Message */}
                        {errors.message && (
                            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl flex items-start space-x-3 animate-pulse">
                                <FaExclamationCircle className="text-red-500 text-xl mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-red-700 font-medium">{errors.message}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Username Field */}
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    <FaUser className="inline mr-2 text-gray-400" />
                                    Username
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="username"
                                        value={credentials.username}
                                        onChange={handleChange}
                                        autoComplete="off"
                                        required
                                        className={`w-full px-4 py-3 pl-12 bg-gray-50 border-2 ${errors.username ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                            } rounded-xl transition-all duration-300 outline-none`}
                                        placeholder="Enter your username"
                                    />

                                </div>
                                {errors.username && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <FaExclamationCircle className="mr-1" /> {errors.username}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    <FaLock className="inline mr-2 text-gray-400" />
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={credentials.password}
                                        onChange={handleChange}
                                        autoComplete="off"
                                        required
                                        className={`w-full px-4 py-3 pl-12 pr-12 bg-gray-50 border-2 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                            } rounded-xl transition-all duration-300 outline-none`}
                                        placeholder="Enter your password"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <FaExclamationCircle className="mr-1" /> {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Remember me & Forgot password */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" />
                                        <div className="w-5 h-5 bg-gray-200 rounded border border-gray-300 transition-colors peer-checked:bg-blue-500"></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 transition-opacity">
                                            <i className="fas fa-check text-xs"></i>
                                        </div>
                                    </div>
                                    <span className="text-gray-600 text-sm">Remember me</span>
                                </label>
                                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                                    Forgot password?
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ${isLoading ? 'opacity-80 cursor-not-allowed' : 'hover:from-blue-700 hover:to-purple-700'
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Signing in...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center space-x-2">
                                        <FaSignInAlt />
                                        <span>Sign In to BlogSphere</span>
                                    </div>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="my-8 relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        {/* Social Login Buttons (Optional) */}
                        <div className="grid grid-cols-1 gap-3 mb-6">
                            <button
                                type="button"
                                className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
                            >
                                <i className="fab fa-google text-red-500"></i>
                                <span className="font-medium">Google</span>
                            </button>

                        </div>

                        {/* Registration Link */}
                        <div className="text-center pt-4 border-t border-gray-200">
                            <p className="text-gray-600">
                                Don't have an account?{" "}
                                <Link
                                    to="/Registration"
                                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    Create one now
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        By signing in, you agree to our{" "}
                        <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors">
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;