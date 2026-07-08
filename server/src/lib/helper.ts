import bcrypt from 'bcryptjs'
import type { Context } from 'hono'
import { setCookie } from 'hono/cookie'
import { JWTPayload, SignJWT, jwtVerify } from 'jose'

export const hashPassword = async (password: string) =>
  await bcrypt.hash(password, 10)
export const passwordMatch = async (
  enteredPassword: string,
  storedPassword: string
) => await bcrypt.compare(enteredPassword, storedPassword)

export const generateAccessAndRefreshTokens = async (
  payload: JWTPayload,
  secrets: {
    accessSecret: string
    accessExpiry: string
    refreshSecret: string
    refreshExpiry: string
  }
) => {
  const accessSecret = new TextEncoder().encode(secrets.accessSecret)
  const refreshSecret = new TextEncoder().encode(secrets.refreshSecret)

  const [accessToken, refreshToken] = await Promise.all([
    new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(secrets.accessExpiry)
      .sign(accessSecret),

    new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(secrets.refreshExpiry)
      .sign(refreshSecret),
  ])

  return { accessToken, refreshToken }
}

export const verifyAccessToken = async (token: string, secret: string) => {
  const key = new TextEncoder().encode(secret)
  try {
    const { payload } = await jwtVerify(token, key)
    return payload
  } catch {
    return null
  }
}

export const verifyRefreshToken = async (token: string, secret: string) => {
  const key = new TextEncoder().encode(secret)
  try {
    const { payload } = await jwtVerify(token, key)
    return payload
  } catch {
    return null
  }
}

/** Set & Cauth cookies */
export const setAuthCookies = (
  c: Context,
  accessToken: string,
  refreshToken: string
) => {
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
  }

  setCookie(c, 'access_token', accessToken, {
    ...cookieOptions,
    maxAge: c.env.ACCESS_EXP,
  })

  setCookie(c, 'refresh_token', refreshToken, {
    ...cookieOptions,
    maxAge: c.env.REFRESH_EXP,
  })
}

export const clearAuthCookies = (c: Context) => {
  const cookieOptions = { path: '/', maxAge: 0 }
  setCookie(c, 'access_token', '', cookieOptions)
  setCookie(c, 'refresh_token', '', cookieOptions)
}
