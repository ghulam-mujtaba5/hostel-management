-- Manually confirm admin user for testing purposes
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email IN ('admin@hostel.com', 'realtest@hostel.com', 'workinguser@hostel.com');
