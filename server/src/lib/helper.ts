import bcrypt from 'bcryptjs'
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
    accessExpiry: number
    refreshSecret: string
    refreshExpiry: number
  }
) => {
  const accessSecret = new TextEncoder().encode(secrets.accessSecret)
  const refreshSecret = new TextEncoder().encode(secrets.refreshSecret)

  const accessToken = new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(secrets.accessExpiry)
    .sign(accessSecret)

  const refreshToken = new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(secrets.refreshExpiry)
    .sign(refreshSecret)

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
