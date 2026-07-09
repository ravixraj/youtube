import { Hono } from 'hono'
import { z } from 'zod'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth'
import { videos } from '@/db/schema'
import { db as database } from '@/db'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { env } from 'hono/adapter'
import { and, eq, sql } from 'drizzle-orm'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const ACCEPTED_MIMES = ['image/png', 'image/jpeg', 'image/webp']

export const searchVideosSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  query: z.string().trim().optional(),
  username: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'viewCount', 'duration']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

const createVideoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(60, 'Title too long'),
  description: z.string().max(160, 'Description too long'),
  isPublished: z.boolean().default(true),
  videoFile: z
    .instanceof(File)
    .refine(file => file.size > 0, 'Video file is required'),
  thumbnail: z
    .instanceof(File)
    .refine(file => file.size > 0, 'File required')
    .refine(file => file.size <= MAX_IMAGE_BYTES, {
      message: `Max size ${MAX_IMAGE_BYTES} bytes`,
    })
    .refine(file => !file.type || ACCEPTED_MIMES.includes(file.type), {
      message: `Allowed types: ${ACCEPTED_MIMES.join(', ')}`,
    }),
})

const updateVideoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(60, 'Title too long'),
  description: z.string().max(160, 'Description too long'),
  thumbnail: z
    .instanceof(File)
    .refine(file => file.size > 0, 'File required')
    .refine(file => file.size <= MAX_IMAGE_BYTES, {
      message: `Max size ${MAX_IMAGE_BYTES} bytes`,
    })
    .refine(file => !file.type || ACCEPTED_MIMES.includes(file.type), {
      message: `Allowed types: ${ACCEPTED_MIMES.join(', ')}`,
    }),
})

const video = new Hono<{
  Bindings: CloudflareBindings
  Variables: { user: string }
}>().basePath('/videos')

video.get('/', zValidator('query', searchVideosSchema), async c => {
  const { page, limit, query, username, sortBy, sortOrder } =
    c.req.valid('query')

  const db = database(c.env.DATABASE_URL)

  const skip = (page - 1) * limit

  const where: any = {
    isPublished: true,
  }

  if (query) {
    where.title = {
      contains: query,
    }
  }

  if (username) {
    where.username = {
      contains: username,
    }
  }

  const orderBy = {
    [sortBy]: sortOrder,
  }

  const videos = await db.query.videos.findMany({
    where,
    orderBy,
    limit,
    offset: skip,
  })

  return c.json(HTTP.Response(HttpPhrase.OK, { videos }), HttpStatus.OK)
})

video.get('/:videoId', async c => {
  const userId = c.get('user')
  const { videoId } = c.req.param()

  const db = database(c.env.DATABASE_URL)

  const video = await db.query.videos.findFirst({
    where: {
      id: videoId,
      userId,
    },
  })

  if (!video) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'Video does not exist')
  }

  return c.json(HTTP.Response(HttpPhrase.OK, { video }), HttpStatus.OK)
})

video.use('/*', authMiddleware)
video.post('/', zValidator('form', createVideoSchema), async c => {
  const userId = c.get('user')
  const { title, description, isPublished, videoFile, thumbnail } =
    c.req.valid('form')

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } =
    env<CloudflareBindings>(c)

  const [videoUpload, thumbnailUpload] = await Promise.all([
    uploadToCloudinary(
      videoFile,
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_UPLOAD_PRESET
    ),
    uploadToCloudinary(
      thumbnail,
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_UPLOAD_PRESET
    ),
  ])

  const db = database(c.env.DATABASE_URL)

  const [newVideo] = await db
    .insert(videos)
    .values({
      userId,
      title,
      description,
      isPublished,
      // @ts-ignore
      videoFile: videoUpload?.url,
      // @ts-ignore
      thumbnail: thumbnailUpload?.url,
      // @ts-ignore
      duration: videoUpload?.duration,
    })
    .returning({
      id: videos.id,
      userId: videos.userId,
      videoFile: videos.videoFile,
      thumbnail: videos.thumbnail,
      title: videos.title,
      description: videos.description,
      duration: videos.duration,
      viewCount: videos.viewCount,
      isPublished: videos.isPublished,
      createdAt: videos.createdAt,
      updatedAt: videos.updatedAt,
    })

  return c.json(
    HTTP.Response(HttpPhrase.CREATED, { video: newVideo }),
    HttpStatus.CREATED
  )
})

video.patch('/:videoId', zValidator('json', updateVideoSchema), async c => {
  const userId = c.get('user')
  const { videoId } = c.req.param()

  const { title, description, thumbnail } = c.req.valid('json')

  const thumbnailUpload = await uploadToCloudinary(
    thumbnail,
    c.env.CLOUDINARY_CLOUD_NAME,
    c.env.CLOUDINARY_UPLOAD_PRESET
  )

  const db = database(c.env.DATABASE_URL)

  const [updatedVideo] = await db
    .update(videos)
    .set({
      title,
      description,
      // @ts-ignore
      thumbnail: thumbnailUpload?.url,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
    .returning({
      id: videos.id,
      userId: videos.userId,
      videoFile: videos.videoFile,
      thumbnail: videos.thumbnail,
      title: videos.title,
      description: videos.description,
      duration: videos.duration,
      viewCount: videos.viewCount,
      isPublished: videos.isPublished,
      createdAt: videos.createdAt,
      updatedAt: videos.updatedAt,
    })

  return c.json(
    HTTP.Response(HttpPhrase.OK, { video: updatedVideo }),
    HttpStatus.OK
  )
})

video.delete('/:videoId', async c => {
  const userId = c.get('user')
  const { videoId } = c.req.param()

  const db = database(c.env.DATABASE_URL)

  const [deletedVideo] = await db
    .delete(videos)
    .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
    .returning({
      id: videos.id,
      userId: videos.userId,
      videoFile: videos.videoFile,
      thumbnail: videos.thumbnail,
      title: videos.title,
      description: videos.description,
      duration: videos.duration,
      viewCount: videos.viewCount,
      isPublished: videos.isPublished,
      createdAt: videos.createdAt,
      updatedAt: videos.updatedAt,
    })

  return c.json(
    HTTP.Response(HttpPhrase.OK, { video: deletedVideo }),
    HttpStatus.OK
  )
})

video.patch('/toggle/publish/:videoId', async c => {
  const userId = c.get('user')
  const { videoId } = c.req.param()

  const db = database(c.env.DATABASE_URL)

  const [updatedVideo] = await db
    .update(videos)
    .set({
      isPublished: sql`NOT ${videos.isPublished}`,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(videos.id, videoId), eq(videos.userId, userId)))
    .returning({
      id: videos.id,
      userId: videos.userId,
      videoFile: videos.videoFile,
      thumbnail: videos.thumbnail,
      title: videos.title,
      description: videos.description,
      duration: videos.duration,
      viewCount: videos.viewCount,
      isPublished: videos.isPublished,
      createdAt: videos.createdAt,
      updatedAt: videos.updatedAt,
    })

  return c.json(
    HTTP.Response(HttpPhrase.OK, { video: updatedVideo }),
    HttpStatus.OK
  )
})

export default video
export type VideoType = typeof video
