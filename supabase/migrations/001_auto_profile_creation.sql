-- Create function to automatically create profile when user signs up
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

-- Create trigger to call the function when a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
