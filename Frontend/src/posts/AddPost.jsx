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
            setLoading(true);
            setError("");

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
                    userId: JSON.parse(sessionStorage.getItem("user")).id,
                }),
            });

            const postData = await postRes.json();
            if (!postRes.ok) throw new Error(postData.message || "Failed to create post.");
            const postId = postData.postId; // returned from backend
            console.log(postId);
            // Step 2: Upload images for that Post
            if (images.length > 0) {
                const formData = new FormData();
                images.forEach((img) => formData.append("images", img));
                formData.append("postId", postId); // send as form field

                const imgRes = await fetch(`${BASE_URL}/api/posts/upload`, {
                    method: "POST",
                    body: formData,
                });

                const imgData = await imgRes.json();
                if (!imgRes.ok) throw new Error(imgData.error || "Image upload failed!");
            }


            navigate("/");
        } catch (err) {
            setError(err.message);
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
