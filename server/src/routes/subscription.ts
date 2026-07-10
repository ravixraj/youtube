import { Hono } from 'hono'
import { z } from 'zod'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth'
import { db as database } from '@/db'
import { subscriptions } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

const channelIdParam = z.object({ channelId: z.uuid('Invalid channel ID') })

const subscription = new Hono<{
  Bindings: CloudflareBindings
  Variables: { user: string }
}>().basePath('/subscriptions')

subscription.get(
  '/u/:channelId',
  zValidator('param', channelIdParam),
  async c => {
    const { channelId } = c.req.valid('param')

    const db = database(c.env.DATABASE_URL)

    const [channel] = await db.query.subscriptions.findMany({
      where: {
        channelId,
      },
      with: {
        subscriber: {
          columns: { id: true, username: true, fullname: true, avatar: true },
        },
      },
    })

    if (!channel) {
      throw HTTP.Error(HttpStatus.NOT_FOUND, 'Channel not found')
    }

    return c.json(HTTP.Response(HttpPhrase.OK, { channel }), HttpStatus.OK)
  }
)

subscription.use('/*', authMiddleware)
subscription.post(
  '/c/:channelId',
  zValidator('param', channelIdParam),
  async c => {
    const userId = c.get('user')
    const { channelId } = c.req.valid('param')
    const db = database(c.env.DATABASE_URL)

    if (userId === channelId) {
      throw HTTP.Error(
        HttpStatus.BAD_REQUEST,
        'You cannot subscribe to yourself'
      )
    }

    const [existingSub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, userId),
          eq(subscriptions.channelId, channelId)
        )
      )
      .limit(1)

    if (existingSub) {
      await db.delete(subscriptions).where(eq(subscriptions.id, existingSub.id))
      return c.json(
        HTTP.Response(HttpPhrase.OK, { subscribed: false }),
        HttpStatus.OK
      )
    }

    const [newSub] = await db
      .insert(subscriptions)
      .values({ subscriberId: userId, channelId })
      .returning({
        id: subscriptions.id,
        subscriberId: subscriptions.subscriberId,
        channelId: subscriptions.channelId,
        createdAt: subscriptions.createdAt,
      })

    return c.json(
      HTTP.Response(HttpPhrase.CREATED, {
        subscribed: true,
        subscription: newSub,
      }),
      HttpStatus.CREATED
    )
  }
)

subscription.get('/channels', async c => {
  const userId = c.get('user')

  const db = database(c.env.DATABASE_URL)

  const channels = await db.query.subscriptions.findMany({
    where: {
      subscriberId: userId,
    },
    with: {
      channel: {
        columns: { id: true, username: true, fullname: true, avatar: true },
      },
    },
  })

  return c.json(HTTP.Response(HttpPhrase.OK, { channels }), HttpStatus.OK)
})

export default subscription
export type SubscriptionType = typeof subscription
