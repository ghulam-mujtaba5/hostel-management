-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Function to create profile automatically when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    new.raw_user_meta_data->>'username' or split_part(new.email, '@', 1),
    new.raw_user_meta_data->>'full_name' or ''
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger to call the function when a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Spaces (Hostels/Flats)
create table public.spaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique default substring(md5(random()::text), 0, 7),
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Space Members
create table public.space_members (
  space_id uuid references public.spaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member',
  points int default 0,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (space_id, user_id)
);

-- Tasks
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  space_id uuid references public.spaces(id) on delete cascade not null,
  title text not null,
  description text,
  category text check (category in ('washroom', 'sweeping', 'kitchen', 'trash', 'dusting', 'laundry', 'dishes', 'other')) default 'other',
  difficulty int check (difficulty between 1 and 10) default 1,
  status text check (status in ('todo', 'in_progress', 'pending_verification', 'done')) default 'todo',
  assigned_to uuid references public.profiles(id),
  due_date timestamp with time zone,
  proof_image_url text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Activity Log (Gamification/History)
create table public.activity_log (
  id uuid default uuid_generate_v4() primary key,
  space_id uuid references public.spaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  action text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Basic)
alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_log enable row level security;

-- Profiles: Public read, self update
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Spaces: Members can view
create policy "Members can view their spaces" on public.spaces for select using (
  exists (select 1 from public.space_members where space_id = spaces.id and user_id = auth.uid())
);
create policy "Users can create spaces" on public.spaces for insert with check (auth.uid() = created_by);

-- Tasks: Members can view/create/update
create policy "Members can view tasks" on public.tasks for select using (
  exists (select 1 from public.space_members where space_id = tasks.space_id and user_id = auth.uid())
);
create policy "Members can create tasks" on public.tasks for insert with check (
  exists (select 1 from public.space_members where space_id = tasks.space_id and user_id = auth.uid())
);
create policy "Members can update tasks" on public.tasks for update using (
  exists (select 1 from public.space_members where space_id = tasks.space_id and user_id = auth.uid())
);

-- Storage Bucket for Proofs
insert into storage.buckets (id, name, public) values ('proofs', 'proofs', true);

create policy "Proof images are publicly accessible" on storage.objects for select using ( bucket_id = 'proofs' );
create policy "Authenticated users can upload proofs" on storage.objects for insert with check ( bucket_id = 'proofs' and auth.role() = 'authenticated' );
