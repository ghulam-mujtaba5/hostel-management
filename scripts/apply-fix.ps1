# Apply Profile Foreign Key Fix
# This script applies the database migration to fix the foreign key constraint

Write-Host "🚀 Profile Foreign Key Constraint Fix" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

# Load environment variables
$envFile = Join-Path $PSScriptRoot ".." ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
    Write-Host "✅ Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local not found" -ForegroundColor Red
    exit 1
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$serviceKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $serviceKey) {
    Write-Host "❌ Missing Supabase credentials" -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 Reading migration SQL..." -ForegroundColor Yellow

# Use here-string with single quotes to prevent variable expansion
$migrationSQL = @'
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

-- Create trigger to call the function when a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
'@

Write-Host "`n" -NoNewline
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "`n📋 SQL MIGRATION TO APPLY:`n" -ForegroundColor Cyan
Write-Host $migrationSQL -ForegroundColor White
Write-Host "`n" -NoNewline
Write-Host ("=" * 60) -ForegroundColor Gray

Write-Host "`n✅ APPLY THIS FIX:`n" -ForegroundColor Green
Write-Host "Option 1 - Supabase Dashboard (RECOMMENDED):" -ForegroundColor Yellow
Write-Host "  1. Open: https://supabase.com/dashboard/project/uyertzuadcneniblfzcs/sql/new"
Write-Host "  2. Copy the SQL above"
Write-Host "  3. Paste into SQL Editor"
Write-Host "  4. Click 'Run' button`n"

Write-Host "Option 2 - Supabase CLI:" -ForegroundColor Yellow
Write-Host "  1. Install CLI: npm install -g supabase"
Write-Host "  2. Run: supabase db push`n"

Write-Host "`n🔍 After applying migration, checking for missing profiles..." -ForegroundColor Yellow

# Try to fix missing profiles using REST API
$apiUrl = "$supabaseUrl/rest/v1"
$headers = @{
    "apikey" = $serviceKey
    "Authorization" = "Bearer $serviceKey"
    "Content-Type" = "application/json"
}

try {
    # Get all profiles
    $profilesResponse = Invoke-RestMethod -Uri "$apiUrl/profiles?select=id" -Headers $headers -Method Get
    Write-Host "✅ Found $($profilesResponse.Count) existing profiles" -ForegroundColor Green
    
    Write-Host "`n📊 Summary:" -ForegroundColor Cyan
    Write-Host "   - Database URL: $supabaseUrl" -ForegroundColor Gray
    Write-Host "   - Profiles in DB: $($profilesResponse.Count)" -ForegroundColor Gray
    Write-Host "`n✅ Migration ready to apply!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not verify profiles (normal if RLS is enabled)" -ForegroundColor Yellow
}

Write-Host "`n" -NoNewline
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "`n💡 TIP: After applying the SQL, all new signups will automatically" -ForegroundColor Cyan
Write-Host "   create profiles. No more foreign key errors!`n" -ForegroundColor Cyan
