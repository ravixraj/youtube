import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, r => ({
  users: {
    videos: r.many.videos(),
    tweets: r.many.tweets(),
    subscriptionsAsSubscriber: r.many.subscriptions({
      from: r.users.id,
      to: r.subscriptions.subscriberId,
      alias: 'subscriptions_subscriberId_users_id',
    }),
    subscriptionsAsChannel: r.many.subscriptions({
      from: r.users.id,
      to: r.subscriptions.channelId,
      alias: 'subscriptions_channelId_users_id',
    }),
    playlists: r.many.playlists(),
    comments: r.many.comments(),
    likes: r.many.likes(),
  },

  videos: {
    user: r.one.users({
      from: r.videos.userId,
      to: r.users.id,
    }),
    comments: r.many.comments(),
    likes: r.many.likes(),
    playlists: r.many.playlists(),
  },

  tweets: {
    user: r.one.users({
      from: r.tweets.userId,
      to: r.users.id,
    }),
    likes: r.many.likes(),
  },

  subscriptions: {
    subscriber: r.one.users({
      from: r.subscriptions.subscriberId,
      to: r.users.id,
      alias: 'subscriptions_subscriberId_users_id',
    }),
    channel: r.one.users({
      from: r.subscriptions.channelId,
      to: r.users.id,
      alias: 'subscriptions_channelId_users_id',
    }),
  },

  playlists: {
    user: r.one.users({
      from: r.playlists.userId,
      to: r.users.id,
    }),
    video: r.one.videos({
      from: r.playlists.videoId,
      to: r.videos.id,
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
    likes: r.many.likes(),
  },

  likes: {
    user: r.one.users({
      from: r.likes.userId,
      to: r.users.id,
    }),
    video: r.one.videos({
      from: r.likes.videoId,
      to: r.videos.id,
    }),
    tweet: r.one.tweets({
      from: r.likes.tweetId,
      to: r.tweets.id,
    }),
    comment: r.one.comments({
      from: r.likes.commentId,
      to: r.comments.id,
    }),
  },
}))
