import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import he from "he"; // 👈 Import he

const Profile = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [showPosts, setShowPosts] = useState(false);
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const navigate = useNavigate();
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    const [savedPosts, setSavedPosts] = useState([]);
    const [showSavedPosts, setShowSavedPosts] = useState(false);
    const [savedPostsLoading, setSavedPostsLoading] = useState(false);

    const [followedUsers, setFollowedUsers] = useState([]);
    const [showFollows, setShowFollows] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
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
            setPosts(prevPosts => prevPosts.filter(p => p.PostID !== postID));
        } catch (err) {
            console.error("Error deleting post:", err);
            alert("Failed to delete the post. Please try again.");
        }
    };
    const fetchFollowedUsers = async () => {
        if (showFollows) {
            setShowFollows(false);
            return;
        }

        setShowPosts(false);
        setShowSavedPosts(false);
        setFollowLoading(true);

        try {
            const res = await axios.get(`${BASE_URL}/api/follows/getList/${storedUser.id}`);
            setFollowedUsers(res.data);
            setShowFollows(true);
        } catch (err) {
            console.error("Error fetching followed users:", err);
        }

        setFollowLoading(false);
    };

    const fetchSavedPosts = async () => {
        if (showSavedPosts) {
            setShowSavedPosts(false);
            return;
        }

        if (!user) return;
        setShowPosts(false);
        setSavedPostsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/api/posts/user-saved/${storedUser.id}`);
            setSavedPosts(res.data);
            setShowSavedPosts(true);
        } catch (err) {
            console.error("Error fetching saved posts:", err);
        }
        setSavedPostsLoading(false);
    };


    const fetchUserPosts = async () => {
        if (showPosts) {
            setShowPosts(false); // close panel if open
            return;
        }

        if (!user) return;
        setShowSavedPosts(false);
        setPostsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/api/posts/user/${storedUser.id}`);
            setPosts(res.data);
            setShowPosts(true);
        } catch (err) {
            console.error("Error fetching posts:", err);
        }
        setPostsLoading(false);
    };

    if (loading) return <div className="container mt-5 text-center text-muted">Loading profile...</div>;
    if (error) return <div className="container mt-5 text-center text-danger">{error}</div>;

    return (
        <div className="container mt-5">
            {/* Profile Card */}
            <div className="card shadow-sm rounded-4 mb-4">
                <div className="card-body text-center">
                    <i className="fas fa-user-circle fa-5x text-secondary mb-3"></i>
                    <h3 className="card-title">{user.username}</h3>
                    <p className="card-text text-muted mb-1">
                        <i className="fas fa-envelope me-2"></i>{user.email}
                    </p>
                    <p className="card-text text-muted">
                        <i className="fas fa-calendar-alt me-2"></i>
                        Joined on {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                    <p className="card-text text-muted">
                        <i className="fas fa-file-alt me-2"></i>
                        {user.postCount || 0} Post{user.postCount === 1 ? "" : "s"}
                    </p>
                    <div className="mt-4">
                        {/* Replaces the Edit Profile button */}
                        <button
                            className="btn px-3 py-1 me-2 text-white border-0"
                            onClick={fetchFollowedUsers}
                            style={{
                                background: showFollows
                                    ? "linear-gradient(to right, #56ab2f, #a8e063)"
                                    : "linear-gradient(to right, #43cea2, #185a9d)",
                                color: "white"
                            }}
                        >
                            <i className="fas fa-users"></i>
                        </button>


                        <button
                            className="btn px-3 py-1 me-2 text-white border-0"
                            onClick={fetchUserPosts}
                            style={{
                                background: showPosts
                                    ? "linear-gradient(to right, #56ab2f, #a8e063)" // show posts (green)
                                    : "linear-gradient(to right, #43cea2, #185a9d)", // hide posts (blue)
                                color: showPosts ? "white" : "#28a745",
                            }}
                        >
                            <i className="fas fa-blog"></i>
                        </button>

                        <button
                            className="btn px-3 py-1 me-2 text-white border-0"
                            onClick={fetchSavedPosts}
                            style={{
                                background: savedPosts
                                    ? "linear-gradient(to right, #56ab2f, #a8e063)" // saved posts (green)
                                    : "linear-gradient(to right, #43cea2, #185a9d)", // unsaved posts (blue)
                                color: savedPosts ? "white" : "#28a745",
                            }}
                        >
                            <i className="fas fa-bookmark"></i>
                        </button>

                        <a
                            href="/logout"
                            className="btn px-3 py-1 text-white border-0"
                            style={{
                                background: "linear-gradient(to right, #e43a45, #d08e73)", // gradient for logout button (red to orange)
                                color: "white",
                            }}
                        >
                            <i className="fas fa-sign-out-alt"></i>
                        </a>

                    </div>
                </div>
            </div>

            {/* Posts Section */}
            {showPosts && (
                <div>
                    <h4 className="fw-bold text-center mb-3">My Posts</h4>

                    {postsLoading ? (
                        <div className="text-muted text-center">Loading posts...</div>
                    ) : posts.length === 0 ? (
                        <div className="text-muted text-center">You haven't written any posts yet.</div>
                    ) : (
                        posts.map(post => (
                            <div key={post.PostID} className="card shadow-sm rounded-4 mb-3">
                                <div className="card-body">
                                    <h5 className="card-title mb-1">{post.Title}</h5>
                                    <div
                                        className="text-muted mb-2"
                                        dangerouslySetInnerHTML={{
                                            __html: post.Content
                                                ? he.decode(post.Content.substring(0, 100)) + "..."
                                                : "No content available.",
                                        }}
                                    />
                                    <small className="text-secondary d-block mb-2">
                                        Published on {new Date(post.PublishedAt).toLocaleDateString()}
                                    </small>
                                    <div>
                                        <a
                                            href={`/ViewPost?postID=${post.PostID}`}
                                            className="btn btn-sm btn-primary me-2"
                                        >
                                            <i className="fas fa-eye me-1"></i> View
                                        </a>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => DeletePost(post.PostID)}
                                        >
                                            <i className="fas fa-trash-alt me-1"></i> Delete
                                        </button>

                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            {showFollows && (
                <div>
                    <h4 className="fw-bold text-center mb-3">Following</h4>
                    {followLoading ? (
                        <div className="text-muted text-center">Loading followed users...</div>
                    ) : followedUsers.length === 0 ? (
                        <div className="text-muted text-center">You are not following anyone yet.</div>
                    ) : (
                        <div className="row">
                            {followedUsers.map((user, index) => (
                                <div key={index} className="col-md-4 mb-3">
                                    <div className="card shadow-sm rounded-4">
                                        <div className="card-body text-center">
                                            <i className="fas fa-user-circle fa-2x text-secondary mb-2"></i>
                                            <h6 className="card-title">{user.Username}</h6>
                                            <p className="card-text text-muted mb-0">
                                                <i className="fas fa-envelope me-1"></i>{user.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showSavedPosts && (
                <div>
                    <h4 className="fw-bold text-center mb-3">Saved Posts</h4>

                    {savedPostsLoading ? (
                        <div className="text-muted text-center">Loading saved posts...</div>
                    ) : savedPosts.length === 0 ? (
                        <div className="text-muted text-center">No saved posts yet.</div>
                    ) : (
                        savedPosts.map(post => (
                            <div key={post.PostID} className="card shadow-sm rounded-4 mb-3">
                                <div className="card-body">
                                    <h5 className="card-title mb-1">{post.Title}</h5>
                                    <div
                                        className="text-muted mb-2"
                                        dangerouslySetInnerHTML={{
                                            __html: he.decode(post.Content.substring(0, 100)) + "..."
                                        }}
                                    />
                                    <small className="text-secondary d-block mb-2">
                                        Published on {new Date(post.PublishedAt).toLocaleDateString()}
                                    </small>
                                    <a
                                        href={`/ViewPost?postID=${post.PostID}`}
                                        className="btn btn-sm btn-primary"
                                    >
                                        <i className="fas fa-eye me-1"></i> View
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

        </div>


    );
};

export default Profile;
