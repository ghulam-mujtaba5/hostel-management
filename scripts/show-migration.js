const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? 'Found' : 'Missing');
  process.exit(1);
}

console.log('🚀 Fixing Profile Foreign Key Constraint\n');
console.log('='.repeat(60));

// Read migration SQL
const migrationSQL = `
-- Create function to automatically create profile when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Create trigger to call the function when a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
`;

console.log('\n📝 SQL Migration to apply:\n');
console.log(migrationSQL);
console.log('\n' + '='.repeat(60));
console.log('\n✅ INSTRUCTIONS:\n');
console.log('1. Go to: https://supabase.com/dashboard/project/uyertzuadcneniblfzcs/sql/new');
console.log('2. Copy the SQL above');
console.log('3. Paste it into the SQL Editor');
console.log('4. Click "Run" button\n');
console.log('Then run: npx ts-node scripts/fix-missing-profiles.ts\n');
console.log('='.repeat(60));
