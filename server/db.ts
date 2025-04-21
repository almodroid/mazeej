import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Development connection string - replace with your actual local/development DB URL
const devDbUrl = "postgres://postgres:NewAlmo2030@@db.abkbhsfmgvcfdjmatffl.supabase.co:5432/postgres";

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || devDbUrl 
});
export const db = drizzle(pool, { schema });
