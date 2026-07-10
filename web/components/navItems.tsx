import {
  Home,
  Heart,
  History,
  Upload,
  MessageCircle,
  ListVideo,
  Search,
  UserCheck,
  Settings,
} from "lucide-react";

export const navItems = [
  {
    name: "Home",
    path: "/home",
    mobileView: true,
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: "Search",
    path: "/search",
    mobileView: true,
    icon: <Search className="h-5 w-5" />,
  },
  {
    name: "Tweets",
    path: "/tweets",
    mobileView: true,
    icon: <MessageCircle className="h-5 w-5" />,
  },
  {
    name: "Upload",
    path: "/upload",
    mobileView: true,
    icon: <Upload className="h-5 w-5" />,
  },
  {
    name: "Playlists",
    path: "/playlists",
    mobileView: false,
    icon: <ListVideo className="h-5 w-5" />,
  },
  {
    name: "Liked Videos",
    path: "/liked-videos",
    mobileView: false,
    icon: <Heart className="h-5 w-5" />,
  },
  {
    name: "History",
    path: "/history",
    mobileView: true,
    icon: <History className="h-5 w-5" />,
  },
  {
    name: "Subscriptions",
    path: "/subscriptions",
    mobileView: true,
    icon: <UserCheck className="h-5 w-5" />,
  },
  {
    name: "Settings",
    path: "/settings",
    mobileView: false,
    icon: <Settings className="h-5 w-5" />,
  },
];
