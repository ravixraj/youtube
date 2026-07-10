"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Video,
  Upload,
  Search,
  MessageSquare,
  ListVideo,
  User,
  Settings,
  Plus,
  Heart,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    {
      title: "Home",
      href: "/home",
      icon: LayoutDashboard,
    },
    {
      title: "Explore",
      href: "/explore",
      icon: Search,
    },
    {
      title: "Subscriptions",
      href: "/subscriptions",
      icon: Heart,
    },
    {
      title: "Library",
      href: "/library",
      icon: ListVideo,
    },
    {
      title: "Watch Later",
      href: "/watch-later",
      icon: Video,
    },
    {
      title: "History",
      href: "/history",
      icon: ListVideo,
    },
    {
      title: "Playlists",
      href: "/playlists",
      icon: ListVideo,
    },
    {
      title: "Tweets",
      href: "/tweets",
      icon: MessageSquare,
    },
    {
      title: "Upload",
      href: "/upload",
      icon: Upload,
    },
  ];

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`w-64 bg-background border-r border-border h-screen fixed left-0 top-0 overflow-y-auto z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <Video className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">StreamTube</h1>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* User Profile */}
          {user && (
            <div className="space-y-1">
              <Link
                href={`/@${user.username}`}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(`/@${user.username}`)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <User className="h-5 w-5" />
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/settings"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </div>
          )}
        </nav>

        {/* Create Playlist Button */}
        <div className="p-4">
          <Link
            href="/playlists"
            onClick={handleLinkClick}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Playlist
          </Link>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
