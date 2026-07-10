"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { videoAPI, type Video } from "@/lib/api";
import VideoCard from "@/components/VideoCard";
import VideoCardSkeleton from "@/components/VideoCardSkeleton";

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get("q") || "";
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(!queryParam);
  const [isSearching, setIsSearching] = useState(false);

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await videoAPI.search({
        page: 1,
        limit: 50,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (response.data.success && response.data.data) {
        setVideos(response.data.data?.videos || []);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const response = await videoAPI.search({
        query,
        page: 1,
        limit: 50,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      if (response.data.success && response.data.data) {
        setSearchResults(response.data.data.videos);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (queryParam) {
      handleSearch(queryParam);
    } else {
      fetchVideos();
    }
  }, [queryParam, fetchVideos, handleSearch]);

  const handleVideoClick = (videoId: string) => {
    router.push(`/watch/${videoId}`);
  };

  if (queryParam) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {isSearching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <VideoCardSkeleton key={index} />
            ))}
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <p className="text-muted-foreground text-lg">
              No videos found for &quot;{queryParam}&quot;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {searchResults
              .filter((video) => video.isPublished)
              .map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={handleVideoClick}
                />
              ))}
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <section className="w-full p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <VideoCardSkeleton key={index} />
          ))}
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return (
      <section className="w-full p-4">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-muted flex items-center justify-center">
            <svg
              className="w-12 h-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No videos yet
          </h2>
          <p className="text-muted-foreground max-w-md">
            Be the first to upload a video and share it with the community!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos
          .filter((video) => video.isPublished)
          .map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={handleVideoClick}
            />
          ))}
      </div>
    </section>
  );
}
