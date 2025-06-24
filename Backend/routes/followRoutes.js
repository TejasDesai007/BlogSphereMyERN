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

router.get("/getList/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await db
      .promise()
      .query(
        `SELECT u.UserID, u.Username, u.Email, u.CreatedAt
         FROM Follows f
         JOIN Users u ON u.UserID = f.FollowedID
         WHERE f.UserID = ?`,
        [userId]
      );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching follow list:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



module.exports = router;