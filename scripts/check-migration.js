#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uyertzuadcneniblfzcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

// Extract project ID from URL
const projectId = new URL(supabaseUrl).hostname.split('.')[0];

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/rpc/pg_execute`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(parsed.message || data));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

async function applyMigration() {
  try {
    console.log('📝 Reading migration file...');
    const sqlContent = fs.readFileSync('./supabase/migrations/20251221160000_fix_profile_foreign_key.sql', 'utf-8');
    
    // Filter out comments and empty lines
    const statements = sqlContent
      .split('\n')
      .filter(line => !line.startsWith('--') && line.trim())
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`🔄 Found ${statements.length} SQL statements`);
    console.log('\n📋 Migration summary:');
    console.log('  - Disabling RLS on profiles');
    console.log('  - Recreating trigger function');
    console.log('  - Recreating RLS policies');
    console.log('\n⚠️  Note: Applying complex migrations via REST API may not work.');
    console.log('  Recommend applying via Supabase dashboard SQL editor instead.\n');
    
    const fullSQL = statements.join(';\n') + ';';
    console.log('📌 Full migration SQL length:', fullSQL.length, 'bytes');
    console.log('\n✅ Migration is ready to apply!');
    console.log('\n📌 To apply manually:');
    console.log('  1. Go to: https://app.supabase.com/project/uyertzuadcneniblfzcs/sql');
    console.log('  2. Create new query');
    console.log('  3. Copy the migration file content');
    console.log('  4. Execute\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

applyMigration();
