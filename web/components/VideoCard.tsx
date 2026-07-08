"use client";

import Link from "next/link";
import { type Video } from "@/lib/api";

interface VideoCardProps {
  video: Video;
  onClick?: (videoId: string) => void;
}

const VideoCard = ({ video, onClick }: VideoCardProps) => {
  const handleClick = () => {
    if (onClick) {
      onClick(video.id);
    }
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const CardContent = (
    <div
      className="w-full bg-card rounded-xl overflow-hidden cursor-pointer group hover:shadow-lg dark:hover:shadow-primary/5 transition-all duration-300"
      onClick={handleClick}
    >
      <div className="relative w-full pt-[56.25%]">
        <div className="absolute inset-0">
          <img
            src={video.thumbnail || "/placeholder-video.jpg"}
            alt={video.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
          {formatDuration(video.duration)}
        </span>
      </div>

      <div className="flex gap-3 p-3">
        <Link
          href={`/@${video.owner?.username || "unknown"}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          <div className="h-9 w-9 rounded-full overflow-hidden bg-muted">
            {video.owner?.avatar ? (
              <img
                src={video.owner.avatar}
                alt={video.owner.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground font-medium">
                {video.owner?.username?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-snug group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <Link
            href={`/@${video.owner?.username || "unknown"}`}
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            {video.owner?.fullname || video.owner?.username || "Unknown"}
          </Link>
          <p className="text-muted-foreground text-xs mt-0.5">
            {formatViewCount(video.viewCount)} views ·{" "}
            {formatDate(video.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return CardContent;
  }

  return <Link href={`/watch/${video.id}`}>{CardContent}</Link>;
};

export default VideoCard;
