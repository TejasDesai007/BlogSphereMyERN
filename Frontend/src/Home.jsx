import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaPlus, FaHeart, FaRegHeart, FaComment, FaBookmark, FaRegBookmark, FaUserPlus, FaUserMinus, FaSearch, FaTimes, FaSpinner, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
//import ScrapedBlogs from './ScrappedBlogs';
import * as bootstrap from 'bootstrap';

window.bootstrap = bootstrap;

export default function Homepage() {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [likes, setLikes] = useState({});
  const [userLikedPosts, setUserLikedPosts] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [showCommentsPostID, setShowCommentsPostID] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [savedPosts, setSavedPosts] = useState({});
  const [followMap, setFollowMap] = useState({});
  const [loading, setLoading] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [modalInstance, setModalInstance] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSource, setActiveSource] = useState("blogsphere");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsHasMore, setCommentsHasMore] = useState(true);
  const [commentsPage, setCommentsPage] = useState(1);
  const commentsEndRef = useRef(null);

  const isMountedRef = useRef(true);
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const loadingRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const userID = user ? user.id : null;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setDebouncedSearchQuery(searchQuery);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const fetchPosts = useCallback(async (page = 1, search = "", reset = false) => {
    if (!isMountedRef.current) return;

    if (page === 1) {
      setIsInitialLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await axios.get(`${BASE_URL}/api/posts/FetchPost`, {
        params: {
          page,
          limit: 6,
          search: search.trim()
        }
      });

      if (!isMountedRef.current) return;

      const { posts: newPosts, pagination } = response.data;

      if (page === 1 || reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(post => post._id));
          const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post._id));
          return [...prev, ...uniqueNewPosts];
        });
      }

      setHasNextPage(pagination.hasNextPage);
      setCurrentPage(pagination.currentPage);

    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      if (isMountedRef.current) {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [BASE_URL]);

  const fetchInitialData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const response = await axios.get(`${BASE_URL}/api/posts/InitialData${userID ? `/${userID}` : ''}`);

      if (!isMountedRef.current) return;

      const { likesCount, commentsCount, likedPosts = [], savedPosts: userSaved = [] } = response.data;

      // Set likes count
      setLikes(likesCount || {});
      setCommentCounts(commentsCount || {});

      // Set user liked posts
      const likedMap = {};
      likedPosts.forEach(postID => likedMap[postID] = true);
      setUserLikedPosts(likedMap);

      // Set user saved posts
      const savedMap = {};
      userSaved.forEach(postID => savedMap[postID] = true);
      setSavedPosts(savedMap);

    } catch (err) {
      console.error("Error fetching initial data:", err);
    }
  }, [BASE_URL, userID]);

  const fetchFollowStatuses = useCallback(async (postsList) => {
    if (!isMountedRef.current || !userID || !postsList.length) return;

    try {
      const uniqueAuthorIDs = [...new Set(postsList.map(post => post.user._id))].filter(id => id !== userID);
      const followStatuses = {};

      for (let authorId of uniqueAuthorIDs) {
        if (!isMountedRef.current) return;

        try {
          const res = await axios.get(`${BASE_URL}/api/follows/check?followerId=${userID}&followedId=${authorId}`);
          followStatuses[authorId] = res.data.isFollowing;
        } catch (err) {
          console.error(`Error checking follow status for user ${authorId}:`, err);
          followStatuses[authorId] = false;
        }
      }

      if (isMountedRef.current) {
        setFollowMap(prev => ({ ...prev, ...followStatuses }));
      }
    } catch (err) {
      console.error("Error fetching follow statuses:", err);
    }
  }, [BASE_URL, userID]);

  // Initialize component state
  useEffect(() => {
    setPosts([]);
    setCurrentPage(1);
    setHasNextPage(true);
    setIsInitialLoading(true);
    setIsLoadingMore(false);
    setLikes({});
    setUserLikedPosts({});
    setCommentCounts({});
    setSavedPosts({});
    setFollowMap({});
    isMountedRef.current = true;
  }, []);

  // Fetch posts when debounced search query changes
  useEffect(() => {
    if (!isMountedRef.current) return;

    const initializeData = async () => {
      await Promise.all([
        fetchPosts(1, debouncedSearchQuery, true),
        fetchInitialData()
      ]);
    };

    initializeData();
  }, [debouncedSearchQuery, fetchPosts, fetchInitialData]);

  // Fetch follow statuses when posts change
  useEffect(() => {
    if (posts.length > 0) {
      fetchFollowStatuses(posts);
    }
  }, [posts, fetchFollowStatuses]);

  // Infinite scroll observer for posts
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasNextPage && !isLoadingMore && !isInitialLoading && isMountedRef.current) {
          fetchPosts(currentPage + 1, debouncedSearchQuery, false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current);
      }
    };
  }, [hasNextPage, isLoadingMore, isInitialLoading, currentPage, debouncedSearchQuery, fetchPosts]);

  // Handle card click - navigate to ViewPost
  const handleCardClick = (postID, event) => {
    if (event.target.closest('button') || event.target.closest('a') || event.target.closest('.carousel-control-prev') || event.target.closest('.carousel-control-next')) {
      return;
    }
    navigate(`/ViewPost?postID=${postID}`);
  };

  const handleFollow = async (followedId) => {
    if (!userID) {
      navigate('/login');
      return;
    }

    if (loading[followedId]) return;

    setLoading(prev => ({ ...prev, [followedId]: true }));

    try {
      await axios.post(`${BASE_URL}/api/follows`, {
        followerId: userID,
        followedId,
      });

      if (isMountedRef.current) {
        setFollowMap(prev => ({ ...prev, [followedId]: true }));
      }
    } catch (err) {
      console.error("Follow failed:", err);
      alert("Failed to follow user. Please try again.");
    } finally {
      if (isMountedRef.current) {
        setLoading(prev => ({ ...prev, [followedId]: false }));
      }
    }
  };

  const handleUnfollow = async (followedId) => {
    if (!userID) {
      navigate('/login');
      return;
    }

    if (loading[followedId]) return;

    setLoading(prev => ({ ...prev, [followedId]: true }));

    try {
      await axios.delete(`${BASE_URL}/api/follow`, {
        data: {
          followerId: userID,
          followedId,
        },
      });

      if (isMountedRef.current) {
        setFollowMap(prev => ({ ...prev, [followedId]: false }));
      }
    } catch (err) {
      console.error("Unfollow failed:", err);
      alert("Failed to unfollow user. Please try again.");
    } finally {
      if (isMountedRef.current) {
        setLoading(prev => ({ ...prev, [followedId]: false }));
      }
    }
  };

  const handleSave = async (postID) => {
    if (!userID) {
      navigate('/login');
      return;
    }

    try {
      const hasSaved = savedPosts[postID];

      setSavedPosts(prev => ({
        ...prev,
        [postID]: !hasSaved
      }));

      if (hasSaved) {
        await axios.post(`${BASE_URL}/api/posts/unsave-post`, { postID, userID });
      } else {
        await axios.post(`${BASE_URL}/api/posts/savepost`, { postID, userID });
      }

    } catch (err) {
      console.error("Error saving/unsaving post:", err);
      if (isMountedRef.current) {
        setSavedPosts(prev => ({
          ...prev,
          [postID]: !prev[postID]
        }));
      }
    }
  };

  const handleLike = async (postID) => {
    if (!userID) {
      navigate('/login');
      return;
    }

    try {
      const hasLiked = userLikedPosts[postID];
      const currentLikeCount = likes[postID] || 0;

      // Optimistic update
      setUserLikedPosts(prev => ({
        ...prev,
        [postID]: !hasLiked
      }));
      setLikes(prev => ({
        ...prev,
        [postID]: hasLiked ? currentLikeCount - 1 : currentLikeCount + 1
      }));

      // Make API call
      let response;
      if (hasLiked) {
        response = await axios.post(`${BASE_URL}/api/posts/unlike`, { postID, userID });
      } else {
        response = await axios.post(`${BASE_URL}/api/posts/like`, { postID, userID });
      }

      // Update with actual count from server
      if (isMountedRef.current) {
        setLikes(prev => ({ ...prev, [postID]: response.data.count }));
      }

    } catch (err) {
      console.error("Error toggling like:", err);
      // Revert optimistic update on error
      if (isMountedRef.current) {
        const hasLiked = userLikedPosts[postID];
        const currentLikeCount = likes[postID] || 0;
        setUserLikedPosts(prev => ({
          ...prev,
          [postID]: hasLiked
        }));
        setLikes(prev => ({
          ...prev,
          [postID]: hasLiked ? currentLikeCount + 1 : currentLikeCount - 1
        }));
      }
    }
  };

  // Modal setup with infinite scroll for comments
  useEffect(() => {
    const modalElement = document.getElementById('commentsModal');
    if (modalElement) {
      const instance = new bootstrap.Modal(modalElement);
      setModalInstance(instance);

      const handleShow = () => setIsModalOpen(true);
      const handleHide = () => {
        setIsModalOpen(false);
        setComments([]);
        setShowCommentsPostID(null);
        setNewComment("");
        setCommentsPage(1);
        setCommentsHasMore(true);
      };

      modalElement.addEventListener('shown.bs.modal', handleShow);
      modalElement.addEventListener('hidden.bs.modal', handleHide);

      return () => {
        modalElement.removeEventListener('shown.bs.modal', handleShow);
        modalElement.removeEventListener('hidden.bs.modal', handleHide);
        instance.dispose();
      };
    }
  }, []);

  // Infinite scroll for comments
  useEffect(() => {
    if (!isModalOpen || !showCommentsPostID || commentsLoading || !commentsHasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !commentsLoading && commentsHasMore) {
          fetchComments(showCommentsPostID, commentsPage + 1);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (commentsEndRef.current) {
      observer.observe(commentsEndRef.current);
    }

    return () => {
      if (commentsEndRef.current) {
        observer.unobserve(commentsEndRef.current);
      }
    };
  }, [isModalOpen, showCommentsPostID, commentsPage, commentsLoading, commentsHasMore]);

  const fetchComments = async (postID, page = 1) => {
    if (!userID || commentsLoading) {
      return;
    }

    setCommentsLoading(true);

    try {
      const res = await axios.get(`${BASE_URL}/api/posts/comments/${postID}`, {
        params: {
          page,
          limit: 10
        }
      });

      if (!isMountedRef.current) return;

      const { comments: newComments, hasMore } = res.data;

      setComments(prev => page === 1 ? newComments : [...prev, ...newComments]);
      setCommentsHasMore(hasMore);
      setCommentsPage(page);
      if (page === 1) {
        setShowCommentsPostID(postID);
        modalInstance?.show();
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
      if (page === 1) {
        alert("Failed to load comments. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setCommentsLoading(false);
      }
    }
  };

  const handleCommentSubmit = async () => {
    if (!userID || !showCommentsPostID || newComment.trim() === "") return;

    try {
      const response = await axios.post(`${BASE_URL}/api/posts/comments`, {
        postID: showCommentsPostID,
        userID,
        comment: newComment.trim()
      });

      if (isMountedRef.current) {
        setNewComment("");
        setCommentCounts(prev => ({
          ...prev,
          [showCommentsPostID]: (prev[showCommentsPostID] || 0) + 1
        }));
        // Refresh comments from first page
        fetchComments(showCommentsPostID, 1);
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Failed to post comment. Please try again.");
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleQuickSearch = (query) => {
    setSearchQuery(query);
  };

  const LoadingSpinner = () => (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h5 className="text-gray-600 text-lg font-medium">Loading posts...</h5>
        <p className="text-gray-500 text-sm mt-1">Please wait while we fetch the latest content</p>
      </div>
    </div>
  );

  const LoadMoreSpinner = () => (
    <div className="flex justify-center my-8">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const CommentsLoadingSpinner = () => (
    <div className="flex justify-center my-4">
      <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            BlogSphere
          </h1>
          <p className="text-gray-600 text-lg">Discover, share, and connect with amazing content</p>
        </div>

        {/* Search Bar */}
        <div className="mb-10 max-w-2xl mx-auto">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full pl-12 pr-12 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-lg"
              placeholder="Search posts by title, tags, or username..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              disabled={isInitialLoading}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>



        {activeSource === "blogsphere" ? (
          <>
            {/* Original posts feed */}
            {isInitialLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-8">
                {/* Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-100"
                      onClick={(e) => handleCardClick(post._id, e)}
                    >
                      {/* Image Carousel */}
                      {/* Image Carousel */}
                      {post.images && post.images.length > 0 && (
                        <div className="relative h-56 overflow-hidden">
                          <div id={`carousel${post._id}`} className="carousel slide h-full">
                            <div className="carousel-inner h-full">
                              {post.images.map((imagePath, index) => (
                                <div
                                  className={`carousel-item h-full ${index === 0 ? "active" : ""}`}
                                  key={index}
                                >
                                  <img
                                    src={imagePath}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    alt="Post"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Carousel Controls - Fixed positioning */}
                          {post.images.length > 1 && (
                            <>
                              <button
                                className="carousel-control-prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors z-10"
                                type="button"
                                data-bs-target={`#carousel${post._id}`}
                                data-bs-slide="prev"
                              >
                                <span className="carousel-control-prev-icon w-4 h-4"></span>
                              </button>
                              <button
                                className="carousel-control-next absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors z-10"
                                type="button"
                                data-bs-target={`#carousel${post._id}`}
                                data-bs-slide="next"
                              >
                                <span className="carousel-control-next-icon w-4 h-4"></span>
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Card Content */}
                      <div className="p-6">
                        {/* Title with Save Button */}
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold text-gray-800 line-clamp-2 flex-1 mr-4">
                            {post.title}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSave(post._id);
                            }}
                            className="p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full hover:from-blue-100 hover:to-purple-100 transition-all duration-300 shadow-sm hover:shadow-md"
                            title={savedPosts[post._id] ? "Unsave post" : "Save post"}
                          >
                            {savedPosts[post._id] ? (
                              <FaBookmark className="text-blue-600 text-lg" />
                            ) : (
                              <FaRegBookmark className="text-gray-600 text-lg" />
                            )}
                          </button>
                        </div>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag, index) => (
                              <span
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickSearch(tag);
                                }}
                                className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 rounded-full text-sm font-medium hover:from-blue-100 hover:to-purple-100 transition-colors cursor-pointer border border-blue-100"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Author and Date */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500">By</span>
                              <Link
                                to={`/profile/${post.user._id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-gray-800 font-semibold hover:text-blue-600 transition-colors"
                              >
                                {post.user.username}
                              </Link>
                            </div>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-500">
                              {new Date(post.publishedAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Follow Button */}
                          {user && user.id !== post.user._id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                followMap[post.user._id]
                                  ? handleUnfollow(post.user._id)
                                  : handleFollow(post.user._id);
                              }}
                              disabled={loading[post.user._id]}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${followMap[post.user._id]
                                ? "bg-gradient-to-r from-red-50 to-pink-50 text-red-600 border border-red-200 hover:from-red-100 hover:to-pink-100"
                                : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border border-blue-200 hover:from-blue-100 hover:to-purple-100"
                                }`}
                            >
                              {loading[post.user._id] ? (
                                <FaSpinner className="animate-spin inline mr-2" />
                              ) : followMap[post.user._id] ? (
                                <FaUserMinus className="inline mr-2" />
                              ) : (
                                <FaUserPlus className="inline mr-2" />
                              )}
                              {followMap[post.user._id] ? "Following" : "Follow"}
                            </button>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                          {/* Like Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(post._id);
                            }}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${userLikedPosts[post._id]
                              ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg transform hover:scale-105"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                          >
                            {userLikedPosts[post._id] ? (
                              <FaHeart className="text-white" />
                            ) : (
                              <FaRegHeart className="text-red-500" />
                            )}
                            <span className="font-semibold">{likes[post._id] || 0}</span>
                            
                          </button>

                          {/* Comments Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchComments(post._id, 1);
                            }}
                            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 transform hover:scale-105"
                          >
                            <FaComment />
                            <span className="font-semibold">{commentCounts[post._id] || 0}</span>
                            <span>Comments</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Indicator */}
                {hasNextPage && (
                  <div ref={loadingRef} className="mt-8">
                    {isLoadingMore && <LoadMoreSpinner />}
                  </div>
                )}

                {/* No Posts Message */}
                {posts.length === 0 && !isInitialLoading && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-8 text-center shadow-lg">
                    <FaExclamationCircle className="text-5xl text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {debouncedSearchQuery ? "No Results Found" : "No Posts Available"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {debouncedSearchQuery
                        ? `We couldn't find any posts matching "${debouncedSearchQuery}"`
                        : "Be the first to create a post and share your thoughts!"}
                    </p>
                    <button
                      onClick={() => debouncedSearchQuery && setSearchQuery("")}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      {debouncedSearchQuery ? "Clear Search" : "Create Post"}
                    </button>
                  </div>
                )}

                {/* End of Posts Message */}
                {posts.length > 0 && !hasNextPage && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 text-center shadow-lg">
                    <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">You've reached the end!</h3>
                    <p className="text-gray-600">You've seen all available posts. Check back later for more content!</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <ScrapedBlogs source={activeSource} />
        )}

        {/* Comments Modal */}
        <div className="modal fade" id="commentsModal" tabIndex="-1" aria-labelledby="commentsModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-scrollable max-w-lg mx-auto">
            <div className="modal-content rounded-2xl border-0 shadow-2xl overflow-hidden">
              <div className="modal-header bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <h5 className="modal-title text-xl font-bold">
                  {comments.length > 0 ? `Comments (${comments.length})` : 'Comments'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={() => modalInstance?.hide()}
                ></button>
              </div>
              <div className="modal-body p-6">
                {comments.length === 0 && !commentsLoading ? (
                  <div className="text-center py-8">
                    <FaComment className="text-5xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {comments.map((comment, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-xl p-4 hover:bg-white transition-colors duration-300 border border-gray-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                              {comment.user?.username?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div>
                              <strong className="text-gray-800">{comment.user?.username || 'Anonymous'}</strong>
                              <p className="text-gray-500 text-sm">
                                {new Date(comment.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                      </div>
                    ))}
                    {commentsLoading && <CommentsLoadingSpinner />}
                    {!commentsHasMore && comments.length > 0 && (
                      <div className="text-center text-gray-500 py-4 border-t border-gray-200">
                        No more comments to load
                      </div>
                    )}
                    <div ref={commentsEndRef} className="h-4" />
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <textarea
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 resize-none"
                    rows="4"
                    placeholder="Add a thoughtful comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.value)}
                    disabled={!isModalOpen}
                  ></textarea>
                  <button
                    className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleCommentSubmit}
                    disabled={newComment.trim() === "" || !isModalOpen}
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Add Post Button */}
        <button
          onClick={() => navigate('/add-post')}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 z-50"
          title="Create new post"
        >
          <FaPlus className="text-2xl" />
        </button>
      </div>
    </div>
  );
}