import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('Checking user ghulam_mujtaba...');
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', 'ghulam_mujtaba')
    .single();

  if (pError) {
    console.error('Profile error:', pError);
  } else {
    console.log('Profile found:', profile);
  }

  console.log('\nChecking spaces...');
  const { data: spaces, error: sError } = await supabase
    .from('spaces')
    .select('*');

  if (sError) {
    console.error('Spaces error:', sError);
  } else {
    console.log('Spaces found:', spaces);
  }

  if (profile) {
    console.log('\nChecking memberships for ghulam_mujtaba...');
    const { data: memberships, error: mError } = await supabase
      .from('space_members')
      .select('*, spaces(*)')
      .eq('user_id', profile.id);

    if (mError) {
      console.error('Membership error:', mError);
    } else {
      console.log('Memberships found:', memberships);
    }
  }
}

verify();
