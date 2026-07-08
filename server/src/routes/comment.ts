import { Hono } from 'hono'
import { z } from 'zod'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth'

const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content cannot be empty')
    .max(50, 'Comment cannot exceed 50 characters'),
  videoId: z.uuid('Invalid video ID format').optional(),
  tweetId: z.uuid('Invalid tweet ID format').optional(),
})

const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content cannot be empty')
    .max(50, 'Comment cannot exceed 50 characters'),
})

const comment = new Hono<{
  Bindings: CloudflareBindings
  Variables: { user: string }
}>().basePath('/comments')

comment.get('/:videoId', async c => {
  const { videoId } = c.req.param()
  const { page = 1, limit = 10 } = c.req.query()
  // TODO: get all comments for a video
})

comment.use('/*', authMiddleware)

comment.post('/', zValidator('json', createCommentSchema), async c => {
  const { content, videoId } = c.req.valid('json')
  // TODO: add a comment to a video
})

comment.patch(
  '/:commentId',
  zValidator('json', updateCommentSchema),
  async c => {
    const { commentId } = c.req.param()
    const { content } = c.req.valid('json')
    // TODO: update a comment
  }
)

comment.delete('/:commentId', async c => {
  const { commentId } = c.req.param()
  // TODO: delete a comment
})

export default comment
export type CommentType = typeof comment
