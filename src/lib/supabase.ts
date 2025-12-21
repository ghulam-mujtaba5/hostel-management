import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate that we have real Supabase credentials
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
  );
}

if (supabaseUrl.includes('example') || supabaseUrl === 'your-project-url') {
  throw new Error(
    'Invalid Supabase URL. Please configure valid Supabase credentials in environment variables.'
  );
}

if (supabaseAnonKey.includes('PLACEHOLDER') || supabaseAnonKey === 'your-anon-key') {
  throw new Error(
    'Invalid Supabase API key. Please configure valid Supabase credentials in environment variables.'
  );
}

// Check if we have valid credentials
const isConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-project-url' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co') &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-anon-key';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = isConfigured;
