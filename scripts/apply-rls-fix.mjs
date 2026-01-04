const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = `
-- Fix infinite recursion in RLS policies for space_members

-- Drop the problematic policies
DROP POLICY IF EXISTS "Members can view space members" ON public.space_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.space_members;
DROP POLICY IF EXISTS "Members can view their spaces" ON public.spaces;
DROP POLICY IF EXISTS "Members can view activity logs" ON public.activity_log;

-- Create a simpler non-recursive policy for viewing space members
-- Users can view space_members rows where they are the user in that row
CREATE POLICY "Members can view space members"
  ON public.space_members
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.user_is_space_member(check_space_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = check_space_id
    AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_space_admin(check_space_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = check_space_id
    AND user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Allow viewing all members in spaces you belong to
CREATE POLICY "View members in your spaces"
  ON public.space_members
  FOR SELECT
  USING (
    public.user_is_space_member(space_id)
  );

-- Allow admins to update/delete members in their spaces
CREATE POLICY "Admins can manage members"
  ON public.space_members
  FOR UPDATE
  USING (public.user_is_space_admin(space_id));

CREATE POLICY "Admins can delete members"
  ON public.space_members
  FOR DELETE
  USING (public.user_is_space_admin(space_id));

-- Fix spaces SELECT policy to use the security definer function
CREATE POLICY "Members can view their spaces"
  ON public.spaces
  FOR SELECT
  USING (
    auth.uid() = created_by
    OR public.user_is_space_member(id)
  );

-- Fix activity_log SELECT policy
CREATE POLICY "Members can view activity logs"
  ON public.activity_log
  FOR SELECT
  USING (
    public.user_is_space_member(space_id)
  );

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.user_is_space_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_space_admin(uuid) TO authenticated;
`;

// Parse URL
const url = new URL(SUPABASE_URL);
const options = {
  hostname: url.hostname,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Prefer': 'return=minimal'
  }
};

// First, let's check if exec_sql exists, if not we'll create it
const createRpcSql = `
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;
`;

console.log('Applying RLS fix via REST API...');
console.log('Service role key present:', !!SERVICE_ROLE_KEY);
console.log('URL:', SUPABASE_URL);

// Use fetch if available (Node 18+)
async function runSql() {
  try {
    // Try direct SQL query endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

runSql();
