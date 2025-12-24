import React, { useState, useEffect, useRef, useCallback } from "react";
import { socket } from "./socket"; // adjust path if needed
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  
  const dropdownRef = useRef();
  const searchRef = useRef();
  const notificationsRef = useRef();
  const notificationsContainerRef = useRef();
  const navigate = useNavigate();

  const rawUser = JSON.parse(sessionStorage.getItem("user"));
  const user = rawUser
    ? {
      ...rawUser,
      _id: rawUser._id || rawUser.id,
    }
    : null;

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Socket connection for real-time notifications
  useEffect(() => {
    if (!user || !user._id) return;

    socket.connect();
    socket.emit("join", user._id);

    socket.on("notification", (data) => {
      setUnreadCount((prev) => prev + 1);
      
      setNotifications((prev) => [
        {
          _id: data._id || Date.now(),
          message: data.message,
          isRead: false,
          createdAt: data.createdAt || new Date(),
        },
        ...prev,
      ]);
    });

    return () => {
      socket.off("notification");
      socket.disconnect();
    };
  }, [user?._id]);

  // Fetch initial notifications
  const fetchInitialNotifications = async () => {
    if (!user || !user._id) return;
    
    setNotificationsLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/notifications/${user._id}`,
        { withCredentials: true }
      );

      setNotifications(res.data.notifications);
      setHasMore(res.data.hasMore);

      if (res.data.notifications.length > 0) {
        const last = res.data.notifications.at(-1);
        setCursor(last.createdAt);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Load more notifications
  const loadMoreNotifications = async () => {
    if (!user || !user._id || !hasMore || loadingMore || !cursor) return;
    
    setLoadingMore(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/notifications/${user._id}?cursor=${cursor}&limit=15`,
        { withCredentials: true }
      );

      if (res.data.notifications.length > 0) {
        const newNotifications = res.data.notifications;
        setNotifications(prev => [...prev, ...newNotifications]);
        setHasMore(res.data.hasMore);
        
        if (res.data.hasMore) {
          const last = newNotifications.at(-1);
          setCursor(last.createdAt);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more notifications:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle scroll for infinite loading
  const handleNotificationsScroll = useCallback(() => {
    if (!notificationsContainerRef.current || !hasMore || loadingMore) return;
    
    const container = notificationsContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Load more when user is near the bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMoreNotifications();
    }
  }, [hasMore, loadingMore, cursor, user?._id]);

  // Toggle notifications panel
  const handleNotificationsToggle = async () => {
    if (!user || !user._id) {
      console.warn("Notifications toggle skipped: user not ready", user);
      return;
    }

    const willOpen = !notificationsOpen;
    setNotificationsOpen(willOpen);

    if (willOpen) {
      // Reset and fetch fresh notifications when opening
      setNotifications([]);
      setHasMore(true);
      setCursor(null);
      await fetchInitialNotifications();

      try {
        await axios.post(
          `${BASE_URL}/api/notifications/mark-read`,
          { userId: user._id },
          { withCredentials: true }
        );
        setUnreadCount(0);
      } catch (err) {
        console.error("Error marking notifications as read:", err);
      }
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const container = notificationsContainerRef.current;
    if (container && notificationsOpen) {
      container.addEventListener('scroll', handleNotificationsScroll);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleNotificationsScroll);
      }
    };
  }, [notificationsOpen, handleNotificationsScroll]);

  // Event listeners for clicks outside
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
                    <div className="absolute right-0 mt-3 w-96 bg-white rounded-xl shadow-2xl overflow-hidden animate-slideDown z-50">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3 text-white flex items-center justify-between">
                        <span className="font-semibold">Notifications</span>
                        {notificationsLoading && (
                          <span className="text-xs opacity-80">Loading...</span>
                        )}
                      </div>
                      
                      {/* Notifications container with scroll */}
                      <div 
                        ref={notificationsContainerRef}
                        className="max-h-96 overflow-y-auto"
                        style={{ scrollbarWidth: 'thin' }}
                      >
                        {notifications.length === 0 && !notificationsLoading ? (
                          <div className="p-6 text-center text-gray-500">
                            <FaBell className="mx-auto text-3xl text-gray-300 mb-3" />
                            <p>No notifications yet.</p>
                          </div>
                        ) : (
                          <>
                            {notifications.map((n) => (
                              <div
                                key={n._id}
                                className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex justify-between items-start transition-colors ${!n.isRead ? "bg-blue-50/70" : "bg-white"
                                  }`}
                              >
                                <div className="flex-1">
                                  <p className="text-gray-800 text-sm">{n.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(n.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                {!n.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                                )}
                              </div>
                            ))}
                            
                            {/* Loading indicator for infinite scroll */}
                            {loadingMore && (
                              <div className="py-4 text-center">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                <p className="text-xs text-gray-500 mt-2">Loading more...</p>
                              </div>
                            )}
                            
                            {/* End of notifications message */}
                            {!hasMore && notifications.length > 0 && (
                              <div className="py-4 text-center text-gray-400 text-sm">
                                <p>No more notifications</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
      <style>{`
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