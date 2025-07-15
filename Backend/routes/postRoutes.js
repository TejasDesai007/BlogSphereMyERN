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
  const { title, content, userId, tags } = req.body;
  if (!title || !content || !userId) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const post = await Post.create({
      title,
      content,
      user: userId,
      tags: tags || [], // Save tags if provided, default to empty array
    });

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

// Enhanced backend route with comprehensive search and filtering
router.get('/FetchPost', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    // Get search and filter parameters
    const searchQuery = req.query.search || '';
    const sortBy = req.query.sortBy || 'publishedAt'; // publishedAt, title, likes, comments
    const sortOrder = req.query.sortOrder || 'desc'; // asc, desc
    const dateFilter = req.query.dateFilter || ''; // today, week, month, year
    const tagFilter = req.query.tagFilter || ''; // specific tag
    const authorFilter = req.query.authorFilter || ''; // specific author

    // Build search filter
    let searchFilter = {};

    if (searchQuery) {
      // Create comprehensive search across multiple fields
      const searchRegex = { $regex: searchQuery, $options: 'i' };

      searchFilter = {
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { tags: { $in: [searchRegex] } }, // Search in tags array
          { 'user.username': searchRegex } // Will be handled in aggregation
        ]
      };
    }

    // Add tag filter
    if (tagFilter) {
      searchFilter.tags = { $in: [new RegExp(tagFilter, 'i')] };
    }

    // Add author filter
    let authorFilterId = null;
    if (authorFilter) {
      // Find user by username
      const User = require('../models/User'); // Adjust path as needed
      const author = await User.findOne({
        username: { $regex: authorFilter, $options: 'i' }
      });
      if (author) {
        authorFilterId = author._id;
      }
    }

    // Add date filter
    if (dateFilter) {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      if (startDate) {
        searchFilter.publishedAt = { $gte: startDate };
      }
    }

    // Add author filter to search
    if (authorFilterId) {
      searchFilter.user = authorFilterId;
    }

    // Build sort object
    let sortObj = {};
    if (sortBy === 'likes' || sortBy === 'comments') {
      // For likes and comments, we'll handle sorting in aggregation
      sortObj = { publishedAt: sortOrder === 'asc' ? 1 : -1 };
    } else {
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Use aggregation pipeline for complex search with username
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      }
    ];

    // Add search stage if needed
    if (searchQuery) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: searchQuery, $options: 'i' } },
            { content: { $regex: searchQuery, $options: 'i' } },
            { tags: { $in: [new RegExp(searchQuery, 'i')] } },
            { 'user.username': { $regex: searchQuery, $options: 'i' } }
          ]
        }
      });
    }

    // Add other filters
    const matchStages = [];
    if (tagFilter) {
      matchStages.push({ tags: { $in: [new RegExp(tagFilter, 'i')] } });
    }
    if (authorFilterId) {
      matchStages.push({ user: authorFilterId });
    }
    if (dateFilter && searchFilter.publishedAt) {
      matchStages.push({ publishedAt: searchFilter.publishedAt });
    }

    if (matchStages.length > 0) {
      pipeline.push({
        $match: { $and: matchStages }
      });
    }

    // Add lookup for likes and comments count if sorting by them
    if (sortBy === 'likes' || sortBy === 'comments') {
      if (sortBy === 'likes') {
        pipeline.push({
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'post',
            as: 'likesArray'
          }
        });
        pipeline.push({
          $addFields: {
            likesCount: { $size: '$likesArray' }
          }
        });
      }

      if (sortBy === 'comments') {
        pipeline.push({
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'post',
            as: 'commentsArray'
          }
        });
        pipeline.push({
          $addFields: {
            commentsCount: { $size: '$commentsArray' }
          }
        });
      }
    }

    // Add sorting
    if (sortBy === 'likes') {
      pipeline.push({ $sort: { likesCount: sortOrder === 'asc' ? 1 : -1 } });
    } else if (sortBy === 'comments') {
      pipeline.push({ $sort: { commentsCount: sortOrder === 'asc' ? 1 : -1 } });
    } else {
      pipeline.push({ $sort: sortObj });
    }

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Project only needed fields
    pipeline.push({
      $project: {
        title: 1,
        content: 1,
        images: 1,
        tags: 1,
        publishedAt: 1,
        user: {
          _id: 1,
          username: 1
        },
        likesCount: 1,
        commentsCount: 1
      }
    });

    // Execute aggregation
    const posts = await Post.aggregate(pipeline);

    // Get total count for pagination (run similar pipeline without skip/limit)
    const countPipeline = pipeline.slice(0, -3); // Remove skip, limit, and project
    countPipeline.push({ $count: "total" });
    const totalResult = await Post.aggregate(countPipeline);
    const totalPosts = totalResult[0]?.total || 0;

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
      },
      appliedFilters: {
        search: searchQuery,
        sortBy,
        sortOrder,
        dateFilter,
        tagFilter,
        authorFilter
      }
    });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

// 📄 Get Initial Data (likes, comments, user-specific data)
// 📄 Get Initial Data (likes, comments, user-specific data) - FIXED
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

    likesAgg.forEach(item => {
      if (item._id) { // Ensure _id exists
        likesCount[item._id.toString()] = item.count;
      }
    });

    commentsAgg.forEach(item => {
      if (item._id) { // Ensure _id exists
        commentsCount[item._id.toString()] = item.count;
      }
    });

    let userSpecificData = {
      likedPosts: [],
      savedPosts: []
    };

    if (userID) {
      // Get user's liked posts and saved posts
      const [userLikes, userSaved] = await Promise.all([
        Like.find({ user: userID }).select('post -_id').lean(),
        SavedPost.find({ user: userID }).select('post -_id').lean()
      ]);

      userSpecificData = {
        likedPosts: userLikes.map(l => l.post.toString()),
        savedPosts: userSaved.map(s => s.post.toString())
      };
    }

    res.json({
      success: true,
      likesCount,
      commentsCount,
      ...userSpecificData
    });
  } catch (err) {
    console.error('Error fetching initial data:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch initial data',
      likesCount: {},
      commentsCount: {},
      likedPosts: [],
      savedPosts: []
    });
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

router.get('/user-saved/:userId', async (req, res) => {
  try {
    const savedPosts = await SavedPost.find({ user: req.params.userId })
      .populate('post')
      .sort({ createdAt: -1 })
      .lean();

    // Extract the post objects from the saved posts
    const posts = savedPosts.map(sp => sp.post);

    res.json(posts);
  } catch (err) {
    console.error('Error fetching saved posts:', err);
    res.status(500).json({ message: 'Failed to fetch saved posts' });
  }
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
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .sort({ publishedAt: -1 })
      .lean();

    res.json(posts);
  } catch (err) {
    console.error('Error fetching user posts:', err);
    res.status(500).json({ message: 'Failed to fetch user posts' });
  }
});

// Additional route to get popular tags for filter suggestions
router.get('/popular-tags', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const pipeline = [
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { tag: '$_id', count: 1, _id: 0 } }
    ];

    const popularTags = await Post.aggregate(pipeline);
    res.json(popularTags);
  } catch (err) {
    console.error('Error fetching popular tags:', err);
    res.status(500).json({ message: 'Failed to fetch popular tags' });
  }
});

// Route to get user suggestions for author filter
router.get('/users-suggestions', async (req, res) => {
  try {
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 10;
    
    const User = require('../models/User'); // Adjust path as needed
    
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    })
    .select('username _id')
    .limit(limit)
    .lean();

    res.json(users);
  } catch (err) {
    console.error('Error fetching user suggestions:', err);
    res.status(500).json({ message: 'Failed to fetch user suggestions' });
  }
});
module.exports = router;