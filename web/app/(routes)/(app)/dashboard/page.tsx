"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  dashboardAPI,
  videoAPI,
  userAPI,
  authAPI,
  subscriptionAPI,
  likeAPI,
  type Video,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  Users,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Lock,
  Camera,
  Video as VideoIcon,
  Image,
  LayoutDashboard,
  Settings,
  ListVideo,
  Bell,
  UserPlus,
  Heart,
  Play,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<{
    totalVideos: number;
    totalViews: number;
    subscriberCount: number;
  } | null>(null);

  const [videos, setVideos] = useState<Video[]>([]);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  const [accountForm, setAccountForm] = useState({
    fullname: "",
    email: "",
    username: "",
  });
  const [accountMsg, setAccountMsg] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarMsg, setAvatarMsg] = useState("");
  const [coverMsg, setCoverMsg] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const [subscribedChannels, setSubscribedChannels] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<Video[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, videosRes, subsRes, likedRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getVideos(),
        subscriptionAPI.getSubscribedChannels(),
        likeAPI.getLikedVideos(),
      ]);
      if (statsRes.data.data?.channelStats) {
        setStats(statsRes.data.data.channelStats);
      }
      if (videosRes.data.data?.videos) {
        setVideos(videosRes.data.data.videos);
      }
      if (subsRes.data.success && subsRes.data.data) {
        setSubscribedChannels(subsRes.data.data.channels);
      }
      if (likedRes.data.success && likedRes.data.data) {
        setLikedVideos(likedRes.data.data.likedVideos as Video[]);
      }
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
    if (user) {
      setAccountForm({
        fullname: user.fullname,
        email: user.email,
        username: user.username,
      });
    }
  };

  const startEdit = (video: Video) => {
    setEditingVideo(video.id);
    setEditTitle(video.title);
    setEditDescription(video.description || "");
  };

  const saveVideo = async (videoId: string) => {
    try {
      await videoAPI.update(videoId, {
        title: editTitle,
        description: editDescription,
      });
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? { ...v, title: editTitle, description: editDescription }
            : v,
        ),
      );
      setEditingVideo(null);
    } catch (err) {
      console.error("Failed to update video", err);
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm("Delete this video permanently?")) return;
    try {
      await videoAPI.delete(videoId);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch (err) {
      console.error("Failed to delete video", err);
    }
  };

  const togglePublish = async (videoId: string) => {
    try {
      const res = await videoAPI.togglePublish(videoId);
      if (res.data.data?.video) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoId
              ? { ...v, isPublished: res.data.data!.video.isPublished }
              : v,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to toggle publish", err);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMsg("");
    try {
      const res = await userAPI.updateAccount(accountForm);
      if (res.data.success) {
        setAccountMsg("Account updated successfully");
      }
    } catch (err: any) {
      setAccountMsg(err?.response?.data?.message || "Failed to update account");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    try {
      const res = await authAPI.changePassword({
        currentPassword,
        newPassword,
      });
      if (res.data.success) {
        setPasswordMsg("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch (err: any) {
      setPasswordMsg(
        err?.response?.data?.message || "Failed to change password",
      );
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setAvatarMsg("");
    try {
      const res = await userAPI.uploadAvatar(avatarFile);
      if (res.data.success) {
        setAvatarMsg("Avatar updated");
        setAvatarFile(null);
      }
    } catch (err: any) {
      setAvatarMsg(err?.response?.data?.message || "Upload failed");
    }
  };

  const handleUploadCover = async () => {
    if (!coverFile) return;
    setCoverMsg("");
    try {
      const res = await userAPI.uploadCoverImage(coverFile);
      if (res.data.success) {
        setCoverMsg("Cover image updated");
        setCoverFile(null);
      }
    } catch (err: any) {
      setCoverMsg(err?.response?.data?.message || "Upload failed");
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toLocaleString();
  };

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      count: 0,
    },
    {
      id: "videos",
      label: "Videos",
      icon: VideoIcon,
      count: videos.length,
    },
    {
      id: "liked",
      label: "Liked",
      icon: Heart,
      count: likedVideos.length,
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      icon: Users,
      count: subscribedChannels.length,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      count: 0,
    },
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="w-full h-48 bg-muted rounded-xl mb-4" />
          <div className="flex items-end gap-4 mb-8">
            <div className="w-24 h-24 rounded-full bg-muted" />
            <div className="flex-1">
              <div className="h-8 bg-muted rounded w-48 mb-2" />
              <div className="h-4 bg-muted rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="w-full h-32 sm:h-48 bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl mb-4 overflow-hidden">
        {user?.coverImage && (
          <img
            src={user.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6 -mt-12 sm:-mt-16 px-4">
        <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-lg">
          <AvatarImage src={user?.avatar || ""} alt={user?.username} />
          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
            {user?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {user?.fullname}
          </h1>
          <p className="text-muted-foreground">@{user?.username}</p>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium text-foreground">
              {formatCount(stats?.totalVideos ?? 0)}
            </span>{" "}
            videos ·{" "}
            <span className="font-medium text-foreground">
              {formatCount(stats?.totalViews ?? 0)}
            </span>{" "}
            views ·{" "}
            <span className="font-medium text-foreground">
              {formatCount(stats?.subscriberCount ?? 0)}
            </span>{" "}
            subscribers
          </p>
        </div>
      </div>

      <div className="border-b border-border mb-6">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className="pb-3 px-1"
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
              {tab.count > 0 && ` (${tab.count})`}
            </Button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Videos",
                  value: stats?.totalVideos ?? 0,
                  icon: VideoIcon,
                },
                { label: "Views", value: stats?.totalViews ?? 0, icon: Eye },
                {
                  label: "Subscribers",
                  value: stats?.subscriberCount ?? 0,
                  icon: Users,
                },
              ].map((item) => (
                <Card key={item.label}>
                  <CardContent className="flex items-center gap-4 py-5">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        {formatCount(item.value)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-4">
                  Recent Videos
                </h3>
                {videos.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <VideoIcon className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      No videos uploaded yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {videos.slice(0, 5).map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <img
                          src={video.thumbnail || "/placeholder.png"}
                          alt={video.title}
                          className="w-20 h-14 object-cover rounded-lg shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{video.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {video.viewCount} views ·{" "}
                            {video.isPublished ? "Published" : "Unpublished"}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "videos" && (
          <div>
            {videos.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <VideoIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  No videos yet
                </h2>
                <p className="text-muted-foreground">
                  Upload your first video to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {videos.map((video) => (
                  <Card key={video.id}>
                    <CardContent className="flex flex-col sm:flex-row gap-4 pt-6">
                      <img
                        src={video.thumbnail || "/placeholder.png"}
                        alt={video.title}
                        className="w-full sm:w-44 h-24 object-cover rounded-lg shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        {editingVideo === video.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Title"
                            />
                            <Input
                              value={editDescription}
                              onChange={(e) =>
                                setEditDescription(e.target.value)
                              }
                              placeholder="Description"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => saveVideo(video.id)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingVideo(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-semibold truncate">
                                  {video.title}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {video.description || "No description"}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${video.isPublished ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}`}
                              >
                                {video.isPublished ? "Published" : "Draft"}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {video.viewCount}{" "}
                                views
                              </span>
                              <span>
                                {new Date(video.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(video)}
                              >
                                <Edit3 className="h-4 w-4 mr-1" /> Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePublish(video.id)}
                              >
                                {video.isPublished ? (
                                  <ToggleLeft className="h-4 w-4 mr-1 text-amber-500" />
                                ) : (
                                  <ToggleRight className="h-4 w-4 mr-1 text-green-500" />
                                )}
                                {video.isPublished ? "Unpublish" : "Publish"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                onClick={() => deleteVideo(video.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "liked" && (
          <div>
            {likedVideos.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Heart className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  No liked videos yet
                </h2>
                <p className="text-muted-foreground">
                  Videos you like will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {likedVideos.map((video) => (
                  <Card
                    key={video.id}
                    className="group cursor-pointer overflow-hidden"
                    onClick={() => router.push(`/watch/${video.id}`)}
                  >
                    <div className="relative w-full pt-[56.25%]">
                      <img
                        src={video.thumbnail || "/placeholder-video.jpg"}
                        alt={video.title}
                        className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {video.viewCount} views
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div>
            {subscribedChannels.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Users className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  No subscriptions yet
                </h2>
                <p className="text-muted-foreground">
                  Channels you subscribe to will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl">
                {subscribedChannels.map((item: any, i: number) => (
                  <Card key={i}>
                    <CardContent className="flex items-center gap-4 pt-6">
                      <Link href={`/@${item.channel.username}`}>
                        <Avatar className="w-14 h-14">
                          <AvatarImage
                            src={item.channel.avatar}
                            alt={item.channel.username}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {item.channel.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/@${item.channel.username}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {item.channel.fullname}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          @{item.channel.username}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <UserPlus className="h-5 w-5" /> Account
                </h3>
                <form onSubmit={handleUpdateAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input
                      id="fullname"
                      value={accountForm.fullname}
                      onChange={(e) =>
                        setAccountForm({
                          ...accountForm,
                          fullname: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={accountForm.email}
                      onChange={(e) =>
                        setAccountForm({
                          ...accountForm,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={accountForm.username}
                      onChange={(e) =>
                        setAccountForm({
                          ...accountForm,
                          username: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button type="submit">Update Account</Button>
                  {accountMsg && (
                    <p
                      className={`text-sm ${accountMsg.includes("successfully") ? "text-green-500" : "text-red-500"}`}
                    >
                      {accountMsg}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5" /> Change Password
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Min 6 chars, must include uppercase, lowercase, number &
                      special character
                    </p>
                  </div>
                  <Button type="submit">Update Password</Button>
                  {passwordMsg && (
                    <p
                      className={`text-sm ${passwordMsg.includes("successfully") ? "text-green-500" : "text-red-500"}`}
                    >
                      {passwordMsg}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Camera className="h-5 w-5" /> Avatar
                </h3>
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.avatar} alt="avatar" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setAvatarFile(e.target.files?.[0] || null)
                      }
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={handleUploadAvatar}
                        disabled={!avatarFile}
                      >
                        Upload Avatar
                      </Button>
                      {avatarMsg && (
                        <span className="text-sm text-green-500">
                          {avatarMsg}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Image className="h-5 w-5" /> Cover Image
                </h3>
                <div className="space-y-4">
                  {user?.coverImage && (
                    <img
                      src={user.coverImage}
                      alt="Current cover"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setCoverFile(e.target.files?.[0] || null)
                      }
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={handleUploadCover}
                        disabled={!coverFile}
                      >
                        Upload Cover Image
                      </Button>
                      {coverMsg && (
                        <span className="text-sm text-green-500">
                          {coverMsg}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
