import { Hono } from 'hono'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { authMiddleware } from '@/middlewares/auth'

const like = new Hono<{
  Bindings: CloudflareBindings
  Variables: { user: string }
}>().basePath('/likes')

like.use(authMiddleware)

like.post('/toggle/v/:videoId', async c => {
  const { videoId } = c.req.param()
  // TODO: toggle like on video
})

like.post('/toggle/c/:commentId', async c => {
  const { commentId } = c.req.param()
  // TODO: toggle like on comment
})

like.post('/toggle/t/:tweetId', async c => {
  const { tweetId } = c.req.param()
  // TODO: toggle like on tweet
})

like.get('/videos', async c => {
  // TODO: get all liked videos
})

export default like
export type LikeType = typeof like
