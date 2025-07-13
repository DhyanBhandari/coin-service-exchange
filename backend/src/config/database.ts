import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../models/schema';
import { logger } from '../utils/logger';

// Make these variables mutable, as they will be assigned later
let client: postgres.Sql | undefined;
let db: ReturnType<typeof drizzle> | undefined;

export function initializeDatabase() {
    // Only access process.env.DATABASE_URL *inside* this function
    const rawConnectionString = process.env.DATABASE_URL;

    if (!rawConnectionString) {
        throw new Error('DATABASE_URL is not set');
    }

    // Extract only the URL part from the environment variable string
    const connectionString = rawConnectionString.startsWith('DATABASE_URL=')
        ? rawConnectionString.substring('DATABASE_URL='.length)
        : rawConnectionString;

    if (!client) { // Prevent re-initializing if already done
        client = postgres(connectionString, {
            max: 20,
            idle_timeout: 30,
            connect_timeout: 60,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });

        db = drizzle(client, {
            schema,
            logger: process.env.NODE_ENV === 'development'
        });
    }
}

// Export the db and client accessors
export const getDb = () => {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
};

export const getClient = () => {
    if (!client) {
        throw new Error('Database client not initialized. Call initializeDatabase() first.');
    }
    return client;
};

// Export db directly for easier imports
export { db };

// Test connection function
export const testConnection = async () => {
    try {
        const currentClient = getClient();
        await currentClient`SELECT 1`;
        logger.info('Database connected successfully');
        return true;
    } catch (error) {
        logger.error('Database connection failed:', error);
        return false;
    }
};

export type Database = ReturnType<typeof drizzle>;
