import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db as database } from '@/db'
import { subscriptions, users, videos } from '@/db/schema'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { authMiddleware } from '@/middlewares/auth'

const dashboard = new Hono<{
  Bindings: CloudflareBindings
  Variables: { user: string }
}>().basePath('/dashboard')

dashboard.use(authMiddleware)

dashboard.get('/stats', async c => {
  const userId = c.get('user')

  const db = database(c.env.DATABASE_URL)
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'User not found')
  }

  const [stats] = await db
    .select({
      totalVideos: sql<number>`count(*)::int`,
      totalViews: sql<number>`coalesce(sum(${videos.viewCount}), 0)::int`,
    })
    .from(videos)
    .where(eq(videos.userId, userId))

  const [subscriberResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(eq(subscriptions.channelId, userId))

  return c.json(
    HTTP.Response(HttpPhrase.OK, {
      channelStats: {
        totalVideos: stats?.totalVideos ?? 0,
        totalViews: stats?.totalViews ?? 0,
        subscriberCount: subscriberResult?.count ?? 0,
      },
    }),
    HttpStatus.OK
  )
})

dashboard.get('/videos', async c => {
  const userId = c.get('user')

  const db = database(c.env.DATABASE_URL)
  const channelVideos = await db.query.videos.findMany({
    columns: {
      id: true,
      title: true,
      thumbnail: true,
      videoFile: true,
      duration: true,
      viewCount: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
    },
    where: {
      userId: userId,
    },
    orderBy: (t, { desc: d }) => d(t.createdAt),
  })

  return c.json(
    HTTP.Response(HttpPhrase.OK, { videos: channelVideos }),
    HttpStatus.OK
  )
})

export default dashboard
export type DashboardType = typeof dashboard
