"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Play,
  ListVideo,
  MessageSquare,
  Bell,
  Heart,
  Repeat2,
  Share,
} from "lucide-react";
import {
  userAPI,
  videoAPI,
  tweetAPI,
  type ChannelUser,
  type Video,
  type Tweet,
} from "@/lib/api";
import VideoCard from "@/components/VideoCard";
import VideoCardSkeleton from "@/components/VideoCardSkeleton";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [channel, setChannel] = useState<ChannelUser | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("videos");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const username = (params.username as string)?.replace("@", "");

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  useEffect(() => {
    if (channel?.id) {
      fetchVideos();
      fetchTweets();
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
        setTweets(response.data.data);
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
    { id: "playlists", label: "Playlists", icon: Play, count: 0 },
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
            {channel.subscribersCount} subscribers · Joined{" "}
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
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label} ({tab.count})
            </button>
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
                <div
                  key={tweet.id}
                  className="bg-card border border-border rounded-xl p-4"
                >
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
                        <span className="text-muted-foreground text-sm">·</span>
                        <span className="text-muted-foreground text-sm">
                          {new Date(tweet.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 text-foreground">{tweet.content}</p>
                      <div className="flex items-center gap-6 mt-3 text-muted-foreground">
                        <button className="flex items-center gap-1 hover:text-primary transition-colors">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-sm">Reply</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                          <Repeat2 className="h-4 w-4" />
                          <span className="text-sm">Retweet</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                          <Heart className="h-4 w-4" />
                          <span className="text-sm">Like</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-primary transition-colors">
                          <Share className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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
          <div className="text-center py-12">
            <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No playlists available</p>
          </div>
        )}
      </div>
    </div>
  );
}
