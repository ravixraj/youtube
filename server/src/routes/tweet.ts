import { Hono } from 'hono'
import { z } from 'zod'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { zValidator } from '@/lib/zValidator'
import { authMiddleware } from '@/middlewares/auth'

const createTweetSchema = z.object({
  content: z
    .string()
    .min(1, 'Tweet content cannot be empty')
    .max(200, 'Tweet cannot exceed 200 characters'),
})

const updateTweetSchema = z.object({
  content: z
    .string()
    .min(1, 'Tweet content cannot be empty')
    .max(200, 'Tweet cannot exceed 200 characters'),
})

const tweet = new Hono<{
  Bindings: CloudflareBindings
  Variables: { user: string }
}>().basePath('/tweets')

tweet.post('/', zValidator('json', createTweetSchema), async c => {
  const { content } = c.req.valid('json')
  // TODO: create tweet
})

tweet.get('/user/:userId', async c => {
  const { userId } = c.req.param()
  // TODO: get user tweets
})

tweet.use('/*', authMiddleware)

tweet.patch('/:tweetId', zValidator('json', updateTweetSchema), async c => {
  const { tweetId } = c.req.param()
  const { content } = c.req.valid('json')
  // TODO: update tweet
})

tweet.delete('/:tweetId', async c => {
  const { tweetId } = c.req.param()
  // TODO: delete tweet
})

export default tweet
export type TweetType = typeof tweet
