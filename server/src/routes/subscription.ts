import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '@/db'
import { subscriptions, users } from '@/db/schema'
import { HttpStatus } from '@/lib/const'
import { ApiError, ok } from '@/lib/http'
import { authMiddleware } from '@/middlewares/auth.middleware'

const subscription = new Hono<{ Variables: { user: string } }>()

subscription.use(authMiddleware)

subscription.post('/c/:channelId', async c => {
  const userId = c.get('user')
  const channelId = c.req.param('channelId')

  if (userId === channelId) {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      'You cannot subscribe to your own channel'
    )
  }

  const [channel] = await db
    .select()
    .from(users)
    .where(eq(users.id, channelId))
    .limit(1)

  if (!channel) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Channel not found')
  }

  const [existingSubscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.subscriberId, userId),
        eq(subscriptions.channelId, channelId)
      )
    )
    .limit(1)

  if (existingSubscription) {
    await db
      .delete(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, userId),
          eq(subscriptions.channelId, channelId)
        )
      )

    return ok(c, { subscribed: false }, 'Unsubscribed successfully')
  }

  await db.insert(subscriptions).values({
    id: crypto.randomUUID(),
    subscriberId: userId,
    channelId,
    updatedAt: new Date().toISOString(),
  })

  return ok(c, { subscribed: true }, 'Subscribed successfully')
})

subscription.get('/channels', async c => {
  const userId = c.get('user')

  const subscribedChannels = await db.query.subscriptions.findMany({
    columns: {},
    with: {
      channel: {
        columns: {
          id: true,
          username: true,
          fullname: true,
          avatar: true,
        },
      },
    },
    where: eq(subscriptions.subscriberId, userId),
  })

  const channels = subscribedChannels.map(s => s.channel)

  return ok(
    c,
    { channels },
    'Subscribed channels retrieved successfully'
  )
})

subscription.get('/u/:channelId', async c => {
  const channelId = c.req.param('channelId')

  const subscriberRows = await db.query.subscriptions.findMany({
    columns: {},
    with: {
      subscriber: {
        columns: {
          id: true,
          username: true,
          fullname: true,
          avatar: true,
        },
      },
    },
    where: eq(subscriptions.channelId, channelId),
  })

  const subscribers = subscriberRows.map(s => s.subscriber)

  return ok(c, { subscribers }, 'Subscribers retrieved successfully')
})

export default subscription
export type SubscriptionType = typeof subscription
