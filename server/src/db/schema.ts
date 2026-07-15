import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp({ precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}

export const users = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),
  fullname: varchar({ length: 20 }).notNull(),
  username: varchar({ length: 12 }).unique().notNull(),
  email: text().unique().notNull(),
  password: text().notNull(),
  avatar: text(),
  coverImage: text(),
  refreshToken: text(),
  ...timestamps,
})

export const videos = pgTable('videos', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  videoFile: text().notNull(),
  thumbnail: text().notNull(),
  title: varchar({ length: 60 }).notNull(),
  description: varchar({ length: 160 }).notNull(),
  duration: integer().notNull(),
  viewCount: integer().default(0).notNull(),
  isPublished: boolean().default(true).notNull(),
  ...timestamps,
})

export const tweets = pgTable('tweets', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text().notNull(),
  ...timestamps,
})

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid().defaultRandom().primaryKey(),
    subscriberId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    channelId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  table => [unique().on(table.subscriberId, table.channelId)]
)

export const playlists = pgTable('playlists', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 30 }).notNull(),
  description: varchar({ length: 100 }).notNull(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
})

export const playlistVideos = pgTable('playlist_videos', {
  id: uuid().defaultRandom().primaryKey(),
  playlistId: uuid()
    .notNull()
    .references(() => playlists.id, { onDelete: 'cascade' }),
  videoId: uuid()
    .notNull()
    .references(() => videos.id, { onDelete: 'cascade' }),
  position: integer().default(0).notNull(),
  ...timestamps,
})

export const comments = pgTable('comments', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text().notNull(),
  videoId: uuid()
    .notNull()
    .references(() => videos.id, { onDelete: 'cascade' }),
  ...timestamps,
})

export const likes = pgTable(
  'likes',
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    commentId: uuid().references(() => comments.id, { onDelete: 'cascade' }),
    videoId: uuid().references(() => videos.id, { onDelete: 'cascade' }),
    tweetId: uuid().references(() => tweets.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  table => [
    unique('unique_user_video_like').on(table.userId, table.videoId),
    unique('unique_user_comment_like').on(table.userId, table.commentId),
    unique('unique_user_tweet_like').on(table.userId, table.tweetId),
  ]
)

type User = typeof users.$inferSelect
type Video = typeof videos.$inferSelect
type Playlist = typeof playlists.$inferSelect
type PlaylistVideo = typeof playlistVideos.$inferSelect
type Comment = typeof comments.$inferSelect
type Subscription = typeof subscriptions.$inferSelect
type Tweet = typeof tweets.$inferSelect
type Like = typeof likes.$inferSelect

export type {
  User,
  Video,
  Playlist,
  PlaylistVideo,
  Comment,
  Subscription,
  Tweet,
  Like,
}
