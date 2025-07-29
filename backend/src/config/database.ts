import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../models/schema';

// Make these variables mutable, as they will be assigned later
let client: postgres.Sql | undefined;
let db: ReturnType<typeof drizzle> | undefined;

export function initializeDatabase() {
    try {
        // Only access process.env.DATABASE_URL *inside* this function
        const rawConnectionString = process.env.DATABASE_URL;

        if (!rawConnectionString) {
            console.warn('DATABASE_URL is not set - database not initialized');
            return;
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
            // For Supabase pooler connection, we need specific SSL settings
            const isSupabase = connectionString.includes('supabase.com');
            
            // For Supabase pooler, we need to ensure proper SSL mode
            const connectionOptions: any = {
                max: 3, // Reduced for serverless
                idle_timeout: 10,
                connect_timeout: 10,
                prepare: false, // Important for serverless
            };
            
            // Supabase pooler requires SSL
            if (isSupabase) {
                connectionOptions.ssl = 'require';
            } else if (process.env.NODE_ENV === 'production') {
                connectionOptions.ssl = { rejectUnauthorized: false };
            }
            
            client = postgres(connectionString, connectionOptions);

            db = drizzle(client, {
                schema,
                logger: process.env.NODE_ENV === 'development'
            });

            console.log('Database initialized successfully');
        }
    } catch (error) {
        console.error('Database initialization failed:', error);
        // Don't throw - let the app start without database
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
            console.error('Failed to initialize database on demand:', error);
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
            console.error('Failed to initialize database client on demand:', error);
            throw new Error('Database connection unavailable. Please check your configuration.');
        }
    }
    return client;
};

// Export db directly for easier imports
export { db };

// Test connection function with better error handling
export const testConnection = async () => {
    try {
        if (!process.env.DATABASE_URL) {
            console.warn('DATABASE_URL not configured');
            return false;
        }

        // Create a separate client just for testing with a very short timeout
        const dbUrl = process.env.DATABASE_URL;
        const isSupabase = dbUrl.includes('supabase.com');
        
        console.log(`Testing database connection to ${isSupabase ? 'Supabase' : 'PostgreSQL'}...`);
        console.log(`Connection string length: ${dbUrl.length}`);
        console.log(`SSL mode: ${isSupabase ? 'require' : 'false'}`);
        
        const testOptions: any = {
            max: 1,
            idle_timeout: 5,
            connect_timeout: 5,
            prepare: false,
        };
        
        // Use proper SSL mode for Supabase
        if (isSupabase) {
            testOptions.ssl = 'require';
        } else if (process.env.NODE_ENV === 'production') {
            testOptions.ssl = { rejectUnauthorized: false };
        }
        
        const testClient = postgres(dbUrl, testOptions);

        // Execute a simple query with a timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection test timeout')), 8000)
        );

        await Promise.race([testClient`SELECT 1`, timeoutPromise]);

        // Close the test client
        await testClient.end();

        console.log('Database connected successfully');
        return true;
    } catch (error: any) {
        console.error(`Database connection failed: ${error.message}`);
        console.error('Full error:', error);
        return false;
    }
};

export type Database = ReturnType<typeof drizzle>;