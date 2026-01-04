-- Fix the profile creation trigger to handle the syntax error
-- The original trigger used 'or' which is not valid PostgreSQL for COALESCE

-- First drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the old function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the corrected function using proper COALESCE syntax
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _username text;
  _full_name text;
BEGIN
  -- Extract username from metadata or use email prefix
  _username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- Extract full_name from metadata or use empty string
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    ''
  );
  
  -- Insert the profile with conflict handling
  INSERT INTO public.profiles (id, username, full_name, email)
  VALUES (
    NEW.id,
    _username,
    _full_name,
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    username = COALESCE(EXCLUDED.username, profiles.username),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email);
    
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the trigger (allow signup to continue)
  RAISE WARNING 'Profile creation warning: % - %', SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies allow profile creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Grant execute permission on the function to the authenticator
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticator;
