import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '@/db'
import { subscriptions, users, videos } from '@/db/schema'
import { HttpStatus } from '@/lib/const'
import { ApiError, ok } from '@/lib/http'
import { authMiddleware } from '@/middlewares/auth.middleware'

const dashboard = new Hono<{ Variables: { user: string } }>()

dashboard.use(authMiddleware)

dashboard.get('/stats', async c => {
  const userId = c.get('user')

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'User not found')
  }

  const [stats] = await db
    .select({
      totalVideos: sql<number>`count(*)::int`,
      totalViews: sql<number>`coalesce(sum(${videos.viewCount}), 0)::int`,
      totalLikes: sql<number>`coalesce(sum(${videos.likeCount}), 0)::int`,
      totalComments: sql<number>`coalesce(sum(${videos.commentCount}), 0)::int`,
    })
    .from(videos)
    .where(eq(videos.userId, userId))

  const [subscriberResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(eq(subscriptions.channelId, userId))

  return ok(
    c,
    {
      channelStats: {
        totalVideos: stats?.totalVideos ?? 0,
        totalViews: stats?.totalViews ?? 0,
        totalLikes: stats?.totalLikes ?? 0,
        totalComments: stats?.totalComments ?? 0,
        subscriberCount: subscriberResult?.count ?? 0,
      },
    },
    'Channel statistics retrieved successfully'
  )
})

dashboard.get('/videos', async c => {
  const userId = c.get('user')

  const channelVideos = await db.query.videos.findMany({
    columns: {
      id: true,
      title: true,
      thumbnail: true,
      videoFile: true,
      duration: true,
      viewCount: true,
      likeCount: true,
      commentCount: true,
      isPublished: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    where: eq(videos.userId, userId),
    orderBy: (t, { desc: d }) => d(t.createdAt),
  })

  return ok(
    c,
    { videos: channelVideos },
    'Channel videos retrieved successfully'
  )
})

export default dashboard
export type DashboardType = typeof dashboard
