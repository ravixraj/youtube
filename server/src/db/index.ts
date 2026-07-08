import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { relations } from './relations'

let client: ReturnType<typeof neon> | null = null

export const db = (databaseUrl: string) => {
  if (!client) {
    client = neon(databaseUrl)
  }
  return drizzle({ client, relations })
}
