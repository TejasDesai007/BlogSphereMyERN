const express = require("express");
const db = require('../config/db');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();


// Check follow status
router.get("/check", (req, res) => {
  const { followerId, followedId } = req.query;
  const sql = "SELECT * FROM follows WHERE userId = ? AND followedId = ?";
  console.log(followerId);
  console.log(followedId);
  db.query(sql, [followerId, followedId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    console.log({ isFollowing: results.length > 0 });
    res.json({ isFollowing: results.length > 0 });
  });
});

// Follow
router.post("/", (req, res) => {
  const { followerId, followedId } = req.body;
  const sql = "INSERT INTO follows (userId, followedId) VALUES (?, ?)";
  db.query(sql, [followerId, followedId], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") return res.status(200).json({ message: "Already following" });
      return res.status(500).json({ error: err });
    }
    res.status(201).json({ message: "Followed successfully" });
  });
});

// Unfollow
router.delete("/", (req, res) => {
  const { followerId, followedId } = req.body;
  const sql = "DELETE FROM follows WHERE userId = ? AND followedId = ?";
  db.query(sql, [followerId, followedId], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Unfollowed successfully" });
  });
});

module.exports = router;
