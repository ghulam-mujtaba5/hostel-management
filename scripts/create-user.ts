
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  const email = 'admin@hostel.com';
  const password = 'password123';
  const username = 'admin';

  console.log(`Attempting to create user: ${email}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    console.error('Full error:', error);
  } else {
    console.log('User created successfully:', data.user?.id);
    
    // Create profile manually if needed (though the app does it)
    if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            username,
            full_name: username,
        });
        if (profileError) {
            console.error('Error creating profile:', profileError);
        } else {
            console.log('Profile created successfully');
        }
    }
  }
}

createUser();
