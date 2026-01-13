-- Fix is_space_member function overload
-- Ensure both one-parameter and two-parameter versions exist

-- One-parameter version (uses auth.uid() internally)
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

-- Two-parameter version (explicit user_id)
CREATE OR REPLACE FUNCTION public.is_space_member(p_space_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.space_members sm
    WHERE sm.space_id = p_space_id
      AND sm.user_id = p_user_id
  );
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_space_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_space_member(uuid, uuid) TO authenticated;

-- Recreate take_task function to ensure it's correct
CREATE OR REPLACE FUNCTION public.take_task(task_id uuid)
RETURNS public.tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.tasks;
  v_user_id uuid := auth.uid();
  v_total_recent int;
  v_easy_recent int;
  v_has_other_active boolean;
  v_other_tasks_available int;
  v_window interval := interval '14 days';
  v_can_take jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_task
  FROM public.tasks t
  WHERE t.id = take_task.task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF NOT public.is_space_member(v_task.space_id, v_user_id) THEN
    RAISE EXCEPTION 'Not a member of this space';
  END IF;

  IF v_task.status <> 'todo' OR v_task.assigned_to IS NOT NULL THEN
    RAISE EXCEPTION 'Task is not available';
  END IF;

  -- Check weekly limit if function exists
  BEGIN
    v_can_take := public.can_user_take_task(v_user_id, v_task.space_id);
    IF NOT (v_can_take->>'can_take')::boolean THEN
      RAISE EXCEPTION '%', v_can_take->>'message';
    END IF;
  EXCEPTION WHEN undefined_function THEN
    -- Function doesn't exist, skip this check
    NULL;
  END;

  -- Prevent hoarding: only one active task at a time
  SELECT EXISTS(
    SELECT 1
    FROM public.tasks t
    WHERE t.space_id = v_task.space_id
      AND t.assigned_to = v_user_id
      AND t.status IN ('in_progress', 'pending_verification')
  ) INTO v_has_other_active;

  IF v_has_other_active THEN
    RAISE EXCEPTION 'Finish your current task before taking a new one';
  END IF;

  -- Recent completion stats
  SELECT
    count(*)::int,
    count(*) FILTER (WHERE t.difficulty <= 3)::int
  INTO v_total_recent, v_easy_recent
  FROM public.tasks t
  WHERE t.space_id = v_task.space_id
    AND t.assigned_to = v_user_id
    AND t.status = 'done'
    AND coalesce(t.completed_at, t.created_at) >= now() - v_window;

  -- Enforce difficulty balance (only if 3+ recent tasks and >60% easy)
  IF v_total_recent >= 3 AND v_task.difficulty <= 3 AND (v_easy_recent::numeric / greatest(v_total_recent, 1)) > 0.6 THEN
    SELECT count(*)::int INTO v_other_tasks_available
    FROM public.tasks t
    WHERE t.space_id = v_task.space_id
      AND t.status = 'todo'
      AND t.assigned_to IS NULL
      AND t.difficulty >= 4;

    IF v_other_tasks_available > 0 THEN
      RAISE EXCEPTION 'Fairness rule: you have been taking mostly easy tasks recently. Please pick a medium or hard task.';
    END IF;
  END IF;

  -- Assign task to user
  UPDATE public.tasks t
  SET assigned_to = v_user_id,
      status = 'in_progress',
      taken_at = now()
  WHERE t.id = v_task.id;

  -- Log activity
  BEGIN
    INSERT INTO public.activity_log(space_id, user_id, action, details)
    VALUES (v_task.space_id, v_user_id, 'took_task', jsonb_build_object('task_id', v_task.id, 'title', v_task.title));
  EXCEPTION WHEN undefined_table THEN
    -- activity_log table doesn't exist, skip
    NULL;
  END;

  SELECT * INTO v_task FROM public.tasks WHERE id = take_task.task_id;
  RETURN v_task;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.take_task(uuid) TO authenticated;
