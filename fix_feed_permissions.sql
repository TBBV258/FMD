-- Fix FEED table permissions - Remove anon access for security

-- Revoke all permissions from anon role (unauthenticated users)
REVOKE ALL ON public.feed FROM anon;

-- Ensure authenticated users have correct permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed TO authenticated;

-- Verify RLS is enabled
ALTER TABLE public.feed ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (optional but recommended)
ALTER TABLE public.feed FORCE ROW LEVEL SECURITY;
