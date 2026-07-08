import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

/** HTTP utils */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

export const HttpPhrase = Object.fromEntries(
  Object.keys(HttpStatus).map(k => [k, k])
) as Record<keyof typeof HttpStatus, string>

export const HTTP = {
  Response<T>(message: string, data: T | null = null, success: boolean = true) {
    return {
      message,
      data,
      success,
    }
  },
  Error(
    status: ContentfulStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    message: string,
    error?: unknown
  ) {
    return new HTTPException(status, { message, cause: error })
  },
}
