"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, MessageSquare } from "lucide-react";
import { videoAPI, type Video } from "@/lib/api";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeTab, setActiveTab] = useState("videos");
  const [filters, setFilters] = useState<{
    sortBy: string;
    sortOrder: "desc" | "asc";
  }>({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  useEffect(() => {
    if (query) {
      handleSearch();
    }
  }, [query]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await videoAPI.search({
        query,
        page: 1,
        limit: 50,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      if (response.success && response.data) {
        setVideos(response.data);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (videoId: string) => {
    router.push(`/watch/${videoId}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    handleSearch();
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input
            type="text"
            placeholder="Search videos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("videos")}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === "videos"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Videos ({videos.length})
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="createdAt">Date</option>
            <option value="viewCount">Views</option>
          </select>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          <Button variant="secondary" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </div>

      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching...</p>
            </div>
          </div>
        ) : query ? (
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 sm:gap-6">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleVideoClick(video.id)}
              >
                <div className="relative">
                  <img
                    src={video.thumbnail || ""}
                    alt={video.title}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-sm">
                    {Math.floor(video.duration / 60)}:
                    {(video.duration % 60).toString().padStart(2, "0")}
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {video.viewCount.toLocaleString()} views ·{" "}
                    {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <img
                      src={video.owner?.avatar || ""}
                      alt={video.owner?.username}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-gray-600">
                      {video.owner?.fullname}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {videos.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-600">
                <p>No videos found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-600">
            <p>Enter a search query to find videos</p>
          </div>
        )}
      </div>
    </div>
  );
}
