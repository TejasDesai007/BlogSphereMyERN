const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../config/db");

const router = express.Router();

// Register User
router.post("/register", async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    try {
        const checkUserQuery = "SELECT * FROM users WHERE Email = ? OR Username = ?";
        db.query(checkUserQuery, [email, username], async (err, results) => {
            if (err) return res.status(500).json({ message: "Database error!" });

            if (results.length > 0) {
                return res.status(400).json({ message: "Email or username already exists!" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const insertUserQuery = "INSERT INTO users (Username, Email, PasswordHash, CreatedAt) VALUES (?, ?, ?, NOW())";
            db.query(insertUserQuery, [username, email, hashedPassword], (err) => {
                if (err) return res.status(500).json({ message: "Failed to register user" });

                return res.status(201).json({ message: "User registered successfully!" });
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error!" });
    }
});

// Login User
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    try {
        const getUserQuery = "SELECT * FROM users WHERE Username = ? OR Email = ?";
        db.query(getUserQuery, [username, username], async (err, results) => {
            if (err) return res.status(500).json({ message: "Database error!" });

            if (results.length === 0) {
                return res.status(400).json({ message: "User not found!" });
            }

            const user = results[0];

            const passwordMatch = await bcrypt.compare(password.trim(), user.PasswordHash.trim());
            
            if (!passwordMatch) {

                return res.status(401).json({ message: "Invalid password!" });
            }



            // Store user info in session
            req.session.user = { id: user.UserID, username: user.Username, email: user.Email };

            res.status(200).json({
                message: "Login successful!",
                user: req.session.user
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error!" });
    }
});

// Check if user is logged in
router.get("/me", (req, res) => {
    if (req.session.user) {
        res.status(200).json({ loggedIn: true, user: req.session.user });
    } else {
        res.status(401).json({ loggedIn: false, message: "Not logged in" });
    }
});

// Logout
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: "Logout failed!" });
        res.status(200).json({ message: "Logout successful!" });
    });
});

router.get("/profile/:userId", async (req, res) => {
    const userId1 = req.params.userId;
    const query = `SELECT * FROM users WHERE UserID = ?`;
    console.log(userId1);
    const query1 = `SELECT COUNT(*) AS postCount FROM posts WHERE UserID = ?`;
    try {
        const [rows] = await db.promise().query(query, [userId1]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = rows[0];

        const [postRows] = await db.promise().query(query1, [userId1]);
        const postCount = postRows[0].postCount;

        res.json({
            ...user,
            postCount: postCount
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Server error!" });
    }
});




module.exports = router;
