"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { playlistAPI, type Playlist } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ListVideo, Plus } from "lucide-react";

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

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await playlistAPI.getByUser(user?.id || "");
      if (response.success && response.data) {
        setPlaylists(response.data);
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
      if (response.success) {
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

  const handleDeletePlaylist = async (playlistId: string) => {
    if (window.confirm("Are you sure you want to delete this playlist?")) {
      try {
        const response = await playlistAPI.delete(playlistId);
        if (response.success) {
          fetchPlaylists();
        }
      } catch (error) {
        console.error("Error deleting playlist:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading playlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your Playlists</h1>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Playlist
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 sm:gap-6">
        {playlists.length > 0 ? (
          playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-video bg-gray-100">
                {playlist.videos && playlist.videos.length > 0 ? (
                  <img
                    src={playlist.videos[0].thumbnail || ""}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ListVideo className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="p-3 sm:p-4">
                <h3 className="font-semibold mb-2 line-clamp-2">
                  {playlist.name}
                </h3>
                {playlist.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {playlist.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{playlist.videos?.length || 0} videos</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary">
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeletePlaylist(playlist.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-600">
            <ListVideo className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-4">
              You haven't created any playlists yet
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Playlist
            </Button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Create New Playlist</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Playlist Name
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter playlist name"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description (Optional)
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
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                >
                  {creating ? "Creating..." : "Create Playlist"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
