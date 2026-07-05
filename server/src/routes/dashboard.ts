import { eq } from 'drizzle-orm'
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

  const userVideos = await db
    .select()
    .from(videos)
    .where(eq(videos.userId, userId))

  const totalVideos = userVideos.length
  const totalViews = userVideos.reduce((sum, v) => sum + (v.viewCount || 0), 0)
  const totalLikes = userVideos.reduce((sum, v) => sum + (v.likeCount || 0), 0)
  const totalComments = userVideos.reduce(
    (sum, v) => sum + (v.commentCount || 0),
    0
  )

  const subscriberCount = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.channelId, userId))
    .then(res => res.length)

  return ok(
    c,
    {
      channelStats: {
        totalVideos,
        totalViews,
        totalLikes,
        totalComments,
        subscriberCount,
      },
    },
    'Channel statistics retrieved successfully'
  )
})

dashboard.get('/videos', async c => {
  const userId = c.get('user')

  const channelVideos = await db
    .select({
      id: videos.id,
      title: videos.title,
      thumbnail: videos.thumbnail,
      videoFile: videos.videoFile,
      duration: videos.duration,
      viewCount: videos.viewCount,
      likeCount: videos.likeCount,
      commentCount: videos.commentCount,
      isPublished: videos.isPublished,
      publishedAt: videos.publishedAt,
      createdAt: videos.createdAt,
      updatedAt: videos.updatedAt,
    })
    .from(videos)
    .where(eq(videos.userId, userId))

  return ok(
    c,
    { videos: channelVideos },
    'Channel videos retrieved successfully'
  )
})

export default dashboard
export type DashboardType = typeof dashboard
