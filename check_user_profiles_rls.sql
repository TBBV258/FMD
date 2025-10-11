-- Check RLS status and policies for user_profiles table

-- 1. Check if RLS is enabled on user_profiles
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- 2. Check existing RLS policies on user_profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- 3. Test if we can select from user_profiles (this will show if RLS is blocking)
SELECT COUNT(*) as total_profiles FROM public.user_profiles;

-- 4. Test specific user IDs that are failing
SELECT id, full_name, phone_number 
FROM public.user_profiles 
WHERE id IN ('c75c867e-aa1f-4653-8e12-efbedb788f33', '30f60b15-13c0-4f4f-a257-a99b113a7d17');
