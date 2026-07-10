"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { tweetAPI, type Tweet } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Heart } from "lucide-react";

export default function TweetsPage() {
  const { user } = useAuth();
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [newTweet, setNewTweet] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchTweets();
  }, []);

  const fetchTweets = async () => {
    try {
      if (user?.id) {
        const response = await tweetAPI.getByUser(user.id);
        if (response.data.success && response.data.data) {
          setTweets(response.data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching tweets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTweet.trim()) return;

    setPosting(true);
    try {
      const response = await tweetAPI.create({ content: newTweet });
      if (response.data.success) {
        setNewTweet("");
        fetchTweets();
      }
    } catch (error) {
      console.error("Error creating tweet:", error);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <section className="w-full p-4 max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="w-full p-4 max-w-2xl mx-auto">
      <div className="bg-card rounded-xl p-4 mb-4 border border-border">
        <div className="flex gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user?.avatar} alt={user?.username} />
            <AvatarFallback>
              {user?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="text"
                placeholder="What's happening?"
                value={newTweet}
                onChange={(e) => setNewTweet(e.target.value)}
                className="text-lg border-none focus-visible:ring-0 p-0"
              />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {200 - newTweet.length} characters remaining
                </div>
                <Button type="submit" disabled={!newTweet.trim() || posting}>
                  {posting ? "Posting..." : "Tweet"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {tweets.length > 0 ? (
          tweets.map((tweet) => (
            <div
              key={tweet.id}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 mt-1">
                  <AvatarImage
                    src={tweet.user?.avatar}
                    alt={tweet.user?.username}
                  />
                  <AvatarFallback>
                    {tweet.user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {tweet.user?.fullname}
                    </span>
                    <span className="text-muted-foreground">
                      @{tweet.user?.username}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(tweet.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-foreground">{tweet.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-muted-foreground">
                    <button className="hover:text-primary transition-colors">
                      <MessageSquare className="h-4 w-4 inline mr-1" />
                      Reply
                    </button>
                    <button className="hover:text-destructive transition-colors">
                      <Heart className="h-4 w-4 inline mr-1" />
                      Like
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[30vh] text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              No tweets yet
            </h2>
            <p className="text-muted-foreground">
              Your tweets will appear here
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
