import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../models/schema';

// Get Supabase connection details
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DATABASE_URL = process.env.DATABASE_URL || '';

// Create Supabase client for auth and other features
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Initialize database connection
let db: ReturnType<typeof drizzle> | undefined;
let sql: postgres.Sql | undefined;

export function initializeSupabaseDb() {
    if (!DATABASE_URL) {
        console.error('DATABASE_URL not set');
        return;
    }
    
    try {
        // For Supabase, use the direct connection (not pooler) for Drizzle
        // The pooler URL often has issues with ORM tools
        let directUrl = DATABASE_URL;
        
        // If this is a pooler URL, try to convert it to direct connection
        if (DATABASE_URL.includes('pooler.supabase.com')) {
            // Replace pooler with direct connection
            directUrl = DATABASE_URL.replace('pooler.supabase.com:6543', 'db.nqctqporsodscwgoetjj.supabase.co:5432');
            console.log('Converted pooler URL to direct connection');
        }
        
        // Create postgres connection
        sql = postgres(directUrl, {
            max: 10,
            idle_timeout: 20,
            connect_timeout: 10,
        });
        
        // Create drizzle instance
        db = drizzle(sql, { schema });
        
        console.log('Supabase database initialized');
    } catch (error) {
        console.error('Failed to initialize Supabase database:', error);
    }
}

export function getSupabaseDb() {
    if (!db) {
        initializeSupabaseDb();
    }
    return db;
}

export async function testSupabaseConnection() {
    try {
        if (!DATABASE_URL) {
            return { success: false, error: 'DATABASE_URL not set' };
        }
        
        // Test with Supabase client
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error) {
            // If the error is about missing table, that's actually a successful connection
            if (error.message.includes('relation') || error.message.includes('does not exist')) {
                return { success: true, message: 'Connected to Supabase (tables not yet created)' };
            }
            return { success: false, error: error.message };
        }
        
        return { success: true, message: 'Connected to Supabase successfully' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}