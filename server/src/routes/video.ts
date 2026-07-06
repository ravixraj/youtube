import { and, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@/db'
import { videos } from '@/db/schema'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { ACCEPTED_MIMES, HttpStatus, MAX_IMAGE_BYTES } from '@/lib/const'
import { coerceFile, parseRequestBody } from '@/lib/helper'
import { ApiError, created, ok } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth.middleware'

const videoFile = z
  .instanceof(File)
  .refine(file => file.size > 0, 'Video file is required')

const imageFile = z
  .instanceof(File)
  .refine(file => file.size > 0, 'File required')
  .refine(file => file.size <= MAX_IMAGE_BYTES, {
    message: `Max size ${MAX_IMAGE_BYTES} bytes`,
  })
  .refine(file => !file.type || ACCEPTED_MIMES.includes(file.type), {
    message: `Allowed types: ${ACCEPTED_MIMES.join(', ')}`,
  })

const searchVideosSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
  query: z.string().optional(),
  sortBy: z
    .enum(['createdAt', 'viewCount', 'likeCount', 'duration'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  userId: z.string().optional(),
})

const createVideoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isPublished: z.union([z.boolean(), z.string()]).optional().default(true),
  videoFile,
  thumbnail: imageFile.optional(),
})

const video = new Hono<{ Variables: { user: string } }>()

video.get('/', zValidator('query', searchVideosSchema), async c => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    userId,
  } = searchVideosSchema.parse(c.req.query())

  const normalizedPage = Math.max(1, Number(page))
  const normalizedLimit = Math.min(50, Math.max(1, Number(limit)))
  const offset = (normalizedPage - 1) * normalizedLimit

  const whereConditions: SQL[] = []
  if (query) {
    whereConditions.push(
      or(
        ilike(videos.title, `%${query}%`),
        ilike(videos.description, `%${query}%`)
      )
    )
  }
  if (userId) {
    whereConditions.push(eq(videos.userId, userId))
  }
  whereConditions.push(eq(videos.isPublished, true))

  const where =
    whereConditions.length > 0 ? and(...whereConditions) : undefined

  const [total, videoList] = await Promise.all([
    db.$count(videos, where),
    db.query.videos.findMany({
      columns: {
        id: true,
        title: true,
        description: true,
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
      where,
      orderBy: (t, { asc: a, desc: d }) => {
        const col = t[sortBy as keyof typeof t]
        return sortOrder === 'asc' ? a(col) : d(col)
      },
      limit: normalizedLimit,
      offset,
    }),
  ])

  const totalPages = Math.ceil(total / normalizedLimit)

  return ok(
    c,
    {
      videos: videoList,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages,
      },
    },
    'Videos retrieved successfully'
  )
})

video.get('/:videoId', async c => {
  const videoId = c.req.param('videoId')

  const existingVideo = await db.query.videos.findFirst({
    columns: {
      id: true,
      title: true,
      description: true,
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
    where: eq(videos.id, videoId),
  })

  if (!existingVideo) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Video not found')
  }

  await db
    .update(videos)
    .set({
      viewCount: (existingVideo.viewCount || 0) + 1,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(videos.id, videoId))

  return ok(c, { video: existingVideo }, 'Video retrieved successfully')
})

video.use('/*', authMiddleware)

video.post('/', zValidator('form', createVideoSchema), async c => {
  const userId = c.get('user')
  const {
    title,
    description,
    isPublished = true,
    videoFile,
    thumbnail,
  } = createVideoSchema.parse(await c.req.parseBody())

  if (!videoFile) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Video file is required')
  }

  const videoResult = await uploadToCloudinary(videoFile)

  let thumbnailUrl = null
  if (thumbnail) {
    const thumbnailResult = await uploadToCloudinary(thumbnail)
    thumbnailUrl = thumbnailResult?.secure_url || thumbnailResult?.url
  }

  const [newVideo] = await db
    .insert(videos)
    .values({
      id: crypto.randomUUID(),
      userId,
      videoFile: videoResult?.secure_url || videoResult?.url,
      thumbnail: thumbnailUrl || '',
      title,
      description,
      duration: videoResult?.duration || 0,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      isPublished: isPublished === true || isPublished === 'true',
      publishedAt:
        isPublished === true || isPublished === 'true'
          ? new Date().toISOString()
          : null,
      updatedAt: new Date().toISOString(),
    })
    .returning({
      id: videos.id,
      title: videos.title,
      description: videos.description,
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

  return created(c, { video: newVideo }, 'Video published successfully')
})

video.patch('/:videoId', async c => {
  const userId = c.get('user')
  const videoId = c.req.param('videoId')

  const body = await parseRequestBody(c)
  const thumbnailFile = coerceFile(body.thumbnail)
  const { title, description, isPublished } = body

  const [existingVideo] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1)

  if (!existingVideo) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Video not found')
  }

  if (existingVideo.userId !== userId) {
    throw new ApiError(
      HttpStatus.FORBIDDEN,
      'You are not authorized to update this video'
    )
  }

  let finalThumbnailUrl = body.thumbnail as string | undefined
  if (thumbnailFile) {
    const thumbnailResult = await uploadToCloudinary(thumbnailFile)
    finalThumbnailUrl = thumbnailResult?.secure_url || thumbnailResult?.url
  }

  const [updatedVideo] = await db
    .update(videos)
    .set({
      title: (title as string | undefined) ?? undefined,
      description: (description as string | undefined) ?? undefined,
      thumbnail:
        typeof finalThumbnailUrl === 'string' ? finalThumbnailUrl : undefined,
      isPublished:
        isPublished !== undefined
          ? isPublished === 'true' || isPublished === true
          : undefined,
      publishedAt:
        (isPublished === 'true' || isPublished === true) &&
        !existingVideo.isPublished
          ? new Date().toISOString()
          : existingVideo.publishedAt,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(videos.id, videoId))
    .returning({
      id: videos.id,
      title: videos.title,
      description: videos.description,
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

  return ok(c, { video: updatedVideo }, 'Video updated successfully')
})

video.delete('/:videoId', async c => {
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

  if (existingVideo.userId !== userId) {
    throw new ApiError(
      HttpStatus.FORBIDDEN,
      'You are not authorized to delete this video'
    )
  }

  await db.delete(videos).where(eq(videos.id, videoId))

  return ok(c, null, 'Video deleted successfully')
})

video.patch('/toggle/publish/:videoId', async c => {
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

  if (existingVideo.userId !== userId) {
    throw new ApiError(
      HttpStatus.FORBIDDEN,
      'You are not authorized to update this video'
    )
  }

  const newPublishStatus = !existingVideo.isPublished

  const [updatedVideo] = await db
    .update(videos)
    .set({
      isPublished: newPublishStatus,
      publishedAt: newPublishStatus ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(videos.id, videoId))
    .returning({
      id: videos.id,
      title: videos.title,
      isPublished: videos.isPublished,
      publishedAt: videos.publishedAt,
    })

  return ok(
    c,
    { video: updatedVideo },
    'Video publish status toggled successfully'
  )
})

export default video
export type VideoType = typeof video
