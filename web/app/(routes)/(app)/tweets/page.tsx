"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { tweetAPI, type Tweet } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { MessageSquare, Heart } from "lucide-react";

export default function TweetsPage() {
  const { user } = useAuth();
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [newTweet, setNewTweet] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchTweets();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchTweets = async () => {
    try {
      if (user?.id) {
        const response = await tweetAPI.getByUser(user.id);
        if (response.data.success && response.data.data) {
          setTweets(response.data.data.tweets);
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

  const remaining = 200 - newTweet.length;
  const nearLimit = remaining <= 20;

  if (loading) {
    return (
      <section className="w-full p-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">Tweets</h1>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-xl overflow-hidden animate-pulse"
            >
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full p-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">Tweets</h1>

      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex gap-4">
          <Avatar className="w-12 h-12 shrink-0">
            <AvatarImage src={user?.avatar} alt={user?.username} />
            <AvatarFallback>
              {user?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                placeholder="What is happening?!"
                value={newTweet}
                onChange={(e) => setNewTweet(e.target.value)}
                rows={3}
                className="w-full resize-none border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
              />
              <div className="flex items-center justify-between border-t border-border pt-3">
                <div
                  className={`text-sm ${
                    remaining < 0
                      ? "text-destructive font-medium"
                      : nearLimit
                        ? "text-amber-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {remaining < 0
                    ? `-${Math.abs(remaining)} characters over`
                    : `${remaining} characters remaining`}
                </div>
                <Button
                  type="submit"
                  disabled={!newTweet.trim() || posting || remaining < 0}
                  className="rounded-full px-5 font-bold"
                >
                  {posting ? <Spinner /> : "Tweet"}
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
                <Avatar className="w-10 h-10 shrink-0 mt-1">
                  <AvatarImage
                    src={tweet.user?.avatar}
                    alt={tweet.user?.username}
                  />
                  <AvatarFallback>
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
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      {new Date(tweet.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-foreground whitespace-pre-wrap break-words">
                    {tweet.content}
                  </p>
                  <div className="flex items-center gap-6 mt-3 text-muted-foreground">
                    <button className="flex items-center gap-1.5 hover:text-primary transition-colors group text-sm">
                      <div className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors group text-sm">
                      <div className="p-1.5 rounded-full group-hover:bg-red-500/10 transition-colors">
                        <Heart className="h-4 w-4" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
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
