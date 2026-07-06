import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@/db'
import { comments, videos } from '@/db/schema'
import { HttpStatus } from '@/lib/const'
import { ApiError, created, ok } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth.middleware'

const createCommentSchema = z.object({
  videoId: z.string().uuid('Invalid video ID format'),
  content: z
    .string()
    .min(1, 'Comment content cannot be empty')
    .max(500, 'Comment cannot exceed 500 characters'),
  parentCommentId: z
    .string()
    .uuid('Invalid parent comment ID format')
    .optional(),
})

const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content cannot be empty')
    .max(500, 'Comment cannot exceed 500 characters'),
})

const comment = new Hono<{ Variables: { user: string } }>()

comment.get('/:videoId', async c => {
  const videoId = c.req.param('videoId')
  const { page, limit } = c.req.query()
  const normalizedPage = Math.max(1, Number(page) || 1)
  const normalizedLimit = Math.min(50, Math.max(1, Number(limit) || 10))
  const offset = (normalizedPage - 1) * normalizedLimit

  const [total, videoComments] = await Promise.all([
    db.$count(comments, eq(comments.videoId, videoId)),
    db.query.comments.findMany({
      columns: {
        id: true,
        userId: true,
        videoId: true,
        content: true,
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
      where: eq(comments.videoId, videoId),
      orderBy: (t, { desc: d }) => d(t.createdAt),
      limit: normalizedLimit,
      offset,
    }),
  ])

  const totalPages = Math.ceil(total / normalizedLimit)

  return ok(
    c,
    {
      comments: videoComments,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages,
      },
    },
    'Comments retrieved successfully'
  )
})

comment.use('/*', authMiddleware)

comment.post('/', zValidator('json', createCommentSchema), async c => {
  const userId = c.get('user')
  const { content, videoId } = createCommentSchema.parse(await c.req.json())

  const [existingVideo] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1)

  if (!existingVideo) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Video not found')
  }

  const [newComment] = await db
    .insert(comments)
    .values({
      id: crypto.randomUUID(),
      userId,
      videoId,
      content,
      updatedAt: new Date().toISOString(),
    })
    .returning({
      id: comments.id,
      userId: comments.userId,
      videoId: comments.videoId,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
    })

  await db
    .update(videos)
    .set({ commentCount: (existingVideo.commentCount || 0) + 1 })
    .where(eq(videos.id, videoId))

  return created(c, { comment: newComment }, 'Comment created successfully')
})

comment.delete('/:commentId', async c => {
  const userId = c.get('user')
  const commentId = c.req.param('commentId')

  const [existingComment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1)

  if (!existingComment) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Comment not found')
  }

  if (existingComment.userId !== userId) {
    throw new ApiError(
      HttpStatus.FORBIDDEN,
      'You are not authorized to delete this comment'
    )
  }

  await db.delete(comments).where(eq(comments.id, commentId))

  const [existingVideo] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, existingComment.videoId))
    .limit(1)

  if (existingVideo) {
    await db
      .update(videos)
      .set({ commentCount: Math.max(0, (existingVideo.commentCount || 0) - 1) })
      .where(eq(videos.id, existingComment.videoId))
  }

  return ok(c, null, 'Comment deleted successfully')
})

comment.patch(
  '/:commentId',
  zValidator('json', updateCommentSchema),
  async c => {
    const userId = c.get('user')
    const commentId = c.req.param('commentId')

    const { content } = updateCommentSchema.parse(await c.req.json())

    const [existingComment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1)

    if (!existingComment) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Comment not found')
    }

    if (existingComment.userId !== userId) {
      throw new ApiError(
        HttpStatus.FORBIDDEN,
        'You are not authorized to update this comment'
      )
    }

    const [updatedComment] = await db
      .update(comments)
      .set({
        content,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(comments.id, commentId))
      .returning({
        id: comments.id,
        userId: comments.userId,
        videoId: comments.videoId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
      })

    return ok(c, { comment: updatedComment }, 'Comment updated successfully')
  }
)

export default comment
export type CommentType = typeof comment
