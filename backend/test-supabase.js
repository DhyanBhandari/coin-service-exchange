// Test Supabase connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection');
console.log('==========================================');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    console.log('\n🔗 Testing connection...');
    
    // First try to test basic connection with storage
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('⚠️ Storage access failed:', bucketsError.message);
      
      // Try alternative connection test - check available schemas/tables
      try {
        const { data: schemas, error: schemaError } = await supabase.rpc('version');
        if (schemaError) {
          console.error('❌ RPC test failed:', schemaError.message);
          
          // Try the services table instead of users
          const { data: servicesData, error: servicesError } = await supabase
            .from('services')
            .select('count')
            .limit(1);
            
          if (servicesError) {
            console.error('❌ Services table access failed:', servicesError.message);
            
            // Try transactions table
            const { data: transData, error: transError } = await supabase
              .from('transactions')
              .select('count')
              .limit(1);
              
            if (transError) {
              console.error('❌ Transactions table access failed:', transError.message);
              console.error('❌ All table access attempts failed');
              return;
            } else {
              console.log('✅ Supabase connection successful via transactions table!');
              console.log('Transactions response:', transData);
            }
          } else {
            console.log('✅ Supabase connection successful via services table!');
            console.log('Services response:', servicesData);
          }
        } else {
          console.log('✅ RPC connection successful!');
        }
      } catch (rpcError) {
        console.error('❌ Alternative connection tests failed:', rpcError.message);
      }
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('Available buckets:', buckets?.map(b => b.name) || []);
    }
    
    // Test storage if available
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        console.warn('⚠️ Storage test failed:', bucketsError.message);
      } else {
        console.log('✅ Storage connection successful!');
        console.log('Available buckets:', buckets?.map(b => b.name) || []);
      }
    } catch (storageError) {
      console.warn('⚠️ Storage test error:', storageError.message);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Check common issues
    if (error.message.includes('Invalid API key')) {
      console.error('💡 Issue: Invalid API key - check your SUPABASE_SERVICE_ROLE_KEY');
    } else if (error.message.includes('Project not found')) {
      console.error('💡 Issue: Project not found - check your SUPABASE_URL');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Issue: Connection timeout - check your internet connection');
    }
  }
}

testConnection();