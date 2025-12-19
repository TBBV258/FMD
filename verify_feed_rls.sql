-- Verification Script for FEED Table and RLS Policies

-- 1. Check if FEED table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'feed';

-- 2. Check FEED table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'feed'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled on FEED table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'feed' 
AND schemaname = 'public';

-- 4. Check all RLS policies on FEED table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'feed' 
AND schemaname = 'public'
ORDER BY policyname;

-- 5. Check indexes on FEED table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'feed'
AND schemaname = 'public'
ORDER BY indexname;

-- 6. Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'feed'
AND tc.table_schema = 'public';

-- 7. Count existing feed entries
SELECT 
    COUNT(*) as total_feed_entries,
    COUNT(CASE WHEN is_visible = true THEN 1 END) as visible_entries,
    COUNT(CASE WHEN is_visible = false THEN 1 END) as hidden_entries,
    COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_entries,
    COUNT(CASE WHEN status = 'found' THEN 1 END) as found_entries
FROM public.feed;

-- 8. Check permissions granted
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'feed'
ORDER BY grantee, privilege_type;
