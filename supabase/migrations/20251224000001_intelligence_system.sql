
-- Task Suggestions (AI/Smart System)
create table public.task_suggestions (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references public.spaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade, -- Optional, if suggesting an existing task
  suggestion_type text check (suggestion_type in ('new_task', 'assignment', 'reminder')) not null,
  title text not null,
  reason text,
  confidence_score float, -- 0 to 1
  status text check (status in ('pending', 'accepted', 'rejected', 'snoozed')) default 'pending',
  snoozed_until timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.task_suggestions enable row level security;

-- Policies
create policy "Members can view their suggestions" on public.task_suggestions
  for select using (auth.uid() = user_id);

create policy "Members can update their suggestions" on public.task_suggestions
  for update using (auth.uid() = user_id);

create policy "Members can create suggestions" on public.task_suggestions
  for insert with check (
    exists (select 1 from public.space_members where space_id = task_suggestions.space_id and user_id = auth.uid())
  );

-- Add index for performance
create index idx_task_suggestions_user_status on public.task_suggestions(user_id, status);
create index idx_task_suggestions_space on public.task_suggestions(space_id);
