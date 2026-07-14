import { and, eq, not, or, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { env } from 'hono/adapter'
import { z } from 'zod'
import { db as database } from '@/db'
import { subscriptions, users } from '@/db/schema'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { uploadToCloudinary } from '@/lib/cloudinary'
import {
  clearAuthCookies,
  generateAccessAndRefreshTokens,
  hashPassword,
  passwordMatch,
  setAuthCookies,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/lib/helper'
import { getCookie } from 'hono/cookie'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const ACCEPTED_MIMES = ['image/png', 'image/jpeg', 'image/webp']

const strongPassword = z
  .string()
  .min(6, { message: 'Password must be at least 6 characters long' })
  .max(16, { message: 'Password must be at most 16 characters long' })
  .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, number and one special character.',
  })

const imageFile = z
  .instanceof(File)
  .refine(file => file.size > 0, 'File required')
  .refine(file => file.size <= MAX_IMAGE_BYTES, {
    message: `Max size ${MAX_IMAGE_BYTES} bytes`,
  })
  .refine(file => !file.type || ACCEPTED_MIMES.includes(file.type), {
    message: `Allowed types: ${ACCEPTED_MIMES.join(', ')}`,
  })

const registerSchema = z.object({
  username: z
    .string()
    .nonempty()
    .max(12, { message: 'Username must be at most 12 characters long' }),
  fullname: z
    .string()
    .min(6, { message: 'Fullname must be at least 6 characters long' })
    .max(15, { message: 'Fullname must be at most 15 characters long' }),
  email: z.email({ message: 'Invalid email address' }).nonempty(),
  password: strongPassword,
})

const loginSchema = registerSchema.pick({ username: true, password: true })

const refreshTokenSchema = z.object({
  refreshToken: z.string().nonempty(),
})

const changePasswordSchema = z.object({
  currentPassword: strongPassword,
  newPassword: strongPassword,
})

const updateAccountDetailsSchema = z.object({
  fullname: z
    .string()
    .min(6, { message: 'Fullname must be at least 6 characters long' })
    .max(15, { message: 'Fullname must be at most 15 characters long' })
    .optional(),
  email: z.string().email({ message: 'Invalid email address' }).optional(),
  username: z
    .string()
    .max(12, { message: 'Username must be at most 12 characters long' })
    .optional(),
})

const user = new Hono<{
  Bindings: CloudflareBindings
  Variables: { user: string }
}>().basePath('/users')

user.post('/register', zValidator('json', registerSchema), async c => {
  const { username, fullname, email, password } = c.req.valid('json')

  const db = database(c.env.DATABASE_URL)

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.email, email), eq(users.username, username)))
    .limit(1)

  if (existingUser) {
    throw HTTP.Error(
      HttpStatus.CONFLICT,
      'User with same email or username already exists'
    )
  }

  const hashedPassword = await hashPassword(password)

  const [newUser] = await db
    .insert(users)
    .values({
      username,
      fullname,
      email,
      password: hashedPassword,
    })
    .returning({
      id: users.id,
      username: users.username,
      fullname: users.fullname,
      email: users.email,
      avatar: users.avatar,
      coverImage: users.coverImage,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })

  if (!newUser) {
    throw HTTP.Error(HttpStatus.BAD_REQUEST, 'Failed to create user')
  }

  const tokens = await generateAccessAndRefreshTokens(
    { userId: newUser.id },
    {
      accessSecret: c.env.ACCESS_TOKEN_SECRET,
      accessExpiry: c.env.ACCESS_TOKEN_EXPIRY,
      refreshSecret: c.env.REFRESH_TOKEN_SECRET,
      refreshExpiry: c.env.REFRESH_TOKEN_EXPIRY,
    }
  )

  await db
    .update(users)
    .set({
      refreshToken: tokens.refreshToken,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, newUser.id))

  setAuthCookies(c, tokens.accessToken, tokens.refreshToken)

  return c.json(
    HTTP.Response(HttpPhrase.CREATED, {
      user: newUser,
      accessToken: tokens.accessToken,
    }),
    HttpStatus.CREATED
  )
})

user.post('/login', zValidator('json', loginSchema), async c => {
  const { username, password } = c.req.valid('json')

  const db = database(c.env.DATABASE_URL)

  const userRecord = await db.query.users.findFirst({
    where: {
      username: username,
    },
  })

  if (!userRecord) {
    throw HTTP.Error(HttpStatus.UNAUTHORIZED, 'Invalid username or password')
  }

  const isMatch = await passwordMatch(password, userRecord.password)
  if (!isMatch) {
    throw HTTP.Error(HttpStatus.UNAUTHORIZED, 'Invalid username or password')
  }

  const tokens = await generateAccessAndRefreshTokens(
    { userId: userRecord.id },
    {
      accessSecret: c.env.ACCESS_TOKEN_SECRET,
      accessExpiry: c.env.ACCESS_TOKEN_EXPIRY,
      refreshSecret: c.env.REFRESH_TOKEN_SECRET,
      refreshExpiry: c.env.REFRESH_TOKEN_EXPIRY,
    }
  )

  await db
    .update(users)
    .set({
      refreshToken: tokens.refreshToken,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userRecord.id))

  setAuthCookies(c, tokens.accessToken, tokens.refreshToken)

  const { password: _, refreshToken: __, ...safeUser } = userRecord

  return c.json(
    HTTP.Response(HttpPhrase.OK, {
      user: safeUser,
      accessToken: tokens.accessToken,
    }),
    HttpStatus.OK
  )
})

user.post('/refresh-token', async c => {
  let refreshToken: string | undefined

  try {
    const body = await c.req.json()
    refreshToken = body.refreshToken
  } catch {}

  if (!refreshToken) {
    throw HTTP.Error(HttpStatus.UNAUTHORIZED, 'Refresh token required')
  }

  const userPayload = await verifyRefreshToken(
    refreshToken,
    c.env.REFRESH_TOKEN_SECRET
  )

  if (!userPayload?.userId || typeof userPayload.userId !== 'string') {
    throw HTTP.Error(HttpStatus.UNAUTHORIZED, 'Invalid refresh token')
  }

  const userId = userPayload.userId
  const db = database(c.env.DATABASE_URL)

  const userRecord = await db.query.users.findFirst({
    columns: {
      id: true,
      refreshToken: true,
    },
    where: {
      id: userId,
    },
  })

  if (!userRecord || userRecord.refreshToken !== refreshToken) {
    throw HTTP.Error(HttpStatus.UNAUTHORIZED, 'Refresh token not recognized')
  }

  const tokens = await generateAccessAndRefreshTokens(
    { userId: userRecord.id },
    {
      accessSecret: c.env.ACCESS_TOKEN_SECRET,
      accessExpiry: c.env.ACCESS_TOKEN_EXPIRY,
      refreshSecret: c.env.REFRESH_TOKEN_SECRET,
      refreshExpiry: c.env.REFRESH_TOKEN_EXPIRY,
    }
  )

  await db
    .update(users)
    .set({
      refreshToken: tokens.refreshToken,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userRecord.id))

  setAuthCookies(c, tokens.accessToken, tokens.refreshToken)

  return c.json(HTTP.Response(HttpPhrase.OK, null), HttpStatus.OK)
})

user.use('/logout', authMiddleware)
user.post('/logout', async c => {
  const userId = c.get('user')
  const db = database(c.env.DATABASE_URL)

  await db.update(users).set({ refreshToken: null }).where(eq(users.id, userId))

  clearAuthCookies(c)

  return c.json(HTTP.Response(HttpPhrase.OK, null), HttpStatus.OK)
})

user.use('/change-password', authMiddleware)
user.post(
  '/change-password',
  zValidator('json', changePasswordSchema),
  async c => {
    const userId = c.get('user')
    const { currentPassword, newPassword } = c.req.valid('json')

    const db = database(c.env.DATABASE_URL)

    const userRecord = await db.query.users.findFirst({
      columns: {
        id: true,
        password: true,
      },
      where: {
        id: userId,
      },
    })

    if (!userRecord) {
      throw HTTP.Error(HttpStatus.NOT_FOUND, 'User not found')
    }

    const isMatch = await passwordMatch(currentPassword, userRecord.password)
    if (!isMatch) {
      throw HTTP.Error(HttpStatus.UNAUTHORIZED, 'Current password is incorrect')
    }

    const hashedPassword = await hashPassword(newPassword)
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))

    return c.json(HTTP.Response(HttpPhrase.OK, null), HttpStatus.OK)
  }
)

user.use('/current-user', authMiddleware)
user.get('/current-user', async c => {
  const userId = c.get('user')
  const db = database(c.env.DATABASE_URL)

  const userRecord = await db.query.users.findFirst({
    columns: {
      id: true,
      username: true,
      fullname: true,
      email: true,
      avatar: true,
      coverImage: true,
      createdAt: true,
      updatedAt: true,
    },
    where: {
      id: userId,
    },
  })

  if (!userRecord) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'User not found')
  }

  return c.json(
    HTTP.Response(HttpPhrase.OK, { user: userRecord }),
    HttpStatus.OK
  )
})

user.use('/update-account', authMiddleware)
user.patch(
  '/update-account',
  zValidator('json', updateAccountDetailsSchema),
  async c => {
    const userId = c.get('user')
    const { fullname, username, email } = c.req.valid('json')

    const db = database(c.env.DATABASE_URL)

    if (email || username) {
      const conditions: ReturnType<typeof eq>[] = []
      if (email) conditions.push(eq(users.email, email))
      if (username) conditions.push(eq(users.username, username))

      const [existingUser] = await db
        .select()
        .from(users)
        .where(and(or(...conditions), not(eq(users.id, userId))))
        .limit(1)

      if (existingUser) {
        throw HTTP.Error(
          HttpStatus.CONFLICT,
          'Email or username already exists'
        )
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        fullname: fullname ?? undefined,
        username: username ?? undefined,
        email: email ?? undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        fullname: users.fullname,
        username: users.username,
        email: users.email,
        avatar: users.avatar,
        coverImage: users.coverImage,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })

    return c.json(
      HTTP.Response(HttpPhrase.OK, { user: updatedUser }),
      HttpStatus.OK
    )
  }
)

user.use('/avatar', authMiddleware)
user.patch(
  '/avatar',
  zValidator('form', z.object({ avatar: imageFile })),
  async c => {
    const userId = c.get('user')
    const { avatar } = c.req.valid('form')

    if (!(avatar instanceof File)) {
      throw HTTP.Error(HttpStatus.BAD_REQUEST, 'Valid avatar file is required')
    }

    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } =
      env<CloudflareBindings>(c)
    const avatarUrl = await uploadToCloudinary(
      avatar,
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_UPLOAD_PRESET
    )

    // @ts-ignore
    if (!avatarUrl?.secure_url && !avatarUrl?.url) {
      throw HTTP.Error(HttpStatus.BAD_REQUEST, 'Error while uploading avatar')
    }

    const db = database(c.env.DATABASE_URL)
    const [updatedUser] = await db
      .update(users)
      .set({
        // @ts-ignore
        avatar: avatarUrl?.secure_url || avatarUrl?.url,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        fullname: users.fullname,
        username: users.username,
        email: users.email,
        avatar: users.avatar,
        coverImage: users.coverImage,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })

    return c.json(
      HTTP.Response(HttpPhrase.OK, { user: updatedUser }),
      HttpStatus.OK
    )
  }
)

user.use('/cover-image', authMiddleware)
user.patch(
  '/cover-image',
  zValidator('form', z.object({ coverImage: imageFile })),
  async c => {
    const userId = c.get('user')
    const { coverImage } = c.req.valid('form')

    if (!(coverImage instanceof File)) {
      throw HTTP.Error(
        HttpStatus.BAD_REQUEST,
        'Valid cover image file is required'
      )
    }

    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } =
      env<CloudflareBindings>(c)
    const coverImageUrl = await uploadToCloudinary(
      coverImage,
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_UPLOAD_PRESET
    )

    // @ts-ignore
    if (!coverImageUrl?.secure_url && !coverImageUrl?.url) {
      throw HTTP.Error(
        HttpStatus.BAD_REQUEST,
        'Error while uploading cover image'
      )
    }

    const db = database(c.env.DATABASE_URL)
    const [updatedUser] = await db
      .update(users)
      .set({
        // @ts-ignore
        coverImage: coverImageUrl?.secure_url || coverImageUrl?.url,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        fullname: users.fullname,
        username: users.username,
        email: users.email,
        avatar: users.avatar,
        coverImage: users.coverImage,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })

    return c.json(
      HTTP.Response(HttpPhrase.OK, { user: updatedUser }),
      HttpStatus.OK
    )
  }
)

const usernameParam = z.object({
  username: z.string().min(1, 'Username is required').max(12).trim(),
})

user.get('/c/:username', zValidator('param', usernameParam), async c => {
  const { username } = c.req.valid('param')

  const db = database(c.env.DATABASE_URL)

  const [channelUser] = await db
    .select({
      id: users.id,
      fullname: users.fullname,
      username: users.username,
      email: users.email,
      avatar: users.avatar,
      coverImage: users.coverImage,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1)

  if (!channelUser) {
    throw HTTP.Error(HttpStatus.NOT_FOUND, 'Channel does not exist')
  }

  const [[subscriberCount], [subscribedToCount]] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(subscriptions)
      .where(eq(subscriptions.channelId, channelUser.id)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(subscriptions)
      .where(eq(subscriptions.subscriberId, channelUser.id)),
  ])

  let isSubscribed = false
  const authHeader = c.req.header('authorization')
  if (authHeader) {
    const [type, token] = authHeader.split(' ')
    if (type?.toLowerCase() === 'bearer' && token) {
      const payload = await verifyAccessToken(token, c.env.ACCESS_TOKEN_SECRET)
      const currentUserId = payload?.userId as string | undefined
      if (currentUserId) {
        const [existingSub] = await db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.subscriberId, currentUserId),
              eq(subscriptions.channelId, channelUser.id)
            )
          )
          .limit(1)
        isSubscribed = !!existingSub
      }
    }
  }

  return c.json(
    HTTP.Response(HttpPhrase.OK, {
      user: {
        ...channelUser,
        subscribersCount: subscriberCount?.count ?? 0,
        channelsSubscribedToCount: subscribedToCount?.count ?? 0,
        isSubscribed,
      },
    }),
    HttpStatus.OK
  )
})

export default user
export type UserType = typeof user
