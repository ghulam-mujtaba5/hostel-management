import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjk2MjQwMCwiZXhwIjoxOTMyNTM4NDAwfQ.PLACEHOLDER';

// Check if we have valid credentials
const isConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-project-url' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co') &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-anon-key';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = isConfigured;
