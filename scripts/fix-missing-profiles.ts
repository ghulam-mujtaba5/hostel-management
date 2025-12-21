/**
 * Fix existing profile constraint violations
 * Run this script if you have users without profiles
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingProfiles() {
  try {
    console.log('Checking for users without profiles...');

    // Get all auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    const profileIds = new Set(profiles?.map(p => p.id) || []);
    const missingProfileUsers = users?.filter(u => !profileIds.has(u.id)) || [];

    if (missingProfileUsers.length === 0) {
      console.log('✅ All users have profiles!');
      return;
    }

    console.log(`Found ${missingProfileUsers.length} users without profiles`);

    // Create missing profiles
    const profilesToCreate = missingProfileUsers.map(user => ({
      id: user.id,
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
      full_name: user.user_metadata?.full_name || '',
    }));

    const { error: insertError } = await supabase
      .from('profiles')
      .insert(profilesToCreate)
      .select();

    if (insertError) {
      console.error('Error creating profiles:', insertError);
      return;
    }

    console.log(`✅ Successfully created ${profilesToCreate.length} missing profiles!`);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixMissingProfiles();
