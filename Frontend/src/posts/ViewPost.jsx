import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import axios from "axios";
import he from 'he';

export default function ViewPost() {
  const [searchParams] = useSearchParams();
  const postID = searchParams.get("postID");

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`http://localhost:8082/api/posts/FetchPost?postID=${postID}`);
        const posts = res.data;
        const matchedPost = posts.find(p => p.postID === parseInt(postID));
        setPost(matchedPost || null);
      } catch (err) {
        console.error("Error fetching post:", err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    if (postID) {
      fetchPost();
    }
  }, [postID]);

  // Decode HTML content safely when post is available
  const decodedContent = useMemo(() => {
    if (!post?.content) return '';
    return he.decode(post.content);
  }, [post]);

  if (loading) return <div className="container py-5">Loading...</div>;

  return (
    <div className="container py-5">
      {post ? (
        <>
          <h1 className="mb-3"><i className="fas fa-file-alt"></i> {post.title}</h1>
          <h6 className="text-muted">By {post.userName} on {new Date(post.publishedAt).toLocaleDateString()}</h6>
          <hr />

          {post.images && post.images.length > 0 && (
            <div id={`carouselPost${postID}`} className="carousel slide my-4" data-bs-ride="carousel">
              <div className="carousel-inner">
                {post.images.map((imagePath, index) => (
                  <div className={`carousel-item ${index === 0 ? "active" : ""}`} key={index}>
                    <img
                      src={`http://localhost:8082${imagePath}`}
                      className="d-block w-100 img-fluid rounded"
                      alt={`Post ${index + 1}`}
                      style={{
                        height: "500px",
                        objectFit: "cover",
                        objectPosition: "center",
                        borderRadius: "10px",
                        cursor: "pointer"
                      }}
                      onClick={() => setSelectedImage(imagePath)}
                    />
                  </div>
                ))}
              </div>
              <button className="carousel-control-prev" type="button" data-bs-target={`#carouselPost${postID}`} data-bs-slide="prev">
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Previous</span>
              </button>
              <button className="carousel-control-next" type="button" data-bs-target={`#carouselPost${postID}`} data-bs-slide="next">
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                <span className="visually-hidden">Next</span>
              </button>
            </div>
          )}

          {/* Render the decoded content */}
          <div dangerouslySetInnerHTML={{ __html: decodedContent }} />

        </>
      ) : (
        <div className="alert alert-danger">Post not found!</div>
      )}

      {/* Full Image Modal */}
      {selectedImage && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          onClick={() => setSelectedImage(null)}
          style={{
            backgroundColor: 'rgba(0,0,0,0.8)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050
          }}
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content bg-transparent border-0 position-relative">

              {/* Close Button */}
              <button
                type="button"
                className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
                aria-label="Close"
                onClick={() => setSelectedImage(null)}
                style={{ zIndex: 1060 }}
              ></button>

              <img
                src={`http://localhost:8082${selectedImage}`}
                className="img-fluid rounded"
                style={{ maxHeight: "90vh", objectFit: "contain" }}
                alt="Full View"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
