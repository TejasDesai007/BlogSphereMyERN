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
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState([]);

    const quillRef = useRef(null);
    const recognitionRef = useRef(null);
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const user = sessionStorage.getItem("user");
        if (!user) navigate("/login");

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setSpeechSupported(true);
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setError("");
            };

            recognitionRef.current.onend = () => setIsListening(false);

            recognitionRef.current.onerror = (event) => {
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    setError("Microphone access denied.");
                } else if (event.error === 'no-speech') {
                    setError("No speech detected.");
                } else {
                    setError(`Speech error: ${event.error}`);
                }
            };

            recognitionRef.current.onresult = (event) => {
                let transcript = '';
                let isFinal = false;
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                    if (event.results[i].isFinal) isFinal = true;
                }
                if (isFinal && transcript.trim()) insertSpeechText(transcript.trim());
            };
        }
    }, [navigate]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 5);
        setImages(files);
        setPreviews(files.map(file => URL.createObjectURL(file)));
    };

    const getPlainText = (htmlContent) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        return tempDiv.textContent || tempDiv.innerText || "";
    };

    const insertSpeechText = (text) => {
        if (!quillRef.current) return;
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        const insert = (index) => {
            const textBefore = quill.getText(Math.max(0, index - 1), 1);
            const needsSpace = textBefore && textBefore !== ' ' && textBefore !== '\n';
            const textToInsert = needsSpace ? ` ${text}` : text;
            quill.insertText(index, textToInsert, 'user');
            quill.setSelection(index + textToInsert.length);
            const newContent = quill.root.innerHTML;
            setContent(newContent);
            const plainText = getPlainText(newContent);
            const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
            if (wordCount >= 2) setTimeout(() => fetchPrediction(plainText), 500);
        };
        if (range) insert(range.index);
        else insert(quill.getLength() - 1);
    };

    const toggleSpeechRecognition = () => {
        if (!speechSupported) {
            setError("Speech recognition not supported.");
            return;
        }
        if (isListening) recognitionRef.current.stop();
        else recognitionRef.current.start();
    };

    const insertSuggestion = () => {
        if (!suggestion || !quillRef.current) return;
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        const insert = (index) => {
            const textBefore = quill.getText(Math.max(0, index - 1), 1);
            const needsSpace = textBefore && textBefore !== ' ' && textBefore !== '\n';
            const textToInsert = needsSpace ? ` ${suggestion}` : suggestion;
            quill.insertText(index, textToInsert, 'user');
            quill.setSelection(index + textToInsert.length);
        };
        if (range) insert(range.index);
        else insert(quill.getLength() - 1);
        setSuggestion("");
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Tab" && suggestion) {
                e.preventDefault();
                insertSuggestion();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [suggestion]);

    const fetchPrediction = async (text) => {
        try {
            const response = await axios.post("http://localhost:5002/generate", { text: text.trim() });
            if (response.data && response.data.next_word) setSuggestion(response.data.next_word);
        } catch (err) {
            console.error("Prediction error:", err);
            setSuggestion("");
        }
    };

    const handleContentChange = (value) => {
        const plainText = getPlainText(value);
        const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount <= 500) {
            setContent(value);
            setError("");
            if (wordCount >= 2) {
                setTimeout(() => fetchPrediction(plainText), 500);
            } else {
                setSuggestion("");
            }
        } else {
            setError("Content must not exceed 500 words.");
        }
    };

    const handleTagKeyDown = (e) => {
        if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
            e.preventDefault();
            addTag(tagInput.trim());
        }
    };

    const addTag = (newTag) => {
        if (!tags.includes(newTag) && tags.length < 10) {
            setTags([...tags, newTag]);
        }
        setTagInput("");
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
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
                body: JSON.stringify({ title, content, userId: user.id, tags }),
            });

            const contentType = postRes.headers.get("content-type");
            let postData;
            if (contentType?.includes("application/json")) {
                postData = await postRes.json();
            } else {
                const textResponse = await postRes.text();
                throw new Error(`Non-JSON response: ${textResponse.substring(0, 100)}...`);
            }

            if (!postRes.ok) throw new Error(postData.message || "Post creation failed.");
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
                if (imgContentType?.includes("application/json")) {
                    imgData = await imgRes.json();
                } else {
                    const imgTextResponse = await imgRes.text();
                    throw new Error(`Image upload failed: ${imgTextResponse.substring(0, 100)}...`);
                }

                if (!imgRes.ok) throw new Error(imgData.message || "Image upload failed.");
            }

            navigate("/");
        } catch (err) {
            console.error("Submit error:", err);
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
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
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <label className="form-label mb-0">Content</label>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${isListening ? 'btn-danger' : 'btn-outline-primary'}`}
                                            onClick={toggleSpeechRecognition}
                                            title={isListening ? "Stop" : "Start"}
                                            disabled={!speechSupported}
                                        >
                                            <i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'} me-1`}></i>
                                            {isListening ? 'Stop Recording' : 'Start Recording'}
                                        </button>
                                    </div>

                                    {!speechSupported && (
                                        <div className="alert alert-warning">Speech recognition is not supported.</div>
                                    )}
                                    {isListening && (
                                        <div className="alert alert-info">
                                            <i className="fas fa-microphone me-2"></i> Listening...
                                        </div>
                                    )}

                                    <ReactQuill
                                        ref={quillRef}
                                        theme="snow"
                                        value={content}
                                        onChange={handleContentChange}
                                        modules={modules}
                                        placeholder="Write your blog content here..."
                                        style={{ height: "200px", marginBottom: "50px" }}
                                    />

                                    {suggestion && (
                                        <div className="alert alert-info mt-2 d-flex justify-content-between align-items-center">
                                            <div>
                                                <i className="fas fa-lightbulb me-2"></i>
                                                Suggested word: <strong>{suggestion}</strong>
                                            </div>
                                            <small className="text-muted">Press <kbd>Tab</kbd> to accept</small>
                                        </div>
                                    )}

                                    <small className="text-muted d-block mt-2">
                                        Word Count: {getPlainText(content).trim().split(/\s+/).filter(Boolean).length} / 500 &nbsp; | &nbsp;
                                        Letters: {getPlainText(content).replace(/\s/g, "").length}
                                    </small>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Tags (Max 10)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder="Type a tag and press Enter"
                                    />
                                    <div className="mt-2 d-flex flex-wrap gap-2">
                                        {tags.map((tag, idx) => (
                                            <span key={idx} className="badge bg-secondary">
                                                {tag}{" "}
                                                <i
                                                    className="fas fa-times ms-1"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => removeTag(tag)}
                                                ></i>
                                            </span>
                                        ))}
                                    </div>
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
