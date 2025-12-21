-- Confirm realtest@hostel.com email
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'realtest@hostel.com' 
  AND email_confirmed_at IS NULL;
