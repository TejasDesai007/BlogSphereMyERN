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

// POST /api/posts/like
router.post("/like", async (req, res) => {
    const { postID, userID } = req.body;

    try {
        // Avoid duplicate likes
        await db.promise().query("INSERT IGNORE INTO Likes (PostID, UserID) VALUES (?, ?)", [postID, userID]);
        res.sendStatus(200);
    } catch (err) {
        console.error("Error adding like:", err);
        res.sendStatus(500);
    }
});
router.post("/unlike", async (req, res) => {
    const { postID, userID } = req.body;

    try {
        await db.promise().query("DELETE FROM Likes WHERE PostID = ? AND UserID = ?", [postID, userID]);
        res.sendStatus(200);
    } catch (err) {
        console.error("Error removing like:", err);
        res.sendStatus(500);
    }
});
router.get("/user-liked/:userID", async (req, res) => {
    const userID = req.params.userID;

    try {
        const [rows] = await db.promise().query("SELECT PostID FROM Likes WHERE UserID = ?", [userID]);
        const likedPostIDs = rows.map(row => row.PostID);
        res.json(likedPostIDs);
    } catch (err) {
        console.error("Error fetching user's liked posts:", err);
        res.sendStatus(500);
    }
});


// GET /api/posts/likes-count
router.get("/likes-count", async (req, res) => {
    const [rows] = await db.promise().query("SELECT PostID, COUNT(*) AS count FROM Likes GROUP BY PostID");
    const likeMap = {};
    rows.forEach(row => {
        likeMap[row.PostID] = row.count;
    });
    // console.log("hitted");
    res.json(likeMap);
});

router.get("/user/:userId", async (req, res) => {
    const { userId } = req.params;
    const query = `SELECT * FROM posts WHERE UserID = ? ORDER BY PublishedAt DESC`;

    try {
        const [rows] = await db.promise().query(query, [userId]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching user posts:", error);
        res.status(500).json({ message: "Server error while fetching posts" });
    }
});


router.delete("/DeletePost/:postID", async (req, res) => {
    const postID = req.params.postID;

    try {

        const [images] = await db.promise().query("SELECT ImagePath FROM postImages WHERE postID = ?", [postID]);


        images.forEach(img => {
            const imgPath = path.join(__dirname, "../uploads", img.ImagePath);
            if (fs.existsSync(imgPath)) {
                fs.unlink(imgPath, err => {
                    if (err) console.error("Error deleting image file:", err);
                });
            }
        });


        await db.promise().query("DELETE FROM postImages WHERE postID = ?", [postID]);


        await db.promise().query("DELETE FROM posts WHERE postID = ?", [postID]);

        res.status(200).json({ message: "Post and its images deleted successfully." });
    } catch (err) {
        console.error("Error deleting post:", err);
        res.status(500).json({ message: "Server error while deleting the post." });
    }
});

router.get("/comments/:postID", async (req, res) => {
    const postID = req.params.postID;

    try {
        const [rows] = await db.promise().query(
            "SELECT c.*, u.username FROM Comments c JOIN Users u ON c.userID = u.userID WHERE c.postID = ? ORDER BY c.CreatedAt DESC",
            [postID]
        );



        res.json(rows);
    } catch (err) {
        console.error("Error fetching comments:", err);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});


router.get("/comments-count", async (req, res) => {
    try {
        const [rows] = await db.promise().query(`
        SELECT postID, COUNT(*) AS count FROM Comments GROUP BY postID
      `);
        // console.log(rows);
        const counts = {};
        rows.forEach(row => {
            counts[row.postID] = row.count;
        });

        res.json(counts);
    } catch (err) {
        console.error("Error fetching comment counts:", err);
        res.status(500).json({ error: "Failed to fetch comment counts" });
    }
});


router.post("/comments", async (req, res) => {
    const { postID, userID, comment } = req.body;

    if (!postID || !userID || !comment || comment.trim() === "") {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        await db.promise().query(
            "INSERT INTO Comments (PostID, UserID, Content, CreatedAt) VALUES (?, ?, ?, NOW())",
            [postID, userID, comment]
        );

        res.json({ message: "Comment added successfully" });
    } catch (err) {
        console.error("Error posting comment:", err);
        res.status(500).json({ error: "Failed to post comment" });
    }
});


router.get("/user-saved/:userID", async (req, res) => {
    const { userID } = req.params;
    try {
        const [rows] = await db.promise().query(`
        SELECT sp.PostID, p.Title, p.Content, p.PublishedAt, p.UserID, u.UserName
        FROM SavedPost sp
        JOIN Posts p ON sp.PostID = p.PostID
        JOIN Users u ON p.UserID = u.UserID
        WHERE sp.UserID = ?`, [userID]);
        // console.log(rows);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching saved posts:", err);
        res.status(500).json({ error: "Failed to fetch saved posts" });
    }
});

router.post("/unsave-post", async (req, res) => {
    const { postID, userID } = req.body;
    try {
        await db.promise().query("DELETE FROM SavedPost WHERE PostID = ? AND UserID = ?", [postID, userID]);
        res.json({ message: "Post unsaved!" });
    } catch (err) {
        console.error("Error unsaving post:", err);
        res.status(500).json({ error: "Failed to unsave post" });
    }
});

router.post("/savepost", async (req, res) => {
    const { postID, userID } = req.body;

    if (!postID || !userID) {
        return res.status(400).json({ message: "Missing postID or userID" });
    }

    try {
        const query = "INSERT INTO SavedPost (PostID, UserID) VALUES (?, ?)";
        await db.promise().query(query, [postID, userID]);

        res.status(200).json({ message: "Post saved successfully" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Already saved" });
        }
        console.error("Error saving post:", error);
        res.status(500).json({ message: "Error saving post" });
    }
});




router.get("/savedposts/:userID", async (req, res) => {
    const { userID } = req.params;
    try {
        const [rows] = await db.promise().query("SELECT PostID FROM SavedPost WHERE UserID = ?", [userID]);
        const savedMap = rows.map(row => row.PostID);
        res.json(savedMap);
    } catch (err) {
        console.error("Error fetching saved post IDs:", err);
        res.status(500).json({ error: "Failed to fetch saved post IDs" });
    }
});


module.exports = router;
