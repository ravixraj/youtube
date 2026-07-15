import { Hono } from 'hono'
import { z } from 'zod'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth'
import { db as database } from '@/db'
import { playlists, videos } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

const playlistIdParam = z.object({ playlistId: z.uuid('Invalid playlist ID') })

const videoIdParam = z.object({ videoId: z.uuid('Invalid video ID') })

const userIdParam = z.object({ userId: z.uuid('Invalid user ID') })

const addVideoParam = z.object({
  videoId: z.uuid('Invalid video ID'),
  playlistId: z.uuid('Invalid playlist ID'),
})

const createPlaylistSchema = z.object({
  name: z
    .string()
    .min(1, 'Playlist name is required')
    .max(100, 'Name too long'),
  description: z
    .string()
    .min(1, 'Playlist description is required')
    .max(100, 'Description too long'),
})

const updatePlaylistSchema = createPlaylistSchema.pick({
  name: true,
  description: true,
})

const playlist = new Hono<{
  Bindings: CloudflareBindings
  Variables: { user: string }
}>().basePath('/playlists')

playlist.use(authMiddleware)

playlist.post('/', zValidator('json', createPlaylistSchema), async c => {
  const userId = c.get('user')
  const { name, description } = c.req.valid('json')

  const db = database(c.env.DATABASE_URL)

  const [existingPlaylist] = await db
    .select()
    .from(playlists)
    .where(and(eq(playlists.name, name), eq(playlists.userId, userId)))
    .limit(1)

  if (existingPlaylist) {
    throw HTTP.Error(
      HttpStatus.CONFLICT,
      'Playlist with same name already exists'
    )
  }

  const [newPlaylist] = await db
    .insert(playlists)
    .values({
      name,
      description,
      userId,
    })
    .returning({
      id: playlists.id,
      name: playlists.name,
      description: playlists.description,
      videoId: playlists.videoId,
      userId: playlists.userId,
      createdAt: playlists.createdAt,
      updatedAt: playlists.updatedAt,
    })

  return c.json(
    HTTP.Response(HttpPhrase.CREATED, { newPlaylist }),
    HttpStatus.CREATED
  )
})

playlist.get('/user/:userId', zValidator('param', userIdParam), async c => {
  const { userId } = c.req.valid('param')

  const db = database(c.env.DATABASE_URL)

  const playlists = await db.query.playlists.findMany({
    where: {
      userId,
    },
  })

  if (!playlists) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'Playlists not found')
  }

  return c.json(HTTP.Response(HttpPhrase.OK, { playlists }), HttpStatus.OK)
})

playlist.get('/:playlistId', zValidator('param', playlistIdParam), async c => {
  const userId = c.get('user')
  const { playlistId } = c.req.valid('param')

  const db = database(c.env.DATABASE_URL)

  const playlist = await db.query.playlists.findFirst({
    where: {
      id: playlistId,
      userId,
    },
  })

  if (!playlist) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'Playlist not found')
  }

  return c.json(HTTP.Response(HttpPhrase.OK, { playlist }), HttpStatus.OK)
})

playlist.patch(
  '/add/:videoId/:playlistId',
  zValidator('param', addVideoParam),
  async c => {
    const userId = c.get('user')
    const { playlistId, videoId } = c.req.valid('param')

    const db = database(c.env.DATABASE_URL)

    const [existingPlaylist] = await db
      .select()
      .from(playlists)
      .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
      .limit(1)

    if (!existingPlaylist) {
      throw HTTP.Error(HttpStatus.NOT_FOUND, 'Playlist not found')
    }

    if (existingPlaylist.videoId) {
      throw HTTP.Error(HttpStatus.CONFLICT, 'Video already added to playlist')
    }

    await db
      .update(playlists)
      .set({
        videoId,
      })
      .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
      .returning({
        id: playlists.id,
        name: playlists.name,
        description: playlists.description,
        videoId: playlists.videoId,
        userId: playlists.userId,
        createdAt: playlists.createdAt,
        updatedAt: playlists.updatedAt,
      })

    return c.json(HTTP.Response(HttpPhrase.OK, { playlist }), HttpStatus.OK)
  }
)

playlist.patch(
  '/remove/:videoId/:playlistId',
  zValidator('param', addVideoParam),
  async c => {
    const userId = c.get('user')
    const { playlistId } = c.req.valid('param')

    const db = database(c.env.DATABASE_URL)

    const [existingPlaylist] = await db
      .select()
      .from(playlists)
      .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
      .limit(1)

    if (!existingPlaylist) {
      throw HTTP.Error(HttpStatus.NOT_FOUND, 'Playlist not found')
    }

    const [newPlaylist] = await db
      .update(playlists)
      .set({
        videoId: null,
      })
      .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
      .returning({
        id: playlists.id,
        name: playlists.name,
        description: playlists.description,
        videoId: playlists.videoId,
        userId: playlists.userId,
        createdAt: playlists.createdAt,
        updatedAt: playlists.updatedAt,
      })

    return c.json(HTTP.Response(HttpPhrase.OK, { newPlaylist }), HttpStatus.OK)
  }
)

playlist.delete(
  '/:playlistId',
  zValidator('param', playlistIdParam),
  async c => {
    const userId = c.get('user')
    const { playlistId } = c.req.valid('param')

    const db = database(c.env.DATABASE_URL)

    const [playlist] = await db
      .select()
      .from(playlists)
      .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
      .limit(1)

    if (!playlist) {
      throw HTTP.Error(HttpStatus.NOT_FOUND, 'Playlist not found')
    }

    await db
      .delete(playlists)
      .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))

    return c.json(HTTP.Response(HttpPhrase.OK, null), HttpStatus.OK)
  }
)

playlist.patch(
  '/:playlistId',
  zValidator('param', playlistIdParam),
  zValidator('json', updatePlaylistSchema),
  async c => {
    const userId = c.get('user')
    const { playlistId } = c.req.valid('param')
    const { name, description } = c.req.valid('json')

    const db = database(c.env.DATABASE_URL)

    const [playlist] = await db
      .select()
      .from(playlists)
      .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
      .limit(1)

    if (!playlist) {
      throw HTTP.Error(HttpStatus.NOT_FOUND, 'Playlist not found')
    }

    const [updatedPlaylist] = await db
      .update(playlists)
      .set({
        name,
        description,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
      .returning({
        id: playlists.id,
        name: playlists.name,
        description: playlists.description,
        videoId: playlists.videoId,
        userId: playlists.userId,
        createdAt: playlists.createdAt,
        updatedAt: playlists.updatedAt,
      })

    return c.json(
      HTTP.Response(HttpPhrase.OK, { updatedPlaylist }),
      HttpStatus.OK
    )
  }
)

export default playlist
export type PlaylistType = typeof playlist
