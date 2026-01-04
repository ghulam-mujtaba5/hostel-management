-- Enhanced fairness enforcement with weekly limits
-- This migration adds stricter fairness rules to prevent any member from taking too many tasks

-- Configuration table for fairness settings per space
create table if not exists public.fairness_settings (
  id uuid default uuid_generate_v4() primary key,
  space_id uuid references public.spaces(id) on delete cascade not null unique,
  max_tasks_per_week int default 10 not null,
  max_easy_task_ratio numeric(3,2) default 0.60 not null, -- 60% max easy tasks
  min_days_between_same_task int default 2 not null,
  enforce_difficulty_balance boolean default true not null,
  allow_overtime_if_no_others boolean default true not null, -- Allow if nobody else available
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.fairness_settings enable row level security;

-- RLS Policies
create policy "Members can view fairness settings"
  on public.fairness_settings
  for select
  using (
    exists (
      select 1 from public.space_members sm
      where sm.space_id = fairness_settings.space_id
        and sm.user_id = auth.uid()
    )
  );

create policy "Admins can update fairness settings"
  on public.fairness_settings
  for all
  using (
    exists (
      select 1 from public.space_members sm
      where sm.space_id = fairness_settings.space_id
        and sm.user_id = auth.uid()
        and sm.role = 'admin'
    )
  );

-- Function to get user's weekly task count
create or replace function public.get_user_weekly_tasks(p_user_id uuid, p_space_id uuid)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.tasks t
  where t.space_id = p_space_id
    and t.assigned_to = p_user_id
    and t.status = 'done'
    and coalesce(t.completed_at, t.created_at) >= date_trunc('week', now());
$$;

-- Function to check if user can take more tasks this week
create or replace function public.can_user_take_task(p_user_id uuid, p_space_id uuid)
returns jsonb
language plpgsql
stable
as $$
declare
  v_settings record;
  v_weekly_tasks int;
  v_other_available_users int;
  v_result jsonb;
begin
  -- Get fairness settings (use defaults if not configured)
  select * into v_settings
  from public.fairness_settings fs
  where fs.space_id = p_space_id;
  
  -- Default settings if not configured
  if not found then
    v_settings := row(
      null, p_space_id, 10, 0.60, 2, true, true, now(), now()
    );
  end if;
  
  -- Get user's weekly task count
  v_weekly_tasks := public.get_user_weekly_tasks(p_user_id, p_space_id);
  
  -- Check if user is at limit
  if v_weekly_tasks >= v_settings.max_tasks_per_week then
    -- Check if others are available
    select count(distinct sm.user_id) into v_other_available_users
    from public.space_members sm
    where sm.space_id = p_space_id
      and sm.user_id <> p_user_id
      and public.get_user_weekly_tasks(sm.user_id, p_space_id) < v_settings.max_tasks_per_week;
    
    if v_other_available_users > 0 then
      return jsonb_build_object(
        'can_take', false,
        'reason', 'weekly_limit_reached',
        'message', format('You''ve completed %s tasks this week. To ensure fair distribution, let others take tasks.', v_weekly_tasks),
        'weekly_count', v_weekly_tasks,
        'weekly_limit', v_settings.max_tasks_per_week,
        'other_available', v_other_available_users
      );
    end if;
    
    -- Allow if configured and no others available
    if v_settings.allow_overtime_if_no_others then
      return jsonb_build_object(
        'can_take', true,
        'reason', 'overtime_allowed',
        'message', 'You''re over the weekly limit, but no other members are available.',
        'weekly_count', v_weekly_tasks,
        'weekly_limit', v_settings.max_tasks_per_week
      );
    end if;
  end if;
  
  return jsonb_build_object(
    'can_take', true,
    'reason', 'within_limit',
    'weekly_count', v_weekly_tasks,
    'weekly_limit', v_settings.max_tasks_per_week,
    'tasks_remaining', v_settings.max_tasks_per_week - v_weekly_tasks
  );
end;
$$;

-- Update take_task function to enforce weekly limits
create or replace function public.take_task(task_id uuid)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks;
  v_user_id uuid := auth.uid();
  v_total_recent int;
  v_easy_recent int;
  v_has_other_active boolean;
  v_other_tasks_available int;
  v_window interval := interval '14 days';
  v_can_take jsonb;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_task
  from public.tasks t
  where t.id = task_id
  for update;

  if not found then
    raise exception 'Task not found';
  end if;

  if not public.is_space_member(v_task.space_id, v_user_id) then
    raise exception 'Not a member of this space';
  end if;

  if v_task.status <> 'todo' or v_task.assigned_to is not null then
    raise exception 'Task is not available';
  end if;

  -- Check weekly limit
  v_can_take := public.can_user_take_task(v_user_id, v_task.space_id);
  if not (v_can_take->>'can_take')::boolean then
    raise exception '%', v_can_take->>'message';
  end if;

  -- Prevent hoarding: only one active task at a time
  select exists(
    select 1
    from public.tasks t
    where t.space_id = v_task.space_id
      and t.assigned_to = v_user_id
      and t.status in ('in_progress', 'pending_verification')
  ) into v_has_other_active;

  if v_has_other_active then
    raise exception 'Finish your current task before taking a new one';
  end if;

  -- Recent completion stats
  select
    count(*)::int,
    count(*) filter (where t.difficulty <= 3)::int
  into v_total_recent, v_easy_recent
  from public.tasks t
  where t.space_id = v_task.space_id
    and t.assigned_to = v_user_id
    and t.status = 'done'
    and coalesce(t.completed_at, t.created_at) >= now() - v_window;

  -- Enforce difficulty balance
  if v_total_recent >= 3 and v_task.difficulty <= 3 and (v_easy_recent::numeric / greatest(v_total_recent, 1)) > 0.6 then
    select count(*)::int into v_other_tasks_available
    from public.tasks t
    where t.space_id = v_task.space_id
      and t.status = 'todo'
      and t.assigned_to is null
      and t.difficulty >= 4;

    if v_other_tasks_available > 0 then
      raise exception 'Fairness rule: you have been taking mostly easy tasks recently. Please pick a medium or hard task.';
    end if;
  end if;

  update public.tasks t
  set assigned_to = v_user_id,
      status = 'in_progress',
      taken_at = now()
  where t.id = v_task.id;

  insert into public.activity_log(space_id, user_id, action, details)
  values (v_task.space_id, v_user_id, 'took_task', jsonb_build_object('task_id', v_task.id, 'title', v_task.title));

  select * into v_task from public.tasks where id = v_task.id;
  return v_task;
end;
$$;

-- Function to get task statistics for a space
create or replace function public.get_task_statistics(p_space_id uuid)
returns jsonb
language plpgsql
stable
as $$
declare
  v_result jsonb;
begin
  if not public.is_space_member(p_space_id, auth.uid()) then
    raise exception 'Not a member of this space';
  end if;

  select jsonb_build_object(
    'total_completed', count(*) filter (where status = 'done'),
    'this_week', count(*) filter (
      where status = 'done' 
      and coalesce(completed_at, created_at) >= date_trunc('week', now())
    ),
    'by_difficulty', jsonb_build_object(
      'easy', count(*) filter (where status = 'done' and difficulty <= 3),
      'medium', count(*) filter (where status = 'done' and difficulty between 4 and 6),
      'hard', count(*) filter (where status = 'done' and difficulty >= 7)
    ),
    'pending', count(*) filter (where status in ('todo', 'in_progress')),
    'by_category', (
      select jsonb_object_agg(category, cnt)
      from (
        select category, count(*) as cnt
        from public.tasks
        where space_id = p_space_id and status = 'done'
        group by category
      ) sub
    )
  ) into v_result
  from public.tasks
  where space_id = p_space_id;
  
  return v_result;
end;
$$;

-- Function to get member workload comparison
create or replace function public.get_member_workload(p_space_id uuid)
returns jsonb
language plpgsql
stable
as $$
declare
  v_result jsonb;
begin
  if not public.is_space_member(p_space_id, auth.uid()) then
    raise exception 'Not a member of this space';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'user_id', sm.user_id,
      'username', p.username,
      'avatar_url', p.avatar_url,
      'points', sm.points,
      'total_completed', (
        select count(*)
        from public.tasks t
        where t.space_id = p_space_id
          and t.assigned_to = sm.user_id
          and t.status = 'done'
      ),
      'this_week', public.get_user_weekly_tasks(sm.user_id, p_space_id),
      'weekly_limit', 10,
      'tasks_remaining', greatest(0, 10 - public.get_user_weekly_tasks(sm.user_id, p_space_id)),
      'easy_tasks', (
        select count(*)
        from public.tasks t
        where t.space_id = p_space_id
          and t.assigned_to = sm.user_id
          and t.status = 'done'
          and t.difficulty <= 3
      ),
      'medium_tasks', (
        select count(*)
        from public.tasks t
        where t.space_id = p_space_id
          and t.assigned_to = sm.user_id
          and t.status = 'done'
          and t.difficulty between 4 and 6
      ),
      'hard_tasks', (
        select count(*)
        from public.tasks t
        where t.space_id = p_space_id
          and t.assigned_to = sm.user_id
          and t.status = 'done'
          and t.difficulty >= 7
      )
    )
  ) into v_result
  from public.space_members sm
  join public.profiles p on p.id = sm.user_id
  where sm.space_id = p_space_id;
  
  return coalesce(v_result, '[]'::jsonb);
end;
$$;

-- Grant execute permissions
grant execute on function public.can_user_take_task(uuid, uuid) to authenticated;
grant execute on function public.get_user_weekly_tasks(uuid, uuid) to authenticated;
grant execute on function public.get_task_statistics(uuid) to authenticated;
grant execute on function public.get_member_workload(uuid) to authenticated;
