import React, { useEffect, useState } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap'; // ✅ import all JS
window.bootstrap = bootstrap;          // ✅ assign to global


export default function Homepage() {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const user = JSON.parse(sessionStorage.getItem("user"));
  const userID = user ? user.id : null;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get("http://localhost:8082/api/posts/FetchPost");
        setPosts(res.data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };

    fetchPosts();
  }, []);

  // ✅ Force Bootstrap to initialize carousels after rendering
  useEffect(() => {
    const carousels = document.querySelectorAll('.carousel');
    carousels.forEach(carousel => {
      new window.bootstrap.Carousel(carousel, {
        interval: 2500,
        ride: 'carousel',
        pause: false
      });
    });
  }, [posts]);

  const handleDelete = async (postID) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await axios.delete(`http://localhost:8082/api/posts/DeletePost?postID=${postID}`);
      setPosts(prev => prev.filter(post => post.postID !== postID));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container py-5">
      <h1 className="text-center mb-4"><i className="fas fa-blog"></i> Blog Home</h1>

      <input
        type="text"
        className="form-control mb-4"
        placeholder="Search posts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="row">
        {filteredPosts.map((post) => (
          <div className="col-md-6 mb-4" key={post.postID}>
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
                          style={{ maxHeight: "300px", objectFit: "cover" }}
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

                <a href={`/ViewPost?postID=${post.postID}`} className="card-link mt-auto">Read Blog</a>

                
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
