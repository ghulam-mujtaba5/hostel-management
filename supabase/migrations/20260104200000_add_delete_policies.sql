-- Migration: Add missing delete RLS policies
-- Date: 2026-01-04
-- Description: Adds delete policies for tasks and space_members tables

-- Allow task creators and admins to delete tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Creator or admin can delete tasks' AND tablename = 'tasks'
  ) THEN
    CREATE POLICY "Creator or admin can delete tasks" ON public.tasks
    FOR DELETE USING (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.space_members sm
        WHERE sm.space_id = tasks.space_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'admin'
      )
    );
  END IF;
END $$;

-- Allow admins to remove members from space
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin can remove space members' AND tablename = 'space_members'
  ) THEN
    CREATE POLICY "Admin can remove space members" ON public.space_members
    FOR DELETE USING (
      -- User can remove themselves
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.space_members sm
        WHERE sm.space_id = space_members.space_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'admin'
      )
    );
  END IF;
END $$;

-- Allow admins to delete activity log entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin can delete activity log' AND tablename = 'activity_log'
  ) THEN
    CREATE POLICY "Admin can delete activity log" ON public.activity_log
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.space_members sm
        WHERE sm.space_id = activity_log.space_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'admin'
      )
    );
  END IF;
END $$;

-- Allow space creator to delete the space
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Creator can delete space' AND tablename = 'spaces'
  ) THEN
    CREATE POLICY "Creator can delete space" ON public.spaces
    FOR DELETE USING (created_by = auth.uid());
  END IF;
END $$;
