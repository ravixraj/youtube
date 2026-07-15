import { Hono } from 'hono'
import { z } from 'zod'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth'
import { db as database } from '@/db'
import { playlists, playlistVideos } from '@/db/schema'
import { and, asc, eq, sql } from 'drizzle-orm'

const playlistIdParam = z.object({ playlistId: z.uuid('Invalid playlist ID') })

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
      userId: playlists.userId,
      createdAt: playlists.createdAt,
      updatedAt: playlists.updatedAt,
    })

  return c.json(
    HTTP.Response(HttpPhrase.CREATED, {
      newPlaylist: { ...newPlaylist, videos: [] },
    }),
    HttpStatus.CREATED
  )
})

playlist.get('/user/:userId', zValidator('param', userIdParam), async c => {
  const { userId } = c.req.valid('param')

  const db = database(c.env.DATABASE_URL)

  const raw = await db.query.playlists.findMany({
    where: { userId },
    with: {
      playlistVideos: {
        with: {
          video: {
            columns: { id: true, title: true, thumbnail: true, duration: true },
          },
        },
        orderBy: (pv, { asc }) => [asc(pv.position), asc(pv.createdAt)],
      },
    },
  })

  if (!raw) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'Playlists not found')
  }

  const playlists = raw.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    userId: p.userId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    videos: p.playlistVideos.map(pv => pv.video),
  }))

  return c.json(HTTP.Response(HttpPhrase.OK, { playlists }), HttpStatus.OK)
})

playlist.get('/:playlistId', zValidator('param', playlistIdParam), async c => {
  const userId = c.get('user')
  const { playlistId } = c.req.valid('param')

  const db = database(c.env.DATABASE_URL)

  const raw = await db.query.playlists.findFirst({
    where: { id: playlistId, userId },
    with: {
      playlistVideos: {
        with: {
          video: {
            columns: { id: true, title: true, thumbnail: true, duration: true },
          },
        },
        orderBy: (pv, { asc }) => [asc(pv.position), asc(pv.createdAt)],
      },
    },
  })

  if (!raw) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'Playlist not found')
  }

  const playlist = {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    userId: raw.userId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    videos: raw.playlistVideos.map(pv => pv.video),
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

    const [existingEntry] = await db
      .select()
      .from(playlistVideos)
      .where(
        and(
          eq(playlistVideos.playlistId, playlistId),
          eq(playlistVideos.videoId, videoId)
        )
      )
      .limit(1)

    if (existingEntry) {
      throw HTTP.Error(HttpStatus.CONFLICT, 'Video already in playlist')
    }

    const rows = await db
      .select({ position: sql<number>`count(*)::int` })
      .from(playlistVideos)
      .where(eq(playlistVideos.playlistId, playlistId))

    const position = rows[0]?.position ?? 0

    await db.insert(playlistVideos).values({
      playlistId,
      videoId,
      position,
    })

    return c.json(HTTP.Response(HttpPhrase.OK, null), HttpStatus.OK)
  }
)

playlist.patch(
  '/remove/:videoId/:playlistId',
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

    await db
      .delete(playlistVideos)
      .where(
        and(
          eq(playlistVideos.playlistId, playlistId),
          eq(playlistVideos.videoId, videoId)
        )
      )

    return c.json(HTTP.Response(HttpPhrase.OK, null), HttpStatus.OK)
  }
)

playlist.delete(
  '/:playlistId',
  zValidator('param', playlistIdParam),
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

    const [existingPlaylist] = await db
      .select()
      .from(playlists)
      .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
      .limit(1)

    if (!existingPlaylist) {
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
