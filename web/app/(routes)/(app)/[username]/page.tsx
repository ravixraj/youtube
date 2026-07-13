"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Play,
  ListVideo,
  MessageSquare,
  Bell,
  Heart,
  Trash2,
  Edit3,
  Check,
  X,
  Users,
} from "lucide-react";
import {
  userAPI,
  videoAPI,
  tweetAPI,
  likeAPI,
  subscriptionAPI,
  playlistAPI,
  type ChannelUser,
  type Video,
  type Tweet,
  type Playlist,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import VideoCard from "../_components/VideoCard";

export default function ProfilePage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [channel, setChannel] = useState<ChannelUser | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("videos");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [deletingTweetId, setDeletingTweetId] = useState<string | null>(null);
  const [editingTweetId, setEditingTweetId] = useState<string | null>(null);
  const [editTweetContent, setEditTweetContent] = useState("");
  const [tweetLikes, setTweetLikes] = useState<Record<string, boolean>>({});
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showSubscribers, setShowSubscribers] = useState(false);
  const [subscribers, setSubscribers] = useState<any[]>([]);

  const username = params.username as string;

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  useEffect(() => {
    if (channel?.id) {
      fetchVideos();
      fetchTweets();
      fetchPlaylists();
    }
  }, [channel?.id]);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getChannel(username);
      if (response.data.success && response.data.data?.user) {
        const ch = response.data.data.user;
        setChannel(ch);
        setIsSubscribed(ch.isSubscribed);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await videoAPI.search({ userId: channel?.id });
      if (response.data.success && response.data.data) {
        setVideos(response.data.data.videos);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  const fetchTweets = async () => {
    try {
      const response = await tweetAPI.getByUser(channel?.id || "");
      if (response.data.success && response.data.data) {
        setTweets(response.data.data.tweets);
      }
    } catch (error) {
      console.error("Error fetching tweets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoClick = (videoId: string) => {
    router.push(`/watch/${videoId}`);
  };

  const handleUpdateTweet = async (tweetId: string) => {
    if (!editTweetContent.trim()) return;
    try {
      const response = await tweetAPI.update(tweetId, {
        content: editTweetContent,
      });
      if (response.data.success) {
        setEditingTweetId(null);
        setEditTweetContent("");
        fetchTweets();
      }
    } catch (error) {
      console.error("Error updating tweet:", error);
    }
  };

  const handleTweetLike = async (tweetId: string) => {
    try {
      const response = await likeAPI.toggleTweet(tweetId);
      if (response.data.success) {
        setTweetLikes((prev) => ({
          ...prev,
          [tweetId]: response.data.data?.liked ?? !prev[tweetId],
        }));
      }
    } catch (error) {
      console.error("Error liking tweet:", error);
    }
  };

  const handleShowSubscribers = async () => {
    if (!channel?.id) return;
    try {
      const response = await subscriptionAPI.getSubscribers(channel.id);
      if (response.data.data) {
        setSubscribers([response.data.data.channel.subscriber]);
        setShowSubscribers(true);
      }
    } catch (error) {
      console.error("Error fetching subscribers:", error);
    }
  };

  const handleDeleteTweet = async (tweetId: string) => {
    try {
      const response = await tweetAPI.delete(tweetId);
      if (response.data.success) {
        setTweets((prev) => prev.filter((t) => t.id !== tweetId));
      }
    } catch (error) {
      console.error("Error deleting tweet:", error);
    } finally {
      setDeletingTweetId(null);
    }
  };

  const fetchPlaylists = async () => {
    if (!channel?.id) return;
    try {
      const response = await playlistAPI.getByUser(channel.id);
      if (response.data.success && response.data.data) {
        setPlaylists(response.data.data.playlists);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const handleSubscribe = async () => {
    try {
      if (isSubscribed) {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Error toggling subscription:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="w-full h-48 bg-muted rounded-xl mb-4"></div>
          <div className="flex items-end gap-4 mb-8">
            <div className="w-24 h-24 rounded-full bg-muted"></div>
            <div className="flex-1">
              <div className="h-8 bg-muted rounded w-48 mb-2"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
          <MessageSquare className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          User not found
        </h2>
        <p className="text-muted-foreground">
          The channel you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: "videos", label: "Videos", icon: ListVideo, count: videos.length },
    {
      id: "tweets",
      label: "Tweets",
      icon: MessageSquare,
      count: tweets.length,
    },
    {
      id: "playlists",
      label: "Playlists",
      icon: Play,
      count: playlists.length,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="w-full h-32 sm:h-48 bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl mb-4 overflow-hidden">
        {channel.coverImage && (
          <img
            src={channel.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6 -mt-12 sm:-mt-16 px-4">
        <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-lg">
          <AvatarImage src={channel.avatar || ""} alt={channel.username} />
          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
            {channel.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {channel.fullname}
          </h1>
          <p className="text-muted-foreground">@{channel.username}</p>
          <p className="text-sm text-muted-foreground mt-1">
            <button
              onClick={handleShowSubscribers}
              className="hover:text-primary transition-colors"
            >
              {channel.subscribersCount} subscribers
            </button>
            {" · Joined "}
            {new Date(channel.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Button
          onClick={handleSubscribe}
          variant={isSubscribed ? "secondary" : "default"}
          className={isSubscribed ? "" : "bg-red-600 hover:bg-red-700"}
        >
          <Bell className="h-4 w-4 mr-2" />
          {isSubscribed ? "Subscribed" : "Subscribe"}
        </Button>
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
              {tab.label} ({tab.count})
            </Button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === "videos" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.length > 0 ? (
              videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={handleVideoClick}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <ListVideo className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No videos yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "tweets" && (
          <div className="space-y-4 max-w-2xl">
            {tweets.length > 0 ? (
              tweets.map((tweet) => (
                <Card key={tweet.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={tweet.user?.avatar}
                          alt={tweet.user?.username}
                        />
                        <AvatarFallback className="bg-muted">
                          {tweet.user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {tweet.user?.fullname}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            @{tweet.user?.username}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            ·
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {new Date(tweet.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {editingTweetId === tweet.id ? (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              value={editTweetContent}
                              onChange={(e) =>
                                setEditTweetContent(e.target.value)
                              }
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateTweet(tweet.id)}
                              >
                                <Check className="h-4 w-4 mr-1" /> Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingTweetId(null)}
                              >
                                <X className="h-4 w-4 mr-1" /> Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 text-foreground">
                            {tweet.content}
                          </p>
                        )}
                        <div className="flex items-center gap-6 mt-3 text-muted-foreground">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTweetLike(tweet.id)}
                            className={
                              tweetLikes[tweet.id]
                                ? "text-red-500"
                                : "hover:text-red-500"
                            }
                          >
                            <Heart
                              className={`h-4 w-4 mr-1 ${tweetLikes[tweet.id] ? "fill-current" : ""}`}
                            />
                          </Button>
                          {tweet.userId === user?.id && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:text-blue-500"
                                onClick={() => {
                                  setEditingTweetId(tweet.id);
                                  setEditTweetContent(tweet.content);
                                }}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <AlertDialog
                                open={deletingTweetId === tweet.id}
                                onOpenChange={(open) =>
                                  setDeletingTweetId(open ? tweet.id : null)
                                }
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hover:text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent size="sm">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete tweet?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      variant="destructive"
                                      onClick={() =>
                                        handleDeleteTweet(tweet.id)
                                      }
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tweets yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "playlists" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.length > 0 ? (
              playlists.map((playlist) => (
                <Link key={playlist.id} href={`/playlist/${playlist.id}`}>
                  <Card className="group overflow-hidden h-full">
                    <div className="relative w-full pt-[56.25%]">
                      {playlist.videos && playlist.videos.length > 0 ? (
                        <>
                          <img
                            src={
                              playlist.videos[0].thumbnail ||
                              "/placeholder-video.jpg"
                            }
                            alt={playlist.name}
                            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="h-12 w-12 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-muted flex items-center justify-center">
                          <ListVideo className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-1">
                        {playlist.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {playlist.videos?.length || 0} videos
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No playlists available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showSubscribers && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSubscribers(false)}
        >
          <Card
            className="w-full max-w-md shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" /> Subscribers
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSubscribers(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {subscribers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No subscribers yet
                </p>
              ) : (
                <div className="space-y-3">
                  {subscribers.map((sub: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={sub.avatar} alt={sub.username} />
                        <AvatarFallback>
                          {sub.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{sub.fullname}</p>
                        <p className="text-sm text-muted-foreground">
                          @{sub.username}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
