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

    // Clean up the connection string - remove any duplicate DATABASE_URL= prefix
    let connectionString = rawConnectionString.trim();
    
    // Handle case where DATABASE_URL appears twice (DATABASE_URL=DATABASE_URL=...)
    if (connectionString.startsWith('DATABASE_URL=DATABASE_URL=')) {
        connectionString = connectionString.substring('DATABASE_URL=DATABASE_URL='.length);
    } else if (connectionString.startsWith('DATABASE_URL=')) {
        connectionString = connectionString.substring('DATABASE_URL='.length);
    }

    if (!client) { // Prevent re-initializing if already done
        client = postgres(connectionString, {
            max: 10,
            idle_timeout: 20,
            connect_timeout: 30,
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
        // Use a timeout for the connection test
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection test timeout')), 10000)
        );
        
        await Promise.race([currentClient`SELECT 1`, timeoutPromise]);
        
        logger.info('Database connected successfully');
        return true;
    } catch (error) {
        logger.error('Database connection failed:', error);
        return false;
    }
};

export type Database = ReturnType<typeof drizzle>;
