import { defineConfig } from "drizzle-kit";
import 'dotenv/config';

// Default connection string for development - same as in db.ts
const devDbUrl = "postgres://postgres:NewAlmo2030@@db.abkbhsfmgvcfdjmatffl.supabase.co:5432/postgres";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || devDbUrl,
  },
});
