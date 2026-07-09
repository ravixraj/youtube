import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { relations } from './relations'

export const db = (databaseUrl: string) => {
  const client = neon(databaseUrl)
  return drizzle({ client, relations })
}
