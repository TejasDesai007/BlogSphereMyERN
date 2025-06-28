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

router.post("/", async (req, res) => {
  const { followerId, followedId } = req.body;

  console.log("Received follow request:", { followerId, followedId });

  if (!mongoose.Types.ObjectId.isValid(followerId) || !mongoose.Types.ObjectId.isValid(followedId)) {
    return res.status(400).json({ message: "Invalid user IDs" });
  }

  if (followerId === followedId) {
    return res.status(400).json({ message: "You cannot follow yourself." });
  }

  try {
    const exists = await Follow.findOne({ follower: followerId, followed: followedId });
    if (exists) return res.status(200).json({ message: "Already following" });

    // ✅ Check if both users exist
    const [followerExists, followedExists] = await Promise.all([
      User.findById(followerId),
      User.findById(followedId)
    ]);

    if (!followerExists || !followedExists) {
      return res.status(404).json({ message: "One or both users not found" });
    }

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
