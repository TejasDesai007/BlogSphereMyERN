const express = require("express");
const router = express.Router();
const Follow = require("../models/Follow");
const User = require("../models/User");
const mongoose = require("mongoose");

// ✅ Check follow status
router.get("/check", async (req, res) => {
  const { followerId, followedId } = req.query;

  try {
    const isFollowing = await Follow.exists({
      follower: followerId,
      followed: followedId
    });

    res.json({ isFollowing: Boolean(isFollowing) });
  } catch (err) {
    console.error("Error checking follow status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Follow a user
router.post("/", async (req, res) => {
  const { followerId, followedId } = req.body;

  if (followerId === followedId) {
    return res.status(400).json({ message: "You cannot follow yourself." });
  }

  try {
    const exists = await Follow.findOne({ follower: followerId, followed: followedId });
    if (exists) return res.status(200).json({ message: "Already following" });

    const follow = new Follow({ follower: followerId, followed: followedId });
    await follow.save();

    res.status(201).json({ message: "Followed successfully" });
  } catch (err) {
    console.error("Error following:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Unfollow a user
router.delete("/", async (req, res) => {
  const { followerId, followedId } = req.body;

  try {
    await Follow.findOneAndDelete({ follower: followerId, followed: followedId });
    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    console.error("Error unfollowing:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Get list of followed users by userId
router.get("/getList/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const follows = await Follow.find({ follower: userId }).populate("followed", "username email createdAt");

    const followedUsers = follows.map(f => f.followed);

    res.json(followedUsers);
  } catch (err) {
    console.error("Error fetching follow list:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
