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
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;



  const [isFollowing, setIsFollowing] = useState(false);


  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const userID = user ? user.id : null;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [postsRes, likesRes, commentsCountRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/posts/FetchPost`),
          axios.get(`${BASE_URL}/api/posts/likes-count`),
          axios.get(`${BASE_URL}/api/posts/comments-count`),
        ]);

        setPosts(postsRes.data);
        // console.log(postsRes.data);
        setLikes(likesRes.data);
        setCommentCounts(commentsCountRes.data);


        if (userID) {
          const userLikesRes = await axios.get(`${BASE_URL}/api/posts/user-liked/${userID}`);
          const likedMap = {};
          userLikesRes.data.forEach(postID => likedMap[postID] = true);
          setUserLikedPosts(likedMap);

          const userSavedRes = await axios.get(`${BASE_URL}/api/posts/savedposts/${userID}`);
          const savedMap = {};
          userSavedRes.data.forEach(postID => savedMap[postID] = true);
          // console.log(savedMap);
          setSavedPosts(savedMap);

          const followStatuses = {};
          const uniqueAuthorIDs = [...new Set(postsRes.data.map(post => post.userId))].filter(id => id !== userID);

          for (let authorId of uniqueAuthorIDs) {
            try {
              const res = await axios.get(`${BASE_URL}/api/follows/check?followerId=${userID}&followedId=${authorId}`);
              followStatuses[authorId] = res.data.isFollowing;
            } catch (err) {
              console.error(`Error checking follow status for user ${authorId}:`, err);
            }
          }

          setFollowMap(followStatuses);

        }

      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchAll();
  }, []);


  const handleFollow = async (followedId) => {
    try {
      await axios.post(`${BASE_URL}/api/follows`, {
        followerId: userID,
        followedId,
      });
      setFollowMap(prev => ({ ...prev, [followedId]: true }));
    } catch (err) {
      console.error("Follow failed", err);
    }
  };

  const handleUnfollow = async (followedId) => {
    try {
      await axios.delete(`${BASE_URL}/api/follows`, {
        data: {
          followerId: userID,
          followedId,
        },
      });
      setFollowMap(prev => ({ ...prev, [followedId]: false }));
    } catch (err) {
      console.error("Unfollow failed", err);
    }
  };



  const handleSave = async (postID) => {
    if (!userID) {
      navigate('/login');
      return;
    }

    try {
      const hasSaved = savedPosts[postID];

      // Optimistically update UI
      setSavedPosts(prev => ({
        ...prev,
        [postID]: !hasSaved
      }));

      if (hasSaved) {
        await axios.post(`${BASE_URL}/api/posts/unsave-post`, { postID, userID });
      } else {
        await axios.post(`${BASE_URL}/api/posts/savepost`, { postID, userID });
      }

      // You can skip this re-fetch to prevent toggling flicker
      // Or keep it if backend is the true source of truth

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
      // console.log(res.data);
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

      // Refresh comment count
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

  return (
    <>
      <h1 className="text-center mb-4"><i className="fas fa-blog"></i></h1>
      <input
        type="text"
        className="form-control mb-4"
        placeholder="Search posts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="row">
        {filteredPosts.map((post) => (
          <div className="col-lg-4 col-md-6 mb-4" key={post.postID}>
            <div className="card h-100">
              {post.images.length > 0 && (
                <div
                  id={`carousel${post.postID}`}
                  className="carousel slide"
                  data-bs-ride="carousel"
                >
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
                      <button className="carousel-control-prev" type="button" data-bs-target={`#carousel${post.postID}`} data-bs-slide="prev">
                        <span className="carousel-control-prev-icon"></span>
                        <span className="visually-hidden">Previous</span>
                      </button>
                      <button className="carousel-control-next" type="button" data-bs-target={`#carousel${post.postID}`} data-bs-slide="next">
                        <span className="carousel-control-next-icon"></span>
                        <span className="visually-hidden">Next</span>
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


                  {user && user.id !== post.userId && (
                    <span className="ms-2">
                      {followMap[post.userId] ? (
                        <button
                          className="btn btn-sm"
                          onClick={() => handleUnfollow(post.userId)}
                          title="Unfollow"
                        >
                          <i className="fas fa-user-minus"></i>
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm"
                          onClick={() => handleFollow(post.userId)}
                          title="Follow"
                        >
                          <i className="fas fa-user-plus"></i>
                        </button>
                      )}
                    </span>
                  )}
                </h6>

                <div className="mt-auto d-flex justify-content-between align-items-center">
                  <button
                    className="btn px-3 py-1 text-white border-0"
                    onClick={() => handleLike(post.postID)}
                    style={{
                      backgroundColor: userLikedPosts[post.postID] ? "#dc3545" : "#f0f0f0",
                      color: userLikedPosts[post.postID] ? "black" : "#dc3545"
                    }}
                  >
                    <i className="fas fa-heart me-1"></i> {likes[post.postID] || 0}
                  </button>



                  <button
                    className="btn btn-sm ms-2"
                    onClick={() => fetchComments(post.postID)}

                  >
                    <i className="fas fa-comments me-1"></i> {commentCounts[post.postID] || 0}
                  </button>

                  <button
                    className="btn px-3 py-1 ms-2"
                    onClick={() => handleSave(post.postID)}

                  >
                    <i className={`fa${savedPosts[post.postID] ? "s" : "r"} fa-bookmark`}></i>
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

        {filteredPosts.length === 0 && (
          <div className="col-12">
            <div className="alert alert-warning text-center">No matching posts found.</div>
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {showCommentsPostID && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
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
                        <strong>{c.username}</strong>: {c.Content}
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
