"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, ListVideo, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const MobileNav = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      title: "Home",
      href: "/home",
      icon: Home,
    },
    {
      title: "Explore",
      href: "/explore",
      icon: Search,
    },
    {
      title: "Upload",
      href: "/upload",
      icon: Upload,
      requiresAuth: true,
    },
    {
      title: "Subscriptions",
      href: "/subscriptions",
      icon: Heart,
      requiresAuth: true,
    },
    {
      title: "Library",
      href: "/library",
      icon: ListVideo,
    },
  ];

  const filteredItems = navItems.filter((item) => !item.requiresAuth || user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border z-30 md:hidden">
      <div className="flex items-center justify-around h-full">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.title}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon
                className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`}
              />
              <span className="text-xs mt-1 font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
