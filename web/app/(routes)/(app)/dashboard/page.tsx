"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  dashboardAPI,
  videoAPI,
  userAPI,
  authAPI,
  type Video,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  // ── Stats ──
  const [stats, setStats] = useState<{
    totalVideos: number;
    totalViews: number;
    subscriberCount: number;
  } | null>(null);

  // ── Videos ──
  const [videos, setVideos] = useState<Video[]>([]);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // ── Password ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  // ── Avatar / Cover ──
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarMsg, setAvatarMsg] = useState("");
  const [coverMsg, setCoverMsg] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, videosRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getVideos(),
      ]);
      if (statsRes.data.data?.channelStats) {
        setStats(statsRes.data.data.channelStats);
      }
      if (videosRes.data.data?.videos) {
        setVideos(videosRes.data.data.videos);
      }
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Video edit ──
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

  // ── Change password ──
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

  // ── Upload avatar ──
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

  // ── Upload cover ──
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="w-14 h-14 border-2 border-border">
          <AvatarImage src={user?.avatar} alt={user?.username} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {user?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {user?.fullname}
          </h1>
          <p className="text-muted-foreground">@{user?.username}</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview">
        <TabsList
          variant="line"
          className="w-full justify-start gap-6 h-auto p-0 bg-transparent"
        >
          <TabsTrigger
            value="overview"
            className="pb-3 px-1 data-[state=active]:bg-transparent flex items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="videos"
            className="pb-3 px-1 data-[state=active]:bg-transparent flex items-center gap-2"
          >
            <VideoIcon className="h-4 w-4" />
            Videos ({videos.length})
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="pb-3 px-1 data-[state=active]:bg-transparent flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="mt-6 space-y-6">
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
                      {item.value}
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
            <CardHeader>
              <CardTitle>Recent Videos</CardTitle>
            </CardHeader>
            <CardContent>
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
        </TabsContent>

        {/* ── Videos Tab ── */}
        <TabsContent value="videos" className="mt-6">
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
                            onChange={(e) => setEditDescription(e.target.value)}
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
        </TabsContent>

        {/* ── Settings Tab ── */}
        <TabsContent value="settings" className="mt-6 space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                    className={`text-sm ${
                      passwordMsg.includes("successfully")
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {passwordMsg}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" /> Avatar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" /> Cover Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
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
                    <span className="text-sm text-green-500">{coverMsg}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
