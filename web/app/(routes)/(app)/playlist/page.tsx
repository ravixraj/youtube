"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { playlistAPI, type Playlist } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ListVideo, Plus, Trash2, Play, Edit3 } from "lucide-react";
import Link from "next/link";

export default function PlaylistsPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const response = await playlistAPI.getByUser(user.id);
      if (response.data.success && response.data.data) {
        setPlaylists(response.data.data.playlists);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setCreating(true);
    try {
      const response = await playlistAPI.create(formData);
      if (response.data.success) {
        setFormData({ name: "", description: "" });
        setIsModalOpen(false);
        fetchPlaylists();
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdatePlaylist = async (playlistId: string) => {
    if (!editFormData.name.trim()) return;
    try {
      const response = await playlistAPI.update(playlistId, editFormData);
      if (response.data.success) {
        setEditingPlaylist(null);
        setEditFormData({ name: "", description: "" });
        fetchPlaylists();
      }
    } catch (error) {
      console.error("Error updating playlist:", error);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (window.confirm("Are you sure you want to delete this playlist?")) {
      try {
        const response = await playlistAPI.delete(playlistId);
        if (response.data.success) {
          fetchPlaylists();
        }
      } catch (error) {
        console.error("Error deleting playlist:", error);
      }
    }
  };

  if (loading) {
    return (
      <section className="w-full p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-full bg-card rounded-xl overflow-hidden animate-pulse"
            >
              <div className="relative w-full pt-[56.25%]">
                <div className="absolute inset-0 bg-muted" />
              </div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full p-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Your Playlists
      </h1>

      {playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {playlists.map((playlist) => (
            <Card key={playlist.id} className="group overflow-hidden">
              <Link href={`/playlist/${playlist.id}`}>
                <div className="relative w-full pt-[56.25%]">
                  {playlist.videos && playlist.videos.length > 0 ? (
                    <>
                      <img
                        src={
                          playlist.videos[0].thumbnail ||
                          "/placeholder-video.jpg"
                        }
                        alt={playlist.name}
                        className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                      <ListVideo className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Link>

              <CardContent className="p-4">
                {editingPlaylist === playlist.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder="Playlist name"
                    />
                    <Textarea
                      value={editFormData.description}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Description"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdatePlaylist(playlist.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingPlaylist(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Link href={`/playlist/${playlist.id}`}>
                      <h3 className="font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
                        {playlist.name}
                      </h3>
                    </Link>
                    {playlist.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {playlist.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-muted-foreground">
                        {playlist.videos?.length || 0} videos
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingPlaylist(playlist.id);
                            setEditFormData({
                              name: playlist.name,
                              description: playlist.description || "",
                            });
                          }}
                          className="text-muted-foreground hover:text-blue-500"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePlaylist(playlist.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-muted flex items-center justify-center">
            <ListVideo className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No playlists yet
          </h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Create a playlist to organize your favorite videos
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Playlist
          </Button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Create New Playlist
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-foreground"
                  >
                    Name
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter playlist name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="text-sm font-medium text-foreground"
                  >
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter playlist description"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={creating} className="flex-1">
                    {creating ? "Creating..." : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
