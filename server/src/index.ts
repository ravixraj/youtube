import { DrizzleError } from 'drizzle-orm'
import { Hono } from 'hono'
import { env } from 'hono/adapter'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { HTTP, HttpPhrase, HttpStatus } from './lib/http'

import comment from '@/routes/comment'
import dashboard from '@/routes/dashboard'
import like from '@/routes/like'
import playlist from '@/routes/playlist'
import subscription from '@/routes/subscription'
import tweet from '@/routes/tweet'
import user from '@/routes/user'
import video from '@/routes/video'

const app = new Hono<{ Bindings: CloudflareBindings }>({
  strict: false,
}).basePath('/api/v1')

app.use(secureHeaders())
app.use('*', async (c, next) => {
  const { CLIENT_URL } = env(c)
  const corsHandler = cors({
    origin: [CLIENT_URL, 'https://yt.raviraj.xyz'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
    credentials: true,
  })
  return corsHandler(c, next)
})

const routes = [
  user,
  tweet,
  subscription,
  video,
  comment,
  like,
  playlist,
  dashboard,
] as const

routes.forEach(route => {
  app.route('/', route)
})

app.get('/health', c =>
  c.json(HTTP.Response(HttpPhrase.OK, null), HttpStatus.OK)
)

app.notFound(c =>
  c.json(HTTP.Response(HttpPhrase.NOT_FOUND, null, false), HttpStatus.NOT_FOUND)
)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      HTTP.Response(err.message, null, false),
      err.status as ContentfulStatusCode
    )
  }

  if (err instanceof DrizzleError) {
    return c.json(
      HTTP.Response('DATABASE ERROR', null, false),
      HttpStatus.BAD_REQUEST
    )
  }

  return c.json(
    HTTP.Response(err.message || 'INTERNAL SERVER ERROR', null, false),
    HttpStatus.INTERNAL_SERVER_ERROR
  )
})

export default app
export type AppType = typeof app
