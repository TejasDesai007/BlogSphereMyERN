import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import he from "he";

const OtherProfile = () => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [showPosts, setShowPosts] = useState(false);
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const navigate = useNavigate();
    const { userID } = useParams();

    const sessionuser = JSON.parse(sessionStorage.getItem("user"));
    const sessionuserID = sessionuser ? sessionuser.id : null;

    useEffect(() => {
        if (!userID) {
            navigate('/');
            return;
        }
        if (userID == sessionuserID){
            navigate('/profile');
            return;
        }

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
    }, [userID, navigate]);

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
                    <div className="mt-4">
                        <button className="btn btn-outline-success" onClick={fetchUserPosts}>
                            <i className="fas fa-blog"></i>
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
        </div>
    );
};

export default OtherProfile;
