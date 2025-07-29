import { Client } from 'pg';

export async function simpleDbTest() {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
        return { success: false, error: 'DATABASE_URL not set' };
    }
    
    // For Supabase, we need specific SSL configuration
    const isSupabase = DATABASE_URL.includes('supabase.com');
    
    const clientConfig: any = {
        connectionString: DATABASE_URL,
    };
    
    // Supabase pooler requires SSL mode 'require'
    if (isSupabase) {
        clientConfig.ssl = { rejectUnauthorized: false };
        // For pooler connections, we might need to specify the ssl mode differently
        clientConfig.ssl = 'require';
    } else {
        clientConfig.ssl = { rejectUnauthorized: false };
    }
    
    const client = new Client(clientConfig);
    
    try {
        console.log('Attempting to connect to database...');
        await client.connect();
        console.log('Connected successfully!');
        
        const result = await client.query('SELECT NOW()');
        console.log('Query result:', result.rows[0]);
        
        await client.end();
        
        return { 
            success: true, 
            time: result.rows[0].now,
            message: 'Database connection successful'
        };
    } catch (error: any) {
        console.error('Database connection error:', error);
        return { 
            success: false, 
            error: error.message,
            code: error.code,
            detail: error.detail
        };
    }
}