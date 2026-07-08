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
        if (response.success && response.data) {
          setTweets(response.data);
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
      if (response.success) {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tweets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-8">
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
                <div className="text-sm text-gray-500">
                  {200 - newTweet.length} characters remaining
                </div>
                <Button
                  type="submit"
                  disabled={!newTweet.trim() || posting}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
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
              className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4"
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
                    <span className="font-semibold">
                      {tweet.user?.fullname}
                    </span>
                    <span className="text-gray-600">
                      @{tweet.user?.username}
                    </span>
                    <span className="text-gray-600">
                      {new Date(tweet.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-800">{tweet.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-gray-600">
                    <button className="hover:text-blue-600">
                      <MessageSquare className="h-4 w-4 inline mr-1" />
                      Reply
                    </button>
                    <button className="hover:text-red-600">
                      <Heart className="h-4 w-4 inline mr-1" />
                      Like
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-600">
            <p>No tweets found</p>
          </div>
        )}
      </div>
    </div>
  );
}
