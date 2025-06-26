const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // Assuming this path
const router = express.Router();

// Register User
router.post("/register", async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    try {
        const existingUser = await User.findOne({
            $or: [{ email: email }, { username: username }]
        });

        if (existingUser) {
            return res.status(400).json({ message: "Email or username already exists!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            passwordHash: hashedPassword
        });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Server error!" });
    }
});

// Login User
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    try {
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        const isMatch = await bcrypt.compare(password.trim(), user.passwordHash.trim());

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password!" });
        }

        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email
        };

        res.status(200).json({
            message: "Login successful!",
            user: req.session.user
        });
    } catch (error) {
        console.error("Login error:", error);
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

// Get user profile
router.get("/profile/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).lean();

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Replace this with actual post count from posts collection
        const postCount = await Post.countDocuments({ userId: user._id }); // You must define Post model for this

        res.status(200).json({
            ...user,
            postCount
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Server error!" });
    }
});

module.exports = router;
