import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '@/db'
import {
  comments,
  tweetLikes,
  tweets,
  users,
  videoLikes,
  videos,
} from '@/db/schema'
import { HttpStatus } from '@/lib/const'
import { ApiError, ok } from '@/lib/http'
import { authMiddleware } from '@/middlewares/auth.middleware'

const like = new Hono<{ Variables: { user: string } }>()

like.use(authMiddleware)

like.post('/toggle/v/:videoId', async c => {
  const userId = c.get('user')
  const videoId = c.req.param('videoId')

  const [existingVideo] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1)

  if (!existingVideo) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Video not found')
  }

  const [existingLike] = await db
    .select()
    .from(videoLikes)
    .where(and(eq(videoLikes.userId, userId), eq(videoLikes.videoId, videoId)))
    .limit(1)

  if (existingLike) {
    await db
      .delete(videoLikes)
      .where(
        and(eq(videoLikes.userId, userId), eq(videoLikes.videoId, videoId))
      )

    await db
      .update(videos)
      .set({
        likeCount: Math.max(0, (existingVideo.likeCount || 0) - 1),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(videos.id, videoId))

    return ok(c, { liked: false }, 'Video unliked successfully')
  }

  await db.insert(videoLikes).values({ userId, videoId })

  await db
    .update(videos)
    .set({
      likeCount: (existingVideo.likeCount || 0) + 1,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(videos.id, videoId))

  return ok(c, { liked: true }, 'Video liked successfully')
})

like.post('/toggle/c/:commentId', async c => {
  const commentId = c.req.param('commentId')

  const [existingComment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1)

  if (!existingComment) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Comment not found')
  }

  return ok(c, { liked: false }, 'Comment like functionality not implemented')
})

like.post('/toggle/t/:tweetId', async c => {
  const userId = c.get('user')
  const tweetId = c.req.param('tweetId')

  const [existingTweet] = await db
    .select()
    .from(tweets)
    .where(eq(tweets.id, tweetId))
    .limit(1)

  if (!existingTweet) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Tweet not found')
  }

  const [existingLike] = await db
    .select()
    .from(tweetLikes)
    .where(and(eq(tweetLikes.userId, userId), eq(tweetLikes.tweetId, tweetId)))
    .limit(1)

  if (existingLike) {
    await db
      .delete(tweetLikes)
      .where(
        and(eq(tweetLikes.userId, userId), eq(tweetLikes.tweetId, tweetId))
      )

    return ok(c, { liked: false }, 'Tweet unliked successfully')
  }

  await db.insert(tweetLikes).values({ userId, tweetId })

  return ok(c, { liked: true }, 'Tweet liked successfully')
})

like.get('/videos', async c => {
  const userId = c.get('user')

  const likedVideos = await db
    .select({
      id: videos.id,
      title: videos.title,
      thumbnail: videos.thumbnail,
      videoFile: videos.videoFile,
      duration: videos.duration,
      viewCount: videos.viewCount,
      likeCount: videos.likeCount,
      commentCount: videos.commentCount,
      createdAt: videos.createdAt,
      user: {
        id: users.id,
        username: users.username,
        fullname: users.fullname,
        avatar: users.avatar,
      },
    })
    .from(videoLikes)
    .leftJoin(videos, eq(videoLikes.videoId, videos.id))
    .leftJoin(users, eq(videos.userId, users.id))
    .where(eq(videoLikes.userId, userId))

  return ok(c, { videos: likedVideos }, 'Liked videos retrieved successfully')
})

export default like
export type LikeType = typeof like
