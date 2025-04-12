import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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


  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const userID = user ? user.id : null;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [postsRes, likesRes, commentsCountRes] = await Promise.all([
          axios.get("http://localhost:8082/api/posts/FetchPost"),
          axios.get("http://localhost:8082/api/posts/likes-count"),
          axios.get("http://localhost:8082/api/posts/comments-count"),
        ]);

        setPosts(postsRes.data);
        setLikes(likesRes.data);
        setCommentCounts(commentsCountRes.data);


        if (userID) {
          const userLikesRes = await axios.get(`http://localhost:8082/api/posts/user-liked/${userID}`);
          const likedMap = {};
          userLikesRes.data.forEach(postID => likedMap[postID] = true);
          setUserLikedPosts(likedMap);

          const userSavedRes = await axios.get(`http://localhost:8082/api/posts/savedposts/${userID}`);
          const savedMap = {};
          userSavedRes.data.forEach(postID => savedMap[postID] = true);
          console.log(savedMap);
          setSavedPosts(savedMap);

        }

      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchAll();
  }, []);

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
        await axios.post("http://localhost:8082/api/posts/unsave-post", { postID, userID });
      } else {
        await axios.post("http://localhost:8082/api/posts/savepost", { postID, userID });
      }

      // You can skip this re-fetch to prevent toggling flicker
      // Or keep it if backend is the true source of truth

      const res = await axios.get(`http://localhost:8082/api/posts/savedposts/${userID}`);
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
        await axios.post("http://localhost:8082/api/posts/unlike", { postID, userID });
      } else {
        await axios.post("http://localhost:8082/api/posts/like", { postID, userID });
      }

      const [likesRes, userLikesRes] = await Promise.all([
        axios.get("http://localhost:8082/api/posts/likes-count"),
        axios.get(`http://localhost:8082/api/posts/user-liked/${userID}`)
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
      const res = await axios.get(`http://localhost:8082/api/posts/comments/${postID}`);
      console.log(res.data);
      setComments(res.data);
      setShowCommentsPostID(postID);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const handleCommentSubmit = async () => {
    if (!userID || newComment.trim() === "") return;

    try {
      await axios.post("http://localhost:8082/api/posts/comments", {
        postID: showCommentsPostID,
        userID,
        comment: newComment
      });
      setNewComment("");
      fetchComments(showCommentsPostID);

      // Refresh comment count
      const res = await axios.get("http://localhost:8082/api/posts/comments-count");
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
    <div className="container py-5">
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
                          src={`http://localhost:8082${imagePath}`}
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
                <h6 className="card-subtitle mb-2 text-muted">
                  By {post.userName} on {new Date(post.publishedAt).toLocaleDateString()}
                </h6>

                <div className="mt-auto d-flex justify-content-between align-items-center">
                  <button
                    className={`btn ${userLikedPosts[post.postID] ? "btn-danger" : "btn-outline-danger"} px-3 py-1`}
                    onClick={() => handleLike(post.postID)}
                  >
                    <i className="fas fa-heart "></i> {likes[post.postID] || 0}
                  </button>

                  <button
                    className="btn btn-sm btn-outline-secondary ms-2"
                    onClick={() => fetchComments(post.postID)}
                  >
                    <i className="fas fa-comments me-1"></i> {commentCounts[post.postID] || 0}
                  </button>
                  <button
                    className={`btn ${savedPosts[post.postID] ? "btn-success" : "btn-outline-success"} px-3 py-1 ms-2`}
                    onClick={() => handleSave(post.postID)}
                  >
                    <i className={`fa${savedPosts[post.postID] ? "s" : "r"} fa-bookmark me-1`}></i>
                  </button>

                  <a
                    href={`/ViewPost?postID=${post.postID}`}
                    className="btn btn-sm btn-primary ms-2"
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
    </div>
  );
}
