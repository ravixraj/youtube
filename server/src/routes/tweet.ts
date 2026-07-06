import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@/db'
import { tweets } from '@/db/schema'
import { HttpStatus } from '@/lib/const'
import { ApiError, created, ok } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth.middleware'

const createTweetSchema = z.object({
  content: z
    .string()
    .min(1, 'Tweet content cannot be empty')
    .max(200, 'Tweet cannot exceed 200 characters'),
})

const updateTweetSchema = z.object({
  content: z
    .string()
    .min(1, 'Tweet content cannot be empty')
    .max(200, 'Tweet cannot exceed 200 characters'),
})

const tweet = new Hono<{ Variables: { user: string } }>()

tweet.get('/user/:userId', async c => {
  const userId = c.req.param('userId')
  const { page, limit } = c.req.query()
  const normalizedPage = Math.max(1, Number(page) || 1)
  const normalizedLimit = Math.min(50, Math.max(1, Number(limit) || 10))
  const offset = (normalizedPage - 1) * normalizedLimit

  const [total, userTweets] = await Promise.all([
    db.$count(tweets, eq(tweets.userId, userId)),
    db.query.tweets.findMany({
      columns: {
        id: true,
        userId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            fullname: true,
            avatar: true,
          },
        },
      },
      where: eq(tweets.userId, userId),
      orderBy: (t, { desc: d }) => d(t.createdAt),
      limit: normalizedLimit,
      offset,
    }),
  ])

  const totalPages = Math.ceil(total / normalizedLimit)

  return ok(
    c,
    {
      tweets: userTweets,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages,
      },
    },
    'User tweets retrieved successfully'
  )
})

tweet.use('/*', authMiddleware)

tweet.post('/', zValidator('json', createTweetSchema), async c => {
  const userId = c.get('user')
  const { content } = createTweetSchema.parse(await c.req.json())

  const [newTweet] = await db
    .insert(tweets)
    .values({
      id: crypto.randomUUID(),
      userId,
      content,
      updatedAt: new Date().toISOString(),
    })
    .returning({
      id: tweets.id,
      userId: tweets.userId,
      content: tweets.content,
      createdAt: tweets.createdAt,
      updatedAt: tweets.updatedAt,
    })

  return created(c, { tweet: newTweet }, 'Tweet created successfully')
})

tweet.patch('/:tweetId', zValidator('json', updateTweetSchema), async c => {
  const userId = c.get('user')
  const tweetId = c.req.param('tweetId')

  const { content } = updateTweetSchema.parse(await c.req.json())

  const [existingTweet] = await db
    .select()
    .from(tweets)
    .where(eq(tweets.id, tweetId))
    .limit(1)

  if (!existingTweet) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Tweet not found')
  }

  if (existingTweet.userId !== userId) {
    throw new ApiError(
      HttpStatus.FORBIDDEN,
      'You are not authorized to update this tweet'
    )
  }

  const [updatedTweet] = await db
    .update(tweets)
    .set({
      content,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tweets.id, tweetId))
    .returning({
      id: tweets.id,
      userId: tweets.userId,
      content: tweets.content,
      createdAt: tweets.createdAt,
      updatedAt: tweets.updatedAt,
    })

  return ok(c, { tweet: updatedTweet }, 'Tweet updated successfully')
})

tweet.delete('/:tweetId', async c => {
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

  if (existingTweet.userId !== userId) {
    throw new ApiError(
      HttpStatus.FORBIDDEN,
      'You are not authorized to delete this tweet'
    )
  }

  await db.delete(tweets).where(eq(tweets.id, tweetId))

  return ok(c, null, 'Tweet deleted successfully')
})

export default tweet
export type TweetType = typeof tweet
