const express = require("express");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const router = express.Router();

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const { cursor, limit = 20 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.json({ notifications: [], hasMore: false });
  }

  const query = { user: userId };

  // 👇 fetch older notifications
  if (cursor) {
    query.createdAt = { $lt: new Date(cursor) };
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  const hasMore = notifications.length === Number(limit);

  res.json({
    notifications,
    hasMore,
  });
});
// Mark all notifications as read for a user
router.post("/mark-read", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    console.error("Error marking notifications as read:", err);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
});

module.exports = router;


