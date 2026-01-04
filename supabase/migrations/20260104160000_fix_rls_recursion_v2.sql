-- Fix infinite recursion in RLS policies for space_members
-- The issue is that policies check space_members table which triggers the same policies

-- Step 1: Drop ALL existing space_members policies to start clean
DROP POLICY IF EXISTS "Members can view space members" ON public.space_members;
DROP POLICY IF EXISTS "View members in your spaces" ON public.space_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.space_members;
DROP POLICY IF EXISTS "Admins can delete members" ON public.space_members;
DROP POLICY IF EXISTS "Users can join spaces" ON public.space_members;

-- Also drop spaces policies that may have recursion issues
DROP POLICY IF EXISTS "Members can view their spaces" ON public.spaces;
DROP POLICY IF EXISTS "Members can view activity logs" ON public.activity_log;

-- Step 2: Create security definer functions (these bypass RLS)
CREATE OR REPLACE FUNCTION public.user_is_space_member(check_space_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
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
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = check_space_id
    AND user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.user_is_space_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_space_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_space_member(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.user_is_space_admin(uuid) TO anon;

-- Step 3: Create non-recursive policies for space_members

-- Allow users to view their own membership records
CREATE POLICY "Users can view own membership"
  ON public.space_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to view other members in spaces they belong to (using function)
CREATE POLICY "View members in your spaces"
  ON public.space_members
  FOR SELECT
  USING (public.user_is_space_member(space_id));

-- Allow users to insert themselves as members
CREATE POLICY "Users can join spaces"
  ON public.space_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow admins to update members in their spaces
CREATE POLICY "Admins can update members"
  ON public.space_members
  FOR UPDATE
  USING (public.user_is_space_admin(space_id));

-- Allow admins to delete members in their spaces
CREATE POLICY "Admins can delete members"
  ON public.space_members
  FOR DELETE
  USING (public.user_is_space_admin(space_id));

-- Step 4: Create non-recursive policy for spaces
CREATE POLICY "Members can view their spaces"
  ON public.spaces
  FOR SELECT
  USING (
    auth.uid() = created_by
    OR public.user_is_space_member(id)
  );

-- Step 5: Create non-recursive policy for activity_log
CREATE POLICY "Members can view activity logs"
  ON public.activity_log
  FOR SELECT
  USING (public.user_is_space_member(space_id));
