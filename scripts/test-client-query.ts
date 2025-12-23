
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Use ANON key to simulate client

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClientQuery() {
  // 1. Login as one of the users
  const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'ghulam.mujtaba@hostel.com',
    password: 'HostelMate123!'
  });

  if (loginError) {
    console.error('Login failed:', loginError);
    return;
  }

  console.log('Logged in as:', session?.user.email);

  // 2. Run the exact query from AuthContext
  const { data, error } = await supabase
      .from('space_members')
      .select(`
        space_id,
        role,
        points,
        spaces:space_id (*)
      `)
      .eq('user_id', session?.user.id);

  if (error) {
    console.error('Query failed:', error);
  } else {
    console.log('Query result:', JSON.stringify(data, null, 2));
  }
}

testClientQuery();
