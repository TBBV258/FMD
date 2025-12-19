-- Drop existing FEED table policies before recreating

-- Drop all RLS policies on feed table
DROP POLICY IF EXISTS "All users can view visible feed entries" ON public.feed;
DROP POLICY IF EXISTS "Users can create feed entries for their own documents" ON public.feed;
DROP POLICY IF EXISTS "Users can update their own feed entries" ON public.feed;
DROP POLICY IF EXISTS "Users can delete their own feed entries" ON public.feed;

-- Optional: Drop the entire table if you want to start fresh
-- Uncomment the line below only if you want to completely recreate the table
-- DROP TABLE IF EXISTS public.feed CASCADE;
