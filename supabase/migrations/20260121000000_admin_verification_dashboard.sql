-- Add admin verification dashboard features
-- This migration ensures admins can view and verify pending tasks in their space

-- Ensure the verify_task function allows admins to approve/reject proofs
-- Check if verify_task function exists and works correctly
create or replace function public.verify_task(task_id uuid, approved boolean)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks;
  v_user_id uuid := auth.uid();
  v_is_admin boolean;
  v_points_earned int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Fetch the task
  select * into v_task from public.tasks where id = task_id for update;
  if not found then
    raise exception 'Task not found';
  end if;

  -- Check if user is admin in this space
  select (role = 'admin') into v_is_admin
  from public.space_members
  where space_id = v_task.space_id and user_id = v_user_id;

  if not v_is_admin then
    raise exception 'Only space admins can verify tasks';
  end if;

  if v_task.status != 'pending_verification' then
    raise exception 'Task is not pending verification';
  end if;

  if approved then
    -- Mark as done and award points
    v_points_earned := coalesce(v_task.difficulty, 1);
    
    update public.tasks
    set status = 'done'
    where id = v_task.id;

    -- Update member points
    update public.space_members
    set points = points + v_points_earned
    where space_id = v_task.space_id and user_id = v_task.assigned_to;

    -- Log activity
    insert into public.activity_log(space_id, user_id, action, details)
    values (v_task.space_id, v_user_id, 'verified_task', jsonb_build_object(
      'task_id', v_task.id, 
      'title', v_task.title, 
      'points', v_points_earned,
      'verified_by', v_user_id
    ));
  else
    -- Reject and reset to in_progress
    update public.tasks
    set status = 'in_progress',
        proof_image_url = null
    where id = v_task.id;

    -- Log activity
    insert into public.activity_log(space_id, user_id, action, details)
    values (v_task.space_id, v_user_id, 'rejected_proof', jsonb_build_object(
      'task_id', v_task.id, 
      'title', v_task.title,
      'rejected_by', v_user_id
    ));
  end if;

  select * into v_task from public.tasks where id = v_task.id;
  return v_task;
end;
$$;

grant execute on function public.verify_task(uuid, boolean) to authenticated;

-- Create a view for pending tasks that admins can access
drop view if exists public.pending_tasks_for_admin cascade;
create view public.pending_tasks_for_admin as
select 
  t.*,
  sm.role as user_role,
  p.username as assigned_username,
  c.username as creator_username
from public.tasks t
join public.space_members sm on sm.space_id = t.space_id and sm.user_id = auth.uid()
left join public.profiles p on p.id = t.assigned_to
left join public.profiles c on c.id = t.created_by
where t.status = 'pending_verification' and sm.role = 'admin';

-- RLS policy for viewing pending verification tasks
create policy "Admins can view pending verification tasks" on public.tasks for select using (
  exists (
    select 1 from public.space_members
    where space_id = tasks.space_id 
    and user_id = auth.uid()
    and role = 'admin'
  )
  or assigned_to = auth.uid()
);

-- Ensure stats table includes pending verifications count
-- Add a helper function to get space stats including pending verifications
create or replace function public.get_space_stats(p_space_id uuid)
returns table(
  total_tasks bigint,
  completed_tasks bigint,
  pending_tasks bigint,
  pending_verification bigint,
  total_members bigint,
  active_members bigint
) 
language plpgsql
security definer
as $$
begin
  -- Check if user is member of space
  if not exists(
    select 1 from public.space_members 
    where space_id = p_space_id and user_id = auth.uid()
  ) then
    raise exception 'Not a member of this space';
  end if;

  return query
  select
    (select count(*) from public.tasks where space_id = p_space_id)::bigint,
    (select count(*) from public.tasks where space_id = p_space_id and status = 'done')::bigint,
    (select count(*) from public.tasks where space_id = p_space_id and assigned_to is not null and status in ('todo', 'in_progress'))::bigint,
    (select count(*) from public.tasks where space_id = p_space_id and status = 'pending_verification')::bigint,
    (select count(*) from public.space_members where space_id = p_space_id)::bigint,
    (select count(*) from public.space_members where space_id = p_space_id and points > 0)::bigint;
end;
$$;

grant execute on function public.get_space_stats(uuid) to authenticated;
