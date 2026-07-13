"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { likeAPI, type Video } from "@/lib/api";
import { Heart } from "lucide-react";
import VideoCard from "../_components/VideoCard";
import VideoCardSkeleton from "../_components/VideoCardSkeleton";

export default function LikedVideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLikedVideos();
  }, []);

  const fetchLikedVideos = async () => {
    try {
      const response = await likeAPI.getLikedVideos();
      if (response.data.success && response.data.data) {
        setVideos(response.data.data.likedVideos as Video[]);
      }
    } catch (error) {
      console.error("Error fetching liked videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (videoId: string) => {
    router.push(`/watch/${videoId}`);
  };

  if (loading) {
    return (
      <section className="w-full p-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Liked Videos
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return (
      <section className="w-full p-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Liked Videos
        </h1>
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Heart className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            No liked videos yet
          </h2>
          <p className="text-muted-foreground">
            Videos you like will appear here
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full p-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">Liked Videos</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onClick={handleVideoClick} />
        ))}
      </div>
    </section>
  );
}
