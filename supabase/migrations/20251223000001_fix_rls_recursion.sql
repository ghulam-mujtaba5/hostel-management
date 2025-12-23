
-- Fix RLS Recursion on space_members

-- 1. Create a security definer function to check membership
-- This bypasses RLS to avoid infinite recursion when querying space_members
CREATE OR REPLACE FUNCTION public.is_space_member(_space_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.space_members 
    WHERE space_id = _space_id 
    AND user_id = auth.uid()
  );
$$;

-- 2. Drop existing policies on space_members
DROP POLICY IF EXISTS "space_members_select_policy" ON public.space_members;
DROP POLICY IF EXISTS "Members can view other members" ON public.space_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.space_members;
DROP POLICY IF EXISTS "Members can view space members" ON public.space_members;

-- 3. Create new non-recursive policies

-- Policy: Users can view their own membership rows (needed for initial load)
CREATE POLICY "view_own_membership" ON public.space_members
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can view other members in spaces they belong to
-- Uses the security definer function to break recursion
CREATE POLICY "view_space_members" ON public.space_members
FOR SELECT
USING (public.is_space_member(space_id));

-- 4. Fix Spaces policy as well just in case
DROP POLICY IF EXISTS "Members can view their spaces" ON public.spaces;

CREATE POLICY "view_joined_spaces" ON public.spaces
FOR SELECT
USING (
  id IN (
    SELECT space_id 
    FROM public.space_members 
    WHERE user_id = auth.uid()
  )
);
