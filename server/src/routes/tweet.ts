import { Hono } from 'hono'
import { z } from 'zod'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth'
import { db as database } from '@/db'
import { tweets } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

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

const tweet = new Hono<{
  Bindings: CloudflareBindings
  Variables: { user: string }
}>().basePath('/tweets')

tweet.get('/user/:userId', async c => {
  const { userId } = c.req.param()

  const db = database(c.env.DATABASE_URL)

  const tweets = await db.query.tweets.findMany({
    where: {
      userId,
    },
    orderBy: (t, { desc: d }) => d(t.createdAt),
    limit: 10,
  })

  if (!tweets) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'Tweets not found')
  }

  return c.json(HTTP.Response(HttpPhrase.OK, { tweets }), HttpStatus.OK)
})

tweet.use('/*', authMiddleware)
tweet.post('/', zValidator('json', createTweetSchema), async c => {
  const userId = c.get('user')
  const { content } = c.req.valid('json')

  const db = database(c.env.DATABASE_URL)

  const [newTweet] = await db
    .insert(tweets)
    .values({
      userId,
      content,
    })
    .returning({
      id: tweets.id,
      userId: tweets.userId,
      content: tweets.content,
      createdAt: tweets.createdAt,
      updatedAt: tweets.updatedAt,
    })

  if (!newTweet) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'Failed to create tweet')
  }

  return c.json(
    HTTP.Response(HttpPhrase.CREATED, { tweet: newTweet }),
    HttpStatus.CREATED
  )
})

tweet.patch('/:tweetId', zValidator('json', updateTweetSchema), async c => {
  const userId = c.get('user')
  const { tweetId } = c.req.param()
  const { content } = c.req.valid('json')

  const db = database(c.env.DATABASE_URL)

  const [updatedTweet] = await db
    .update(tweets)
    .set({
      content,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(tweets.id, tweetId), eq(tweets.userId, userId)))
    .returning({
      id: tweets.id,
      userId: tweets.userId,
      content: tweets.content,
      createdAt: tweets.createdAt,
      updatedAt: tweets.updatedAt,
    })

  if (!updatedTweet) {
    throw HTTP.Error(
      HttpStatus.NOT_FOUND,
      'Tweet not found or you are not authorized to update it'
    )
  }

  return c.json(
    HTTP.Response(HttpPhrase.OK, { tweet: updatedTweet }),
    HttpStatus.OK
  )
})

tweet.delete('/:tweetId', async c => {
  const userId = c.get('user')
  const { tweetId } = c.req.param()

  const db = database(c.env.DATABASE_URL)

  const [deletedTweet] = await db
    .delete(tweets)
    .where(and(eq(tweets.id, tweetId), eq(tweets.userId, userId)))
    .returning({
      id: tweets.id,
      userId: tweets.userId,
      content: tweets.content,
      createdAt: tweets.createdAt,
      updatedAt: tweets.updatedAt,
    })

  if (!deletedTweet) {
    throw HTTP.Error(
      HttpStatus.NOT_FOUND,
      'Tweet not found or you are not authorized to delete it'
    )
  }

  return c.json(
    HTTP.Response(HttpPhrase.OK, { tweet: deletedTweet }),
    HttpStatus.OK
  )
})

export default tweet
export type TweetType = typeof tweet
