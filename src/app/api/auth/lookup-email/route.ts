
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Find user ID from profiles (public table)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      // Try case-insensitive search if exact match fails
      const { data: profileCi, error: profileCiError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('username', username)
        .single();
        
      if (profileCiError || !profileCi) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Use the found profile
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profileCi.id);
      if (userError || !userData.user) {
        return NextResponse.json({ error: 'User auth data not found' }, { status: 404 });
      }
      return NextResponse.json({ email: userData.user.email });
    }

    // 2. Get user email from Auth Admin
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'User auth data not found' }, { status: 404 });
    }

    return NextResponse.json({ email: userData.user.email });
  } catch (error: any) {
    console.error('Lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
