import { sql } from 'drizzle-orm'
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const tweets = pgTable(
  'tweets',
  {
    id: uuid().primaryKey().notNull(),
    userId: uuid().notNull(),
    content: varchar({ length: 200 }).notNull(),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  },
  table => [
    index('tweets_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'tweets_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid().primaryKey().notNull(),
    subscriberId: uuid().notNull(),
    channelId: uuid().notNull(),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  },
  table => [
    index('subscriptions_channelId_idx').using(
      'btree',
      table.channelId.asc().nullsLast().op('uuid_ops')
    ),
    uniqueIndex('subscriptions_subscriberId_channelId_key').using(
      'btree',
      table.subscriberId.asc().nullsLast().op('uuid_ops'),
      table.channelId.asc().nullsLast().op('uuid_ops')
    ),
    index('subscriptions_subscriberId_idx').using(
      'btree',
      table.subscriberId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.subscriberId],
      foreignColumns: [users.id],
      name: 'subscriptions_subscriberId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.channelId],
      foreignColumns: [users.id],
      name: 'subscriptions_channelId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const playlists = pgTable(
  'playlists',
  {
    id: uuid().primaryKey().notNull(),
    userId: uuid().notNull(),
    name: varchar({ length: 30 }).notNull(),
    description: varchar({ length: 160 }),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  },
  table => [
    index('UserPlaylist').using(
      'btree',
      table.userId.asc().nullsLast().op('text_ops'),
      table.name.asc().nullsLast().op('text_ops')
    ),
    index('playlists_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'playlists_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const comments = pgTable(
  'comments',
  {
    id: uuid().primaryKey().notNull(),
    userId: uuid().notNull(),
    videoId: uuid().notNull(),
    parentCommentId: uuid(),
    content: text().notNull(),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  },
  table => [
    index('comments_parentCommentId_idx').using(
      'btree',
      table.parentCommentId.asc().nullsLast().op('uuid_ops')
    ),
    index('comments_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    ),
    index('comments_videoId_idx').using(
      'btree',
      table.videoId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'comments_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.videoId],
      foreignColumns: [videos.id],
      name: 'comments_videoId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.parentCommentId],
      foreignColumns: [table.id],
      name: 'comments_parentCommentId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('set null'),
  ]
)

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().notNull(),
    fullname: varchar({ length: 20 }).notNull(),
    username: varchar({ length: 12 }).notNull(),
    email: text().notNull(),
    password: text().notNull(),
    avatar: text(),
    coverImage: text(),
    refreshToken: text(),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  },
  table => [
    uniqueIndex('users_email_key').using(
      'btree',
      table.email.asc().nullsLast().op('text_ops')
    ),
    uniqueIndex('users_refreshToken_key').using(
      'btree',
      table.refreshToken.asc().nullsLast().op('text_ops')
    ),
    uniqueIndex('users_username_key').using(
      'btree',
      table.username.asc().nullsLast().op('text_ops')
    ),
  ]
)

export const videos = pgTable(
  'videos',
  {
    id: uuid().primaryKey().notNull(),
    userId: uuid().notNull(),
    videoFile: text().notNull(),
    thumbnail: text().notNull(),
    title: varchar({ length: 60 }).notNull(),
    description: varchar({ length: 160 }),
    duration: integer().notNull(),
    viewCount: integer().default(0).notNull(),
    likeCount: integer().default(0).notNull(),
    commentCount: integer().default(0).notNull(),
    isPublished: boolean().default(true).notNull(),
    publishedAt: timestamp({ precision: 3, mode: 'string' }),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  },
  table => [
    index('videos_isPublished_publishedAt_idx').using(
      'btree',
      table.isPublished.asc().nullsLast().op('timestamp_ops'),
      table.publishedAt.desc().nullsFirst().op('bool_ops')
    ),
    index('videos_title_idx').using(
      'btree',
      table.title.asc().nullsLast().op('text_ops')
    ),
    index('videos_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'videos_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
)

export const playlistToVideo = pgTable(
  '_PlaylistToVideo',
  {
    a: uuid('A').notNull(),
    b: uuid('B').notNull(),
  },
  table => [
    index().using('btree', table.b.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.a],
      foreignColumns: [playlists.id],
      name: '_PlaylistToVideo_A_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.b],
      foreignColumns: [videos.id],
      name: '_PlaylistToVideo_B_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    primaryKey({
      columns: [table.a, table.b],
      name: '_PlaylistToVideo_AB_pkey',
    }),
  ]
)

export const videoLikes = pgTable(
  'video_likes',
  {
    userId: uuid().notNull(),
    videoId: uuid().notNull(),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  table => [
    index('video_likes_videoId_createdAt_idx').using(
      'btree',
      table.videoId.asc().nullsLast().op('timestamp_ops'),
      table.createdAt.desc().nullsFirst().op('timestamp_ops')
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'video_likes_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.videoId],
      foreignColumns: [videos.id],
      name: 'video_likes_videoId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    primaryKey({
      columns: [table.userId, table.videoId],
      name: 'video_likes_pkey',
    }),
  ]
)

export const tweetLikes = pgTable(
  'tweet_likes',
  {
    userId: uuid().notNull(),
    tweetId: uuid().notNull(),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  table => [
    index('tweet_likes_tweetId_idx').using(
      'btree',
      table.tweetId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'tweet_likes_userId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.tweetId],
      foreignColumns: [tweets.id],
      name: 'tweet_likes_tweetId_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    primaryKey({
      columns: [table.userId, table.tweetId],
      name: 'tweet_likes_pkey',
    }),
  ]
)

type User = typeof users.$inferSelect
type Video = typeof videos.$inferSelect
type Playlist = typeof playlists.$inferSelect
type Comment = typeof comments.$inferSelect
type Subscription = typeof subscriptions.$inferSelect
type Tweet = typeof tweets.$inferSelect

export type { User, Video, Playlist, Comment, Subscription, Tweet }
