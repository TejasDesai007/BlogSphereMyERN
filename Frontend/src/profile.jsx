import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import he from "he";
import {
    FaUserCircle,
    FaEnvelope,
    FaCalendarAlt,
    FaFileAlt,
    FaUsers,
    FaBlog,
    FaBookmark,
    FaSignOutAlt,
    FaEye,
    FaTrash,
    FaSpinner,
    FaEdit,
    FaHeart,
    FaComment,
    FaExternalLinkAlt
} from "react-icons/fa";

const Profile = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("none");
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [savedPosts, setSavedPosts] = useState([]);
    const [savedPostsLoading, setSavedPostsLoading] = useState(false);
    const [followedUsers, setFollowedUsers] = useState([]);
    const [followLoading, setFollowLoading] = useState(false);
    const navigate = useNavigate();
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (!storedUser) {
            navigate('/login');
            return;
        }

        axios.get(`${BASE_URL}/api/users/profile/${storedUser.id}`)
            .then(res => {
                setUser(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Profile fetch error:", err);
                setError("Failed to load profile.");
                setLoading(false);
            });
    }, [navigate]);

    const DeletePost = async (postID) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this post?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`${BASE_URL}/api/posts/DeletePost/${postID}`);
            setPosts(prevPosts => prevPosts.filter(p => p._id !== postID));
        } catch (err) {
            console.error("Error deleting post:", err);
            alert("Failed to delete the post. Please try again.");
        }
    };

    const fetchFollowedUsers = async () => {
        if (activeTab === "following") {
            setActiveTab("none");
            return;
        }

        setActiveTab("following");
        setFollowLoading(true);

        try {
            const res = await axios.get(`${BASE_URL}/api/follows/getList/${storedUser.id}`);
            setFollowedUsers(res.data);
        } catch (err) {
            console.error("Error fetching followed users:", err);
        }
        setFollowLoading(false);
    };

    const fetchSavedPosts = async () => {
        if (activeTab === "saved") {
            setActiveTab("none");
            return;
        }

        if (!user) return;
        setActiveTab("saved");
        setSavedPostsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/api/posts/user-saved/${storedUser.id}`);
            setSavedPosts(res.data);
        } catch (err) {
            console.error("Error fetching saved posts:", err);
        }
        setSavedPostsLoading(false);
    };

    const fetchUserPosts = async () => {
        if (activeTab === "posts") {
            setActiveTab("none");
            return;
        }

        if (!storedUser) return;

        setActiveTab("posts");
        setPostsLoading(true);
        try {
            // Use storedUser.id instead of user._id
            const res = await axios.get(`${BASE_URL}/api/posts/user/${storedUser.id}`);
            setPosts(res.data);
        } catch (err) {
            console.error("Error fetching posts:", err);
        }
        setPostsLoading(false);
    };

    const handleLogout = () => {
        sessionStorage.removeItem("user");
        navigate("/login");
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-24 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-700">Loading profile...</h3>
                <p className="text-gray-500 mt-2">Fetching your information</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-24 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                <div className="text-red-500 text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUserCircle className="text-4xl" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Error Loading Profile</h3>
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all duration-300"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-24">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
                    <div className="h-40 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
                        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-2xl opacity-50"></div>
                                <div className="relative w-32 h-32 bg-white rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                                    <FaUserCircle className="text-8xl text-blue-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 pb-8 px-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">{user.username}</h1>

                        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 mb-6">
                            <div className="flex items-center space-x-2 text-gray-600">
                                <FaEnvelope className="text-blue-500" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600">
                                <FaCalendarAlt className="text-green-500" />
                                <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex justify-center space-x-8 mb-8">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{user.postCount || 0}</div>
                                <div className="text-gray-500 text-sm">Posts</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{user.followingCount || 0}</div>
                                <div className="text-gray-500 text-sm">Following</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-pink-600">{user.followersCount || 0}</div>
                                <div className="text-gray-500 text-sm">Followers</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{savedPosts.length}</div>
                                <div className="text-gray-500 text-sm">Saved</div>
                            </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex flex-wrap justify-center gap-3">
                            <button
                                onClick={fetchFollowedUsers}
                                className={`flex items-center space-x-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${activeTab === "following"
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                                    : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 hover:shadow-md"
                                    }`}
                            >
                                <FaUsers />
                                <span>Following</span>
                            </button>

                            <button
                                onClick={fetchUserPosts}
                                className={`flex items-center space-x-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${activeTab === "posts"
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                                    : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 hover:shadow-md"
                                    }`}
                            >
                                <FaBlog />
                                <span>My Posts</span>
                            </button>

                            <button
                                onClick={fetchSavedPosts}
                                className={`flex items-center space-x-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${activeTab === "saved"
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                                    : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 hover:shadow-md"
                                    }`}
                            >
                                <FaBookmark />
                                <span>Saved</span>
                            </button>

                            <button
                                onClick={() => navigate('/edit-profile')}
                                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full font-medium hover:shadow-md transition-all duration-300"
                            >
                                <FaEdit />
                                <span>Edit</span>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 rounded-full font-medium hover:shadow-md transition-all duration-300"
                            >
                                <FaSignOutAlt />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                {activeTab !== "none" && (
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                        {/* Tab Header */}
                        <div className="border-b border-gray-200">
                            <div className="flex overflow-x-auto">
                                <button
                                    onClick={() => setActiveTab(activeTab === "posts" ? "none" : "posts")}
                                    className={`flex-1 min-w-fit py-4 px-6 text-center font-medium transition-colors ${activeTab === "posts"
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    <FaBlog className="inline mr-2" />
                                    My Posts ({posts.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab(activeTab === "following" ? "none" : "following")}
                                    className={`flex-1 min-w-fit py-4 px-6 text-center font-medium transition-colors ${activeTab === "following"
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    <FaUsers className="inline mr-2" />
                                    Following ({followedUsers.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab(activeTab === "saved" ? "none" : "saved")}
                                    className={`flex-1 min-w-fit py-4 px-6 text-center font-medium transition-colors ${activeTab === "saved"
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    <FaBookmark className="inline mr-2" />
                                    Saved ({savedPosts.length})
                                </button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {/* Posts Tab */}
                            {activeTab === "posts" && (
                                <div>
                                    {postsLoading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="text-center">
                                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                                <p className="text-gray-600">Loading your posts...</p>
                                            </div>
                                        </div>
                                    ) : posts.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaBlog className="text-3xl text-gray-400" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Posts Yet</h3>
                                            <p className="text-gray-500 mb-6">Start sharing your thoughts with the community!</p>
                                            <button
                                                onClick={() => navigate('/add-post')}
                                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition-all duration-300"
                                            >
                                                Create Your First Post
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {posts.map(post => (
                                                <div key={post._id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <h3 className="text-lg font-bold text-gray-800 line-clamp-2 flex-1">
                                                            {post.title}
                                                        </h3>
                                                        <button
                                                            onClick={() => DeletePost(post._id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                                            title="Delete post"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>

                                                    <div
                                                        className="text-gray-600 mb-4 text-sm line-clamp-3"
                                                        dangerouslySetInnerHTML={{
                                                            __html: post.content
                                                                ? he.decode(post.content.substring(0, 150)) + "..."
                                                                : "No content available.",
                                                        }}
                                                    />

                                                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                                        <span className="flex items-center">
                                                            <FaCalendarAlt className="mr-1" />
                                                            {new Date(post.publishedAt).toLocaleDateString()}
                                                        </span>
                                                        <div className="flex space-x-4">
                                                            <span className="flex items-center">
                                                                <FaHeart className="mr-1 text-red-400" />
                                                                0
                                                            </span>
                                                            <span className="flex items-center">
                                                                <FaComment className="mr-1 text-blue-400" />
                                                                0
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between">
                                                        <Link
                                                            to={`/ViewPost?postID=${post._id}`}
                                                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-sm font-medium hover:shadow-lg transition-all duration-300"
                                                        >
                                                            <FaEye />
                                                            <span>View Post</span>
                                                        </Link>
                                                        <Link
                                                            to={`/edit-post/${post._id}`}
                                                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-sm font-medium hover:shadow-md transition-all duration-300"
                                                        >
                                                            <FaEdit />
                                                            <span>Edit</span>
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Following Tab */}
                            {activeTab === "following" && (
                                <div>
                                    {followLoading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="text-center">
                                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                                <p className="text-gray-600">Loading followed users...</p>
                                            </div>
                                        </div>
                                    ) : followedUsers.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaUsers className="text-3xl text-gray-400" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Not Following Anyone</h3>
                                            <p className="text-gray-500 mb-6">Start following users to see their posts in your feed!</p>
                                            <button
                                                onClick={() => navigate('/')}
                                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition-all duration-300"
                                            >
                                                Explore Users
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {followedUsers.map((user, index) => (
                                                <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
                                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <FaUserCircle className="text-3xl text-white" />
                                                    </div>
                                                    <h4 className="text-lg font-bold text-gray-800 mb-2">{user.username}</h4>
                                                    <p className="text-gray-600 text-sm mb-4 truncate">
                                                        <FaEnvelope className="inline mr-2 text-blue-500" />
                                                        {user.email}
                                                    </p>
                                                    <Link
                                                        to={`/other-profile/${user._id}`}
                                                        className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 rounded-full text-sm font-medium hover:from-blue-100 hover:to-purple-100 transition-all duration-300"
                                                    >
                                                        <FaExternalLinkAlt />
                                                        <span>Visit Profile</span>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Saved Posts Tab */}
                            {activeTab === "saved" && (
                                <div>
                                    {savedPostsLoading ? (
                                        <div className="flex justify-center py-12">
                                            <div className="text-center">
                                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                                <p className="text-gray-600">Loading saved posts...</p>
                                            </div>
                                        </div>
                                    ) : savedPosts.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaBookmark className="text-3xl text-gray-400" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Saved Posts</h3>
                                            <p className="text-gray-500 mb-6">Save interesting posts to read them later!</p>
                                            <button
                                                onClick={() => navigate('/')}
                                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition-all duration-300"
                                            >
                                                Explore Posts
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {savedPosts.map(post => (
                                                <div key={post._id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                                                                <FaUserCircle className="text-xl text-white" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-gray-800">{post.user?.username || "Unknown"}</h4>
                                                                <p className="text-gray-500 text-sm">{new Date(post.publishedAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <FaBookmark className="text-yellow-500" />
                                                    </div>

                                                    <h3 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2">
                                                        {post.title}
                                                    </h3>

                                                    <div
                                                        className="text-gray-600 mb-4 text-sm line-clamp-3"
                                                        dangerouslySetInnerHTML={{
                                                            __html: he.decode(post.content.substring(0, 150)) + "..."
                                                        }}
                                                    />

                                                    <div className="flex justify-between items-center">
                                                        <Link
                                                            to={`/ViewPost?postID=${post._id}`}
                                                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-sm font-medium hover:shadow-lg transition-all duration-300"
                                                        >
                                                            <FaEye />
                                                            <span>Read Post</span>
                                                        </Link>
                                                        <div className="flex space-x-2">
                                                            <span className="flex items-center text-sm text-gray-500">
                                                                <FaHeart className="mr-1 text-red-400" />
                                                                {post.likes || 0}
                                                            </span>
                                                            <span className="flex items-center text-sm text-gray-500">
                                                                <FaComment className="mr-1 text-blue-400" />
                                                                {post.comments || 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;