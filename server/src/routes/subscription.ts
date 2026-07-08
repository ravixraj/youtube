import { Hono } from 'hono'
import { HTTP, HttpPhrase, HttpStatus } from '@/lib/http'
import { authMiddleware } from '@/middlewares/auth'

const subscription = new Hono<{
  Bindings: CloudflareBindings
  Variables: { user: string }
}>().basePath('/subscriptions')

subscription.use(authMiddleware)

subscription.post('/c/:channelId', async c => {
  const { channelId } = c.req.param()
  // TODO: toggle subscription
})

subscription.get('/u/:channelId', async c => {
  const { channelId } = c.req.param()
  // TODO: get user channel subscribers
})

subscription.get('/channels', async c => {
  // TODO: get subscribed channels
})

export default subscription
export type SubscriptionType = typeof subscription
