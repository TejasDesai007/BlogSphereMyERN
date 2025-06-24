import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import he from "he";

const OtherProfile = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [showPosts, setShowPosts] = useState(false);
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [followingList, setFollowingList] = useState([]);
    const [showFollowingModal, setShowFollowingModal] = useState(false);
    const [followingLoading, setFollowingLoading] = useState(false);

    const navigate = useNavigate();
    const { userID } = useParams();

    const sessionuser = JSON.parse(sessionStorage.getItem("user"));
    const sessionuserID = sessionuser ? sessionuser.id : null;

    useEffect(() => {
        if (!userID) {
            navigate('/');
            return;
        }
        if (userID === sessionuserID) {
            navigate('/profile');
            return;
        }

        // Fetch profile data
        axios.get(`http://localhost:8082/api/users/profile/${userID}`)
            .then(res => {
                setUser(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Profile fetch error:", err);
                setError("Failed to load profile.");
                setLoading(false);
            });

        // Check follow status
        axios.get(`http://localhost:8082/api/follows/check`, {
            params: { followerId: sessionuserID, followedId: userID }
        })
            .then(res => {
                setIsFollowing(res.data.isFollowing);
            })
            .catch(err => {
                console.error("Follow status check failed:", err);
            });

    }, [userID, navigate, sessionuserID]);

    const fetchFollowingList = async () => {
        setFollowingLoading(true);
        try {
            const res = await axios.get(`http://localhost:8082/api/follows/getList/${userID}`);
            setFollowingList(res.data);
            setShowFollowingModal(true);
        } catch (err) {
            console.error("Error fetching following list:", err);
        }
        setFollowingLoading(false);
    };

    const fetchUserPosts = async () => {
        if (showPosts) {
            setShowPosts(false);
            return;
        }

        setPostsLoading(true);
        try {
            const res = await axios.get(`http://localhost:8082/api/posts/user/${userID}`);
            setPosts(res.data);
            setShowPosts(true);
        } catch (err) {
            console.error("Error fetching posts:", err);
        }
        setPostsLoading(false);
    };

    const toggleFollow = async () => {
        setFollowLoading(true);
        try {
            if (!isFollowing) {
                await axios.post(`http://localhost:8082/api/follows`, {
                    followerId: sessionuserID,
                    followedId: userID
                });
            } else {
                await axios.delete(`http://localhost:8082/api/follows`, {
                    data: {
                        followerId: sessionuserID,
                        followedId: userID
                    }
                });
            }
            setIsFollowing(!isFollowing);
        } catch (err) {
            console.error("Follow/unfollow error:", err);
        }
        setFollowLoading(false);
    };

    if (loading) return <div className="container mt-5 text-center text-muted">Loading profile...</div>;
    if (error) return <div className="container mt-5 text-center text-danger">{error}</div>;

    return (
        <div className="container mt-5">
            <div className="card shadow-sm rounded-4 mb-4">
                <div className="card-body text-center">
                    <i className="fas fa-user-circle fa-5x text-secondary mb-3"></i>
                    <h3 className="card-title">{user.Name}</h3>
                    <p className="card-text text-muted mb-1">
                        <i className="fas fa-envelope me-2"></i>{user.Email}
                    </p>
                    <p className="card-text text-muted">
                        <i className="fas fa-calendar-alt me-2"></i>
                        Joined on {user.CreatedAt ? new Date(user.CreatedAt).toLocaleDateString() : "N/A"}
                    </p>
                    <p className="card-text text-muted">
                        <i className="fas fa-file-alt me-2"></i>
                        {user.postCount || 0} Post{user.postCount === 1 ? "" : "s"}
                    </p>
                    <div className="mt-4 d-flex justify-content-center gap-3 flex-wrap">
                        <button
                            className="btn px-3 py-1 ms-2 text-white border-0"
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
                            className="btn px-3 py-1 ms-2 text-white border-0"
                            onClick={toggleFollow}
                            disabled={followLoading}
                            style={{
                                background: isFollowing
                                    ? "linear-gradient(to right, #56ab2f, #a8e063)" // followed (green)
                                    : "linear-gradient(to right, #43cea2, #185a9d)", // not followed
                                color: isFollowing ? "white" : "#28a745",
                            }}
                        >
                            <i className={`fas ${isFollowing ? "fa-user-check" : "fa-user-plus"} `}></i>

                        </button>
                        <button
                            className="btn px-3 py-1 ms-2 text-white border-0"
                            onClick={fetchFollowingList}
                            style={{
                                background: "linear-gradient(to right, #ff9966, #ff5e62)",
                                color: "white"
                            }}
                        >
                            <i className="fas fa-users"></i>
                        </button>


                    </div>
                </div>
            </div>

            {showPosts && (
                <div>
                    <h4 className="fw-bold text-center mb-3">{user.userName}'s Posts</h4>
                    {postsLoading ? (
                        <div className="text-muted text-center">Loading posts...</div>
                    ) : posts.length === 0 ? (
                        <div className="text-muted text-center">No posts available.</div>
                    ) : (
                        posts.map(post => (
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
            
            {showFollowingModal && (
                <div>
                    <h4 className="fw-bold text-center mb-3">Following</h4>
                    {followLoading ? (
                        <div className="text-muted text-center">Loading followed users...</div>
                    ) : followingList.length === 0 ? (
                        <div className="text-muted text-center">You are not following anyone yet.</div>
                    ) : (
                        <div className="row">
                            {followingList.map(f => (
                                <div key={f.UserID} className="col-md-4 mb-3">
                                    <div className="card shadow-sm rounded-4">
                                        <div className="card-body text-center">
                                            <i className="fas fa-user-circle fa-2x text-secondary mb-2"></i>
                                            <h6 className="card-title">{f.Username}</h6>
                                            <p className="card-text text-muted mb-0">
                                                <i className="fas fa-envelope me-1"></i>{f.Email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}


        </div>
    );
};

export default OtherProfile;
