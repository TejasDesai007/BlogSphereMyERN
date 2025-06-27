import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import axios from "axios";
import { Link } from "react-router-dom";
import he from 'he';

export default function ViewPost() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postID = searchParams.get("postID");

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const user = JSON.parse(sessionStorage.getItem("user"));
  const userID = user ? user.id : null;
  const [savedPosts, setSavedPosts] = useState({});
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (!userID) return;
      try {
        const res = await axios.get(`${BASE_URL}/api/posts/savedposts/${userID}`);
        const savedMap = {};
        res.data.forEach(id => savedMap[id] = true);
        setSavedPosts(savedMap);
      } catch (err) {
        console.error("Error fetching saved posts:", err);
      }
    };

    fetchSavedPosts();
  }, [userID]);


  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/posts/FetchPost/${postID}`);
        setPost(res.data);
      } catch (err) {
        console.error("Error fetching post:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchLikeAndCommentData = async () => {
      try {
        const [likeRes, userLikeRes, commentRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/posts/likes-count`),
          axios.get(`${BASE_URL}/api/posts/user-liked/${userID}`),
          axios.get(`${BASE_URL}/api/posts/comments/${postID}`)
        ]);

        setLikes(likeRes.data[postID] || 0);
        setHasLiked(userLikeRes.data.includes(parseInt(postID)));
        setComments(commentRes.data);
      } catch (err) {
        console.error("Error fetching like/comment data:", err);
      }
    };

    if (postID) {
      fetchPost();
      fetchLikeAndCommentData();
    }
  }, [postID, userID]);

  const decodedContent = useMemo(() => {
    if (!post?.content) return '';
    return he.decode(post.content);
  }, [post]);

  const handleLike = async () => {
    if (!userID) {
      navigate("/login");
      return;
    }

    try {
      if (hasLiked) {
        await axios.post(`${BASE_URL}/api/posts/unlike`, { postID, userID });
      } else {
        await axios.post(`${BASE_URL}/api/posts/like`, { postID, userID });
      }

      const [likeRes, userLikeRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/posts/likes-count`),
        axios.get(`${BASE_URL}/api/posts/user-liked/${userID}`)
      ]);

      setLikes(likeRes.data[postID] || 0);
      setHasLiked(userLikeRes.data.includes(parseInt(postID)));
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };
  const handleSave = async (postID) => {
    if (!userID) {
      navigate('/login');
      return;
    }

    try {
      const hasSaved = savedPosts[postID];

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

  const handleCommentSubmit = async () => {
    if (!userID || newComment.trim() === "") return;

    try {
      await axios.post(`${BASE_URL}/api/posts/comments`, {
        postID,
        userID,
        comment: newComment
      });

      const res = await axios.get(`${BASE_URL}/api/posts/comments/${postID}`);
      setComments(res.data);
      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="card h-100">
      <div className="card-body px-5 py-5">
        {post ? (
          <>
            <h1 className="mb-3"><i className="fas fa-file-alt"></i> {post.title}</h1>
            <h6 className="text-muted mb-3">
              <span>
                By <Link
                  to={`/profile/${post.userId}`}
                  className="bg-dark text-light rounded text-decoration-none"
                  style={{
                    background: "linear-gradient(to right, #667eea, #764ba2)", // gradient effect
                    color: "white",
                  }}
                >
                  {post.userName}
                </Link> on {new Date(post.publishedAt).toLocaleDateString()}
              </span>

            </h6>

            {/* Images Carousel */}
            {post.images.length > 0 && (
              <div id="carouselImages" className="carousel slide mb-4" data-bs-ride="carousel">
                <div className="carousel-inner">
                  {post.images.map((imagePath, index) => (
                    <div key={index} className={`carousel-item ${index === 0 ? "active" : ""}`}>
                      <img
                        src={`${BASE_URL}${imagePath}`}
                        className="d-block w-100"
                        style={{ maxHeight: "400px", objectFit: "cover", cursor: "pointer" }}
                        alt="Post"
                        onClick={() => setSelectedImage(`${BASE_URL}${imagePath}`)}
                      />

                    </div>
                  ))}
                </div>
                {post.images.length > 1 && (
                  <>
                    <button className="carousel-control-prev" type="button" data-bs-target="#carouselImages" data-bs-slide="prev">
                      <span className="carousel-control-prev-icon"></span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target="#carouselImages" data-bs-slide="next">
                      <span className="carousel-control-next-icon"></span>
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="mb-4" dangerouslySetInnerHTML={{ __html: decodedContent }}></div>

            {/* Like and Comment Section */}
            <div className="d-flex align-items-center mb-4">
              <button
                className="btn me-3 text-white border-0"
                onClick={handleLike}
                style={{
                  background: hasLiked
                    ? "linear-gradient(to right, #ff416c, #ff4b2b)" // liked gradient
                    : "linear-gradient(to right, #43cea2, #185a9d)", // neutral gradient
                  color: hasLiked ? "white" : "#dc3545",
                }}
              >
                <i className="fas fa-heart me-1"></i> {likes}
              </button>

              <button
                className="btn px-3 py-1 ms-2 text-white border-0"
                onClick={() => handleSave(post.postID)}
                style={{
                  background: savedPosts[post.postID]
                    ? "linear-gradient(to right, #56ab2f, #a8e063)" // saved (green)
                    : "linear-gradient(to right, #43cea2, #185a9d)", // unsaved
                  color: savedPosts[post.postID] ? "white" : "#28a745",
                }}
              >
                <i className={`fa${savedPosts[post.postID] ? "s" : "r"} fa-bookmark`}></i>
              </button>

              <span
                className="text-muted px-3 py-1 ms-2 d-inline-block"
                style={{
                  border: "linear-gradient(to right, #43cea2, #185a9d)",
                  color: "white",
                  borderRadius: "5px",
                }}
              >
                <i className="fas fa-comments me-1"></i> {comments.length} Comment{comments.length !== 1 && "s"}
              </span>




            </div>

            {/* Comments List */}
            <div className="mb-4">
              {comments.length > 0 ? (
                <ul className="list-group">
                  {comments.map((c, i) => (
                    <li className="list-group-item" key={i}>
                      <strong>{c.username}</strong>: {c.Content}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No comments yet.</p>
              )}
            </div>

            {/* Add Comment Box */}
            <div>
              <textarea
                className="form-control mb-2"
                placeholder="Write a comment..."
                rows="3"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              ></textarea>
              <button className="btn btn-primary" onClick={handleCommentSubmit}>Submit</button>
            </div>
          </>
        ) : (
          <div className="alert alert-danger">Post not found</div>

        )}
        {selectedImage && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Image Preview</h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedImage(null)}></button>
                </div>
                <div className="modal-body text-center">
                  <img src={selectedImage} className="img-fluid" alt="Preview" />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>


  );
}
