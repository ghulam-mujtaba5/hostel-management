// Check profile and test space creation
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function check() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const userId = '044bdba3-3467-49c9-835d-d686409ead6d';
  
  // Check user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  console.log('Profile:', profile);
  console.log('Profile Error:', profileError);
  
  // Check if user has any spaces
  const { data: spaces, error: spacesError } = await supabase
    .from('space_members')
    .select('*, spaces(*)')
    .eq('user_id', userId);
  
  console.log('User Spaces:', spaces);
  console.log('Spaces Error:', spacesError);
  
  // Try to create a space as service role (bypasses RLS)
  const { data: newSpace, error: createError } = await supabase
    .from('spaces')
    .insert({
      name: 'Test Space Service Role',
      created_by: userId,
    })
    .select()
    .single();
  
  console.log('New Space:', newSpace);
  console.log('Create Error:', createError);
  
  if (newSpace) {
    // Add user as admin member
    const { error: memberError } = await supabase
      .from('space_members')
      .insert({
        space_id: newSpace.id,
        user_id: userId,
        role: 'admin',
        points: 0,
      });
    
    console.log('Member Error:', memberError);
    console.log('\n✅ Space created successfully!');
    console.log('Invite Code:', newSpace.invite_code);
    console.log('Invite Link:', `http://localhost:3000/invite/${newSpace.invite_code}`);
  }
}

check().catch(console.error);
