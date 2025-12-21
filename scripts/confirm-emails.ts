import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function confirmUser() {
  console.log('Attempting to manually confirm user emails...');
  
  // This won't work with anon key, but let's try to work around it
  // We'll need to use the app to trigger email confirmation bypass
  console.log('Note: Email confirmation requires service role key or manual SQL update');
  console.log('Please run this SQL in Supabase SQL Editor:');
  console.log(`
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email IN ('admin@hostel.com', 'realtest@hostel.com');
  `);
}

confirmUser();
