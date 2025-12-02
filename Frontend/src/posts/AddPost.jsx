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
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState([]);
    const [corrections, setCorrections] = useState({});
    const [grammarSuggestion, setGrammarSuggestion] = useState("");

    const quillRef = useRef(null);
    const recognitionRef = useRef(null);
    const spellTimeoutRef = useRef(null);
    const grammarTimeoutRef = useRef(null);

    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const API_BASE = "http://localhost:5000"; // Flask API URL

    // -------------------- INIT --------------------
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
                if (event.error === 'not-allowed') setError("Microphone access denied.");
                else if (event.error === 'no-speech') setError("No speech detected.");
                else setError(`Speech error: ${event.error}`);
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

    // -------------------- UTIL --------------------
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
            handleContentChange(newContent);
        };
        if (range) insert(range.index);
        else insert(quill.getLength() - 1);
    };

    const toggleSpeechRecognition = () => {
        if (!speechSupported) { setError("Speech recognition not supported."); return; }
        if (isListening) recognitionRef.current.stop();
        else recognitionRef.current.start();
    };

    // -------------------- SPELL & GRAMMAR --------------------
    const handleContentChange = (value) => {
        setContent(value);
        setError("");

        const plainText = getPlainText(value);
        const words = plainText.trim().split(/\s+/).filter(Boolean);

        if (words.length > 500) {
            setError("Content must not exceed 500 words.");
            return;
        }

        // SPELLCHECK: last word
        if (words.length > 0) debounceSpellCheck(words[words.length - 1]);
        else setCorrections({});

        // GRAMMAR: send only latest sentence
        const sentences = plainText.match(/[^.!?]*[.!?]/g) || [];
        if (sentences.length > 0) {
            const lastSentence = sentences[sentences.length - 1].trim();
            if (lastSentence.length > 1) debounceGrammarCheck(lastSentence);
        }
    };



    const debounceSpellCheck = (word) => {
        if (spellTimeoutRef.current) clearTimeout(spellTimeoutRef.current);
        spellTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/spellcheck?word=${word}`);
                if (res.data?.correction && res.data.correction !== word) setCorrections({ [word]: res.data.correction });
                else setCorrections({});
            } catch (err) {
                console.error("Spell check failed:", err);
                setCorrections({});
            }
        }, 500);
    };

    const debounceGrammarCheck = (sentence) => {
        if (grammarTimeoutRef.current) clearTimeout(grammarTimeoutRef.current);
        grammarTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await axios.post(`${API_BASE}/api/grammar`, { text: sentence });
                if (res.data?.corrected && res.data.corrected !== sentence)
                    setGrammarSuggestion(res.data.corrected);
                else
                    setGrammarSuggestion("");
            } catch (err) {
                console.error("Grammar correction failed:", err);
                setGrammarSuggestion("");
            }
        }, 1000);
    };


    // -------------------- TAGS --------------------
    const handleTagKeyDown = (e) => {
        if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
            e.preventDefault();
            addTag(tagInput.trim());
        }
    };
    const addTag = (newTag) => { if (!tags.includes(newTag) && tags.length < 10) setTags([...tags, newTag]); setTagInput(""); };
    const removeTag = (tagToRemove) => setTags(tags.filter(tag => tag !== tagToRemove));

    // -------------------- IMAGES --------------------
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 5);
        setImages(files);
        setPreviews(files.map(file => URL.createObjectURL(file)));
    };

    // -------------------- SUBMIT --------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); setLoading(true);
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
            if (contentType?.includes("application/json")) postData = await postRes.json();
            else throw new Error("Non-JSON response from AddPost");

            if (!postRes.ok) throw new Error(postData.message || "Post creation failed");
            const postId = postData.postId;

            if (images.length > 0) {
                const formData = new FormData();
                images.forEach((img) => formData.append("images", img));
                formData.append("postId", postId);

                const imgRes = await fetch(`${BASE_URL}/api/posts/upload`, {
                    method: "POST", credentials: "include", body: formData
                });

                const imgContentType = imgRes.headers.get("content-type");
                let imgData;
                if (imgContentType?.includes("application/json")) imgData = await imgRes.json();
                else throw new Error("Image upload failed");

                if (!imgRes.ok) throw new Error(imgData.message || "Image upload failed");
            }

            navigate("/");
        } catch (err) {
            console.error("Submit error:", err);
            setError(err.message || "An unexpected error occurred");
        } finally { setLoading(false); }
    };

    // -------------------- QUILL MODULE --------------------
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    // -------------------- RENDER --------------------
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
                                {/* TITLE */}
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

                                {/* CONTENT */}
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <label className="form-label mb-0">Content</label>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${isListening ? 'btn-danger' : 'btn-outline-primary'}`}
                                            onClick={toggleSpeechRecognition}
                                            disabled={!speechSupported}
                                        >
                                            <i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'} me-1`}></i>
                                            {isListening ? 'Stop Recording' : 'Start Recording'}
                                        </button>
                                    </div>

                                    <ReactQuill
                                        ref={quillRef}
                                        theme="snow"
                                        value={content}
                                        onChange={handleContentChange}
                                        modules={modules}
                                        placeholder="Write your blog content here..."
                                        style={{ height: "200px", marginBottom: "50px" }}
                                    />

                                    {/* SPELL CORRECTIONS */}
                                    {/* SPELL & GRAMMAR CORRECTIONS */}
                                    {(Object.keys(corrections).length > 0 || grammarSuggestion) && (
                                        <div className="mt-3">
                                            {/* SPELL CORRECTIONS */}
                                            {Object.keys(corrections).length > 0 && (
                                                <div className="alert alert-warning mt-3">
                                                    <strong>Spelling Suggestions:</strong>
                                                    <ul className="mb-0">
                                                        {Object.entries(corrections).map(([word, correction], idx) => (
                                                            <li key={idx}>
                                                                <code>{word}</code> →{" "}
                                                                <strong
                                                                    className="text-primary"
                                                                    style={{ cursor: "pointer", textDecoration: "underline" }}
                                                                    onClick={() => {
                                                                        const quill = quillRef.current?.getEditor();
                                                                        if (!quill) return;

                                                                        const plainText = quill.getText();
                                                                        const index = plainText.indexOf(word);
                                                                        if (index === -1) return;

                                                                        quill.deleteText(index, word.length, 'user');
                                                                        quill.insertText(index, correction, 'user');
                                                                        setContent(quill.root.innerHTML);

                                                                        const newCorrections = { ...corrections };
                                                                        delete newCorrections[word];
                                                                        setCorrections(newCorrections);
                                                                    }}
                                                                    title="Click to apply correction"
                                                                >
                                                                    {correction}
                                                                </strong>{" "}
                                                                <i
                                                                    className="fas fa-times text-muted ms-2"
                                                                    style={{ cursor: "pointer" }}
                                                                    onClick={() => {
                                                                        const newCorrections = { ...corrections };
                                                                        delete newCorrections[word];
                                                                        setCorrections(newCorrections);
                                                                    }}
                                                                    title="Ignore suggestion"
                                                                ></i>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}


                                            {/* GRAMMAR SUGGESTION */}
                                            {grammarSuggestion && (
                                                <div className="alert alert-info mt-2">
                                                    <strong>Grammar Suggestion:</strong>
                                                    <p className="mb-1">{grammarSuggestion}</p>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => {
                                                            const quill = quillRef.current?.getEditor();
                                                            if (!quill) return;

                                                            // Get current plain text
                                                            const plainText = quill.getText().trimEnd();

                                                            // Split into sentences
                                                            const sentences = plainText.match(/[^.!?]*[.!?]?/g)?.filter(Boolean) || [];
                                                            if (sentences.length === 0) return;

                                                            // Find the last sentence and its start index
                                                            const lastSentence = sentences[sentences.length - 1];
                                                            const startIndex = plainText.lastIndexOf(lastSentence);

                                                            // Replace last sentence with grammar suggestion
                                                            quill.deleteText(startIndex, lastSentence.length, 'user');
                                                            quill.insertText(startIndex, grammarSuggestion, 'user');

                                                            // Keep cursor at end of inserted text
                                                            quill.setSelection(startIndex + grammarSuggestion.length);

                                                            // Update state and clear suggestion
                                                            setContent(quill.root.innerHTML);
                                                            setGrammarSuggestion("");
                                                        }}
                                                    >
                                                        Apply
                                                    </button>

                                                </div>
                                            )}
                                        </div>
                                    )}


                                    <small className="text-muted d-block mt-2">
                                        Word Count: {getPlainText(content).trim().split(/\s+/).filter(Boolean).length} / 500 &nbsp; | &nbsp;
                                        Letters: {getPlainText(content).replace(/\s/g, "").length}
                                    </small>
                                </div>

                                {/* TAGS */}
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

                                {/* IMAGES */}
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

                                {/* SUBMIT */}
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
