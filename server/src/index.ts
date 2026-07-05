import { DrizzleError } from 'drizzle-orm'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { env } from '@/lib/env'
import { HttpStatus } from './lib/const'
import { ContentfulStatusCode } from 'hono/utils/http-status'
import { ApiError, ApiResponse } from './lib/http'

import comment from './routes/comment'
import dashboard from './routes/dashboard'
import like from './routes/like'
import playlist from './routes/playlist'
import subscription from './routes/subscription'
import tweet from './routes/tweet'
import user from './routes/user'
import video from './routes/video'

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

app.route('/users', user)
app.route('/tweets', tweet)
app.route('/subscriptions', subscription)
app.route('/videos', video)
app.route('/comments', comment)
app.route('/likes', like)
app.route('/playlist', playlist)
app.route('/dashboard', dashboard)

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
    apiError.statusCode as ContentfulStatusCode
  )
})

export default app
export type AppType = typeof app
