import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    tweets: r.many.tweets(),
    subscriptionsAsSubscriber: r.many.subscriptions({
      from: r.users.id,
      to: r.subscriptions.subscriberId,
      alias: "subscriptions_subscriberId_users_id",
    }),
    subscriptionsAsChannel: r.many.subscriptions({
      from: r.users.id,
      to: r.subscriptions.channelId,
      alias: "subscriptions_channelId_users_id",
    }),
    playlists: r.many.playlists(),
    comments: r.many.comments(),
    videos: r.many.videos(),
    videoLikes: r.many.videoLikes(),
    tweetLikes: r.many.tweetLikes(),
  },

  tweets: {
    user: r.one.users({
      from: r.tweets.userId,
      to: r.users.id,
    }),
    tweetLikes: r.many.tweetLikes(),
  },

  subscriptions: {
    subscriber: r.one.users({
      from: r.subscriptions.subscriberId,
      to: r.users.id,
      alias: "subscriptions_subscriberId_users_id",
    }),
    channel: r.one.users({
      from: r.subscriptions.channelId,
      to: r.users.id,
      alias: "subscriptions_channelId_users_id",
    }),
  },

  playlists: {
    user: r.one.users({
      from: r.playlists.userId,
      to: r.users.id,
    }),
    videos: r.many.videos({
      from: r.playlists.id.through(r.playlistToVideo.a),
      to: r.videos.id.through(r.playlistToVideo.b),
    }),
  },

  comments: {
    user: r.one.users({
      from: r.comments.userId,
      to: r.users.id,
    }),
    video: r.one.videos({
      from: r.comments.videoId,
      to: r.videos.id,
    }),
    parentComment: r.one.comments({
      from: r.comments.parentCommentId,
      to: r.comments.id,
      alias: "comments_parentCommentId_comments_id",
    }),
    replies: r.many.comments({
      from: r.comments.id,
      to: r.comments.parentCommentId,
      alias: "comments_parentCommentId_comments_id",
    }),
  },

  videos: {
    user: r.one.users({
      from: r.videos.userId,
      to: r.users.id,
    }),
    comments: r.many.comments(),
    playlists: r.many.playlists({
      from: r.videos.id.through(r.playlistToVideo.b),
      to: r.playlists.id.through(r.playlistToVideo.a),
    }),
    videoLikes: r.many.videoLikes(),
  },

  playlistToVideo: {
    playlist: r.one.playlists({
      from: r.playlistToVideo.a,
      to: r.playlists.id,
    }),
    video: r.one.videos({
      from: r.playlistToVideo.b,
      to: r.videos.id,
    }),
  },

  videoLikes: {
    user: r.one.users({
      from: r.videoLikes.userId,
      to: r.users.id,
    }),
    video: r.one.videos({
      from: r.videoLikes.videoId,
      to: r.videos.id,
    }),
  },

  tweetLikes: {
    user: r.one.users({
      from: r.tweetLikes.userId,
      to: r.users.id,
    }),
    tweet: r.one.tweets({
      from: r.tweetLikes.tweetId,
      to: r.tweets.id,
    }),
  },
}));
