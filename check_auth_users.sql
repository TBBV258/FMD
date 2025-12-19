-- Check all users in auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
