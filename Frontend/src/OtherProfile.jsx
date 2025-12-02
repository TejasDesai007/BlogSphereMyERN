import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import he from "he";
import {
  FaUserCircle,
  FaEnvelope,
  FaCalendarAlt,
  FaFileAlt,
  FaBlog,
  FaUserCheck,
  FaUserPlus,
  FaUsers,
  FaEye,
  FaArrowLeft,
  FaSpinner,
  FaExternalLinkAlt,
  FaHeart,
  FaComment,
  FaShare
} from "react-icons/fa";

const OtherProfile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPosts, setShowPosts] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followingList, setFollowingList] = useState([]);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const navigate = useNavigate();
  const { userID } = useParams();

  const sessionuser = JSON.parse(sessionStorage.getItem("user"));
  const sessionuserID = sessionuser ? sessionuser.id : null;

  useEffect(() => {
    if (!userID) {
      navigate('/');
      return;
    }
    if (userID === sessionuserID) {
      navigate('/profile');
      return;
    }

    // Fetch profile data
    axios.get(`${BASE_URL}/api/users/profile/${userID}`)
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Profile fetch error:", err);
        setError("Failed to load profile.");
        setLoading(false);
      });

    // Check follow status
    axios.get(`${BASE_URL}/api/follows/check`, {
      params: { followerId: sessionuserID, followedId: userID }
    })
      .then(res => {
        setIsFollowing(res.data.isFollowing);
      })
      .catch(err => {
        console.error("Follow status check failed:", err);
      });
  }, [userID, navigate, sessionuserID]);

  const fetchFollowingList = async () => {
    setFollowingLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/follows/getList/${userID}`);
      setFollowingList(res.data);
      setActiveTab("following");
    } catch (err) {
      console.error("Error fetching following list:", err);
    }
    setFollowingLoading(false);
  };

  const fetchUserPosts = async () => {
    if (activeTab === "posts" && posts.length > 0) {
      setActiveTab("none");
      return;
    }

    setPostsLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/posts/user/${userID}`);
      setPosts(res.data);
      setActiveTab("posts");
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
    setPostsLoading(false);
  };

  const toggleFollow = async () => {
    setFollowLoading(true);
    try {
      if (!isFollowing) {
        await axios.post(`${BASE_URL}/api/follows`, {
          followerId: sessionuserID,
          followedId: userID
        });
      } else {
        await axios.delete(`${BASE_URL}/api/follows`, {
          data: {
            followerId: sessionuserID,
            followedId: userID
          }
        });
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("Follow/unfollow error:", err);
    }
    setFollowLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-24 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold text-gray-700">Loading profile...</h3>
        <p className="text-gray-500 mt-2">Fetching user information</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-24 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-red-500 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUserCircle className="text-4xl" />
          </div>
          <h3 className="text-xl font-bold mb-2">Error Loading Profile</h3>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all duration-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-24">
      {/* Back Button */}
      <div className="fixed top-24 left-6 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <FaArrowLeft className="text-blue-600" />
          <span className="font-medium text-gray-700">Back</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
          {/* Profile Header Background */}
          <div className="h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-2xl opacity-50"></div>
                <div className="relative w-32 h-32 bg-white rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                  <FaUserCircle className="text-8xl text-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-20 pb-8 px-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{user.Name}</h1>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              {user.bio || "Blog enthusiast sharing thoughts and ideas"}
            </p>

            {/* Stats */}
            <div className="flex justify-center space-x-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{user.postCount || 0}</div>
                <div className="text-gray-500 text-sm">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-gray-500 text-sm">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">0</div>
                <div className="text-gray-500 text-sm">Following</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
              <div className="flex items-center space-x-2 text-gray-600">
                <FaEnvelope className="text-blue-500" />
                <span>{user.Email}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <FaCalendarAlt className="text-green-500" />
                <span>Joined {user.CreatedAt ? new Date(user.CreatedAt).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={fetchUserPosts}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${activeTab === "posts"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                    : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border border-blue-200"
                  }`}
              >
                <FaBlog />
                <span>View Posts</span>
              </button>

              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${isFollowing
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl"
                  }`}
              >
                {followLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : isFollowing ? (
                  <>
                    <FaUserCheck />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <FaUserPlus />
                    <span>Follow</span>
                  </>
                )}
              </button>

              <button
                onClick={fetchFollowingList}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <FaUsers />
                <span>Following</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {activeTab !== "none" && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Tab Header */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => activeTab === "posts" ? setActiveTab("none") : fetchUserPosts()}
                  className={`flex-1 py-4 text-center font-semibold transition-colors ${activeTab === "posts"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <FaBlog className="inline mr-2" />
                  Posts ({posts.length})
                </button>
                <button
                  onClick={() => activeTab === "following" ? setActiveTab("none") : fetchFollowingList()}
                  className={`flex-1 py-4 text-center font-semibold transition-colors ${activeTab === "following"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <FaUsers className="inline mr-2" />
                  Following ({followingList.length})
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Posts Tab */}
              {activeTab === "posts" && (
                <div>
                  {postsLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading posts...</p>
                      </div>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaBlog className="text-3xl text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Posts Yet</h3>
                      <p className="text-gray-500">This user hasn't created any posts yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {posts.map(post => (
                        <div
                          key={post.PostID}
                          className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
                        >
                          <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2">
                              {post.Title}
                            </h3>
                            <div
                              className="text-gray-600 mb-4 text-sm line-clamp-3"
                              dangerouslySetInnerHTML={{
                                __html: he.decode(post.Content.substring(0, 150)) + "..."
                              }}
                            />
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                              <span className="flex items-center">
                                <FaCalendarAlt className="mr-1" />
                                {new Date(post.PublishedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => navigate(`/ViewPost?postID=${post.PostID}`)}
                                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold hover:shadow-lg transition-all duration-300"
                              >
                                <FaEye />
                                <span>Read More</span>
                              </button>
                              <div className="flex space-x-3">
                                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                  <FaHeart />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                                  <FaComment />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-green-500 transition-colors">
                                  <FaShare />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Following Tab */}
              {activeTab === "following" && (
                <div>
                  {followingLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading following list...</p>
                      </div>
                    </div>
                  ) : followingList.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUsers className="text-3xl text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Not Following Anyone</h3>
                      <p className="text-gray-500">This user isn't following anyone yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {followingList.map(f => (
                        <div
                          key={f.UserID}
                          className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 p-6 text-center"
                        >
                          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaUserCircle className="text-4xl text-white" />
                          </div>
                          <h4 className="text-lg font-bold text-gray-800 mb-2">{f.Username}</h4>
                          <p className="text-gray-600 text-sm mb-4 truncate">
                            <FaEnvelope className="inline mr-2 text-blue-500" />
                            {f.Email}
                          </p>
                          <button
                            onClick={() => navigate(`/other-profile/${f.UserID}`)}
                            className="w-full px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 rounded-full text-sm font-semibold hover:from-blue-100 hover:to-purple-100 transition-all duration-300"
                          >
                            View Profile
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OtherProfile;