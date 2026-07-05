import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@/db'
import { playlists, playlistToVideo, users, videos } from '@/db/schema'
import { HttpStatus } from '@/lib/const'
import { ApiError, created, ok } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth.middleware'

const createPlaylistSchema = z.object({
  name: z
    .string()
    .min(1, 'Playlist name is required')
    .max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
})

const updatePlaylistSchema = z.object({
  name: z
    .string()
    .min(1, 'Playlist name is required')
    .max(100, 'Name too long')
    .optional(),
  description: z.string().max(500, 'Description too long').optional(),
})

const playlist = new Hono<{ Variables: { user: string } }>()

playlist.use(authMiddleware)

playlist.post('/', zValidator('json', createPlaylistSchema), async c => {
  const userId = c.get('user')
  const { name, description } = createPlaylistSchema.parse(await c.req.json())

  const [newPlaylist] = await db
    .insert(playlists)
    .values({
      id: crypto.randomUUID(),
      userId,
      name,
      description,
      updatedAt: new Date().toISOString(),
    })
    .returning({
      id: playlists.id,
      userId: playlists.userId,
      name: playlists.name,
      description: playlists.description,
      createdAt: playlists.createdAt,
      updatedAt: playlists.updatedAt,
    })

  return created(c, { playlist: newPlaylist }, 'Playlist created successfully')
})

playlist.get('/:playlistId', async c => {
  const playlistId = c.req.param('playlistId')

  const [existingPlaylist] = await db
    .select({
      id: playlists.id,
      userId: playlists.userId,
      name: playlists.name,
      description: playlists.description,
      createdAt: playlists.createdAt,
      updatedAt: playlists.updatedAt,
    })
    .from(playlists)
    .where(eq(playlists.id, playlistId))
    .limit(1)

  if (!existingPlaylist) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Playlist not found')
  }

  const playlistVideos = await db
    .select({
      id: videos.id,
      title: videos.title,
      thumbnail: videos.thumbnail,
      videoFile: videos.videoFile,
      duration: videos.duration,
      viewCount: videos.viewCount,
      likeCount: videos.likeCount,
      commentCount: videos.commentCount,
      createdAt: videos.createdAt,
      user: {
        id: users.id,
        username: users.username,
        fullname: users.fullname,
        avatar: users.avatar,
      },
    })
    .from(playlistToVideo)
    .leftJoin(videos, eq(playlistToVideo.b, videos.id))
    .leftJoin(users, eq(videos.userId, users.id))
    .where(eq(playlistToVideo.a, playlistId))

  return ok(
    c,
    {
      playlist: {
        ...existingPlaylist,
        videoCount: playlistVideos.length,
        videos: playlistVideos,
      },
    },
    'Playlist retrieved successfully'
  )
})

playlist.patch(
  '/:playlistId',
  zValidator('json', updatePlaylistSchema),
  async c => {
    const userId = c.get('user')
    const playlistId = c.req.param('playlistId')

    const [existingPlaylist] = await db
      .select()
      .from(playlists)
      .where(eq(playlists.id, playlistId))
      .limit(1)

    if (!existingPlaylist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Playlist not found')
    }

    if (existingPlaylist.userId !== userId) {
      throw new ApiError(
        HttpStatus.FORBIDDEN,
        'You are not authorized to update this playlist'
      )
    }

    const { name, description } = updatePlaylistSchema.parse(await c.req.json())

    const [updatedPlaylist] = await db
      .update(playlists)
      .set({
        name: name ?? undefined,
        description: description ?? undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(playlists.id, playlistId))
      .returning({
        id: playlists.id,
        userId: playlists.userId,
        name: playlists.name,
        description: playlists.description,
        createdAt: playlists.createdAt,
        updatedAt: playlists.updatedAt,
      })

    return ok(c, { playlist: updatedPlaylist }, 'Playlist updated successfully')
  }
)

playlist.delete('/:playlistId', async c => {
  const userId = c.get('user')
  const playlistId = c.req.param('playlistId')

  const [existingPlaylist] = await db
    .select()
    .from(playlists)
    .where(eq(playlists.id, playlistId))
    .limit(1)

  if (!existingPlaylist) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Playlist not found')
  }

  if (existingPlaylist.userId !== userId) {
    throw new ApiError(
      HttpStatus.FORBIDDEN,
      'You are not authorized to delete this playlist'
    )
  }

  await db.delete(playlistToVideo).where(eq(playlistToVideo.a, playlistId))
  await db.delete(playlists).where(eq(playlists.id, playlistId))

  return ok(c, null, 'Playlist deleted successfully')
})

playlist.patch('/add/:videoId/:playlistId', async c => {
  const userId = c.get('user')
  const playlistId = c.req.param('playlistId')
  const videoId = c.req.param('videoId')

  const [existingPlaylist] = await db
    .select()
    .from(playlists)
    .where(eq(playlists.id, playlistId))
    .limit(1)

  if (!existingPlaylist) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Playlist not found')
  }

  if (existingPlaylist.userId !== userId) {
    throw new ApiError(
      HttpStatus.FORBIDDEN,
      'You are not authorized to modify this playlist'
    )
  }

  const [existingVideo] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1)

  if (!existingVideo) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Video not found')
  }

  const [existingEntry] = await db
    .select()
    .from(playlistToVideo)
    .where(
      and(eq(playlistToVideo.a, playlistId), eq(playlistToVideo.b, videoId))
    )
    .limit(1)

  if (existingEntry) {
    throw new ApiError(HttpStatus.CONFLICT, 'Video already exists in playlist')
  }

  await db.insert(playlistToVideo).values({
    a: playlistId,
    b: videoId,
  })

  return ok(c, null, 'Video added to playlist successfully')
})

playlist.patch('/remove/:videoId/:playlistId', async c => {
  const userId = c.get('user')
  const playlistId = c.req.param('playlistId')
  const videoId = c.req.param('videoId')

  const [existingPlaylist] = await db
    .select()
    .from(playlists)
    .where(eq(playlists.id, playlistId))
    .limit(1)

  if (!existingPlaylist) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Playlist not found')
  }

  if (existingPlaylist.userId !== userId) {
    throw new ApiError(
      HttpStatus.FORBIDDEN,
      'You are not authorized to modify this playlist'
    )
  }

  await db
    .delete(playlistToVideo)
    .where(
      and(eq(playlistToVideo.a, playlistId), eq(playlistToVideo.b, videoId))
    )

  return ok(c, null, 'Video removed from playlist successfully')
})

playlist.get('/user/:userId', async c => {
  const userId = c.req.param('userId')

  const userPlaylists = await db
    .select({
      id: playlists.id,
      userId: playlists.userId,
      name: playlists.name,
      description: playlists.description,
      createdAt: playlists.createdAt,
      updatedAt: playlists.updatedAt,
    })
    .from(playlists)
    .where(eq(playlists.userId, userId))

  const playlistsWithVideoCount = await Promise.all(
    userPlaylists.map(async p => {
      const videoCount = await db
        .select()
        .from(playlistToVideo)
        .where(eq(playlistToVideo.a, p.id))
        .then(res => res.length)

      return {
        ...p,
        videoCount,
      }
    })
  )

  return ok(
    c,
    { playlists: playlistsWithVideoCount },
    'User playlists retrieved successfully'
  )
})

export default playlist
export type PlaylistType = typeof playlist
