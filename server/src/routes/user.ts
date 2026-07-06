import { and, eq, not, or } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@/db'
import { users } from '@/db/schema'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { ACCEPTED_MIMES, HttpStatus, MAX_IMAGE_BYTES } from '@/lib/const'
import {
  generateAccessAndRefreshTokens,
  hashPassword,
  passwordMatch,
  verifyRefreshToken,
} from '@/lib/helper'
import { ApiError, created, ok } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth.middleware'

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
  email: z.string().nonempty().email({ message: 'Invalid email address' }),
  password: strongPassword,
  avatar: imageFile.optional(),
  coverImage: imageFile.optional(),
})

const loginSchema = registerSchema.pick({ username: true, password: true })

const refreshTokenSchema = z.object({
  refreshToken: z.string().nonempty(),
})

const changePasswordSchema = z.object({
  currentPassword: strongPassword,
  newPassword: strongPassword,
})

const forgotPasswordSchema = z.object({
  email: z.string().nonempty().email({ message: 'Invalid email address' }),
})

const resetPasswordSchema = z.object({
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

const user = new Hono<{ Variables: { user: string } }>()

// ── Auth routes ──

user.post('/register', zValidator('form', registerSchema), async c => {
  const { username, fullname, email, password, avatar, coverImage } =
    c.req.valid('form')

  const existing = await db
    .select({ id: users })
    .from(users)
    .where(or(eq(users.email, email), eq(users.username, username)))
    .limit(1)

  if (existing.length > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'User with same email or username already exists'
    )
  }

  const hashedPassword = await hashPassword(password)

  const avatarUpload =
    avatar instanceof File ? await uploadToCloudinary(avatar) : null
  const coverUpload =
    coverImage instanceof File ? await uploadToCloudinary(coverImage) : null

  const userId = crypto.randomUUID()
  const now = new Date().toISOString()

  const [newUser] = await db
    .insert(users)
    .values({
      id: userId,
      username,
      fullname,
      email,
      password: hashedPassword,
      avatar: avatarUpload?.secure_url ?? avatarUpload?.url ?? null,
      coverImage: coverUpload?.secure_url ?? coverUpload?.url ?? null,
      updatedAt: now,
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

  const tokens = await generateAccessAndRefreshTokens({ userId })

  await db
    .update(users)
    .set({ refreshToken: tokens.refreshToken, updatedAt: now })
    .where(eq(users.id, userId))

  return created(c, { user: newUser, tokens }, 'User registered successfully')
})

user.post('/login', zValidator('json', loginSchema), async c => {
  const { username, password } = c.req.valid('json')

  const userRecord = await db.query.users.findFirst({
    columns: {
      id: true,
      username: true,
      fullname: true,
      email: true,
      password: true,
      avatar: true,
      coverImage: true,
      createdAt: true,
      updatedAt: true,
    },
    where: or(eq(users.username, username), eq(users.email, username)),
  })

  if (!userRecord) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid username or password')
  }

  const isValid = await passwordMatch(password, userRecord.password)
  if (!isValid) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid username or password')
  }

  const tokens = await generateAccessAndRefreshTokens({ userId: userRecord.id })
  await db
    .update(users)
    .set({
      refreshToken: tokens.refreshToken,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userRecord.id))

  const { password: _, ...safeUser } = userRecord

  return ok(c, { user: safeUser, tokens }, 'Login successful')
})

user.post(
  '/forgot-password',
  zValidator('json', forgotPasswordSchema),
  async c => {
    return ok(c, null, 'Password reset email sent if the email exists')
  }
)

user.post(
  '/reset-password',
  zValidator('json', resetPasswordSchema),
  async c => {
    return ok(c, null, 'Password reset successfully')
  }
)

user.post('/refresh-token', zValidator('json', refreshTokenSchema), async c => {
  const { refreshToken } = c.req.valid('json')

  const userPayload = await verifyRefreshToken(refreshToken)

  if (!userPayload?.userId || typeof userPayload.userId !== 'string') {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid refresh token')
  }

  const userId = userPayload.userId

  const userRecord = await db.query.users.findFirst({
    columns: {
      id: true,
      refreshToken: true,
    },
    where: eq(users.id, userId),
  })

  if (!userRecord || userRecord.refreshToken !== refreshToken) {
    throw new ApiError(HttpStatus.UNAUTHORIZED, 'Refresh token not recognized')
  }

  const tokens = await generateAccessAndRefreshTokens({ userId: userRecord.id })

  await db
    .update(users)
    .set({
      refreshToken: tokens.refreshToken,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userRecord.id))

  return ok(c, { tokens }, 'Access token refreshed')
})

user.use('/logout', authMiddleware)
user.post('/logout', async c => {
  const userId = c.get('user')
  await db
    .update(users)
    .set({ refreshToken: null, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId))

  return ok(c, null, 'Logged out successfully')
})

user.use('/change-password', authMiddleware)
user.post(
  '/change-password',
  zValidator('json', changePasswordSchema),
  async c => {
    const userId = c.get('user')
    const { currentPassword, newPassword } = c.req.valid('json')

    const userRecord = await db.query.users.findFirst({
      columns: {
        id: true,
        password: true,
      },
      where: eq(users.id, userId),
    })

    if (!userRecord) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found')
    }

    const isValid = await passwordMatch(currentPassword, userRecord.password)
    if (!isValid) {
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        'Current password is incorrect'
      )
    }

    const hashedPassword = await hashPassword(newPassword)
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))

    return ok(c, null, 'Password changed successfully')
  }
)

user.use('/current-user', authMiddleware)
user.get('/current-user', async c => {
  const userId = c.get('user')

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
    where: eq(users.id, userId),
  })

  if (!userRecord) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'User not found')
  }

  return ok(c, { user: userRecord }, 'Current user retrieved successfully')
})

// ── User profile routes ──

user.use('/update-account', authMiddleware)
user.patch(
  '/update-account',
  zValidator('json', updateAccountDetailsSchema),
  async c => {
    const userId = c.get('user')
    const { fullname, username, email } = c.req.valid('json')

    if (email || username) {
      const conditions = []
      if (email) conditions.push(eq(users.email, email))
      if (username) conditions.push(eq(users.username, username))

      const [existingUser] = await db
        .select()
        .from(users)
        .where(and(or(...conditions), not(eq(users.id, userId))))
        .limit(1)

      if (existingUser) {
        throw new ApiError(
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

    return ok(c, { user: updatedUser }, 'Account details updated successfully')
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
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        'Valid avatar file is required'
      )
    }

    const avatarUrl = await uploadToCloudinary(avatar)

    const [updatedUser] = await db
      .update(users)
      .set({
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

    return ok(c, { user: updatedUser }, 'Avatar updated successfully')
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
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        'Valid cover image file is required'
      )
    }

    const coverImageUrl = await uploadToCloudinary(coverImage)

    const [updatedUser] = await db
      .update(users)
      .set({
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

    return ok(c, { user: updatedUser }, 'Cover image updated successfully')
  }
)

user.get('/c/:username', async c => {
  const username = c.req.param('username')

  const channelUser = await db.query.users.findFirst({
    columns: {
      id: true,
      fullname: true,
      username: true,
      email: true,
      avatar: true,
      coverImage: true,
      createdAt: true,
      updatedAt: true,
    },
    where: eq(users.username, username),
  })

  if (!channelUser) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'User not found')
  }

  return ok(
    c,
    { user: channelUser },
    'User channel profile retrieved successfully'
  )
})

user.use('/history', authMiddleware)
user.get('/history', async c => {
  const _userId = c.get('user')
  const history: unknown[] = []
  return ok(c, { history }, 'Watch history retrieved successfully')
})

export default user
export type UserType = typeof user
