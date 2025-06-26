const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  user: { type: mongoose.ObjectId, ref: 'User', required: true },
  publishedAt: { type: Date, default: Date.now },
  isPublished: { type: Boolean, default: true },
  images: [String]
});
module.exports = mongoose.model('Post', postSchema);
