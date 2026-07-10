"use client";

import {
  SearchIcon,
  Menu,
  Upload,
  LogOut,
  Settings,
  User,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModeToggle } from "@/components/ModeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/home?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/signin");
  };

  return (
    <header className="sticky inset-x-0 top-0 z-50 w-full border-b border-border px-4 bg-background">
      <nav className="mx-auto flex max-w-7xl items-center py-2 gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <Video className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground hidden sm:block">
            StreamTube
          </span>
        </Link>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-xl mx-auto hidden sm:block"
        >
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-4 pr-12 rounded-full bg-muted border-border"
              placeholder="Search videos..."
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            >
              <SearchIcon className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Mobile Search */}
        <Button variant="ghost" size="icon" className="sm:hidden ml-auto">
          <SearchIcon className="h-5 w-5" />
        </Button>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <ModeToggle />

          {user ? (
            <>
              {/* Upload Button */}
              <Link href="/upload" className="hidden sm:block">
                <Button variant="ghost" size="icon">
                  <Upload className="h-5 w-5" />
                </Button>
              </Link>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.avatar || ""}
                        alt={user.username}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="font-medium">{user.fullname}</p>
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/@${user.username}`}>
                      <User className="mr-2 h-4 w-4" />
                      Your Channel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/signin">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
