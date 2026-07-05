import { zValidator as zv } from '@hono/zod-validator'
import type { ContentfulStatusCode, ValidationTargets } from 'hono'
import type { ZodError, ZodSchema } from 'zod'
import { ApiError, ApiResponse } from './http'

export const handleZodError = <T>(
  result: { success: true; data: T } | { success: false; error: ZodError }
): T => {
  if (result.success) return result.data

  const issue = result.error?.issues[0]
  const path = issue?.path.join('.')
  const isMissing =
    issue?.code === 'invalid_type' && issue.input === 'undefined'

  throw new ApiError(
    isMissing ? 400 : 422,
    isMissing
      ? path
        ? `Missing '${path}' field`
        : 'Missing required fields'
      : issue?.message || 'Invalid input data'
  )
}

export const zValidator = <
  T extends ZodSchema,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T
) =>
  zv(target, schema, (result, c) => {
    if (!result.success) {
      const issue = result.error?.issues[0]
      const path = issue?.path.join('.')
      const isMissing =
        issue?.code === 'invalid_type' && issue.input === 'undefined'

      const message = isMissing
        ? path
          ? `Missing '${path}' field`
          : 'Missing required fields'
        : issue?.message || 'Invalid input data'

      const statusCode = (isMissing ? 400 : 422) as ContentfulStatusCode
      return c.json(new ApiResponse(statusCode, null, message), statusCode)
    }
  })
