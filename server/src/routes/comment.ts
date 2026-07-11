import { Hono } from 'hono'
import { z } from 'zod'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth'
import { db as database } from '@/db'
import { comments, videos } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

const videoIdParam = z.object({ videoId: z.uuid('Invalid video ID') })

const commentIdParam = z.object({ commentId: z.uuid('Invalid comment ID') })

const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content cannot be empty')
    .max(50, 'Comment cannot exceed 50 characters'),
  videoId: z.uuid('Invalid video ID format'),
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

comment.get('/video/:videoId', zValidator('param', videoIdParam), async c => {
  const { videoId } = c.req.valid('param')

  const db = database(c.env.DATABASE_URL)

  const [video] = await db
    .select({ id: videos.id })
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1)

  if (!video) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'Video not found')
  }

  const videoComments = await db.query.comments.findMany({
    where: { videoId },
    orderBy: (t, { desc: d }) => d(t.createdAt),
  })

  return c.json(
    HTTP.Response(HttpPhrase.OK, { comments: videoComments }),
    HttpStatus.OK
  )
})

comment.use('/*', authMiddleware)
comment.post('/', zValidator('json', createCommentSchema), async c => {
  const userId = c.get('user')
  const { content, videoId } = c.req.valid('json')

  const db = database(c.env.DATABASE_URL)

  let newComment

  try {
    ;[newComment] = await db
      .insert(comments)
      .values({
        userId,
        content,
        videoId,
      })
      .returning({
        id: comments.id,
        userId: comments.userId,
        content: comments.content,
        videoId: comments.videoId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
      })
  } catch (err: any) {
    if (err?.code === '23503') {
      throw HTTP.Error(
        HttpStatus.NOT_FOUND,
        'The video you are commenting on does not exist'
      )
    }
    throw err
  }

  if (!newComment) {
    throw HTTP.Error(HttpStatus.BAD_REQUEST, 'Failed to create comment')
  }

  return c.json(
    HTTP.Response(HttpPhrase.CREATED, { comment: newComment }),
    HttpStatus.CREATED
  )
})

comment.patch(
  '/:commentId',
  zValidator('param', commentIdParam),
  zValidator('json', updateCommentSchema),
  async c => {
    const userId = c.get('user')
    const { commentId } = c.req.valid('param')
    const { content } = c.req.valid('json')

    const db = database(c.env.DATABASE_URL)

    const [updatedComment] = await db
      .update(comments)
      .set({
        content,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
      .returning({
        id: comments.id,
        userId: comments.userId,
        content: comments.content,
        videoId: comments.videoId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
      })

    if (!updatedComment) {
      throw HTTP.Error(
        HttpStatus.NOT_FOUND,
        'Comment not found or you are not authorized to update it'
      )
    }

    return c.json(
      HTTP.Response(HttpPhrase.OK, { comment: updatedComment }),
      HttpStatus.OK
    )
  }
)

comment.delete('/:commentId', zValidator('param', commentIdParam), async c => {
  const userId = c.get('user')
  const { commentId } = c.req.valid('param')

  const db = database(c.env.DATABASE_URL)

  const [deletedComment] = await db
    .delete(comments)
    .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
    .returning({
      id: comments.id,
      userId: comments.userId,
      content: comments.content,
      videoId: comments.videoId,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
    })

  if (!deletedComment) {
    throw HTTP.Error(
      HttpStatus.NOT_FOUND,
      'Comment not found or you are not authorized to delete it'
    )
  }

  return c.json(
    HTTP.Response(HttpPhrase.OK, { comment: deletedComment }),
    HttpStatus.OK
  )
})

export default comment
export type CommentType = typeof comment
