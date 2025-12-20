-- Enforce fair task picking + secure task lifecycle via RPC
-- This migration introduces server-side guards so users can't spam only easy tasks.

-- Extensions
create extension if not exists "pgcrypto";

-- Track lifecycle timestamps (created_at already exists)
alter table public.tasks
  add column if not exists taken_at timestamp with time zone,
  add column if not exists completed_at timestamp with time zone,
  add column if not exists verified_at timestamp with time zone,
  add column if not exists verified_by uuid references public.profiles(id);

-- Activity log policies (RLS is enabled but base schema had no policies)
drop policy if exists "Members can view activity log" on public.activity_log;
drop policy if exists "Members can insert activity log" on public.activity_log;

create policy "Members can view activity log"
  on public.activity_log
  for select
  using (
    exists (
      select 1
      from public.space_members sm
      where sm.space_id = activity_log.space_id
        and sm.user_id = auth.uid()
    )
  );

create policy "Members can insert activity log"
  on public.activity_log
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.space_members sm
      where sm.space_id = activity_log.space_id
        and sm.user_id = auth.uid()
    )
  );

-- Tighten tasks updates: enforce via RPC instead of client-side arbitrary updates
-- NOTE: Supabase RLS policies are table-wide, so we remove the broad update policy.
drop policy if exists "Members can update tasks" on public.tasks;

-- Helper: check membership
create or replace function public.is_space_member(p_space_id uuid, p_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.space_members sm
    where sm.space_id = p_space_id
      and sm.user_id = p_user_id
  );
$$;

-- Core rule (anti-gaming): block taking an easy task if user has been taking mostly easy tasks recently,
-- unless no medium/hard tasks are available.
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

  -- Recent completion stats (use completed_at when present; fall back to created_at)
  select
    count(*)::int,
    count(*) filter (where t.difficulty <= 3)::int
  into v_total_recent, v_easy_recent
  from public.tasks t
  where t.space_id = v_task.space_id
    and t.assigned_to = v_user_id
    and t.status = 'done'
    and coalesce(t.completed_at, t.created_at) >= now() - v_window;

  -- If user recently completed enough tasks and they were mostly easy, block easy picks
  if v_total_recent >= 3 and v_task.difficulty <= 3 and (v_easy_recent::numeric / greatest(v_total_recent, 1)) > 0.6 then
    -- Allow easy only if no medium/hard tasks exist
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

create or replace function public.submit_task_proof(task_id uuid, proof_image_url text)
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
  where t.id = task_id
  for update;

  if not found then
    raise exception 'Task not found';
  end if;

  if v_task.assigned_to <> v_user_id then
    raise exception 'Only the assignee can submit proof';
  end if;

  if v_task.status not in ('in_progress', 'todo') then
    raise exception 'Task is not in a state that accepts proof';
  end if;

  update public.tasks t
  set proof_image_url = submit_task_proof.proof_image_url,
      status = 'pending_verification'
  where t.id = v_task.id;

  insert into public.activity_log(space_id, user_id, action, details)
  values (v_task.space_id, v_user_id, 'uploaded_proof', jsonb_build_object('task_id', v_task.id, 'title', v_task.title));

  select * into v_task from public.tasks where id = v_task.id;
  return v_task;
end;
$$;

create or replace function public.verify_task(task_id uuid, approved boolean)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks;
  v_user_id uuid := auth.uid();
  v_space_id uuid;
  v_assignee uuid;
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

  v_space_id := v_task.space_id;
  v_assignee := v_task.assigned_to;

  if not public.is_space_member(v_space_id, v_user_id) then
    raise exception 'Not a member of this space';
  end if;

  if v_task.status <> 'pending_verification' then
    raise exception 'Task is not pending verification';
  end if;

  if v_assignee is null then
    raise exception 'Task has no assignee';
  end if;

  if v_assignee = v_user_id then
    raise exception 'You cannot verify your own task';
  end if;

  if approved then
    update public.tasks t
    set status = 'done',
        completed_at = now(),
        verified_at = now(),
        verified_by = v_user_id
    where t.id = v_task.id;

    -- Atomic points award
    update public.space_members sm
    set points = sm.points + v_task.difficulty
    where sm.space_id = v_space_id
      and sm.user_id = v_assignee;

    insert into public.activity_log(space_id, user_id, action, details)
    values (v_space_id, v_user_id, 'verified_task', jsonb_build_object('task_id', v_task.id, 'title', v_task.title, 'approved', true));
  else
    update public.tasks t
    set status = 'in_progress',
        proof_image_url = null,
        verified_at = now(),
        verified_by = v_user_id
    where t.id = v_task.id;

    insert into public.activity_log(space_id, user_id, action, details)
    values (v_space_id, v_user_id, 'rejected_proof', jsonb_build_object('task_id', v_task.id, 'title', v_task.title, 'approved', false));
  end if;

  select * into v_task from public.tasks where id = v_task.id;
  return v_task;
end;
$$;

-- Allow members to call RPC functions
revoke all on function public.take_task(uuid) from public;
revoke all on function public.submit_task_proof(uuid, text) from public;
revoke all on function public.verify_task(uuid, boolean) from public;

grant execute on function public.take_task(uuid) to authenticated;
grant execute on function public.submit_task_proof(uuid, text) to authenticated;
grant execute on function public.verify_task(uuid, boolean) to authenticated;
