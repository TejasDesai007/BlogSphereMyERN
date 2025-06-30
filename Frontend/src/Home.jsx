import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap';
import { Link } from 'react-router-dom';
window.bootstrap = bootstrap;

export default function Homepage() {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [likes, setLikes] = useState({});
  const [userLikedPosts, setUserLikedPosts] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [showCommentsPostID, setShowCommentsPostID] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [savedPosts, setSavedPosts] = useState({});
  const [followMap, setFollowMap] = useState({});
  const [loading, setLoading] = useState({});
  const [isInitialLoading, setIsInitialLoading] = useState(true); // ✅ NEW: Initial loading state
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const userID = user ? user.id : null;

  useEffect(() => {
    const fetchAll = async () => {
      setIsInitialLoading(true); // ✅ Start loading
      try {
        const [postsRes, likesRes, commentsCountRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/posts/FetchPost`),
          axios.get(`${BASE_URL}/api/posts/likes-count`),
          axios.get(`${BASE_URL}/api/posts/comments-count`),
        ]);

        setPosts(postsRes.data);
        setLikes(likesRes.data);
        setCommentCounts(commentsCountRes.data);

        if (userID) {
          const userLikesRes = await axios.get(`${BASE_URL}/api/posts/user-liked/${userID}`);
          const likedMap = {};
          userLikesRes.data.forEach(postID => likedMap[postID] = true);
          setUserLikedPosts(likedMap);

          const userSavedRes = await axios.get(`${BASE_URL}/api/posts/user-saved/${userID}`);
          const savedMap = {};
          userSavedRes.data.forEach(postID => savedMap[postID] = true);
          setSavedPosts(savedMap);

          // ✅ FIX: Use consistent user._id for follow status
          const followStatuses = {};
          const uniqueAuthorIDs = [...new Set(postsRes.data.map(post => post.user._id))].filter(id => id !== userID);

          for (let authorId of uniqueAuthorIDs) {
            try {
              const res = await axios.get(`${BASE_URL}/api/follows/check?followerId=${userID}&followedId=${authorId}`);
              followStatuses[authorId] = res.data.isFollowing;
            } catch (err) {
              console.error(`Error checking follow status for user ${authorId}:`, err);
              followStatuses[authorId] = false; // Default to false on error
            }
          }

          setFollowMap(followStatuses);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsInitialLoading(false); // ✅ End loading
      }
    };

    fetchAll();
  }, [userID, BASE_URL]);

  const handleFollow = async (followedId) => {
    if (!userID) {
      navigate('/login');
      return;
    }

    // Prevent multiple clicks
    if (loading[followedId]) return;
    
    setLoading(prev => ({ ...prev, [followedId]: true }));

    try {
      const response = await axios.post(`${BASE_URL}/api/follows`, {
        followerId: userID,
        followedId,
      });
      
      console.log("Follow success:", response.data);
      setFollowMap(prev => ({ ...prev, [followedId]: true }));
    } catch (err) {
      console.error("Follow failed:", err);
      // Show user-friendly error
      alert("Failed to follow user. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, [followedId]: false }));
    }
  };

  const handleUnfollow = async (followedId) => {
    if (!userID) {
      navigate('/login');
      return;
    }

    // Prevent multiple clicks
    if (loading[followedId]) return;
    
    setLoading(prev => ({ ...prev, [followedId]: true }));

    try {
      const response = await axios.delete(`${BASE_URL}/api/follows`, {
        data: {
          followerId: userID,
          followedId,
        },
      });
      
      console.log("Unfollow success:", response.data);
      setFollowMap(prev => ({ ...prev, [followedId]: false }));
    } catch (err) {
      console.error("Unfollow failed:", err);
      // Show user-friendly error
      alert("Failed to unfollow user. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, [followedId]: false }));
    }
  };

  const handleSave = async (postID) => {
    if (!userID) {
      navigate('/login');
      return;
    }

    try {
      const hasSaved = savedPosts[postID];

      setSavedPosts(prev => ({
        ...prev,
        [postID]: !hasSaved
      }));

      if (hasSaved) {
        await axios.post(`${BASE_URL}/api/posts/unsave-post`, { postID, userID });
      } else {
        await axios.post(`${BASE_URL}/api/posts/savepost`, { postID, userID });
      }

      const res = await axios.get(`${BASE_URL}/api/posts/savedposts/${userID}`);
      const savedMap = {};
      res.data.forEach(postID => savedMap[postID] = true);
      setSavedPosts(savedMap);

    } catch (err) {
      console.error("Error saving/unsaving post:", err);
    }
  };

  const handleLike = async (postID) => {
    if (!userID) {
      navigate('/login');
      return;
    }

    try {
      const hasLiked = userLikedPosts[postID];

      if (hasLiked) {
        await axios.post(`${BASE_URL}/api/posts/unlike`, { postID, userID });
      } else {
        await axios.post(`${BASE_URL}/api/posts/like`, { postID, userID });
      }

      const [likesRes, userLikesRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/posts/likes-count`),
        axios.get(`${BASE_URL}/api/posts/user-liked/${userID}`)
      ]);

      setLikes(likesRes.data);
      const likedMap = {};
      userLikesRes.data.forEach(postID => likedMap[postID] = true);
      setUserLikedPosts(likedMap);

    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const fetchComments = async (postID) => {
    if (!userID) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.get(`${BASE_URL}/api/posts/comments/${postID}`);
      setComments(res.data);
      setShowCommentsPostID(postID);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const handleCommentSubmit = async () => {
    if (!userID || newComment.trim() === "") return;

    try {
      await axios.post(`${BASE_URL}/api/posts/comments`, {
        postID: showCommentsPostID,
        userID,
        comment: newComment
      });
      setNewComment("");
      fetchComments(showCommentsPostID);

      const res = await axios.get(`${BASE_URL}/api/posts/comments-count`);
      setCommentCounts(res.data);

    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ Loading Component
  const LoadingSpinner = () => (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="text-muted">Loading posts...</h5>
        <p className="text-muted small">Please wait while we fetch the latest content</p>
      </div>
    </div>
  );

  // ✅ Skeleton Loader for better UX
  const SkeletonCard = () => (
    <div className="col-lg-4 col-md-6 mb-4">
      <div className="card h-100">
        <div className="placeholder-glow">
          <div className="placeholder bg-secondary" style={{ height: "200px", width: "100%" }}></div>
        </div>
        <div className="card-body">
          <div className="placeholder-glow">
            <h5 className="card-title">
              <span className="placeholder col-8"></span>
            </h5>
            <h6 className="card-subtitle mb-2">
              <span className="placeholder col-6"></span>
            </h6>
            <div className="mt-auto d-flex justify-content-between">
              <span className="placeholder col-2"></span>
              <span className="placeholder col-2"></span>
              <span className="placeholder col-2"></span>
              <span className="placeholder col-2"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <h1 className="text-center mb-4"><i className="fas fa-blog"></i></h1>
      
      {/* Search Input - Always visible */}
      <input
        type="text"
        className="form-control mb-4"
        placeholder="Search posts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={isInitialLoading} // ✅ Disable during initial loading
      />

      {/* ✅ Show loading state during initial data fetch */}
      {isInitialLoading ? (
        <>
          {/* Option 1: Simple Loading Spinner */}
          <LoadingSpinner />
          
          {/* Option 2: Skeleton Loading Cards (uncomment to use instead) */}
          {/*
          <div className="row">
            {[...Array(6)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
          */}
        </>
      ) : (
        // ✅ Show content only after loading is complete
        <div className="row">
          {filteredPosts.map((post) => (
            <div className="col-lg-4 col-md-6 mb-4" key={post._id}>
              <div className="card h-100">
                {post.images.length > 0 && (
                  <div id={`carousel${post._id}`} className="carousel slide" data-bs-ride="carousel">
                    <div className="carousel-inner">
                      {post.images.map((imagePath, index) => (
                        <div className={`carousel-item ${index === 0 ? "active" : ""}`} key={index}>
                          <img
                            src={imagePath}
                            className="d-block w-100"
                            alt="Post"
                            style={{ height: "200px", objectFit: "cover" }}
                          />
                        </div>
                      ))}
                    </div>
                    {post.images.length > 1 && (
                      <>
                        <button className="carousel-control-prev" type="button" data-bs-target={`#carousel${post._id}`} data-bs-slide="prev">
                          <span className="carousel-control-prev-icon"></span>
                        </button>
                        <button className="carousel-control-next" type="button" data-bs-target={`#carousel${post._id}`} data-bs-slide="next">
                          <span className="carousel-control-next-icon"></span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{post.title}</h5>
                  <h6 className="card-subtitle mb-2 text-muted d-flex align-items-center justify-content-between">
                    <span>
                      By <Link
                        to={`/profile/${post.user._id}`}
                        style={{
                          background: "linear-gradient(to right, #667eea, #764ba2)",
                          color: "white",
                          padding: "0px 4px",
                          borderRadius: "5px",
                          textDecoration: "none"
                        }}
                      >
                        {post.user.username}
                      </Link> on {new Date(post.publishedAt).toLocaleDateString()}
                    </span>
                    {/* ✅ FIX: Use consistent post.user._id instead of post.userId */}
                    {user && user.id !== post.user._id && (
                      <span className="ms-2">
                        {followMap[post.user._id] ? (
                          <button 
                            className="btn btn-sm" 
                            onClick={() => handleUnfollow(post.user._id)}
                            disabled={loading[post.user._id]}
                          >
                            {loading[post.user._id] ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-user-minus"></i>
                            )}
                          </button>
                        ) : (
                          <button 
                            className="btn btn-sm" 
                            onClick={() => handleFollow(post.user._id)}
                            disabled={loading[post.user._id]}
                          >
                            {loading[post.user._id] ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-user-plus"></i>
                            )}
                          </button>
                        )}
                      </span>
                    )}
                  </h6>

                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <button
                      className="btn px-3 py-1 text-white border-0"
                      onClick={() => handleLike(post._id)}
                      style={{
                        backgroundColor: userLikedPosts[post._id] ? "#dc3545" : "#f0f0f0",
                        color: userLikedPosts[post._id] ? "black" : "#dc3545"
                      }}
                    >
                      <i className="fas fa-heart me-1"></i> {likes[post._id] || 0}
                    </button>

                    <button className="btn btn-sm ms-2" onClick={() => fetchComments(post._id)}>
                      <i className="fas fa-comments me-1"></i> {commentCounts[post._id] || 0}
                    </button>

                    <button className="btn px-3 py-1 ms-2" onClick={() => handleSave(post._id)}>
                      <i className={`fa${savedPosts[post._id] ? "s" : "r"} fa-bookmark`}></i>
                    </button>

                    <a
                      href={`/ViewPost?postID=${post._id}`}
                      className="btn btn-sm ms-2"
                      style={{
                        background: "linear-gradient(to right, #36d1dc, #5b86e5)",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        padding: "5px 10px",
                        textDecoration: "none",
                      }}
                    >
                      <i className="fas fa-eye"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* ✅ Only show "No matching posts" if not loading AND no filtered posts */}
          {!isInitialLoading && filteredPosts.length === 0 && (
            <div className="col-12">
              <div className="alert alert-warning text-center">
                <i className="fas fa-search me-2"></i>
                {searchQuery ? 
                  `No posts found matching "${searchQuery}". Try different keywords.` : 
                  "No posts available at the moment."
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsPostID && (
        <div className="modal-backdrop" style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1040
        }}
          onClick={() => setShowCommentsPostID(null)}
        >
          <div className="modal-dialog modal-lg" style={{ margin: "10% auto", zIndex: 1050 }} onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Comments</h5>
                <button className="btn-close" onClick={() => setShowCommentsPostID(null)}></button>
              </div>
              <div className="modal-body">
                {comments.length > 0 ? (
                  <ul className="list-group mb-3">
                    {comments.map((c, i) => (
                      <li className="list-group-item mt-2" key={i}>
                        <strong> {c.user?.username || c.username || "Anonymous"}</strong>: {c.content}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No comments yet.</p>
                )}
                <textarea
                  className="form-control mb-2"
                  rows="3"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                ></textarea>
                <button className="btn btn-primary" onClick={handleCommentSubmit}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}