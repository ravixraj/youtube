import { Hono } from 'hono'
import { z } from 'zod'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const ACCEPTED_MIMES = ['image/png', 'image/jpeg', 'image/webp']

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
  sortType: z.enum(['asc', 'desc']).optional().default('desc'),
  userId: z.string().optional(),
})

const createVideoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isPublished: z.union([z.boolean(), z.string()]).optional().default(true),
  videoFile,
  thumbnail: imageFile.optional(),
})

const video = new Hono<{
  Bindings: CloudflareBindings
  Variables: { user: string }
}>().basePath('/videos')

video.get('/', zValidator('query', searchVideosSchema), async c => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy,
    sortType,
    userId,
  } = c.req.valid('query')
  // TODO: get all videos based on query, sort, pagination
})

video.get('/:videoId', async c => {
  const { videoId } = c.req.param()
  // TODO: get video by id
})

video.use('/*', authMiddleware)

video.post('/', zValidator('form', createVideoSchema), async c => {
  const { title, description } = c.req.valid('form')
  // TODO: get video, upload to cloudinary, create video
})

video.patch('/:videoId', async c => {
  const { videoId } = c.req.param()
  // TODO: update video details like title, description, thumbnail
})

video.delete('/:videoId', async c => {
  const { videoId } = c.req.param()
  // TODO: delete video
})

video.patch('/toggle/publish/:videoId', async c => {
  const { videoId } = c.req.param()
  // TODO: toggle publish status
})

export default video
export type VideoType = typeof video
