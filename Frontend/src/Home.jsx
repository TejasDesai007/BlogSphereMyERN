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
  const navigate = useNavigate();
  const [userLikedPosts, setUserLikedPosts] = useState({});

  const user = JSON.parse(sessionStorage.getItem("user"));
  const userID = user ? user.id : null;

  useEffect(() => {
    const fetchPostsLikesAndUserLikes = async () => {
      try {
        const [postsRes, likesRes] = await Promise.all([
          axios.get("http://localhost:8082/api/posts/FetchPost"),
          axios.get("http://localhost:8082/api/posts/likes-count"),
        ]);

        setPosts(postsRes.data);
        setLikes(likesRes.data);

        if (userID) {
          const userLikesRes = await axios.get(`http://localhost:8082/api/posts/user-liked/${userID}`);
          const likedMap = {};
          userLikesRes.data.forEach(postID => likedMap[postID] = true);
          setUserLikedPosts(likedMap);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchPostsLikesAndUserLikes();
  }, []);

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
                    <i className="fas fa-heart me-1"></i> {likes[post.postID] || 0}
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
    </div>
  );
}