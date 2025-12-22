#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uyertzuadcneniblfzcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not set in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('📝 Reading migration file...');
    const sqlContent = fs.readFileSync('./supabase/migrations/20251221160000_fix_profile_foreign_key.sql', 'utf-8');
    
    // Split by statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`🔄 Executing ${statements.length} SQL statements...`);
    
    let success = 0;
    let errors = [];
    
    for (let i = 0; i < statements.length; i++) {
      try {
        const statement = statements[i] + ';';
        console.log(`  ├─ Statement ${i + 1}/${statements.length}...`);
        
        const { error, data } = await supabase.rpc('postgres', { sql: statement });
        
        if (error && !error.message?.includes('duplicate') && !error.message?.includes('already exists')) {
          errors.push(`Statement ${i + 1}: ${error.message}`);
          console.log(`  │  ❌ Failed`);
        } else {
          success++;
          console.log(`  │  ✅ Success`);
        }
      } catch (e) {
        errors.push(`Statement ${i + 1}: ${e.message}`);
        console.log(`  │  ❌ Error`);
      }
    }
    
    console.log(`\n✅ Applied ${success}/${statements.length} statements`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Some statements had issues (may be expected):');
      errors.forEach(e => console.log(`  - ${e}`));
    }
    
    process.exit(errors.length > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
