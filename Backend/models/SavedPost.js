const mongoose = require('mongoose');
const savedSchema = new mongoose.Schema({
  post: { type: mongoose.ObjectId, ref: 'Post', required: true },
  user: { type: mongoose.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
savedSchema.index({ post: 1, user: 1 }, { unique: true });
module.exports = mongoose.model('SavedPost', savedSchema);
