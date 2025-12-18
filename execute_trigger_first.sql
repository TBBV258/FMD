-- First execute the trigger
-- Then check if there are any users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;
