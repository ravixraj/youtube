"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Video,
  ListVideo,
  Upload,
  MessageSquare,
  X,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { name: "Home", path: "/home", icon: Home, mobileView: true },
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    mobileView: true,
  },
  { name: "Playlist", path: "/playlist", icon: ListVideo, mobileView: true },
  { name: "Tweets", path: "/tweets", icon: MessageSquare, mobileView: true },
  { name: "Upload", path: "/upload", icon: Upload, mobileView: false },
];

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="group hidden sm:block fixed inset-y-0 left-0 z-40 w-[70px] shrink-0 border-r border-border py-6 hover:w-[250px] lg:w-[250px] transition-all duration-200 bg-sidebar">
        <ul className="sticky top-[80px] flex flex-col gap-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.path}
                className={cn(
                  "flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "group-hover:justify-start lg:justify-start",
                  "justify-center",
                  pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="hidden group-hover:inline lg:inline truncate">
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] border-r border-border py-4 bg-background transition-transform duration-300 sm:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Close Button */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <Video className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg">UTube</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <ul className="flex flex-col gap-y-1 px-2 pt-4">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* User Info */}
        {user && (
          <div className="absolute bottom-4 left-0 right-0 px-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                {user.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.fullname}</p>
                <p className="text-xs text-muted-foreground truncate">
                  @{user.username}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border z-30 sm:hidden">
        <div className="flex items-center justify-around h-full">
          {navItems
            .filter((item) => item.mobileView)
            .map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5", isActive && "scale-110")}
                  />
                  <span className="text-xs mt-1 font-medium">{item.name}</span>
                </Link>
              );
            })}
        </div>
      </nav>
    </>
  );
}
