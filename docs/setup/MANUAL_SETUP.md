# Manual Database Setup Guide

If the automatic setup script failed, don't worry! You can set up the database manually in just a few minutes.

## Step 1: Get Your Credentials
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (`uyertzuadcneniblfzcs`).
3. Go to **Settings** -> **API**.
4. Ensure your `.env.local` file has the correct URL and Anon Key.

## Step 2: Run the Schema
1. Go to the **SQL Editor** in the Supabase Dashboard (icon looks like a terminal `>_`).
2. Click **New Query**.
3. Copy and paste the entire content of the SQL block below.
4. Click **Run** (bottom right).

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Spaces (Hostels/Flats)
create table if not exists public.spaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique default substring(md5(random()::text), 0, 7),
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Space Members
create table if not exists public.space_members (
  space_id uuid references public.spaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member',
  points int default 0,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (space_id, user_id)
);

-- Tasks
create table if not exists public.tasks (
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
create table if not exists public.activity_log (
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

-- Space Members: Viewable by members of the same space
create policy "Members can view other members in same space" on public.space_members for select using (
  exists (
    select 1 from public.space_members as sm 
    where sm.space_id = space_members.space_id 
    and sm.user_id = auth.uid()
  )
);
create policy "Users can join spaces" on public.space_members for insert with check (auth.uid() = user_id);

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
insert into storage.buckets (id, name, public) 
values ('proofs', 'proofs', true)
on conflict (id) do nothing;

create policy "Proof images are publicly accessible" on storage.objects for select using ( bucket_id = 'proofs' );
create policy "Authenticated users can upload proofs" on storage.objects for insert with check ( bucket_id = 'proofs' and auth.role() = 'authenticated' );
```

## Step 3: Verify Storage
1. Go to **Storage** in the dashboard.
2. You should see a bucket named `proofs`.
3. If not, create a new public bucket named `proofs`.

## Step 4: Start the App
Run this in your terminal:
```bash
npm run dev
```
