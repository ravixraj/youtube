"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { playlistAPI, type Playlist } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Play, ListVideo, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  const playlistId = params.id as string;

  useEffect(() => {
    if (playlistId) fetchPlaylist();
  }, [playlistId]);

  const fetchPlaylist = async () => {
    try {
      const response = await playlistAPI.getById(playlistId);
      if (response.data.success && response.data.data) {
        setPlaylist(response.data.data.playlist);
      }
    } catch (error) {
      console.error("Error fetching playlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    try {
      const response = await playlistAPI.removeVideo(playlistId, videoId);
      if (response.data.success) {
        fetchPlaylist();
      }
    } catch (error) {
      console.error("Error removing video:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ListVideo className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Playlist not found</h2>
        <Button variant="outline" onClick={() => router.push("/playlist")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Playlists
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/playlist")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          {playlist.name}
        </h1>
        {playlist.description && (
          <p className="text-muted-foreground mb-2">{playlist.description}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {playlist.videos?.length || 0} videos
        </p>
      </div>

      {!playlist.videos || playlist.videos.length === 0 ? (
        <div className="text-center py-16">
          <ListVideo className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No videos in this playlist</p>
        </div>
      ) : (
        <div className="space-y-3">
          {playlist.videos.map((video, index) => (
            <Card key={video.id} className="group">
              <CardContent className="flex items-center gap-4 pt-6">
                <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">
                  {index + 1}
                </span>
                <Link href={`/watch/${video.id}`} className="shrink-0">
                  <div className="relative w-40 h-24 rounded-lg overflow-hidden">
                    <img
                      src={video.thumbnail || "/placeholder-video.jpg"}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/watch/${video.id}`}
                    className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors"
                  >
                    {video.title}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">
                    {Math.floor(video.duration / 60)}:
                    {(video.duration % 60).toString().padStart(2, "0")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveVideo(video.id)}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
