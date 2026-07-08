import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
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
  thumbnail: text(),
  title: varchar({ length: 60 }).notNull(),
  description: text(),
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

export const subscriptions = pgTable('subscriptions', {
  id: uuid().primaryKey().notNull(),
  subscriberId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  channelId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
})

export const playlists = pgTable('playlists', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 30 }).notNull(),
  description: varchar({ length: 160 }),
  videoId: uuid()
    .notNull()
    .references(() => videos.id, { onDelete: 'cascade' }),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
})

export const comments = pgTable('comments', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text().notNull(),
  tweetId: uuid().references(() => tweets.id, { onDelete: 'cascade' }),
  videoId: uuid().references(() => videos.id, { onDelete: 'cascade' }),
  ...timestamps,
})

export const likes = pgTable('likes', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  commentId: uuid().references(() => comments.id, { onDelete: 'cascade' }),
  videoId: uuid().references(() => videos.id, { onDelete: 'cascade' }),
  tweetId: uuid().references(() => tweets.id, { onDelete: 'cascade' }),
  ...timestamps,
})

type User = typeof users.$inferSelect
type Video = typeof videos.$inferSelect
type Playlist = typeof playlists.$inferSelect
type Comment = typeof comments.$inferSelect
type Subscription = typeof subscriptions.$inferSelect
type Tweet = typeof tweets.$inferSelect
type Like = typeof likes.$inferSelect

export type { User, Video, Playlist, Comment, Subscription, Tweet, Like }
