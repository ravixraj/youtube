"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { subscriptionAPI } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserMinus } from "lucide-react";

export default function SubscriptionsPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscribedChannels();
  }, []);

  const fetchSubscribedChannels = async () => {
    try {
      const response = await subscriptionAPI.getSubscribedChannels();
      if (response.data.success && response.data.data) {
        setChannels(response.data.data.channels);
      }
    } catch (error) {
      console.error("Error fetching subscribed channels:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="w-full p-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Subscriptions
        </h1>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse flex items-center gap-4 p-4 rounded-xl bg-card"
            >
              <div className="w-14 h-14 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (channels.length === 0) {
    return (
      <section className="w-full p-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Subscriptions
        </h1>
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            No subscriptions yet
          </h2>
          <p className="text-muted-foreground">
            Channels you subscribe to will appear here
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full p-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">Subscriptions</h1>
      <div className="space-y-3 max-w-2xl">
        {channels.map((item: any, i: number) => (
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
    </section>
  );
}
