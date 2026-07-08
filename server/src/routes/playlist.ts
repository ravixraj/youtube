import { Hono } from 'hono'
import { z } from 'zod'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth'

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

const playlist = new Hono<{
  Bindings: CloudflareBindings
  Variables: { user: string }
}>().basePath('/playlists')

playlist.use(authMiddleware)

playlist.post('/', zValidator('json', createPlaylistSchema), async c => {
  const { name, description } = c.req.valid('json')
  // TODO: create playlist
})

playlist.get('/user/:userId', async c => {
  const { userId } = c.req.param()
  // TODO: get user playlists
})

playlist.get('/:playlistId', async c => {
  const { playlistId } = c.req.param()
  // TODO: get playlist by id
})

playlist.patch('/add/:videoId/:playlistId', async c => {
  const { playlistId, videoId } = c.req.param()
  // TODO: add video to playlist
})

playlist.patch('/remove/:videoId/:playlistId', async c => {
  const { playlistId, videoId } = c.req.param()
  // TODO: remove video from playlist
})

playlist.delete('/:playlistId', async c => {
  const { playlistId } = c.req.param()
  // TODO: delete playlist
})

playlist.patch(
  '/:playlistId',
  zValidator('json', updatePlaylistSchema),
  async c => {
    const { playlistId } = c.req.param()
    const { name, description } = c.req.valid('json')
    // TODO: update playlist
  }
)

export default playlist
export type PlaylistType = typeof playlist
