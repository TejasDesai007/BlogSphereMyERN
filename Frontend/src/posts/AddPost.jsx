import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapEditor from "./TipTapEditor";


const AddPost = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [userId, setUserId] = useState(null);
    const [image, setImage] = useState(null);

    const editor = useEditor({
        extensions: [StarterKit],
        content: "",
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML());
        },
    });

    useEffect(() => {
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser?.id) {
                setUserId(parsedUser.id);
            } else {
                navigate("/login");
            }
        } else {
            navigate("/login");
        }
    }, []);

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            console.error("User ID not found. Cannot submit post.");
            return;
        }

        const postContent = editor.getHTML(); // Get content from Tiptap
        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", postContent);
        formData.append("userId", userId);
        if (image) {
            formData.append("image", image);
        }

        try {
            const response = await fetch("http://localhost:8082/api/posts", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            if (response.ok) {
                console.log("Post added successfully:", result);
                navigate("/");
            } else {
                console.error("Failed to add post:", result);
            }
        } catch (error) {
            console.error("Error submitting post:", error);
        }
    };

    return (
        <div className="container mt-5">
            <h2>Add New Post</h2>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div className="mb-3">
                    <label htmlFor="title" className="form-label">Post Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        className="form-control"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Post Content</label>
                    <TiptapEditor editor={editor} className="border p-2" />
                </div>
                
                <button type="submit" className="btn btn-success mt-3">
                    Add Post
                </button>
            </form>
        </div>
    );
};

export default AddPost;
