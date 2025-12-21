# Foreign Key Constraint Fix Guide

## Problem
Error: `insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"`

This error occurs when trying to create a profile for a user that doesn't exist in `auth.users`.

## Root Causes
1. **Race condition**: Profile creation is attempted before the user is fully created in `auth.users`
2. **Manual profile insertion**: Someone tries to insert a profile without first creating the auth user
3. **Missing trigger**: Database doesn't automatically create profiles when users sign up

## Solution Applied

### 1. Added Database Trigger
A PostgreSQL trigger now automatically creates a profile when a new user signs up:

```sql
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Benefits:**
- Automatically creates profile when user is created
- Prevents race conditions
- Ensures every auth user has a profile

### 2. Updated AuthContext Sign Up Flow
Changed from `insert` to `upsert` to handle cases where profile might already exist:

```typescript
const { error: profileError } = await supabase.from('profiles').upsert({
  id: data.user.id,
  username,
  full_name: username,
}, {
  onConflict: 'id'
});
```

**Benefits:**
- Handles duplicate profiles gracefully
- Non-blocking (errors don't prevent signup)
- More resilient to timing issues

### 3. Migration File
Created `/supabase/migrations/001_auto_profile_creation.sql` to apply the trigger setup.

### 4. Fix Script
Created `/scripts/fix-missing-profiles.ts` to fix any existing users without profiles.

## How to Apply the Fix

### Option A: Manual SQL in Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Run the migration SQL from `/supabase/migrations/001_auto_profile_creation.sql`

### Option B: Using Supabase CLI
```bash
# Push migrations to remote
supabase db push

# Or manually apply specific migration
supabase migration up
```

### Option C: Using the Fix Script
```bash
# Set environment variables first
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"

# Run the fix script
npx ts-node scripts/fix-missing-profiles.ts
```

## Verification

After applying the fix, verify in Supabase:

1. **Check the trigger exists:**
   ```sql
   select * from pg_trigger where tgname = 'on_auth_user_created';
   ```

2. **Check the function exists:**
   ```sql
   select * from pg_proc where proname = 'handle_new_user';
   ```

3. **Test signup flow:**
   - Create a new account in the app
   - Check that profile is automatically created
   - Verify no constraint errors in logs

## Testing Steps

1. **Clear existing test users** (optional):
   ```bash
   # In Supabase Auth panel, delete test users
   ```

2. **Test new signup:**
   - Go to `/login?mode=signup`
   - Fill in email, password, username
   - Click sign up
   - Should succeed without constraint errors
   - Profile should automatically exist in database

3. **Verify in database:**
   ```sql
   select * from public.profiles order by created_at desc limit 1;
   ```

## What Changed

| File | Change | Reason |
|------|--------|--------|
| `supabase/schema.sql` | Added trigger function | Auto-create profiles |
| `supabase/migrations/001_auto_profile_creation.sql` | New migration file | Apply trigger to database |
| `src/contexts/AuthContext.tsx` | Changed insert to upsert | Handle duplicates gracefully |
| `scripts/fix-missing-profiles.ts` | New fix script | Repair existing constraint violations |

## Troubleshooting

### Error: "Function already exists"
If you see this error, the function was already applied. Just drop and recreate:
```sql
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
-- Then run the migration
```

### Error: "Permission denied"
Make sure you're using a service role key with proper permissions, not anon key.

### Profiles still not being created
Check Supabase logs for trigger execution errors:
1. Go to Supabase Dashboard
2. Check Database → Logs
3. Look for errors related to `handle_new_user` trigger

## Prevention

To prevent this error in the future:

1. ✅ Always use the upsert pattern for profile operations
2. ✅ Trust the database trigger for profile creation
3. ✅ Never manually insert into profiles table without checking auth.users first
4. ✅ Use service role for admin operations, anon role for client operations
5. ✅ Test signup flow regularly

## Related Links
- [Supabase Auth Hooks](https://supabase.com/docs/guides/auth)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/plpgsql-trigger.html)
- [Supabase RLS & Security](https://supabase.com/docs/guides/auth/row-level-security)
