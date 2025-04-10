const express = require("express");
const db = require('../config/db');
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Set up uploads folder
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `${timestamp}${ext}`);
    }
});
const upload = multer({ storage });

// POST /AddPost
router.post("/AddPost", (req, res) => {
    const { title, content, userId } = req.body;

    if (!title || !content || !userId) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }

    const query = "INSERT INTO Posts (Title, Content, UserID, PublishedAt, IsPublished) VALUES (?, ?, ?, NOW(), 1)";
    db.query(query, [title, content, userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error!" });
        } else {
            const postId = result.insertId;
            return res.status(200).json({ message: "Successfully posted!", postId });
        }
    });
});

// POST /upload
router.post("/upload", upload.array("images", 5), async (req, res) => {
    const { postId } = req.body;

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
    }

    if (!postId) {
        return res.status(400).json({ error: "postId is required" });
    }

    try {
        const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

        for (const imagePath of imageUrls) {
            await db.promise().query("INSERT INTO PostImages (PostID, ImagePath) VALUES (?, ?)", [postId, imagePath]);
        }

        return res.status(200).json({ message: "Images uploaded", imageUrls });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to save images" });
    }

});

// server.js or routes/post.js
router.get("/FetchPost", (req, res) => {
    const query = `
       SELECT 
    p.PostID, p.Title, p.Content, p.PublishedAt, p.UserID, u.UserName,
    pi.ImagePath
    FROM Posts p
    JOIN Users u ON p.UserID = u.UserID
    LEFT JOIN PostImages pi ON p.PostID = pi.PostID
    ORDER BY p.PostID DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error!" });
        }

        // Group posts with multiple images
        const posts = {};
        results.forEach(row => {
            const postID = row.PostID;
            if (!posts[postID]) {
                posts[postID] = {
                    postID,
                    title: row.Title,
                    userId: row.UserID,
                    content: row.Content,
                    publishedAt: row.PublishedAt,
                    userName: row.UserName,
                    images: []
                };
            }

            if (row.ImagePath) {
                posts[postID].images.push(row.ImagePath);
            }
        });

        res.status(200).json(Object.values(posts));
    });
});

router.get("/FetchPost/:postID", (req, res) => {
    const query = `SELECT 
    p.PostID, p.Title, p.Content, p.PublishedAt, p.UserID, u.UserName,
    pi.ImagePath
    FROM Posts p
    JOIN Users u ON p.UserID = u.UserID
    LEFT JOIN PostImages pi ON p.PostID = pi.PostID
    WHERE p.PostID = ?
    ORDER BY p.PostID DESC`;

    db.query(query, [req.params.postID], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error!" });
        }
        const post = {};
        results.forEach(row => {
            const postID = row.PostID;
            if (!post[postID]) {
                post[postID] = {
                    postID,
                    title: row.Title,
                    userId: row.UserID,
                    content: row.Content,
                    publishedAt: row.PublishedAt,
                    userName: row.UserName,
                    images: []
                };
            }

            if (row.ImagePath) {
                post[postID].images.push(row.ImagePath);
            }
        });
        res.status(200).json(Object.values(posts));
    });
});

module.exports = router;
