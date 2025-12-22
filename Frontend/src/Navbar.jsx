import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaPlus,
  FaUserCircle,
  FaSignInAlt,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaBookmark,
  FaBell,
  FaSearch,
  FaMoon,
  FaSun
} from "react-icons/fa";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const dropdownRef = useRef();
  const searchRef = useRef();
  const notificationsRef = useRef();
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    setNotificationsLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/notifications/${user.id}`);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationsToggle = async () => {
    if (!user) return;
    const willOpen = !notificationsOpen;
    setNotificationsOpen(willOpen);
    if (willOpen) {
      await fetchNotifications();
      try {
        await axios.post(`${BASE_URL}/api/notifications/mark-read`, {
          userId: user.id,
        });
        setUnreadCount(0);
      } catch (err) {
        console.error("Error marking notifications as read:", err);
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      {/* Navigation Bar - Fixed with proper height */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16 ${scrolled
          ? "bg-white/95 backdrop-blur-lg shadow-xl py-2 dark:bg-gray-900/95 dark:shadow-gray-900/50"
          : "bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-md py-3"
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <Link
                to="/"
                className="flex items-center space-x-3 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <i className={`fas fa-blog text-xl ${scrolled ? 'text-blue-600' : 'text-blue-500'}`}></i>
                  </div>
                </div>
                <div className="hidden md:block">
                  <h1 className={`text-xl font-bold bg-gradient-to-r ${scrolled ? 'from-blue-600 to-purple-600' : 'from-white to-blue-100'} bg-clip-text text-transparent`}>
                    BlogSphere
                  </h1>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {/* Search Bar */}
              <div className="relative" ref={searchRef}>


              </div>

              {/* Add Post Button */}
              <Link
                to="/add-post"
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <FaPlus />
                <span>New Post</span>
              </Link>

              {/* Notifications */}
              {user && (
                <div className="relative" ref={notificationsRef}>
                  <button
                    className="relative p-2 rounded-full hover:bg-white/20 transition-all duration-300"
                    onClick={handleNotificationsToggle}
                  >
                    <FaBell className="text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl overflow-hidden animate-slideDown z-50">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3 text-white flex items-center justify-between">
                        <span className="font-semibold">Notifications</span>
                        {notificationsLoading && (
                          <span className="text-xs opacity-80">Loading...</span>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n._id}
                              className={`px-4 py-3 text-sm border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex justify-between items-start ${
                                !n.isRead ? "bg-blue-50/70" : "bg-white"
                              }`}
                            >
                              <div>
                                <p className="text-gray-800">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(n.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Saved Posts */}


              {/* Dark Mode Toggle */}


              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-white/20 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 p-0.5">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <FaUserCircle className="text-2xl text-blue-600" />
                    </div>
                  </div>
                  <span className="text-white font-medium hidden lg:block">
                    {user ? user.username : "Guest"}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl overflow-hidden animate-slideDown">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                          <FaUserCircle className="text-2xl text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{user ? user.username : "Guest"}</h3>
                          <p className="text-blue-100 text-sm">{user ? user.email : "Login to continue"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      {!user ? (
                        <>
                          <Link
                            to="/login"
                            className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <FaSignInAlt className="text-blue-500" />
                            <span>Sign In</span>
                          </Link>
                          <Link
                            to="/registration"
                            className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <FaUser className="text-green-500" />
                            <span>Create Account</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/profile"
                            className="flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <FaUser className="text-blue-500" />
                            <span>My Profile</span>
                          </Link>
                          
                          
                          <button
                            onClick={() => {
                              handleLogout();
                              setDropdownOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          >
                            <FaSignOutAlt />
                            <span>Logout</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <span className={`block w-6 h-0.5 bg-white transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-white transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-white transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer div to push content down */}
      <div className="h-16"></div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-gradient-to-b from-blue-600/95 to-purple-600/95 backdrop-blur-lg">
          <div className="p-6 space-y-4 animate-slideDown mt-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-3 pl-10 bg-white/20 backdrop-blur-sm text-white rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" />
            </div>

            {/* Mobile Menu Items */}
            <div className="space-y-2">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaSignInAlt className="text-white text-xl" />
                    <span className="text-white font-medium">Sign In</span>
                  </Link>
                  <Link
                    to="/registration"
                    className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaUser className="text-white text-xl" />
                    <span className="text-white font-medium">Create Account</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/add-post"
                    className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-500/80 to-emerald-500/80 backdrop-blur-sm rounded-xl hover:scale-105 transition-transform"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaPlus className="text-white" />
                    <span className="text-white font-medium">Create Post</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaUser className="text-white text-xl" />
                    <span className="text-white font-medium">My Profile</span>
                  </Link>
                  <Link
                    to="/saved"
                    className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaBookmark className="text-white text-xl" />
                    <span className="text-white font-medium">Saved Posts</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FaCog className="text-white text-xl" />
                    <span className="text-white font-medium">Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 p-4 bg-red-500/80 backdrop-blur-sm rounded-xl hover:bg-red-600 transition-colors"
                  >
                    <FaSignOutAlt className="text-white" />
                    <span className="text-white font-medium">Logout</span>
                  </button>
                </>
              )}
            </div>

            {/* Dark Mode Toggle for Mobile */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors w-full"
            >
              {darkMode ? (
                <FaSun className="text-yellow-300 text-xl" />
              ) : (
                <FaMoon className="text-white text-xl" />
              )}
              <span className="text-white font-medium">
                {darkMode ? "Light Mode" : "Dark Mode"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Add some custom styles for animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Navbar;