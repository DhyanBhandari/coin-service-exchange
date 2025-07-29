import { Client } from 'pg';

export async function simpleDbTest() {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
        return { success: false, error: 'DATABASE_URL not set' };
    }
    
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
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