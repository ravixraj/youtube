import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { env } from '@/lib/env'
import { secureHeaders } from 'hono/secure-headers'
import { ApiError, ApiResponse } from './lib/http'
import { DrizzleError } from 'drizzle-orm'

const app = new Hono({ strict: false }).basePath('/api/v1')

const allowsOrigins = [env.CLIENT_URL, 'http://localhost:3000']

app.use(secureHeaders())

app.use(
  cors({
    origin: allowsOrigins,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
  })
)

/**
 * IMPORT ROUTES
 */
import authRouter from './routes/auth.route'
import userRouter from './routes/user.route'
import tweetRouter from './routes/tweet.route'
import subscriptionRouter from './routes/subscription.route'
import videoRouter from './routes/video.route'
import commentRouter from './routes/comment.route'
import likeRouter from './routes/like.route'
import playlistRouter from './routes/playlist.route'
import dashboardRouter from './routes/dashboard.route'
import { HttpStatus } from './lib/const'

app.route('/auth', authRouter)
app.route('/users', userRouter)
app.route('/tweets', tweetRouter)
app.route('/subscriptions', subscriptionRouter)
app.route('/videos', videoRouter)
app.route('/comments', commentRouter)
app.route('/likes', likeRouter)
app.route('/playlist', playlistRouter)
app.route('/dashboard', dashboardRouter)

app.get('/healthcheck', c =>
  c.json(new ApiResponse(HttpStatus.OK, null, 'Health Check Passed'))
)

app.notFound(c =>
  c.json(new ApiResponse(HttpStatus.NOT_FOUND, null, 'RESOURCE NOT FOUND'))
)

app.onError((err, c) => {
  let apiError: ApiError
  if (err instanceof DrizzleError) {
    apiError = new ApiError(400, 'DATABASE ERROR')
  } else if (err instanceof ApiError) {
    apiError = err
  } else {
    apiError = new ApiError(500, err.message || 'INTERNAL SERVER ERROR')
  }

  return c.json(
    {
      ...apiError,
      message: apiError.message,
    },
    apiError.statusCode as any
  )
})

export default app
