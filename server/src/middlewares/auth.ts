import { env } from 'hono/adapter'
import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { verifyAccessToken } from '@/lib/helper'
import { HTTP, HttpStatus } from '@/lib/http'

type AuthEnv = {
  Bindings: CloudflareBindings
  Variables: {
    user: string
  }
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  let token: string | undefined

  const authHeader = c.req.header('authorization')

  if (authHeader) {
    const [type, value] = authHeader.split(' ')
    if (type?.toLowerCase() === 'bearer' && value) {
      token = value
    }
  }

  if (!token) {
    token = getCookie(c, 'access_token')
  }

  if (!token) {
    throw HTTP.Error(HttpStatus.UNAUTHORIZED, 'Please login first')
  }

  const { ACCESS_TOKEN_SECRET } = env<CloudflareBindings>(c)
  const payload = await verifyAccessToken(token, ACCESS_TOKEN_SECRET)

  if (!payload || !payload.userId) {
    throw HTTP.Error(HttpStatus.UNAUTHORIZED, 'Invalid or expired token')
  }

  c.set('user', payload.userId as string)

  await next()
})
