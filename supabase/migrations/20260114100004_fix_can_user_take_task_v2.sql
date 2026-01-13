-- Fix can_user_take_task function - correct column names
-- The fairness_settings table uses max_easy_task_ratio, not easy_task_threshold

create or replace function public.can_user_take_task(p_user_id uuid, p_space_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_max_tasks_per_week int := 10;
  v_allow_overtime_if_no_others boolean := true;
  v_weekly_tasks int;
  v_other_available_users int;
begin
  -- Get fairness settings (use defaults if not configured)
  select 
    coalesce(fs.max_tasks_per_week, 10),
    coalesce(fs.allow_overtime_if_no_others, true)
  into 
    v_max_tasks_per_week,
    v_allow_overtime_if_no_others
  from public.fairness_settings fs
  where fs.space_id = p_space_id;
  
  -- Get user's weekly task count
  v_weekly_tasks := public.get_user_weekly_tasks(p_user_id, p_space_id);
  
  -- Check if user is at limit
  if v_weekly_tasks >= v_max_tasks_per_week then
    -- Check if others are available
    select count(distinct sm.user_id) into v_other_available_users
    from public.space_members sm
    where sm.space_id = p_space_id
      and sm.user_id <> p_user_id
      and public.get_user_weekly_tasks(sm.user_id, p_space_id) < v_max_tasks_per_week;
    
    if v_other_available_users > 0 then
      return jsonb_build_object(
        'can_take', false,
        'reason', 'weekly_limit_reached',
        'message', format('You''ve completed %s tasks this week. To ensure fair distribution, let others take tasks.', v_weekly_tasks),
        'weekly_count', v_weekly_tasks,
        'weekly_limit', v_max_tasks_per_week,
        'other_available', v_other_available_users
      );
    end if;
    
    -- Allow if configured and no others available
    if v_allow_overtime_if_no_others then
      return jsonb_build_object(
        'can_take', true,
        'reason', 'overtime_allowed',
        'message', 'You''re over the weekly limit, but no other members are available.',
        'weekly_count', v_weekly_tasks,
        'weekly_limit', v_max_tasks_per_week
      );
    end if;
  end if;
  
  return jsonb_build_object(
    'can_take', true,
    'reason', 'within_limit',
    'weekly_count', v_weekly_tasks,
    'weekly_limit', v_max_tasks_per_week,
    'tasks_remaining', v_max_tasks_per_week - v_weekly_tasks
  );
end;
$$;

-- Grant execute permission
grant execute on function public.can_user_take_task(uuid, uuid) to authenticated;
