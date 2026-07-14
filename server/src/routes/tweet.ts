import { Hono } from 'hono'
import { z } from 'zod'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth'
import { db as database } from '@/db'
import { subscriptions, tweets, users } from '@/db/schema'
import { and, desc, eq, inArray } from 'drizzle-orm'

const tweetIdParam = z.object({ tweetId: z.uuid('Invalid tweet ID') })

const userIdParam = z.object({ userId: z.uuid('Invalid user ID') })

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

tweet.get('/user/:userId', zValidator('param', userIdParam), async c => {
  const { userId } = c.req.valid('param')

  const db = database(c.env.DATABASE_URL)

  const tweets = await db.query.tweets.findMany({
    where: {
      userId,
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
    orderBy: (t, { desc: d }) => d(t.createdAt),
    limit: 10,
  })

  if (!tweets) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'Tweets not found')
  }

  return c.json(HTTP.Response(HttpPhrase.OK, { tweets }), HttpStatus.OK)
})

tweet.use('/*', authMiddleware)
tweet.get('/feed', async c => {
  const userId = c.get('user')
  const db = database(c.env.DATABASE_URL)

  const subscribedChannels = await db
    .select({ channelId: subscriptions.channelId })
    .from(subscriptions)
    .where(eq(subscriptions.subscriberId, userId))

  const channelIds = [
    userId,
    ...subscribedChannels.map(s => s.channelId),
  ]
  const uniqueChannelIds = [...new Set(channelIds)]

  const raw = await db
    .select({
      id: tweets.id,
      userId: tweets.userId,
      content: tweets.content,
      createdAt: tweets.createdAt,
      updatedAt: tweets.updatedAt,
      username: users.username,
      fullname: users.fullname,
      avatar: users.avatar,
    })
    .from(tweets)
    .innerJoin(users, eq(tweets.userId, users.id))
    .where(inArray(tweets.userId, uniqueChannelIds))
    .orderBy(desc(tweets.createdAt))
    .limit(50)

  const feed = raw.map(t => ({
    id: t.id,
    userId: t.userId,
    content: t.content,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    user: {
      id: t.userId,
      username: t.username,
      fullname: t.fullname,
      avatar: t.avatar,
    },
  }))

  return c.json(HTTP.Response(HttpPhrase.OK, { tweets: feed }), HttpStatus.OK)
})

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

tweet.patch(
  '/:tweetId',
  zValidator('param', tweetIdParam),
  zValidator('json', updateTweetSchema),
  async c => {
    const userId = c.get('user')
    const { tweetId } = c.req.valid('param')
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
  }
)

tweet.delete('/:tweetId', zValidator('param', tweetIdParam), async c => {
  const userId = c.get('user')
  const { tweetId } = c.req.valid('param')

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
