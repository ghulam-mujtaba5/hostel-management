# Profile Foreign Key Fix - Auto Apply
Write-Host "🚀 Profile Foreign Key Fix" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Gray

# SQL Migration
$sql = @'
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
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
'@

Write-Host "`n📋 SQL TO APPLY IN SUPABASE:" -ForegroundColor Yellow
Write-Host $sql -ForegroundColor White

Write-Host "`n" -NoNewline
Write-Host ("=" * 70) -ForegroundColor Gray
Write-Host "`n✅ TO FIX THE ERROR:`n" -ForegroundColor Green
Write-Host "1. Go to: " -NoNewline
Write-Host "https://supabase.com/dashboard/project/uyertzuadcneniblfzcs/sql/new" -ForegroundColor Cyan
Write-Host "2. Copy the SQL above and paste it there"
Write-Host "3. Click the 'RUN' button`n"

Write-Host "✨ After that, your signup will work without foreign key errors!" -ForegroundColor Green
Write-Host "`n" -NoNewline
Write-Host ("=" * 70) -ForegroundColor Gray
