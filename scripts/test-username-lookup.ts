
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLookup() {
  const username = 'iman_azhar';
  console.log(`Looking up username: ${username}`);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (profileError) {
    console.error('Profile error:', profileError);
    return;
  }

  console.log('Found profile ID:', profile.id);

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);
  
  if (userError) {
    console.error('User error:', userError);
    return;
  }

  console.log('Found email:', userData.user.email);
}

testLookup();
