import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "react-quill/dist/quill.snow.css";
import ReactQuill from "react-quill";
import axios from "axios";

const AddPost = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState("");
    const quillRef = useRef(null);
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const user = sessionStorage.getItem("user");
        if (!user) {
            navigate("/login");
        }
    }, [navigate]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 5);
        setImages(files);
        setPreviews(files.map(file => URL.createObjectURL(file)));
    };

    // Get plain text from HTML content
    const getPlainText = (htmlContent) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        return tempDiv.textContent || tempDiv.innerText || "";
    };

    // Insert suggestion at cursor position
    const insertSuggestion = () => {
        if (!suggestion || !quillRef.current) return;
        
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        
        if (range) {
            // Get the current text to check what's before the cursor
            const currentText = quill.getText();
            const beforeCursor = currentText.substring(0, range.index);
            const lastChar = beforeCursor.slice(-1);
            
            // Only add space if the last character is not a space, newline, or empty
            const needsSpace = lastChar && lastChar !== ' ' && lastChar !== '\n' && lastChar !== '\t';
            
            const textToInsert = needsSpace ? ` ${suggestion}` : suggestion;
            
            // Insert the suggestion
            quill.insertText(range.index, textToInsert);
            
            // Set cursor position after the inserted text
            const newPosition = range.index + textToInsert.length;
            quill.setSelection(newPosition, 0);
        }
        
        setSuggestion("");
    };

    // Handle keyboard events
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle Tab when there's a suggestion
            if (e.key === "Tab" && suggestion) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                insertSuggestion();
                return false;
            }
        };

        // Add event listener to the quill editor specifically
        if (quillRef.current) {
            const quill = quillRef.current.getEditor();
            const editorElement = quill.root;
            editorElement.addEventListener("keydown", handleKeyDown, true);
            
            return () => {
                editorElement.removeEventListener("keydown", handleKeyDown, true);
            };
        }
    }, [suggestion]);

    // Fetch prediction from backend
    const fetchPrediction = async (text) => {
        try {
            const response = await axios.post("http://localhost:5002/generate", {
                text: text.trim()
            });
            
            if (response.data && response.data.next_word) {
                setSuggestion(response.data.next_word);
            }
        } catch (err) {
            console.error("Prediction error:", err);
            setSuggestion("");
        }
    };

    const handleContentChange = async (value) => {
        const plainText = getPlainText(value);
        const wordCount = plainText.trim().split(/\s+/).filter(word => word).length;

        if (wordCount <= 500) {
            setContent(value);
            setError("");

            // Fetch new prediction if we have enough words
            if (wordCount >= 2) {
                // Debounce the prediction request
                setTimeout(() => {
                    fetchPrediction(plainText);
                }, 500);
            } else {
                setSuggestion("");
            }
        } else {
            setError("Content must not exceed 500 words.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const user = JSON.parse(sessionStorage.getItem("user"));
            const postRes = await fetch(`${BASE_URL}/api/posts/AddPost`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ title, content, userId: user.id }),
            });

            const contentType = postRes.headers.get("content-type");
            let postData;
            if (contentType && contentType.includes("application/json")) {
                postData = await postRes.json();
            } else {
                const textResponse = await postRes.text();
                throw new Error(`Non-JSON response: ${textResponse.substring(0, 100)}...`);
            }

            if (!postRes.ok) {
                throw new Error(postData.message || "Failed to create post.");
            }

            const postId = postData.postId;

            if (images.length > 0) {
                const formData = new FormData();
                images.forEach((img) => formData.append("images", img));
                formData.append("postId", postId);

                const imgRes = await fetch(`${BASE_URL}/api/posts/upload`, {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                });

                const imgContentType = imgRes.headers.get("content-type");
                let imgData;
                if (imgContentType && imgContentType.includes("application/json")) {
                    imgData = await imgRes.json();
                } else {
                    const imgTextResponse = await imgRes.text();
                    throw new Error(`Image upload failed: ${imgTextResponse.substring(0, 100)}...`);
                }

                if (!imgRes.ok) {
                    throw new Error(imgData.error || imgData.message || "Image upload failed!");
                }
            }

            navigate("/");
        } catch (err) {
            console.error("Submit error:", err);
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Custom toolbar for ReactQuill
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ],
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
                                        ref={quillRef}
                                        theme="snow"
                                        value={content}
                                        onChange={handleContentChange}
                                        modules={modules}
                                        placeholder="Write your blog content here..."
                                        style={{ height: "200px", marginBottom: "50px" }}
                                    />

                                    {/* Suggestion box */}
                                    {suggestion && (
                                        <div className="alert alert-info mt-2 d-flex justify-content-between align-items-center">
                                            <div>
                                                <i className="fas fa-lightbulb me-2"></i>
                                                Suggested next word: <strong>{suggestion}</strong>
                                            </div>
                                            <small className="text-muted">
                                                Press <kbd>Tab</kbd> to accept
                                            </small>
                                        </div>
                                    )}

                                    <small className="text-muted d-block mt-2">
                                        Word Count: {
                                            getPlainText(content).trim().split(/\s+/).filter(word => word).length
                                        } / 500 &nbsp; | &nbsp;
                                        Letter Count: {
                                            getPlainText(content).replace(/\s/g, "").length
                                        }
                                    </small>
                                </div>

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