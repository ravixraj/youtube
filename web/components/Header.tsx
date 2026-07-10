"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Video,
  Bell,
  Upload,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ModeToggle } from "./ModeToggle";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
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
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-30 md:left-64">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-muted rounded-lg transition-colors md:hidden"
          >
            <Menu className="h-6 w-6 text-foreground" />
          </button>

          {/* Mobile Logo */}
          <Link href="/home" className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <Video className="h-5 w-5 text-white" />
            </div>
          </Link>
        </div>

        {/* Center Section - Search */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-2xl mx-4 hidden sm:block"
        >
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos..."
              className="w-full h-10 pl-4 pr-12 rounded-full bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-10 px-4 rounded-r-full bg-muted hover:bg-muted/80 border-l border-border transition-colors"
            >
              <Search className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </form>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          <button className="p-2 hover:bg-muted rounded-lg transition-colors sm:hidden">
            <Search className="h-5 w-5 text-foreground" />
          </button>

          <ModeToggle />

          {user ? (
            <>
              {/* Upload Button */}
              <Link href="/upload">
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <Upload className="h-5 w-5" />
                </Button>
              </Link>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Bell className="h-5 w-5" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.avatar || ""}
                        alt={user.username}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="font-medium text-foreground">
                      {user.fullname}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/@${user.username}`}
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Your Channel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/signin">
              <Button variant="default" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
