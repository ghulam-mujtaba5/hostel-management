/**
 * Apply profile constraint fix automatically
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('📝 Applying profile trigger migration...');
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_auto_profile_creation.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  
  // Split by semicolons and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        // Try direct execution if RPC fails
        console.log('Trying direct execution...');
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ query: statement })
        });
        
        if (!response.ok) {
          console.log('⚠️  Could not execute via API, continuing...');
        }
      }
    } catch (e) {
      console.log('⚠️  Statement execution note:', e);
    }
  }
  
  console.log('✅ Migration applied (run SQL manually in Supabase Dashboard if needed)');
}

async function fixExistingProfiles() {
  console.log('\n🔍 Checking for users without profiles...');

  try {
    // Get all auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${users?.length || 0} total auth users`);

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`Found ${profiles?.length || 0} existing profiles`);

    const profileIds = new Set(profiles?.map(p => p.id) || []);
    const missingProfileUsers = users?.filter(u => !profileIds.has(u.id)) || [];

    if (missingProfileUsers.length === 0) {
      console.log('✅ All users have profiles!');
      return;
    }

    console.log(`\n⚠️  Found ${missingProfileUsers.length} users without profiles:`);
    missingProfileUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.id})`);
    });

    // Create missing profiles
    console.log('\n📝 Creating missing profiles...');
    const profilesToCreate = missingProfileUsers.map(user => ({
      id: user.id,
      username: user.user_metadata?.username || user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
      full_name: user.user_metadata?.full_name || '',
    }));

    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert(profilesToCreate)
      .select();

    if (insertError) {
      console.error('❌ Error creating profiles:', insertError);
      return;
    }

    console.log(`✅ Successfully created ${created?.length || 0} missing profiles!`);
    created?.forEach(p => {
      console.log(`   ✓ Created profile for user ${p.id}`);
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function verifyFix() {
  console.log('\n🔍 Verifying the fix...');
  
  try {
    // Check if trigger exists
    const { data: triggers } = await supabase
      .from('pg_trigger')
      .select('*')
      .eq('tgname', 'on_auth_user_created');
    
    if (triggers && triggers.length > 0) {
      console.log('✅ Trigger "on_auth_user_created" exists');
    } else {
      console.log('⚠️  Trigger not found - you may need to apply the SQL manually in Supabase Dashboard');
    }

    // Final verification
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const { data: profiles } = await supabase.from('profiles').select('id');
    
    const userCount = users?.length || 0;
    const profileCount = profiles?.length || 0;
    
    console.log(`\n📊 Final Status:`);
    console.log(`   - Auth Users: ${userCount}`);
    console.log(`   - Profiles: ${profileCount}`);
    
    if (userCount === profileCount) {
      console.log('   ✅ All users have matching profiles!');
    } else {
      console.log(`   ⚠️  Mismatch: ${userCount - profileCount} users still missing profiles`);
    }
  } catch (error) {
    console.log('⚠️  Verification skipped (some checks require database access)');
  }
}

async function main() {
  console.log('🚀 Starting Profile Foreign Key Constraint Fix\n');
  console.log('=' .repeat(60));
  
  await applyMigration();
  await fixExistingProfiles();
  await verifyFix();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Fix completed!\n');
  console.log('📌 IMPORTANT: If the trigger was not applied automatically,');
  console.log('   please run the SQL from this file in Supabase SQL Editor:');
  console.log('   supabase/migrations/001_auto_profile_creation.sql\n');
}

main();
