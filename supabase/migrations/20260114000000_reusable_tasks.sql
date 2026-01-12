-- Migration: Make tasks reusable (like templates)
-- When a task is completed, it can be retaken by any member
-- This allows tasks to remain in the list for future use

-- Add is_reusable column to tasks table
alter table public.tasks add column if not exists is_reusable boolean default true;

-- Add original_task_id to track if a task was created from a template
alter table public.tasks add column if not exists original_task_id uuid references public.tasks(id) on delete set null;

-- Update existing tasks to be reusable by default
update public.tasks set is_reusable = true where is_reusable is null;

-- Create function to retake a completed task
-- This creates a fresh instance from a completed task template
create or replace function public.retake_task(p_task_id uuid)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_original_task public.tasks;
  v_new_task public.tasks;
  v_user_id uuid := auth.uid();
  v_can_take jsonb;
  v_has_other_active boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Get the original completed task
  select * into v_original_task
  from public.tasks t
  where t.id = p_task_id;

  if not found then
    raise exception 'Task not found';
  end if;

  if not public.is_space_member(v_original_task.space_id, v_user_id) then
    raise exception 'Not a member of this space';
  end if;

  -- Task must be done and reusable to be retaken
  if v_original_task.status <> 'done' then
    raise exception 'Only completed tasks can be retaken';
  end if;

  if v_original_task.is_reusable = false then
    raise exception 'This task cannot be retaken';
  end if;

  -- Check weekly limit
  v_can_take := public.can_user_take_task(v_user_id, v_original_task.space_id);
  if not (v_can_take->>'can_take')::boolean then
    raise exception '%', v_can_take->>'message';
  end if;

  -- Prevent hoarding: only one active task at a time
  select exists(
    select 1
    from public.tasks t
    where t.space_id = v_original_task.space_id
      and t.assigned_to = v_user_id
      and t.status in ('in_progress', 'pending_verification')
  ) into v_has_other_active;

  if v_has_other_active then
    raise exception 'Finish your current task before taking a new one';
  end if;

  -- Create a new task instance from the template
  insert into public.tasks (
    space_id,
    title,
    description,
    category,
    difficulty,
    status,
    assigned_to,
    created_by,
    is_reusable,
    original_task_id
  ) values (
    v_original_task.space_id,
    v_original_task.title,
    v_original_task.description,
    v_original_task.category,
    v_original_task.difficulty,
    'in_progress',
    v_user_id,
    v_user_id,
    true,
    coalesce(v_original_task.original_task_id, v_original_task.id)
  )
  returning * into v_new_task;

  -- Log the activity
  insert into public.activity_log(space_id, user_id, action, details)
  values (
    v_new_task.space_id, 
    v_user_id, 
    'retook_task', 
    jsonb_build_object(
      'task_id', v_new_task.id, 
      'title', v_new_task.title,
      'original_task_id', p_task_id
    )
  );

  return v_new_task;
end;
$$;

-- Create function to get reusable task templates (completed tasks that can be retaken)
create or replace function public.get_reusable_tasks(p_space_id uuid)
returns setof public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_space_member(p_space_id, v_user_id) then
    raise exception 'Not a member of this space';
  end if;

  -- Return distinct reusable tasks (completed tasks that can be retaken)
  -- Only show the most recent instance of each unique task
  return query
  select distinct on (coalesce(t.original_task_id, t.id)) t.*
  from public.tasks t
  where t.space_id = p_space_id
    and t.status = 'done'
    and t.is_reusable = true
  order by coalesce(t.original_task_id, t.id), t.completed_at desc nulls last;
end;
$$;

-- Grant execute permissions
grant execute on function public.retake_task(uuid) to authenticated;
grant execute on function public.get_reusable_tasks(uuid) to authenticated;

-- Add index for faster lookup of reusable tasks
create index if not exists idx_tasks_reusable on public.tasks (space_id, status, is_reusable) where is_reusable = true;
