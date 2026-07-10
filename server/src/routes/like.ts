import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth'
import { db as database } from '@/db'
import { comments, likes, tweets, videos } from '@/db/schema'

const videoIdParam = z.object({ videoId: z.uuid('Invalid video ID') })

const commentIdParam = z.object({ commentId: z.uuid('Invalid comment ID') })

const tweetIdParam = z.object({ tweetId: z.uuid('Invalid tweet ID') })

const like = new Hono<{
  Bindings: CloudflareBindings
  Variables: { user: string }
}>().basePath('/likes')

like.use(authMiddleware)

like.post('/toggle/v/:videoId', zValidator('param', videoIdParam), async c => {
  const userId = c.get('user')
  const { videoId } = c.req.valid('param')

  const db = database(c.env.DATABASE_URL)

  const [video] = await db
    .select({ id: videos.id })
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1)

  if (!video) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'Video not found')
  }

  const [existingLike] = await db
    .select({ id: likes.id })
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.videoId, videoId)))
    .limit(1)

  if (existingLike) {
    await db.delete(likes).where(eq(likes.id, existingLike.id))
    return c.json(HTTP.Response(HttpPhrase.OK, { liked: false }), HttpStatus.OK)
  }

  await db.insert(likes).values({ userId, videoId })
  return c.json(
    HTTP.Response(HttpPhrase.CREATED, { liked: true }),
    HttpStatus.CREATED
  )
})

like.post(
  '/toggle/c/:commentId',
  zValidator('param', commentIdParam),
  async c => {
    const userId = c.get('user')
    const { commentId } = c.req.valid('param')

    const db = database(c.env.DATABASE_URL)

    const [comment] = await db
      .select({ id: comments.id })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1)
    if (!comment) {
      throw HTTP.Error(HttpStatus.NOT_FOUND, 'Comment not found')
    }

    const [existingLike] = await db
      .select({ id: likes.id })
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.commentId, commentId)))
      .limit(1)

    if (existingLike) {
      await db.delete(likes).where(eq(likes.id, existingLike.id))
      return c.json(
        HTTP.Response(HttpPhrase.OK, { liked: false }),
        HttpStatus.OK
      )
    }

    await db.insert(likes).values({ userId, commentId })
    return c.json(
      HTTP.Response(HttpPhrase.CREATED, { liked: true }),
      HttpStatus.CREATED
    )
  }
)

like.post('/toggle/t/:tweetId', zValidator('param', tweetIdParam), async c => {
  const userId = c.get('user')
  const { tweetId } = c.req.valid('param')

  const db = database(c.env.DATABASE_URL)

  const [tweet] = await db
    .select({ id: tweets.id })
    .from(tweets)
    .where(eq(tweets.id, tweetId))
    .limit(1)
  if (!tweet) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'Tweet not found')
  }

  const [existingLike] = await db
    .select({ id: likes.id })
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.tweetId, tweetId)))
    .limit(1)

  if (existingLike) {
    await db.delete(likes).where(eq(likes.id, existingLike.id))
    return c.json(HTTP.Response(HttpPhrase.OK, { liked: false }), HttpStatus.OK)
  }

  await db.insert(likes).values({ userId, tweetId })
  return c.json(
    HTTP.Response(HttpPhrase.CREATED, { liked: true }),
    HttpStatus.CREATED
  )
})

like.get('/videos', async c => {
  const userId = c.get('user')

  const db = database(c.env.DATABASE_URL)

  const likedVideos = await db.query.likes.findMany({
    where: {
      userId,
    },
  })

  if (!likedVideos) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'Liked videos not found')
  }

  return c.json(HTTP.Response(HttpPhrase.OK, { likedVideos }), HttpStatus.OK)
})

export default like
export type LikeType = typeof like
