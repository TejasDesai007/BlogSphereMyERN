const express = require("express");
const router = express.Router();
const Follow = require("../models/Follow");
const User = require("../models/User");
const Notification = require("../models/Notification");
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

  if (
    !mongoose.Types.ObjectId.isValid(followerId) ||
    !mongoose.Types.ObjectId.isValid(followedId)
  ) {
    return res.status(400).json({ message: "Invalid user IDs" });
  }

  if (followerId === followedId) {
    return res.status(400).json({ message: "You cannot follow yourself." });
  }

  try {
    const exists = await Follow.findOne({ follower: followerId, followed: followedId });
    if (exists) {
      return res.status(200).json({ message: "Already following" });
    }

    // Save follow
    await Follow.create({ follower: followerId, followed: followedId });

    // Fetch actor username
    const actor = await User.findById(followerId).select("username");

    // Save notification
    const notification = await Notification.create({
      user: followedId,
      actor: followerId,
      type: "follow",
      message: `${actor.username} started following you.`,
    });

    // 🔔 REAL-TIME SOCKET PUSH
    const io = req.app.get("io");
    io.to(followedId.toString()).emit("notification", {
      _id: notification._id,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
    });

    return res.status(201).json({ message: "Followed successfully" });
  } catch (err) {
    console.error("Error following user:", err);
    return res.status(500).json({ error: "Internal server error" });
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
