import React from "react";
import { FaComment } from "react-icons/fa";

const CommentsModal = ({
  comments,
  commentsLoading,
  commentsHasMore,
  commentsEndRef,
  isModalOpen,
  newComment,
  setNewComment,
  onClose,
  onSubmitComment,
  CommentsLoadingSpinner,
}) => {
  return (
    <div
      className="modal fade"
      id="commentsModal"
      tabIndex="-1"
      aria-labelledby="commentsModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-scrollable max-w-lg mx-auto">
        <div className="modal-content rounded-2xl border-0 shadow-2xl overflow-hidden">
          <div className="modal-header bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <h5 className="modal-title text-xl font-bold">
              {comments.length > 0 ? `Comments (${comments.length})` : "Comments"}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              data-bs-dismiss="modal"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body p-6">
            {comments.length === 0 && !commentsLoading ? (
              <div className="text-center py-8">
                <FaComment className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  No comments yet. Be the first to comment!
                </p>
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
                          {comment.user?.username?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div>
                          <strong className="text-gray-800">
                            {comment.user?.username || "Anonymous"}
                          </strong>
                          <p className="text-gray-500 text-sm">
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {comment.content}
                    </p>
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
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!isModalOpen}
              ></textarea>
              <button
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onSubmitComment}
                disabled={newComment.trim() === "" || !isModalOpen}
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;


