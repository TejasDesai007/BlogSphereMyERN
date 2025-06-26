import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "react-quill/dist/quill.snow.css";
import ReactQuill from "react-quill";



const AddPost = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const user = sessionStorage.getItem("user");
        if (!user) {
            navigate("/login");
        }
    }, [navigate]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 5); // max 5 images
        setImages(files);
        setPreviews(files.map(file => URL.createObjectURL(file)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Debug logs
            console.log("BASE_URL:", BASE_URL);
            console.log("Full API URL:", `${BASE_URL}/api/posts/AddPost`);

            const user = JSON.parse(sessionStorage.getItem("user"));
            console.log("User from sessionStorage:", user);

            // Step 1: Create Post without images
            const postRes = await fetch(`${BASE_URL}/api/posts/AddPost`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    title,
                    content,
                    userId: user.id,
                }),
            });

            console.log("Response status:", postRes.status);
            console.log("Response ok:", postRes.ok);

            // Check if response is JSON
            const contentType = postRes.headers.get("content-type");
            console.log("Content-Type:", contentType);

            let postData;
            if (contentType && contentType.includes("application/json")) {
                postData = await postRes.json();
            } else {
                const textResponse = await postRes.text();
                console.log("Non-JSON response received:", textResponse);
                throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 100)}...`);
            }

            console.log("Post response data:", postData);

            if (!postRes.ok) {
                throw new Error(postData.message || "Failed to create post.");
            }

            const postId = postData.postId;
            console.log("Created post ID:", postId);

            // Step 2: Upload images for that Post
            if (images.length > 0) {
                console.log("Uploading images for post:", postId);

                const formData = new FormData();
                images.forEach((img) => formData.append("images", img));
                formData.append("postId", postId);

                const imgRes = await fetch(`${BASE_URL}/api/posts/upload`, {
                    method: "POST",
                    credentials: "include", // Add this
                    body: formData,
                });

                console.log("Image upload response status:", imgRes.status);

                const imgContentType = imgRes.headers.get("content-type");
                let imgData;

                if (imgContentType && imgContentType.includes("application/json")) {
                    imgData = await imgRes.json();
                } else {
                    const imgTextResponse = await imgRes.text();
                    console.log("Image upload non-JSON response:", imgTextResponse);
                    throw new Error(`Image upload failed: ${imgTextResponse.substring(0, 100)}...`);
                }

                console.log("Image upload response data:", imgData);

                if (!imgRes.ok) {
                    throw new Error(imgData.error || imgData.message || "Image upload failed!");
                }
            }

            console.log("Post created successfully, navigating to home");
            navigate("/");

        } catch (err) {
            console.error("Submit error details:", err);
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-body">
                            <h4 className="card-title text-center mb-4">
                                <i className="fas fa-pen-nib me-2"></i> New Blog Post
                            </h4>

                            {error && <div className="alert alert-danger">{error}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Title</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Content</label>
                                    <ReactQuill
                                        theme="snow"
                                        value={content}
                                        onChange={(value) => {
                                            const text = value.replace(/<[^>]+>/g, ""); // remove HTML tags
                                            const wordCount = text.trim().split(/\s+/).filter(word => word).length;
                                            if (wordCount <= 500) {
                                                setContent(value);
                                                setError(""); // clear previous error if any
                                            } else {
                                                setError("Content must not exceed 500 words.");
                                            }
                                        }}
                                        placeholder="Write your blog content here..."
                                        style={{ height: "200px" }}
                                    />

                                </div>
                                <br></br>
                                <small className="text-muted d-block mt-2">
                                    Word Count: {
                                        content.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(word => word).length
                                    } / 500 &nbsp; | &nbsp;
                                    Letter Count: {
                                        content.replace(/<[^>]+>/g, "").replace(/\s/g, "").length
                                    }
                                </small>
                                <br></br>
                                <div className="mb-3">
                                    <label className="form-label">Upload Images (Max 5)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="form-control"
                                        onChange={handleImageChange}
                                    />
                                    <div className="mt-2 d-flex flex-wrap gap-2">
                                        {previews.map((src, idx) => (
                                            <img
                                                key={idx}
                                                src={src}
                                                alt={`Preview ${idx}`}
                                                className="rounded"
                                                style={{ maxHeight: "100px", maxWidth: "100px" }}
                                            />
                                        ))}
                                    </div>
                                </div>


                                <div className="d-grid">
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? "Posting..." : <><i className="fas fa-upload me-2"></i>Post</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPost;
