const express = require('express');
const { v2: cloudinary } = require('cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const Post = require('../models/Post');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const SavedPost = require('../models/SavedPost');

const router = express.Router();

// ✅ Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// ✅ Multer + Cloudinary Storage Setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'posts',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  }
});
const upload = multer({ storage });

// ➕ Add Post
router.post('/AddPost', async (req, res) => {
  const { title, content, userId } = req.body;
  if (!title || !content || !userId) return res.status(400).json({ message: 'Missing fields' });
   
  try {
    const post = await Post.create({ title, content, user: userId });
    
    res.json({ message: 'Successfully posted!', postId: post._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'DB error' });
  }
});

// 🖼️ Upload Images to Cloudinary
router.post('/upload', upload.array('images', 5), async (req, res) => {
  const { postId } = req.body;
  if (!postId || !req.files?.length) return res.status(400).json({ message: 'Missing post or images' });

  try {
    const imageUrls = req.files.map(file => file.path); // file.path = Cloudinary URL
    await Post.findByIdAndUpdate(postId, { $push: { images: { $each: imageUrls } } });
    res.json({ message: 'Images uploaded', imageUrls });
  } catch (err) {
    console.error('Error uploading images:', err);
    res.status(500).json({ message: 'Failed to upload images' });
  }
});

// 📄 Get All Posts
router.get('/FetchPost', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username')
      .sort({ publishedAt: -1 })
      .lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

// 📍 Get Single Post
router.get('/FetchPost/:postID', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postID)
      .populate('user', 'username email')
      .lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching post' });
  }
});

// 👍 Like / 👎 Unlike
router.post('/like', async (req, res) => {
  const { postID, userID } = req.body;
  try {
    await Like.create({ post: postID, user: userID });
    res.sendStatus(200);
  } catch (err) {
    if (err.code === 11000) return res.status(200).json({ message: 'Already liked' });
    console.error(err);
    res.sendStatus(500);
  }
});

router.post('/unlike', async (req, res) => {
  await Like.deleteOne({ post: req.body.postID, user: req.body.userID });
  res.sendStatus(200);
});

router.get('/user-liked/:userID', async (req, res) => {
  const likes = await Like.find({ user: req.params.userID }).select('post -_id');
  res.json(likes.map(l => l.post));
});

router.get('/likes-count', async (req, res) => {
  const agg = await Like.aggregate([
    { $group: { _id: '$post', count: { $sum: 1 } } }
  ]);
  const result = {};
  agg.forEach(a => result[a._id] = a.count);
  res.json(result);
});

// 💬 Comments
router.get('/comments/:postID', async (req, res) => {
  const comments = await Comment.find({ post: req.params.postID })
    .populate('user', 'username')
    .sort({ createdAt: -1 })
    .lean();
  res.json(comments);
});

router.get('/comments-count', async (req, res) => {
  const agg = await Comment.aggregate([
    { $group: { _id: '$post', count: { $sum: 1 } } }
  ]);
  const result = {}; agg.forEach(a => result[a._id] = a.count);
  res.json(result);
});

router.post('/comments', async (req, res) => {
  const { postID, userID, comment } = req.body;
  if (!postID || !userID || !comment?.trim()) return res.status(400).json({ message: 'Missing fields' });
  const c = await Comment.create({ post: postID, user: userID, content: comment });
  res.json({ message: 'Comment added', commentId: c._id });
});

// 🔖 Save / Unsave
router.post('/savepost', async (req, res) => {
  try {
    await SavedPost.create({ post: req.body.postID, user: req.body.userID });
    res.json({ message: 'Post saved' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Already saved' });
    console.error(err);
    res.status(500).json({ message: 'Error saving post' });
  }
});

router.post('/unsave-post', async (req, res) => {
  await SavedPost.deleteOne({ post: req.body.postID, user: req.body.userID });
  res.json({ message: 'Post unsaved' });
});

router.get('/user-saved/:userID', async (req, res) => {
  const saved = await SavedPost.find({ user: req.params.userID }).select('post -_id');
  res.json(saved.map(s => s.post));
});

// 🗑️ Delete Post + Cloudinary Images
router.delete('/DeletePost/:postID', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postID);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    for (const url of post.images) {
      const publicId = url.split('/').pop().split('.')[0]; // crude extraction
      await cloudinary.uploader.destroy(`posts/${publicId}`, { invalidate: true });
    }

    await post.deleteOne();
    res.json({ message: 'Post and images deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ message: 'Error deleting post' });
  }
});

module.exports = router;
