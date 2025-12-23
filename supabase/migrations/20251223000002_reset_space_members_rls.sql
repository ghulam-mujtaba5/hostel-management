
-- Reset RLS on space_members to fix recursion

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'space_members' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.space_members', pol.policyname);
  END LOOP;
END $$;

-- Create simple non-recursive policy
CREATE POLICY "view_own_membership" ON public.space_members
FOR SELECT
USING (user_id = auth.uid());

-- Create policy for viewing others in same space using the security definer function
-- Ensure function exists and is correct
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

CREATE POLICY "view_space_members" ON public.space_members
FOR SELECT
USING (public.is_space_member(space_id));

-- Fix Spaces policy to be safe
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'spaces' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.spaces', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "view_joined_spaces" ON public.spaces
FOR SELECT
USING (
  id IN (
    SELECT space_id 
    FROM public.space_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "create_spaces" ON public.spaces
FOR INSERT
WITH CHECK (auth.uid() = created_by);
