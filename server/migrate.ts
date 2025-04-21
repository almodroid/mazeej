import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './db';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Run migrations
async function runMigrations() {
  console.log('Running database migrations...');
  
  // Check if migrations folder exists
  const migrationsFolder = path.resolve(__dirname, '..', 'migrations');
  if (!fs.existsSync(migrationsFolder)) {
    console.warn(`Migrations folder not found at ${migrationsFolder}`);
    console.warn('This is normal if you\'re running in production with bundled code.');
    console.warn('Will attempt to run migrations from the default location...');
  }
  
  try {
    await migrate(db, {
      migrationsFolder: migrationsFolder,
    });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close the pool only if we're running as a standalone script
    if (process.argv[1] === fileURLToPath(import.meta.url)) {
      await pool.end();
    }
  }
}

// Run as standalone script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration script failed:', err);
      process.exit(1);
    });
}

export { runMigrations };
