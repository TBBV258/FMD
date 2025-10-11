-- Fix RLS policies for user_profiles table
-- This script ensures users can read other users' profiles for chat functionality

-- 1. Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- 2. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- 3. Enable RLS if not already enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- 5. Create new RLS policies for user_profiles
-- Allow users to view all profiles (needed for chat functionality)
CREATE POLICY "Users can view all profiles" ON public.user_profiles
    FOR SELECT USING (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Grant necessary permissions
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT INSERT, UPDATE ON public.user_profiles TO authenticated;

-- 7. Test the fix by trying to select profiles
SELECT COUNT(*) as total_profiles FROM public.user_profiles;

-- 8. Test specific user IDs that were failing
SELECT id, full_name, phone_number 
FROM public.user_profiles 
WHERE id IN ('c75c867e-aa1f-4653-8e12-efbedb788f33', '30f60b15-13c0-4f4f-a257-a99b113a7d17');
