import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaBlog, FaUserPlus, FaUser, FaEnvelope, FaLock, FaExclamationCircle, FaEye, FaEyeSlash, FaCheck } from "react-icons/fa";

const Registration = () => {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState({
        password: false,
        confirmPassword: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear error for this field when user starts typing
        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: "" }));
        }
        if (errors.confirmPassword && e.target.name === "password") {
            setErrors(prev => ({ ...prev, confirmPassword: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.username.trim()) {
            newErrors.username = "Username is required";
        } else if (formData.username.length < 3) {
            newErrors.username = "Username must be at least 3 characters";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        return newErrors;
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
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
            const response = await fetch("https://tejasblogsbackend-com.onrender.com/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);

                // Show success animation
                const button = e.target.querySelector('button[type="submit"]');
                button.innerHTML = '<i class="fas fa-check"></i> Success!';
                button.classList.remove('bg-gradient-to-r', 'from-green-500', 'to-emerald-500', 'hover:from-green-600', 'hover:to-emerald-600');
                button.classList.add('bg-green-500', 'hover:bg-green-600');

                // Small delay for visual feedback
                setTimeout(() => {
                    navigate("/login");
                }, 1500);
            } else {
                setErrors({
                    message: data.message || "Registration failed. Please try again.",
                    ...(data.email && { email: data.message }),
                    ...(data.username && { username: data.message })
                });
            }
        } catch (error) {
            console.error("Registration error:", error);
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
                    <div className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                                <FaBlog className="text-white text-4xl" />
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-2">BlogSphere</h1>
                            <p className="text-emerald-100 text-lg">Join our community of writers</p>
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
                        {/* Success Message */}
                        {success && (
                            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl flex items-start space-x-3 animate-pulse">
                                <FaCheck className="text-green-500 text-xl mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-green-700 font-medium">Registration successful! Redirecting to login...</p>
                                </div>
                            </div>
                        )}

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
                                        value={formData.username}
                                        onChange={handleChange}
                                        autoComplete="off"
                                        required
                                        className={`w-full px-4 py-3 pl-12 bg-gray-50 border-2 ${errors.username ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                                            } rounded-xl transition-all duration-300 outline-none`}
                                        placeholder="Choose a username"
                                    />
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">

                                    </div>
                                </div>
                                {errors.username && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <FaExclamationCircle className="mr-1" /> {errors.username}
                                    </p>
                                )}
                            </div>

                            {/* Email Field */}
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    <FaEnvelope className="inline mr-2 text-gray-400" />
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        autoComplete="off"
                                        required
                                        className={`w-full px-4 py-3 pl-12 bg-gray-50 border-2 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                                            } rounded-xl transition-all duration-300 outline-none`}
                                        placeholder="Enter your email"
                                    />
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">

                                    </div>
                                </div>
                                {errors.email && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <FaExclamationCircle className="mr-1" /> {errors.email}
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
                                        type={showPassword.password ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        autoComplete="off"
                                        required
                                        className={`w-full px-4 py-3 pl-12 pr-12 bg-gray-50 border-2 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                                            } rounded-xl transition-all duration-300 outline-none`}
                                        placeholder="Create a password"
                                    />
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">

                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility("password")}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword.password ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <FaExclamationCircle className="mr-1" /> {errors.password}
                                    </p>
                                )}
                                <p className="mt-2 text-xs text-gray-500">
                                    Password must be at least 6 characters long
                                </p>
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">
                                    <FaLock className="inline mr-2 text-gray-400" />
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword.confirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        autoComplete="off"
                                        required
                                        className={`w-full px-4 py-3 pl-12 pr-12 bg-gray-50 border-2 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                                            } rounded-xl transition-all duration-300 outline-none`}
                                        placeholder="Confirm your password"
                                    />
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">

                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility("confirmPassword")}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <FaExclamationCircle className="mr-1" /> {errors.confirmPassword}
                                    </p>
                                )}
                            </div>



                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || success}
                                className={`w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ${(isLoading || success) ? 'opacity-80 cursor-not-allowed' : 'hover:from-green-600 hover:to-emerald-600'
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Creating account...</span>
                                    </div>
                                ) : success ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <FaCheck />
                                        <span>Success! Redirecting...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center space-x-2">
                                        <FaUserPlus />
                                        <span>Create Account</span>
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
                                <span className="px-4 bg-white text-gray-500">Or sign up with</span>
                            </div>
                        </div>

                        {/* Social Registration Buttons */}
                        <div className="grid grid-cols-1 gap-3 mb-6">
                            <button
                                type="button"
                                className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-300"
                            >
                                <i className="fab fa-google text-red-500"></i>
                                <span className="font-medium">Sign up with Google</span>
                            </button>
                        </div>

                        {/* Login Link */}
                        <div className="text-center pt-4 border-t border-gray-200">
                            <p className="text-gray-600">
                                Already have an account?{" "}
                                <Link
                                    to="/login"
                                    className="font-semibold text-green-600 hover:text-green-700 transition-colors"
                                >
                                    Sign in here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        By creating an account, you agree to our{" "}
                        <a href="#" className="text-green-600 hover:text-green-700 transition-colors">
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-green-600 hover:text-green-700 transition-colors">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Registration;    