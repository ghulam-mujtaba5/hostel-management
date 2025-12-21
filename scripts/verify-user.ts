import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyUser() {
  // Get the user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('No logged in user');
    return;
  }
  
  console.log('Current user:', user.email);
  console.log('Email confirmed:', user.email_confirmed_at);
}

verifyUser();
