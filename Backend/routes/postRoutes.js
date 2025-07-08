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

// 📄 Get All Posts with Pagination (NEW - Instagram-style)
router.get('/FetchPost', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // Start with 6 posts per page
    const skip = (page - 1) * limit;
    
    // Get search query if provided
    const searchQuery = req.query.search || '';
    
    // Build search filter
    let searchFilter = {};
    if (searchQuery) {
      searchFilter = {
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { content: { $regex: searchQuery, $options: 'i' } }
        ]
      };
    }

    // Get posts with pagination
    const posts = await Post.find(searchFilter)
      .populate('user', 'username')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination info
    const totalPosts = await Post.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalPosts / limit);
    const hasNextPage = page < totalPages;

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage,
        limit
      }
    });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

// 📄 Get Initial Data (likes, comments, user-specific data)
router.get('/InitialData/:userID?', async (req, res) => {
  try {
    const userID = req.params.userID;
    
    // Get likes count and comments count
    const [likesAgg, commentsAgg] = await Promise.all([
      Like.aggregate([
        { $group: { _id: '$post', count: { $sum: 1 } } }
      ]),
      Comment.aggregate([
        { $group: { _id: '$post', count: { $sum: 1 } } }
      ])
    ]);

    const likesCount = {};
    const commentsCount = {};
    
    likesAgg.forEach(item => likesCount[item._id] = item.count);
    commentsAgg.forEach(item => commentsCount[item._id] = item.count);

    let userSpecificData = {};
    
    if (userID) {
      // Get user's liked posts and saved posts
      const [userLikes, userSaved] = await Promise.all([
        Like.find({ user: userID }).select('post -_id'),
        SavedPost.find({ user: userID }).select('post -_id')
      ]);

      userSpecificData = {
        likedPosts: userLikes.map(l => l.post),
        savedPosts: userSaved.map(s => s.post)
      };
    }

    res.json({
      likesCount,
      commentsCount,
      ...userSpecificData
    });
  } catch (err) {
    console.error('Error fetching initial data:', err);
    res.status(500).json({ message: 'Failed to fetch initial data' });
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
    
    // Return updated count
    const count = await Like.countDocuments({ post: postID });
    res.json({ message: 'Post liked', count });
  } catch (err) {
    if (err.code === 11000) {
      const count = await Like.countDocuments({ post: req.body.postID });
      return res.status(200).json({ message: 'Already liked', count });
    }
    console.error(err);
    res.sendStatus(500);
  }
});

router.post('/unlike', async (req, res) => {
  const { postID, userID } = req.body;
  await Like.deleteOne({ post: postID, user: userID });
  
  // Return updated count
  const count = await Like.countDocuments({ post: postID });
  res.json({ message: 'Post unliked', count });
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
  const result = {}; 
  agg.forEach(a => result[a._id] = a.count);
  res.json(result);
});

router.post('/comments', async (req, res) => {
  const { postID, userID, comment } = req.body;
  if (!postID || !userID || !comment?.trim()) return res.status(400).json({ message: 'Missing fields' });
  
  const c = await Comment.create({ post: postID, user: userID, content: comment });
  
  // Return updated count
  const count = await Comment.countDocuments({ post: postID });
  res.json({ message: 'Comment added', commentId: c._id, count });
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