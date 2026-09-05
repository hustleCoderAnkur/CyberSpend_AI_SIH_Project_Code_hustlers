import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.local.example to .env.local and fill it in.')
}

const client = postgres(connectionString)

export const db = drizzle(client, { schema })
