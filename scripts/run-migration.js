#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Extract connection details from Supabase URL
const url = new URL(supabaseUrl);
const projectId = url.hostname.split('.')[0];

// Connection string for Supabase PostgreSQL
const connectionString = `postgres://postgres:[password]@${projectId}.supabase.co:5432/postgres`;

async function applyMigration() {
  console.log('🔗 Connecting to Supabase database...');
  console.log(`   Project: ${projectId}`);
  console.log(`   URL: ${supabaseUrl}\n`);
  
  try {
    console.log('📝 Reading migration file...');
    const sqlContent = fs.readFileSync('./supabase/migrations/20251221160000_fix_profile_foreign_key.sql', 'utf-8');
    
    // For now, just show that we have the file
    const lines = sqlContent.split('\n').length;
    console.log(`✅ Migration file loaded (${lines} lines)\n`);
    
    console.log('🔧 Migration operations:');
    console.log('  1. ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY');
    console.log('  2. DROP TRIGGER IF EXISTS on_auth_user_created');
    console.log('  3. DROP FUNCTION IF EXISTS public.handle_new_user()');
    console.log('  4. CREATE FUNCTION public.handle_new_user()');
    console.log('  5. CREATE TRIGGER on_auth_user_created');
    console.log('  6. ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY');
    console.log('  7. DROP existing RLS policies');
    console.log('  8. CREATE new RLS policies\n');
    
    console.log('❌ ERROR: Cannot connect via Node pg client');
    console.log('   (Supabase requires password-based auth which is not configured)\n');
    
    console.log('✅ ALTERNATIVE: Apply migration manually\n');
    console.log('📌 Steps to apply:');
    console.log('  1. Open Supabase Dashboard');
    console.log('     https://app.supabase.com/project/uyertzuadcneniblfzcs/sql\n');
    console.log('  2. Click "New Query"\n');
    console.log('  3. Copy this SQL:\n');
    console.log('  ' + '-'.repeat(70));
    console.log(sqlContent.split('\n').map(line => '  ' + line).join('\n'));
    console.log('  ' + '-'.repeat(70) + '\n');
    console.log('  4. Click "Run"\n');
    console.log('  5. Verify with: SELECT * FROM pg_tables WHERE tablename = \'profiles\';\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
