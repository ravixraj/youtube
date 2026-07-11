const VideoCardSkeleton = () => {
  return (
    <div className="w-full bg-card rounded-xl overflow-hidden animate-pulse">
      {/* Thumbnail Skeleton */}
      <div className="relative w-full pt-[56.25%]">
        <div className="absolute inset-0 bg-muted"></div>
      </div>

      {/* Video Info Skeleton */}
      <div className="flex gap-3 p-3">
        {/* Avatar Skeleton */}
        <div className="h-9 w-9 rounded-full bg-muted shrink-0"></div>

        {/* Details Skeleton */}
        <div className="flex-1 space-y-2">
          {/* Title */}
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          {/* Channel Name */}
          <div className="h-3 bg-muted rounded w-1/2"></div>
          {/* Views & Date */}
          <div className="h-3 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );
};

export default VideoCardSkeleton;
