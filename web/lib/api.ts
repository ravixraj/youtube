const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────

const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = localStorage.getItem("accessToken");
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/signin";
    throw new Error("Unauthorized");
  }

  return response;
};

// ─── Auth API ─────────────────────────────────────────────────────────

export const authAPI = {
  login: (data: { username: string; password: string }) =>
    fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json() as Promise<ApiResponse<{ user: User; tokens: AuthTokens }>>),

  register: (data: FormData) =>
    fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      body: data,
    }).then((r) => r.json() as Promise<ApiResponse<{ user: User }>>),

  refreshToken: (refreshToken: string) =>
    fetch(`${API_BASE_URL}/users/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).then((r) => r.json() as Promise<ApiResponse<{ tokens: AuthTokens }>>),

  logout: () =>
    fetchWithAuth(`${API_BASE_URL}/users/logout`, { method: "POST" }).then(
      (r) => r.json() as Promise<ApiResponse<null>>,
    ),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetchWithAuth(`${API_BASE_URL}/users/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json() as Promise<ApiResponse<null>>),
};

// ─── User API ─────────────────────────────────────────────────────────

export const userAPI = {
  getCurrentUser: () =>
    fetchWithAuth(`${API_BASE_URL}/users/current-user`).then(
      (r) => r.json() as Promise<ApiResponse<{ user: User }>>,
    ),

  getChannel: (username: string) =>
    fetch(`${API_BASE_URL}/users/c/${username}`).then(
      (r) => r.json() as Promise<ApiResponse<{ user: ChannelUser }>>,
    ),

  updateAccount: (data: {
    fullname?: string;
    email?: string;
    username?: string;
  }) =>
    fetchWithAuth(`${API_BASE_URL}/users/update-account`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json() as Promise<ApiResponse<{ user: User }>>),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return fetchWithAuth(`${API_BASE_URL}/users/avatar`, {
      method: "PATCH",
      body: formData,
    }).then((r) => r.json() as Promise<ApiResponse<{ user: User }>>);
  },

  uploadCoverImage: (file: File) => {
    const formData = new FormData();
    formData.append("coverImage", file);
    return fetchWithAuth(`${API_BASE_URL}/users/cover-image`, {
      method: "PATCH",
      body: formData,
    }).then((r) => r.json() as Promise<ApiResponse<{ user: User }>>);
  },

  getHistory: () =>
    fetchWithAuth(`${API_BASE_URL}/users/history`).then(
      (r) => r.json() as Promise<ApiResponse<{ history: unknown[] }>>,
    ),
};

// ─── Video API ────────────────────────────────────────────────────────

export const videoAPI = {
  search: (params?: {
    page?: number;
    limit?: number;
    query?: string;
    sortBy?: string;
    sortOrder?: string;
    userId?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const qs = searchParams.toString();
    return fetchWithAuth(`${API_BASE_URL}/videos${qs ? `?${qs}` : ""}`).then(
      (r) => r.json() as Promise<ApiResponse<Video[]>>,
    );
  },

  getById: (videoId: string) =>
    fetchWithAuth(`${API_BASE_URL}/videos/${videoId}`).then(
      (r) => r.json() as Promise<ApiResponse<Video>>,
    ),

  create: (data: FormData) =>
    fetchWithAuth(`${API_BASE_URL}/videos`, {
      method: "POST",
      body: data,
    }).then((r) => r.json() as Promise<ApiResponse<Video>>),

  update: (videoId: string, data: { title?: string; description?: string }) =>
    fetchWithAuth(`${API_BASE_URL}/videos/${videoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json() as Promise<ApiResponse<Video>>),

  delete: (videoId: string) =>
    fetchWithAuth(`${API_BASE_URL}/videos/${videoId}`, {
      method: "DELETE",
    }).then((r) => r.json() as Promise<ApiResponse<null>>),

  togglePublish: (videoId: string) =>
    fetchWithAuth(`${API_BASE_URL}/videos/toggle/publish/${videoId}`, {
      method: "PATCH",
    }).then((r) => r.json() as Promise<ApiResponse<Video>>),
};

// ─── Comment API ──────────────────────────────────────────────────────

export const commentAPI = {
  getByVideo: (videoId: string) =>
    fetch(`${API_BASE_URL}/comments/${videoId}`).then(
      (r) => r.json() as Promise<ApiResponse<Comment[]>>,
    ),

  create: (data: { videoId: string; content: string; tweetId?: string }) =>
    fetchWithAuth(`${API_BASE_URL}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json() as Promise<ApiResponse<Comment>>),

  update: (commentId: string, data: { content: string }) =>
    fetchWithAuth(`${API_BASE_URL}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json() as Promise<ApiResponse<Comment>>),

  delete: (commentId: string) =>
    fetchWithAuth(`${API_BASE_URL}/comments/${commentId}`, {
      method: "DELETE",
    }).then((r) => r.json() as Promise<ApiResponse<null>>),
};

// ─── Playlist API ─────────────────────────────────────────────────────

export const playlistAPI = {
  create: (data: { name: string; description?: string }) =>
    fetchWithAuth(`${API_BASE_URL}/playlists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json() as Promise<ApiResponse<Playlist>>),

  update: (playlistId: string, data: { name?: string; description?: string }) =>
    fetchWithAuth(`${API_BASE_URL}/playlists/${playlistId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json() as Promise<ApiResponse<Playlist>>),

  delete: (playlistId: string) =>
    fetchWithAuth(`${API_BASE_URL}/playlists/${playlistId}`, {
      method: "DELETE",
    }).then((r) => r.json() as Promise<ApiResponse<null>>),

  getById: (playlistId: string) =>
    fetchWithAuth(`${API_BASE_URL}/playlists/${playlistId}`).then(
      (r) => r.json() as Promise<ApiResponse<Playlist>>,
    ),

  getByUser: (userId: string) =>
    fetchWithAuth(`${API_BASE_URL}/playlists/user/${userId}`).then(
      (r) => r.json() as Promise<ApiResponse<Playlist[]>>,
    ),

  addVideo: (playlistId: string, videoId: string) =>
    fetchWithAuth(
      `${API_BASE_URL}/playlists/add/${videoId}/${playlistId}`,
      { method: "PATCH" },
    ).then((r) => r.json() as Promise<ApiResponse<Playlist>>),

  removeVideo: (playlistId: string, videoId: string) =>
    fetchWithAuth(
      `${API_BASE_URL}/playlists/remove/${videoId}/${playlistId}`,
      { method: "PATCH" },
    ).then((r) => r.json() as Promise<ApiResponse<Playlist>>),
};

// ─── Tweet API ────────────────────────────────────────────────────────

export const tweetAPI = {
  create: (data: { content: string }) =>
    fetchWithAuth(`${API_BASE_URL}/tweets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json() as Promise<ApiResponse<Tweet>>),

  update: (tweetId: string, data: { content: string }) =>
    fetchWithAuth(`${API_BASE_URL}/tweets/${tweetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json() as Promise<ApiResponse<Tweet>>),

  delete: (tweetId: string) =>
    fetchWithAuth(`${API_BASE_URL}/tweets/${tweetId}`, {
      method: "DELETE",
    }).then((r) => r.json() as Promise<ApiResponse<null>>),

  getByUser: (userId: string) =>
    fetch(`${API_BASE_URL}/tweets/user/${userId}`).then(
      (r) => r.json() as Promise<ApiResponse<Tweet[]>>,
    ),
};

// ─── Like API ─────────────────────────────────────────────────────────

export const likeAPI = {
  toggleVideo: (videoId: string) =>
    fetchWithAuth(`${API_BASE_URL}/likes/toggle/v/${videoId}`, {
      method: "POST",
    }).then((r) => r.json() as Promise<ApiResponse<{ isLiked: boolean }>>),

  toggleComment: (commentId: string) =>
    fetchWithAuth(`${API_BASE_URL}/likes/toggle/c/${commentId}`, {
      method: "POST",
    }).then((r) => r.json() as Promise<ApiResponse<{ isLiked: boolean }>>),

  toggleTweet: (tweetId: string) =>
    fetchWithAuth(`${API_BASE_URL}/likes/toggle/t/${tweetId}`, {
      method: "POST",
    }).then((r) => r.json() as Promise<ApiResponse<{ isLiked: boolean }>>),

  getLikedVideos: () =>
    fetchWithAuth(`${API_BASE_URL}/likes/videos`).then(
      (r) => r.json() as Promise<ApiResponse<Video[]>>,
    ),
};

// ─── Subscription API ─────────────────────────────────────────────────

export const subscriptionAPI = {
  toggle: (channelId: string) =>
    fetchWithAuth(`${API_BASE_URL}/subscriptions/c/${channelId}`, {
      method: "POST",
    }).then((r) => r.json() as Promise<ApiResponse<{ isSubscribed: boolean }>>),

  getSubscribers: (channelId: string) =>
    fetchWithAuth(`${API_BASE_URL}/subscriptions/u/${channelId}`).then(
      (r) => r.json() as Promise<ApiResponse<unknown[]>>,
    ),

  getSubscribedChannels: () =>
    fetchWithAuth(`${API_BASE_URL}/subscriptions/channels`).then(
      (r) => r.json() as Promise<ApiResponse<unknown[]>>,
    ),
};

// ─── Dashboard API ────────────────────────────────────────────────────

export const dashboardAPI = {
  getStats: () =>
    fetchWithAuth(`${API_BASE_URL}/dashboard/stats`).then(
      (r) =>
        r.json() as Promise<
          ApiResponse<{
            channelStats: {
              totalVideos: number;
              totalViews: number;
              subscriberCount: number;
            };
          }>
        >,
    ),

  getVideos: () =>
    fetchWithAuth(`${API_BASE_URL}/dashboard/videos`).then(
      (r) => r.json() as Promise<ApiResponse<{ videos: Video[] }>>,
    ),
};
