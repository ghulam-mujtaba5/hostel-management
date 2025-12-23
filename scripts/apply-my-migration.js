
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not set in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    const filePath = './supabase/migrations/20251223000000_add_email_to_profiles.sql';
    console.log(`📝 Reading migration file: ${filePath}`);
    const sqlContent = fs.readFileSync(filePath, 'utf-8');
    
    // Split by statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`🔄 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`  ├─ Executing statement ${i + 1}...`);
      
      // Try using the 'postgres' RPC if it exists
      const { error } = await supabase.rpc('postgres', { sql: statement });
      
      if (error) {
        console.error(`  │  ❌ Error: ${error.message}`);
        // If RPC fails, we might not have it.
        if (error.message.includes('function "postgres" does not exist')) {
            console.error('  │  🛑 The "postgres" RPC function does not exist. Cannot apply migration via RPC.');
            process.exit(1);
        }
      } else {
        console.log(`  │  ✅ Success`);
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

applyMigration();
