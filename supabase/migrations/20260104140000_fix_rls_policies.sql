-- Fix RLS policies for spaces table to allow authenticated users to create spaces

-- Drop existing policy
DROP POLICY IF EXISTS "Users can create spaces" ON public.spaces;

-- Create a new policy that allows any authenticated user to create a space
-- as long as they set themselves as the creator
CREATE POLICY "Users can create spaces"
  ON public.spaces
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = created_by
  );

-- Also add a policy to allow space creators to update their spaces
DROP POLICY IF EXISTS "Creators can update their spaces" ON public.spaces;
CREATE POLICY "Creators can update their spaces"
  ON public.spaces
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Add a policy to allow viewing spaces you created (even before joining)
DROP POLICY IF EXISTS "Members can view their spaces" ON public.spaces;
CREATE POLICY "Members can view their spaces"
  ON public.spaces
  FOR SELECT
  USING (
    auth.uid() = created_by
    OR exists (
      SELECT 1 FROM public.space_members 
      WHERE space_id = spaces.id AND user_id = auth.uid()
    )
  );

-- Add a policy for activity_log to allow inserting
DROP POLICY IF EXISTS "Members can log activities" ON public.activity_log;
CREATE POLICY "Members can log activities"
  ON public.activity_log
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Allow viewing activity logs for your spaces
DROP POLICY IF EXISTS "Members can view activity logs" ON public.activity_log;
CREATE POLICY "Members can view activity logs"
  ON public.activity_log
  FOR SELECT
  USING (
    exists (
      SELECT 1 FROM public.space_members 
      WHERE space_id = activity_log.space_id AND user_id = auth.uid()
    )
  );

-- Space members policies
DROP POLICY IF EXISTS "Users can join spaces" ON public.space_members;
DROP POLICY IF EXISTS "Members can view space members" ON public.space_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.space_members;

-- Allow users to insert themselves as members
CREATE POLICY "Users can join spaces"
  ON public.space_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Allow members to view other members in their spaces
CREATE POLICY "Members can view space members"
  ON public.space_members
  FOR SELECT
  USING (
    exists (
      SELECT 1 FROM public.space_members sm
      WHERE sm.space_id = space_members.space_id AND sm.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Allow admins to update/delete members
CREATE POLICY "Admins can manage members"
  ON public.space_members
  FOR ALL
  USING (
    exists (
      SELECT 1 FROM public.space_members sm
      WHERE sm.space_id = space_members.space_id 
      AND sm.user_id = auth.uid()
      AND sm.role = 'admin'
    )
  );
