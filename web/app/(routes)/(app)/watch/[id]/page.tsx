"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  MessageSquare,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Bell,
} from "lucide-react";
import {
  videoAPI,
  commentAPI,
  likeAPI,
  subscriptionAPI,
  type Video,
  type Comment,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function WatchPage() {
  const params = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);

  const videoId = params.id as string;

  useEffect(() => {
    if (videoId) {
      fetchVideo();
      fetchComments();
    }
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      const response = await videoAPI.getById(videoId);
      if (response.data.success && response.data.data) {
        const videoData = response.data.data.video;
        setVideo(videoData);
        setViewCount(videoData.viewCount);
      }
    } catch (error) {
      console.error("Error fetching video:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await commentAPI.getByVideo(videoId);
      if (response.data.success && response.data.data) {
        setComments(response.data.data.comments);
        setCommentCount(response.data.data.comments.length);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await commentAPI.create({
        videoId,
        content: newComment,
      });

      if (response.data.success) {
        setNewComment("");
        fetchComments();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        const response = await likeAPI.toggleVideo(videoId);
        if (response.data.success) {
          setIsLiked(true);
          setLikeCount((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleSubscribe = async () => {
    try {
      if (isSubscribed) {
        setIsSubscribed(false);
      } else if (video?.userId) {
        const response = await subscriptionAPI.toggle(video.userId);
        if (response.data.success) {
          setIsSubscribed(true);
        }
      }
    } catch (error) {
      console.error("Error toggling subscription:", error);
    }
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toLocaleString();
  };

  if (isLoading || !video) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              <video
                src={video.videoFile}
                controls
                className="w-full h-full"
                poster={video.thumbnail}
                autoPlay
              />
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
              {video.title}
            </h1>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Link href={`/@${video.owner?.username}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={video.owner?.avatar}
                      alt={video.owner?.username}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {video.owner?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link
                    href={`/@${video.owner?.username}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {video.owner?.fullname}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatViewCount(viewCount)} views ·{" "}
                    {new Date(video.createdAt).toLocaleDateString()}
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

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={handleLike}
                  variant="secondary"
                  className={isLiked ? "bg-primary/10 text-primary" : ""}
                >
                  <ThumbsUp
                    className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`}
                  />
                  {formatViewCount(likeCount)}
                </Button>
                <Button variant="secondary">
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button variant="secondary">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <Card className="mt-4 bg-muted">
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">
                  {video.description || "No description"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {commentCount} Comments
            </h2>

            {user && (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar || ""} alt={user.username} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="mb-2 bg-muted"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setNewComment("")}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={!newComment.trim()}>
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={comment.user?.avatar}
                      alt={comment.user?.username}
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {comment.user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm">
                        {comment.user?.fullname || comment.user?.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-foreground mb-2">{comment.content}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Like
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        Reply
                      </Button>
                    </div>

                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 ml-4 space-y-3 border-l-2 border-border pl-4">
                        {comment.replies.map((reply: Comment) => (
                          <div key={reply.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={reply.user?.avatar}
                                alt={reply.user?.username}
                              />
                              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                {reply.user?.username?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-foreground text-sm">
                                  {reply.user?.fullname}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    reply.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-foreground text-sm">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-4">
                Related Videos
              </h3>
              <p className="text-muted-foreground text-sm">
                Related videos will appear here.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
