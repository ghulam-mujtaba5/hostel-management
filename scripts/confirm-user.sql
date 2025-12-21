-- Manually confirm the admin user email
-- Run this in Supabase SQL Editor

UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email = 'admin@hostel.com';
