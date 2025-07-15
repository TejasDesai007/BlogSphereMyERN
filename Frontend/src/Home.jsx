import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaPlus, FaHeart, FaRegHeart, FaComment, FaBookmark, FaRegBookmark, FaEye, FaUserPlus, FaUserMinus } from "react-icons/fa";
import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  const isMountedRef = useRef(true);
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const loadingRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const userID = user ? user.id : null;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchPosts = useCallback(async (page = 1, search = "", reset = false) => {
    if (!isMountedRef.current) return;
    
    if (page === 1) {
      setIsInitialLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await axios.get(`${BASE_URL}/api/posts/FetchPost`, {
        params: {
          page,
          limit: 6,
          search: search.trim()
        }
      });

      if (!isMountedRef.current) return;

      const { posts: newPosts, pagination } = response.data;
      
      if (page === 1 || reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(post => post._id));
          const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post._id));
          return [...prev, ...uniqueNewPosts];
        });
      }

      setHasNextPage(pagination.hasNextPage);
      setCurrentPage(pagination.currentPage);

    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      if (isMountedRef.current) {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [BASE_URL]);

  const fetchInitialData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      const response = await axios.get(`${BASE_URL}/api/posts/InitialData${userID ? `/${userID}` : ''}`);
      
      // Fixed typo: changed 'component' to 'current'
      if (!isMountedRef.current) return;
      
      const { likesCount, commentsCount, likedPosts = [], savedPosts: userSaved = [] } = response.data;

      // Set likes count
      setLikes(likesCount || {});
      setCommentCounts(commentsCount || {});

      // Set user liked posts
      const likedMap = {};
      likedPosts.forEach(postID => likedMap[postID] = true);
      setUserLikedPosts(likedMap);

      // Set user saved posts
      const savedMap = {};
      userSaved.forEach(postID => savedMap[postID] = true);
      setSavedPosts(savedMap);

    } catch (err) {
      console.error("Error fetching initial data:", err);
    }
  }, [BASE_URL, userID]);

  const fetchFollowStatuses = useCallback(async (postsList) => {
    if (!isMountedRef.current || !userID || !postsList.length) return;

    try {
      const uniqueAuthorIDs = [...new Set(postsList.map(post => post.user._id))].filter(id => id !== userID);
      const followStatuses = {};

      for (let authorId of uniqueAuthorIDs) {
        if (!isMountedRef.current) return;
        
        try {
          const res = await axios.get(`${BASE_URL}/api/follows/check?followerId=${userID}&followedId=${authorId}`);
          followStatuses[authorId] = res.data.isFollowing;
        } catch (err) {
          console.error(`Error checking follow status for user ${authorId}:`, err);
          followStatuses[authorId] = false;
        }
      }

      if (isMountedRef.current) {
        setFollowMap(prev => ({ ...prev, ...followStatuses }));
      }
    } catch (err) {
      console.error("Error fetching follow statuses:", err);
    }
  }, [BASE_URL, userID]);

  useEffect(() => {
    setPosts([]);
    setCurrentPage(1);
    setHasNextPage(true);
    setIsInitialLoading(true);
    setIsLoadingMore(false);
    setLikes({});
    setUserLikedPosts({});
    setCommentCounts({});
    setSavedPosts({});
    setFollowMap({});
    isMountedRef.current = true;
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const initializeData = async () => {
      await Promise.all([
        fetchPosts(1, searchQuery, true),
        fetchInitialData()
      ]);
    };

    initializeData();
  }, [fetchPosts, fetchInitialData, searchQuery]);

  useEffect(() => {
    if (posts.length > 0) {
      fetchFollowStatuses(posts);
    }
  }, [posts, fetchFollowStatuses]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    setSearchTimeout(setTimeout(() => {
      if (isMountedRef.current) {
        setCurrentPage(1);
        setHasNextPage(true);
        fetchPosts(1, searchQuery, true);
      }
    }, 500));

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery, fetchPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasNextPage && !isLoadingMore && !isInitialLoading && isMountedRef.current) {
          fetchPosts(currentPage + 1, searchQuery, false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current);
      }
    };
  }, [hasNextPage, isLoadingMore, isInitialLoading, currentPage, searchQuery, fetchPosts]);

  const handleFollow = async (followedId) => {
    if (!userID) {
      navigate('/login');
      return;
    }

    if (loading[followedId]) return;
    
    setLoading(prev => ({ ...prev, [followedId]: true }));

    try {
      await axios.post(`${BASE_URL}/api/follows`, {
        followerId: userID,
        followedId,
      });
      
      if (isMountedRef.current) {
        setFollowMap(prev => ({ ...prev, [followedId]: true }));
      }
    } catch (err) {
      console.error("Follow failed:", err);
      alert("Failed to follow user. Please try again.");
    } finally {
      if (isMountedRef.current) {
        setLoading(prev => ({ ...prev, [followedId]: false }));
      }
    }
  };

  const handleUnfollow = async (followedId) => {
    if (!userID) {
      navigate('/login');
      return;
    }

    if (loading[followedId]) return;
    
    setLoading(prev => ({ ...prev, [followedId]: true }));

    try {
      await axios.delete(`${BASE_URL}/api/follow`, {
        data: {
          followerId: userID,
          followedId,
        },
      });
      
      if (isMountedRef.current) {
        setFollowMap(prev => ({ ...prev, [followedId]: false }));
      }
    } catch (err) {
      console.error("Unfollow failed:", err);
      alert("Failed to unfollow user. Please try again.");
    } finally {
      if (isMountedRef.current) {
        setLoading(prev => ({ ...prev, [followedId]: false }));
      }
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

    } catch (err) {
      console.error("Error saving/unsaving post:", err);
      if (isMountedRef.current) {
        setSavedPosts(prev => ({
          ...prev,
          [postID]: !prev[postID]
        }));
      }
    }
  };

  const handleLike = async (postID) => {
    if (!userID) {
      navigate('/login');
      return;
    }

    try {
      const hasLiked = userLikedPosts[postID];
      const currentLikeCount = likes[postID] || 0;

      // Optimistic update
      setUserLikedPosts(prev => ({
        ...prev,
        [postID]: !hasLiked
      }));
      setLikes(prev => ({
        ...prev,
        [postID]: hasLiked ? currentLikeCount - 1 : currentLikeCount + 1
      }));

      // Make API call
      let response;
      if (hasLiked) {
        response = await axios.post(`${BASE_URL}/api/posts/unlike`, { postID, userID });
      } else {
        response = await axios.post(`${BASE_URL}/api/posts/like`, { postID, userID });
      }

      // Update with actual count from server
      if (isMountedRef.current) {
        setLikes(prev => ({ ...prev, [postID]: response.data.count }));
      }

    } catch (err) {
      console.error("Error toggling like:", err);
      // Revert optimistic update on error
      if (isMountedRef.current) {
        const hasLiked = userLikedPosts[postID];
        const currentLikeCount = likes[postID] || 0;
        setUserLikedPosts(prev => ({
          ...prev,
          [postID]: hasLiked
        }));
        setLikes(prev => ({
          ...prev,
          [postID]: hasLiked ? currentLikeCount + 1 : currentLikeCount - 1
        }));
      }
    }
  };

  const fetchComments = async (postID) => {
    if (!userID) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.get(`${BASE_URL}/api/posts/comments/${postID}`);
      if (isMountedRef.current) {
        setComments(res.data);
        setShowCommentsPostID(postID);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const handleCommentSubmit = async () => {
    if (!userID || newComment.trim() === "") return;

    try {
      const response = await axios.post(`${BASE_URL}/api/posts/comments`, {
        postID: showCommentsPostID,
        userID,
        comment: newComment
      });
      
      if (isMountedRef.current) {
        setNewComment("");
        setCommentCounts(prev => ({
          ...prev,
          [showCommentsPostID]: response.data.count
        }));
        fetchComments(showCommentsPostID);
      }

    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

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

  const LoadMoreSpinner = () => (
    <div className="d-flex justify-content-center my-4">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading more posts...</span>
      </div>
    </div>
  );

  return (
    <>
      <h1 className="text-center mb-4"><i className="fas fa-blog"></i></h1>
      
      {/* Search Input */}
      <input
        type="text"
        className="form-control mb-4"
        placeholder="Search posts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={isInitialLoading}
      />

      {/* Initial Loading */}
      {isInitialLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Posts Grid */}
          <div className="row">
            {posts.map((post) => (
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
                      {user && user.id !== post.user._id && (
                        <span className="ms-2">
                          {followMap[post.user._id] ? (
                            <button 
                              className="btn btn-sm" 
                              onClick={() => handleUnfollow(post.user._id)}
                              disabled={loading[post.user._id]}
                              title="Unfollow"
                            >
                              {loading[post.user._id] ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <FaUserMinus />
                              )}
                            </button>
                          ) : (
                            <button 
                              className="btn btn-sm" 
                              onClick={() => handleFollow(post.user._id)}
                              disabled={loading[post.user._id]}
                              title="Follow"
                            >
                              {loading[post.user._id] ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <FaUserPlus />
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
                          color: userLikedPosts[post._id] ? "white" : "#dc3545"
                        }}
                        title="Like"
                      >
                        {userLikedPosts[post._id] ? <FaHeart /> : <FaRegHeart />} {likes[post._id] || 0}
                      </button>

                      <button 
                        className="btn btn-sm ms-2" 
                        onClick={() => fetchComments(post._id)}
                        title="Comments"
                      >
                        <FaComment /> {commentCounts[post._id] || 0}
                      </button>

                      <button 
                        className="btn px-3 py-1 ms-2" 
                        onClick={() => handleSave(post._id)}
                        title={savedPosts[post._id] ? "Unsave post" : "Save post"}
                      >
                        {savedPosts[post._id] ? <FaBookmark /> : <FaRegBookmark />}
                      </button>

                      <Link
                        to={`/ViewPost?postID=${post._id}`}
                        className="btn btn-sm ms-2"
                        style={{
                          background: "linear-gradient(to right, #36d1dc, #5b86e5)",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          padding: "5px 10px",
                          textDecoration: "none",
                        }}
                        title="View post"
                      >
                        <FaEye />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Indicator */}
          {hasNextPage && (
            <div ref={loadingRef}>
              {isLoadingMore && <LoadMoreSpinner />}
            </div>
          )}

          {/* No Posts Message */}
          {posts.length === 0 && !isInitialLoading && (
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

          {/* End of Posts Message */}
          {posts.length > 0 && !hasNextPage && (
            <div className="col-12">
              <div className="alert alert-info text-center">
                <i className="fas fa-check-circle me-2"></i>
                You've reached the end! No more posts to load.
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating Add Post Button */}
      <button 
        onClick={() => navigate('/add-post')}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#007bff',
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '24px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          zIndex: 1000,
          border: 'none',
          outline: 'none',
          transition: 'all 0.3s ease',
        }}
        className="hover-scale"
        title="Create new post"
      >
        <FaPlus />
      </button>

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
                        <strong>{c.user?.username || c.username || "Anonymous"}</strong>: {c.content}
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