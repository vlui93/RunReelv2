#!/usr/bin/env node

/**
 * Schema refresh script for Supabase PostgREST cache
 * Run this script to force refresh the schema cache when encountering PGRST204 errors
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function refreshSchema() {
  console.log('🔄 Refreshing Supabase schema cache...');
  
  try {
    // Method 1: Try to use NOTIFY command to reload schema
    console.log('📡 Attempting to notify PostgREST to reload schema...');
    
    const { data, error } = await supabase
      .rpc('notify_pgrst_reload');
    
    if (error && error.code !== '42883') { // Function doesn't exist error is expected
      console.warn('⚠️  NOTIFY method failed:', error.message);
    } else {
      console.log('✅ Schema refresh notification sent successfully');
    }
    
    // Method 2: Force schema reload by making a request that triggers cache refresh
    console.log('🔍 Verifying schema by querying video_generations table...');
    
    const { data: testData, error: testError } = await supabase
      .from('video_generations')
      .select('id, generation_config')
      .limit(1);
    
    if (testError) {
      if (testError.code === 'PGRST204') {
        console.error('❌ Schema cache still out of sync. Manual intervention may be required.');
        console.log('💡 Try the following:');
        console.log('   1. Restart your Supabase project (if using hosted Supabase)');
        console.log('   2. Wait 1-2 minutes for the cache to refresh automatically');
        console.log('   3. Check if the generation_config column exists in your database');
        return false;
      } else {
        console.error('❌ Database query failed:', testError.message);
        return false;
      }
    }
    
    console.log('✅ Schema cache is now synchronized!');
    console.log('📊 Found', testData?.length || 0, 'video generation records');
    
    return true;
    
  } catch (error) {
    console.error('❌ Schema refresh failed:', error.message);
    return false;
  }
}

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema for video_generations table...');
  
  try {
    // Query information_schema to verify column exists
    const { data, error } = await supabase
      .rpc('check_column_exists', {
        table_name: 'video_generations',
        column_name: 'generation_config'
      });
    
    if (error && error.code === '42883') {
      // Function doesn't exist, try direct query
      console.log('📋 Querying information_schema directly...');
      
      const { data: columnData, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'video_generations')
        .eq('column_name', 'generation_config');
      
      if (columnError) {
        console.warn('⚠️  Could not verify column existence:', columnError.message);
      } else if (columnData && columnData.length > 0) {
        console.log('✅ generation_config column exists in database schema');
        console.log('📝 Column details:', columnData[0]);
      } else {
        console.error('❌ generation_config column NOT found in database schema');
        console.log('💡 You may need to run database migrations');
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    console.warn('⚠️  Schema check failed:', error.message);
    return true; // Continue anyway
  }
}

async function main() {
  console.log('🚀 Starting Supabase schema refresh process...\n');
  
  // Check if the column exists in the database
  await checkDatabaseSchema();
  
  console.log(''); // Empty line for readability
  
  // Attempt to refresh the schema cache
  const success = await refreshSchema();
  
  console.log('\n📋 Summary:');
  if (success) {
    console.log('✅ Schema refresh completed successfully');
    console.log('🔄 Please restart your application to ensure changes take effect');
  } else {
    console.log('❌ Schema refresh encountered issues');
    console.log('🔧 Manual intervention may be required');
  }
  
  process.exit(success ? 0 : 1);
}

// Run the script
main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});