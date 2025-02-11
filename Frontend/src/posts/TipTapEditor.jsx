import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Heading from "@tiptap/extension-heading";
import Bold from "@tiptap/extension-bold";
import Underline from "@tiptap/extension-underline";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Blockquote from "@tiptap/extension-blockquote";
import TextStyle from "@tiptap/extension-text-style";
import Paragraph from "@tiptap/extension-paragraph";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";

// ✅ Custom Resizable & Alignable Image Extension
const ResizableImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            src: { default: null },
            width: { default: "300px" },
            height: { default: "auto" },
            align: { default: "center" }, // Default center alignment
        };
    },
    renderHTML({ HTMLAttributes }) {
        let styles = `width: ${HTMLAttributes.width}; height: ${HTMLAttributes.height}; display: flex;`;

        if (HTMLAttributes.align === "center") {
            styles += "justify-content: center; align-items: center; margin: auto;";
        } else if (HTMLAttributes.align === "right") {
            styles += "justify-content: flex-end;";
        } else {
            styles += "justify-content: flex-start;";
        }

        return ["div", { style: styles }, ["img", mergeAttributes(HTMLAttributes)]];
    },
});



const TiptapEditor = () => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Bold,
            Italic,
            Underline,
            Strike,
            Heading.configure({ levels: [1, 2, 3] }),
            Paragraph,
            TextStyle,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Blockquote,
            BulletList,
            OrderedList,
            ListItem,
            Color,
            Highlight,
            ResizableImage,
        ],
        content: "<p>Start typing here...</p>",
    });

    if (!editor) {
        return null;
    }

    // ✅ Image Upload Function (Fixed)
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const imageUrl = reader.result;
                editor.chain().focus().setImage({ src: imageUrl, width: "300px", align: "left" }).run();
            };
            reader.readAsDataURL(file);
        }
    };

    // ✅ Image Resizing Function
    const handleResize = () => {
        const newWidth = prompt("Enter new width (e.g., 400px, 50%):");
        if (newWidth) {
            editor.chain().focus().updateAttributes("image", { width: newWidth }).run();
        }
    };

    // ✅ Image Alignment Function
    const handleImageAlignment = (alignment) => {
        editor.chain().focus().updateAttributes("image", { align: alignment }).run();
    };



    return (
        <div className="editor-container">
            {/* Toolbar */}
            <div className="toolbar">
                <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "active" : ""}>
                    <b>B</b>
                </button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "active" : ""}>
                    <i>I</i>
                </button>
                <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? "active" : ""}>
                    <u>U</u>
                </button>
                <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive("strike") ? "active" : ""}>
                    <s>S</s>
                </button>

                {/* Alignment */}
                <button onClick={() => editor.chain().focus().setTextAlign("left").run()} className={editor.isActive({ textAlign: "left" }) ? "active" : ""}>
                    Left
                </button>
                <button onClick={() => editor.chain().focus().setTextAlign("center").run()} className={editor.isActive({ textAlign: "center" }) ? "active" : ""}>
                    Center
                </button>
                <button onClick={() => editor.chain().focus().setTextAlign("right").run()} className={editor.isActive({ textAlign: "right" }) ? "active" : ""}>
                    Right
                </button>
                <button onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={editor.isActive({ textAlign: "justify" }) ? "active" : ""}>
                    Justify
                </button>

                {/* Headings */}
                <select onChange={(e) => editor.chain().focus().toggleHeading({ level: parseInt(e.target.value) }).run()}>
                    <option value="0">Normal</option>
                    <option value="1">Heading 1</option>
                    <option value="2">Heading 2</option>
                    <option value="3">Heading 3</option>
                </select>

                {/* Font Size */}
                <select onChange={(e) => editor.chain().focus().setMark("textStyle", { style: `font-size: ${e.target.value}` }).run()}>
                    <option value="16px">16px</option>
                    <option value="20px">20px</option>
                    <option value="24px">24px</option>
                    <option value="30px">30px</option>
                </select>

                {/* Text Color */}
                <input type="color" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />

                {/* Background Color */}
                <input type="color" onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} />

                {/* Lists */}
                <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? "active" : ""}>
                    • List
                </button>
                <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? "active" : ""}>
                    1. List
                </button>

                {/* Blockquote */}
                <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive("blockquote") ? "active" : ""}>
                    “ Quote
                </button>

                {/* Undo/Redo */}
                <button onClick={() => editor.chain().focus().undo().run()}>↩ Undo</button>
                <button onClick={() => editor.chain().focus().redo().run()}>↪ Redo</button>

                {/* Image Upload */}
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} id="imageUpload" />
                <label htmlFor="imageUpload" className="upload-btn">🖼 Upload Image</label>

                {/* Resize Image Button */}
                <button onClick={handleResize}>🔧 Resize Image</button>

                {/* Image Alignment Buttons */}
                <button onClick={() => handleImageAlignment("left")}>⬅ Align Left</button>
                <button onClick={() => handleImageAlignment("center")}>🔲 Center</button>
                <button onClick={() => handleImageAlignment("right")}>➡ Align Right</button>


            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} className="editor-content" />
        </div>
    );
};

export default TiptapEditor;
