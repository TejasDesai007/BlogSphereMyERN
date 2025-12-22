import React from "react";
import { Link } from "react-router-dom";
import {
  FaPlus,
  FaHeart,
  FaRegHeart,
  FaComment,
  FaBookmark,
  FaRegBookmark,
  FaUserPlus,
  FaUserMinus,
  FaSpinner,
} from "react-icons/fa";

const PostCard = ({
  post,
  user,
  likes,
  userLikedPosts,
  commentCounts,
  savedPosts,
  followMap,
  loading,
  onCardClick,
  onSave,
  onLike,
  onFollow,
  onUnfollow,
  onCommentsClick,
  onTagClick,
}) => {
  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-100"
      onClick={onCardClick}
    >
      {/* Image Carousel */}
      {post.images && post.images.length > 0 && (
        <div className="relative h-56 overflow-hidden">
          <div id={`carousel${post._id}`} className="carousel slide h-full">
            <div className="carousel-inner h-full">
              {post.images.map((imagePath, index) => (
                <div
                  className={`carousel-item h-full ${
                    index === 0 ? "active" : ""
                  }`}
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
              onSave(post._id);
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
                  onTagClick(tag);
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
                  ? onUnfollow(post.user._id)
                  : onFollow(post.user._id);
              }}
              disabled={loading[post.user._id]}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                followMap[post.user._id]
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
              onLike(post._id);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
              userLikedPosts[post._id]
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
              onCommentsClick(post._id);
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 transform hover:scale-105"
          >
            <FaComment />
            <span className="font-semibold">
              {commentCounts[post._id] || 0}
            </span>
            <span>Comments</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;


