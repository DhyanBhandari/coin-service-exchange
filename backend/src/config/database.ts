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
            max: 5,
            idle_timeout: 10,
            connect_timeout: 5, // Reduced timeout for faster failure detection
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
        // Try to initialize if not already done
        try {
            initializeDatabase();
            if (!db) {
                throw new Error('Database initialization failed');
            }
        } catch (error) {
            logger.error('Failed to initialize database on demand:', error);
            throw new Error('Database connection unavailable. Please check your configuration.');
        }
    }
    return db;
};

export const getClient = () => {
    if (!client) {
        // Try to initialize if not already done
        try {
            initializeDatabase();
            if (!client) {
                throw new Error('Database client initialization failed');
            }
        } catch (error) {
            logger.error('Failed to initialize database client on demand:', error);
            throw new Error('Database connection unavailable. Please check your configuration.');
        }
    }
    return client;
};

// Export db directly for easier imports
export { db };

// Test connection function
export const testConnection = async () => {
    try {
        // Create a separate client just for testing with a very short timeout
        const testClient = postgres(process.env.DATABASE_URL || '', {
            max: 1,
            idle_timeout: 5,
            connect_timeout: 3, // Very short timeout just for testing
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });

        // Execute a simple query with a timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection test timeout')), 5000)
        );
        
        await Promise.race([testClient`SELECT 1`, timeoutPromise]);
        
        // Close the test client
        await testClient.end();
        
        logger.info('Database connected successfully');
        return true;
    } catch (error) {
        // More detailed error logging
        if (error instanceof Error) {
            logger.error(`Database connection failed: ${error.message}`);
            if (error.stack) {
                logger.debug(error.stack);
            }
        } else {
            logger.error('Database connection failed with unknown error');
        }
        
        // Return false but don't crash the application
        return false;
    }
};

export type Database = ReturnType<typeof drizzle>;
