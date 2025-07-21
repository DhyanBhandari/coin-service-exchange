// Migration script to apply database schema
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getDb } from '../config/database';

async function runMigrations() {
  try {
    console.log('🔄 Starting database migration...');

    const db = getDb();

    // Run migrations from the migrations folder with postgres-js migrator
    await migrate(db as any, { migrationsFolder: './migrations' });

    console.log('✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();