import { Hono } from 'hono'
import { z } from 'zod'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth'
import { db as database } from '@/db'
import { comments } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

const videoIdParam = z.object({ videoId: z.uuid('Invalid video ID') })

const tweetIdParam = z.object({ tweetId: z.uuid('Invalid tweet ID') })

const commentIdParam = z.object({ commentId: z.uuid('Invalid comment ID') })

const commentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

const createCommentSchema = z
  .object({
    content: z
      .string()
      .min(1, 'Comment content cannot be empty')
      .max(50, 'Comment cannot exceed 50 characters'),
    videoId: z.uuid('Invalid video ID format').optional(),
    tweetId: z.uuid('Invalid tweet ID format').optional(),
  })
  .refine(
    data => !!data.tweetId !== !!data.videoId, // exactly one, not both, not neither
    { message: 'Comment must be linked to exactly one of tweet or video' }
  )

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

async function fetchComments(
  db: ReturnType<typeof database>,
  filter: { videoId: string } | { tweetId: string },
  page: number,
  limit: number
) {
  return db.query.comments.findMany({
    where: filter,
    orderBy: (t, { desc: d }) => d(t.createdAt),
    limit,
    offset: (page - 1) * limit,
  })
}

comment.get(
  '/video/:videoId',
  zValidator('param', videoIdParam),
  zValidator('query', commentQuerySchema),
  async c => {
    const { videoId } = c.req.valid('param')
    const { page, limit } = c.req.valid('query')

    const db = database(c.env.DATABASE_URL)

    const videoComments = await fetchComments(db, { videoId }, page, limit)

    return c.json(
      HTTP.Response(HttpPhrase.OK, { comments: videoComments }),
      HttpStatus.OK
    )
  }
)

comment.get(
  '/tweet/:tweetId',
  zValidator('param', tweetIdParam),
  zValidator('query', commentQuerySchema),
  async c => {
    const { tweetId } = c.req.valid('param')
    const { page, limit } = c.req.valid('query')

    const db = database(c.env.DATABASE_URL)

    const tweetComments = await fetchComments(db, { tweetId }, page, limit)

    return c.json(
      HTTP.Response(HttpPhrase.OK, { comments: tweetComments }),
      HttpStatus.OK
    )
  }
)

comment.use('/*', authMiddleware)
comment.post('/', zValidator('json', createCommentSchema), async c => {
  const userId = c.get('user')
  const { content, videoId, tweetId } = c.req.valid('json')

  const db = database(c.env.DATABASE_URL)

  let newComment

  try {
    ;[newComment] = await db
      .insert(comments)
      .values({
        userId,
        content,
        ...(videoId ? { videoId } : { tweetId }),
      })
      .returning({
        id: comments.id,
        userId: comments.userId,
        content: comments.content,
        videoId: comments.videoId,
        tweetId: comments.tweetId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
      })
  } catch (err: any) {
    if (err?.code === '23503') {
      throw HTTP.Error(
        HttpStatus.NOT_FOUND,
        'The video or tweet you are commenting on does not exist'
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
        tweetId: comments.tweetId,
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
      tweetId: comments.tweetId,
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
