-- Add function to mark task complete without proof
-- This provides a simpler workflow for tasks that don't need photo verification

-- Function to mark a task as complete directly (self-verification)
create or replace function public.complete_task_direct(p_task_id uuid)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_task
  from public.tasks t
  where t.id = p_task_id
  for update;

  if not found then
    raise exception 'Task not found';
  end if;

  if v_task.assigned_to <> v_user_id then
    raise exception 'Only the assignee can complete this task';
  end if;

  if v_task.status not in ('in_progress', 'todo') then
    raise exception 'Task cannot be completed from its current state';
  end if;

  -- Update task to done
  update public.tasks t
  set status = 'done',
      completed_at = now(),
      verified_at = now(),
      verified_by = v_user_id  -- Self-verified
  where t.id = v_task.id;

  -- Award points
  update public.space_members sm
  set points = sm.points + v_task.difficulty
  where sm.space_id = v_task.space_id
    and sm.user_id = v_user_id;

  -- Log the completion
  insert into public.activity_log(space_id, user_id, action, details)
  values (v_task.space_id, v_user_id, 'completed_task', jsonb_build_object(
    'task_id', v_task.id, 
    'title', v_task.title,
    'points', v_task.difficulty,
    'self_verified', true
  ));

  select * into v_task from public.tasks where id = v_task.id;
  return v_task;
end;
$$;

-- Grant execute permission
grant execute on function public.complete_task_direct(uuid) to authenticated;
