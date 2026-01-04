// Test script to verify authentication and profile creation
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testProfiles() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('=== Authentication Test Report ===\n');
  
  // Get all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, email, full_name, created_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }
  
  console.log(`Total profiles: ${profiles?.length || 0}\n`);
  
  console.log('Recent profiles:');
  profiles?.slice(0, 5).forEach((profile, i) => {
    console.log(`${i + 1}. ${profile.username} (${profile.email || 'no email'})`);
    console.log(`   Created: ${new Date(profile.created_at).toLocaleString()}`);
  });
  
  // Check for duplicate usernames
  const usernames = profiles?.map(p => p.username) || [];
  const duplicates = usernames.filter((item, index) => usernames.indexOf(item) !== index);
  
  if (duplicates.length > 0) {
    console.log('\n⚠️ Duplicate usernames found:', [...new Set(duplicates)]);
  } else {
    console.log('\n✅ No duplicate usernames');
  }
  
  // Check for profiles without email
  const noEmail = profiles?.filter(p => !p.email);
  if (noEmail && noEmail.length > 0) {
    console.log(`\n⚠️ Profiles without email: ${noEmail.length}`);
  }
  
  console.log('\n=== Test Complete ===');
}

testProfiles().catch(console.error);
