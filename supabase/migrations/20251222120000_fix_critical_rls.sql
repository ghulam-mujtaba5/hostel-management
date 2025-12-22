-- Fix Spaces Select Policy
drop policy if exists "Members can view their spaces" on public.spaces;
create policy "Members and creators can view their spaces" on public.spaces for select using (
  exists (select 1 from public.space_members where space_id = spaces.id and user_id = auth.uid())
  OR
  created_by = auth.uid()
);

-- Space Members Policies
-- Enable RLS is already done in schema.sql, but good to ensure
alter table public.space_members enable row level security;

drop policy if exists "Members can view other members in the same space" on public.space_members;
create policy "Members can view other members in the same space" on public.space_members for select using (
  exists (
    select 1 from public.space_members as sm
    where sm.space_id = space_members.space_id
    and sm.user_id = auth.uid()
  )
  OR
  user_id = auth.uid()
);

drop policy if exists "Users can join spaces" on public.space_members;
create policy "Users can join spaces" on public.space_members for insert with check (
  auth.uid() = user_id
);

drop policy if exists "Admins can update members" on public.space_members;
create policy "Admins can update members" on public.space_members for update using (
  exists (
    select 1 from public.space_members as sm
    where sm.space_id = space_members.space_id
    and sm.user_id = auth.uid()
    and sm.role = 'admin'
  )
);

drop policy if exists "Admins can remove members or members can leave" on public.space_members;
create policy "Admins can remove members or members can leave" on public.space_members for delete using (
  (user_id = auth.uid())
  OR
  exists (
    select 1 from public.space_members as sm
    where sm.space_id = space_members.space_id
    and sm.user_id = auth.uid()
    and sm.role = 'admin'
  )
);

-- Activity Log Policies
alter table public.activity_log enable row level security;

drop policy if exists "Members can view activity logs" on public.activity_log;
create policy "Members can view activity logs" on public.activity_log for select using (
  exists (
    select 1 from public.space_members
    where space_id = activity_log.space_id
    and user_id = auth.uid()
  )
);

drop policy if exists "Members can insert activity logs" on public.activity_log;
create policy "Members can insert activity logs" on public.activity_log for insert with check (
  auth.uid() = user_id
  AND
  exists (
    select 1 from public.space_members
    where space_id = activity_log.space_id
    and user_id = auth.uid()
  )
);
