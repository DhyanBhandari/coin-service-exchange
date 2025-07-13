import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL and Service Role Key are required');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Supabase connection timeout')), 10000)
    );
    
    const connectionPromise = supabase.from('users').select('count').limit(1);
    
    const { data, error } = await Promise.race([connectionPromise, timeoutPromise]) as { data: any, error: any };
    
    if (error) throw error;
    logger.info('Supabase connected successfully');
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        logger.warn('Supabase connection timeout - continuing with limited functionality');
      } else {
        logger.error('Supabase connection failed:', error.message);
      }
    } else {
      logger.error('Supabase connection failed with unknown error');
    }
    return false;
  }
};
