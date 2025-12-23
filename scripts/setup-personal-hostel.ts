
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const USERS = [
  { email: 'iman.azhar@hostel.com', password: 'HostelMate123!', name: 'Iman Azhar', username: 'iman_azhar' },
  { email: 'ghulam.mujtaba@hostel.com', password: 'HostelMate123!', name: 'Ghulam Mujtaba', username: 'ghulam_mujtaba', isAdmin: true },
  { email: 'sohail.niamat@hostel.com', password: 'HostelMate123!', name: 'Muhammad Sohail Niamat', username: 'sohail_niamat' },
  { email: 'muhammad.salman@hostel.com', password: 'HostelMate123!', name: 'Muhammad Salman', username: 'muhammad_salman' },
  { email: 'muhammad.mubashir@hostel.com', password: 'HostelMate123!', name: 'Muhammad Mubashir', username: 'muhammad_mubashir' },
];

const SPACE_NAME = 'Doctors/Engineer hostel';

async function setupHostel() {
  console.log('Starting Hostel Setup...');
  
  const createdUsers = [];

  // 1. Create Users
  for (const user of USERS) {
    console.log(`Creating user: ${user.name} (${user.email})...`);
    
    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let userId = existingUsers?.users.find(u => u.email === user.email)?.id;

    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.name,
          username: user.username
        }
      });

      if (error) {
        console.error(`Error creating user ${user.email}:`, error.message);
        continue;
      }
      userId = data.user.id;
      console.log(`User created: ${userId}`);
    } else {
      console.log(`User already exists: ${userId}`);
    }

    createdUsers.push({ ...user, id: userId });
  }

  // 2. Create Space
  const adminUser = createdUsers.find(u => u.isAdmin);
  if (!adminUser || !adminUser.id) {
    console.error('Admin user not found or failed to create.');
    return;
  }

  console.log(`Creating space "${SPACE_NAME}" for admin ${adminUser.name}...`);

  // Check if space exists
  const { data: existingSpaces } = await supabase
    .from('spaces')
    .select('*')
    .eq('name', SPACE_NAME)
    .eq('created_by', adminUser.id);

  let spaceId;

  if (existingSpaces && existingSpaces.length > 0) {
    spaceId = existingSpaces[0].id;
    console.log(`Space already exists: ${spaceId}`);
  } else {
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .insert({
        name: SPACE_NAME,
        created_by: adminUser.id
      })
      .select()
      .single();

    if (spaceError) {
      console.error('Error creating space:', spaceError);
      return;
    }
    spaceId = space.id;
    console.log(`Space created: ${spaceId}`);
  }

  // 3. Add Members
  console.log('Adding members to space...');
  
  for (const user of createdUsers) {
    if (!user.id) continue;

    const role = user.isAdmin ? 'admin' : 'member';
    
    // Check if member exists
    const { data: existingMember } = await supabase
      .from('space_members')
      .select('*')
      .eq('space_id', spaceId)
      .eq('user_id', user.id);

    if (existingMember && existingMember.length > 0) {
      console.log(`User ${user.name} is already a member.`);
      continue;
    }

    const { error: memberError } = await supabase
      .from('space_members')
      .insert({
        space_id: spaceId,
        user_id: user.id,
        role: role
      });

    if (memberError) {
      console.error(`Error adding ${user.name} to space:`, memberError);
    } else {
      console.log(`Added ${user.name} as ${role}`);
    }
  }

  console.log('\n--- SETUP COMPLETE ---');
  console.log('Space: ' + SPACE_NAME);
  console.log('Login Credentials:');
  createdUsers.forEach(u => {
    console.log(`- ${u.name}: ${u.email} / ${u.password} (${u.isAdmin ? 'Admin' : 'Member'})`);
  });
}

setupHostel();
