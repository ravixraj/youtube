import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8787/api/v1",
  withCredentials: true,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("accessToken="))
          ?.split("=")[1]
      : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Types (derived from server schema) ───────────────────────────────

export interface User {
  id: string;
  fullname: string;
  username: string;
  email: string;
  avatar?: string;
  coverImage?: string;
  refreshToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelUser extends User {
  subscribersCount: number;
  channelsSubscribedToCount: number;
  isSubscribed: boolean;
}

export interface Video {
  id: string;
  userId: string;
  videoFile: string;
  thumbnail?: string;
  title: string;
  description?: string;
  duration: number;
  viewCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    username: string;
    fullname: string;
    avatar?: string;
  };
}

export interface Tweet {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    fullname: string;
    avatar?: string;
  };
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  tweetId?: string;
  videoId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    fullname: string;
    avatar?: string;
  };
  replies?: Comment[];
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  videoId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  videos?: {
    id: string;
    title: string;
    thumbnail?: string;
    duration: number;
  }[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
}

// ─── Auth API ─────────────────────────────────────────────────────────

const loginApi = (data: { username: string; password: string }) =>
  apiClient.post<ApiResponse<{ user: User }>>("/users/login", data);

const registerApi = (data: {
  username: string;
  fullname: string;
  email: string;
  password: string;
}) => apiClient.post<ApiResponse<{ user: User }>>("/users/register", data);

const refreshTokenApi = () =>
  apiClient.post<ApiResponse<null>>("/users/refresh-token");

const logoutApi = () => apiClient.post<ApiResponse<null>>("/users/logout");

const changePasswordApi = (data: {
  currentPassword: string;
  newPassword: string;
}) => apiClient.post<ApiResponse<null>>("/users/change-password", data);

export const authAPI = {
  login: loginApi,
  register: registerApi,
  refreshToken: refreshTokenApi,
  logout: logoutApi,
  changePassword: changePasswordApi,
};

// ─── User API ─────────────────────────────────────────────────────────

const getCurrentUserApi = () =>
  apiClient.get<ApiResponse<{ user: User }>>("/users/current-user");

const getChannelApi = (username: string) =>
  apiClient.get<ApiResponse<{ user: ChannelUser }>>(`/users/c/${username}`);

const updateAccountApi = (data: {
  fullname?: string;
  email?: string;
  username?: string;
}) =>
  apiClient.patch<ApiResponse<{ user: User }>>("/users/update-account", data);

const uploadAvatarApi = (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return apiClient.patch<ApiResponse<{ user: User }>>(
    "/users/avatar",
    formData,
  );
};

const uploadCoverImageApi = (file: File) => {
  const formData = new FormData();
  formData.append("coverImage", file);
  return apiClient.patch<ApiResponse<{ user: User }>>(
    "/users/cover-image",
    formData,
  );
};

const getHistoryApi = () =>
  apiClient.get<ApiResponse<{ history: unknown[] }>>("/users/history");

export const userAPI = {
  getCurrentUser: getCurrentUserApi,
  getChannel: getChannelApi,
  updateAccount: updateAccountApi,
  uploadAvatar: uploadAvatarApi,
  uploadCoverImage: uploadCoverImageApi,
  getHistory: getHistoryApi,
};

// ─── Video API ────────────────────────────────────────────────────────

const searchVideosApi = (params?: {
  page?: number;
  limit?: number;
  query?: string;
  sortBy?: string;
  sortOrder?: string;
  userId?: string;
}) => apiClient.get<ApiResponse<{ videos: Video[] }>>("/videos", { params });

const getVideoByIdApi = (videoId: string) =>
  apiClient.get<ApiResponse<Video>>(`/videos/${videoId}`);

const createVideoApi = (data: FormData) =>
  apiClient.post<ApiResponse<Video>>("/videos", data);

const updateVideoApi = (
  videoId: string,
  data: { title?: string; description?: string },
) => apiClient.patch<ApiResponse<Video>>(`/videos/${videoId}`, data);

const deleteVideoApi = (videoId: string) =>
  apiClient.delete<ApiResponse<null>>(`/videos/${videoId}`);

const togglePublishApi = (videoId: string) =>
  apiClient.patch<ApiResponse<Video>>(`/videos/toggle/publish/${videoId}`);

export const videoAPI = {
  search: searchVideosApi,
  getById: getVideoByIdApi,
  create: createVideoApi,
  update: updateVideoApi,
  delete: deleteVideoApi,
  togglePublish: togglePublishApi,
};

// ─── Comment API ──────────────────────────────────────────────────────

const getCommentsByVideoApi = (videoId: string) =>
  apiClient.get<ApiResponse<Comment[]>>(`/comments/${videoId}`);

const createCommentApi = (data: {
  videoId: string;
  content: string;
  tweetId?: string;
}) => apiClient.post<ApiResponse<Comment>>("/comments", data);

const updateCommentApi = (commentId: string, data: { content: string }) =>
  apiClient.patch<ApiResponse<Comment>>(`/comments/${commentId}`, data);

const deleteCommentApi = (commentId: string) =>
  apiClient.delete<ApiResponse<null>>(`/comments/${commentId}`);

export const commentAPI = {
  getByVideo: getCommentsByVideoApi,
  create: createCommentApi,
  update: updateCommentApi,
  delete: deleteCommentApi,
};

// ─── Playlist API ─────────────────────────────────────────────────────

const createPlaylistApi = (data: { name: string; description?: string }) =>
  apiClient.post<ApiResponse<Playlist>>("/playlists", data);

const updatePlaylistApi = (
  playlistId: string,
  data: { name?: string; description?: string },
) => apiClient.patch<ApiResponse<Playlist>>(`/playlists/${playlistId}`, data);

const deletePlaylistApi = (playlistId: string) =>
  apiClient.delete<ApiResponse<null>>(`/playlists/${playlistId}`);

const getPlaylistByIdApi = (playlistId: string) =>
  apiClient.get<ApiResponse<Playlist>>(`/playlists/${playlistId}`);

const getPlaylistsByUserApi = (userId: string) =>
  apiClient.get<ApiResponse<Playlist[]>>(`/playlists/user/${userId}`);

const addVideoToPlaylistApi = (playlistId: string, videoId: string) =>
  apiClient.patch<ApiResponse<Playlist>>(
    `/playlists/add/${videoId}/${playlistId}`,
  );

const removeVideoFromPlaylistApi = (playlistId: string, videoId: string) =>
  apiClient.patch<ApiResponse<Playlist>>(
    `/playlists/remove/${videoId}/${playlistId}`,
  );

export const playlistAPI = {
  create: createPlaylistApi,
  update: updatePlaylistApi,
  delete: deletePlaylistApi,
  getById: getPlaylistByIdApi,
  getByUser: getPlaylistsByUserApi,
  addVideo: addVideoToPlaylistApi,
  removeVideo: removeVideoFromPlaylistApi,
};

// ─── Tweet API ────────────────────────────────────────────────────────

const createTweetApi = (data: { content: string }) =>
  apiClient.post<ApiResponse<Tweet>>("/tweets", data);

const updateTweetApi = (tweetId: string, data: { content: string }) =>
  apiClient.patch<ApiResponse<Tweet>>(`/tweets/${tweetId}`, data);

const deleteTweetApi = (tweetId: string) =>
  apiClient.delete<ApiResponse<null>>(`/tweets/${tweetId}`);

const getTweetsByUserApi = (userId: string) =>
  apiClient.get<ApiResponse<Tweet[]>>(`/tweets/user/${userId}`);

export const tweetAPI = {
  create: createTweetApi,
  update: updateTweetApi,
  delete: deleteTweetApi,
  getByUser: getTweetsByUserApi,
};

// ─── Like API ─────────────────────────────────────────────────────────

const toggleVideoLikeApi = (videoId: string) =>
  apiClient.post<ApiResponse<{ isLiked: boolean }>>(
    `/likes/toggle/v/${videoId}`,
  );

const toggleCommentLikeApi = (commentId: string) =>
  apiClient.post<ApiResponse<{ isLiked: boolean }>>(
    `/likes/toggle/c/${commentId}`,
  );

const toggleTweetLikeApi = (tweetId: string) =>
  apiClient.post<ApiResponse<{ isLiked: boolean }>>(
    `/likes/toggle/t/${tweetId}`,
  );

const getLikedVideosApi = () =>
  apiClient.get<ApiResponse<Video[]>>("/likes/videos");

export const likeAPI = {
  toggleVideo: toggleVideoLikeApi,
  toggleComment: toggleCommentLikeApi,
  toggleTweet: toggleTweetLikeApi,
  getLikedVideos: getLikedVideosApi,
};

// ─── Subscription API ─────────────────────────────────────────────────

const toggleSubscriptionApi = (channelId: string) =>
  apiClient.post<ApiResponse<{ isSubscribed: boolean }>>(
    `/subscriptions/c/${channelId}`,
  );

const getSubscribersApi = (channelId: string) =>
  apiClient.get<ApiResponse<unknown[]>>(`/subscriptions/u/${channelId}`);

const getSubscribedChannelsApi = () =>
  apiClient.get<ApiResponse<unknown[]>>("/subscriptions/channels");

export const subscriptionAPI = {
  toggle: toggleSubscriptionApi,
  getSubscribers: getSubscribersApi,
  getSubscribedChannels: getSubscribedChannelsApi,
};

// ─── Dashboard API ────────────────────────────────────────────────────

const getDashboardStatsApi = () =>
  apiClient.get<
    ApiResponse<{
      channelStats: {
        totalVideos: number;
        totalViews: number;
        subscriberCount: number;
      };
    }>
  >("/dashboard/stats");

const getDashboardVideosApi = () =>
  apiClient.get<ApiResponse<{ videos: Video[] }>>("/dashboard/videos");

export const dashboardAPI = {
  getStats: getDashboardStatsApi,
  getVideos: getDashboardVideosApi,
};
