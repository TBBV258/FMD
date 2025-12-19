-- ============================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- Execute this after creating the schema
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER PROFILES RLS POLICIES
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (auto-created on signup)
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- DOCUMENTS RLS POLICIES
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "All users can view lost and found documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view public documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;

-- Users can view their own documents
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (auth.uid() = user_id);

-- ALL authenticated users can view lost and found documents (for public feed)
CREATE POLICY "All users can view lost and found documents" ON public.documents
    FOR SELECT USING (status IN ('lost', 'found'));

-- Users can view public documents
CREATE POLICY "Users can view public documents" ON public.documents
    FOR SELECT USING (is_public = true);

-- Users can insert their own documents
CREATE POLICY "Users can insert own documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own documents
CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CHATS RLS POLICIES
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chats;
DROP POLICY IF EXISTS "Users can send messages" ON public.chats;
DROP POLICY IF EXISTS "Users can update own messages" ON public.chats;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.chats;

-- Users can view chat messages where they are sender or receiver
CREATE POLICY "Users can view own chat messages" ON public.chats
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages" ON public.chats
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update their own messages
CREATE POLICY "Users can update own messages" ON public.chats
    FOR UPDATE USING (auth.uid() = sender_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages" ON public.chats
    FOR DELETE USING (auth.uid() = sender_id);

-- ============================================
-- NOTIFICATIONS RLS POLICIES
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- POINTS ACTIVITY LOG RLS POLICIES
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own points activity" ON public.points_activity_log;
DROP POLICY IF EXISTS "System can insert points activity" ON public.points_activity_log;

-- Users can view their own points activity
CREATE POLICY "Users can view own points activity" ON public.points_activity_log
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert points activity for any user
CREATE POLICY "System can insert points activity" ON public.points_activity_log
    FOR INSERT WITH CHECK (true);

-- ============================================
-- VERIFICATION REQUESTS RLS POLICIES
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Users can create verification requests" ON public.verification_requests;

-- Users can view their own verification requests
CREATE POLICY "Users can view own verification requests" ON public.verification_requests
    FOR SELECT USING (auth.uid() = requested_by);

-- Users can create verification requests
CREATE POLICY "Users can create verification requests" ON public.verification_requests
    FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- Admin users can view all verification requests (if needed in future)
-- CREATE POLICY "Admins can view all verification requests" ON public.verification_requests
--     FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND plan = 'premium'));

-- ============================================
-- GRANTS FOR AUTHENTICATED USERS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT ON public.points_activity_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_requests TO authenticated;

-- ============================================
-- VERIFICATION FUNCTIONS
-- ============================================

-- Function to verify all policies are created correctly
CREATE OR REPLACE FUNCTION verify_rls_policies()
RETURNS TABLE(
    table_name TEXT,
    policy_name TEXT,
    policy_cmd TEXT,
    policy_roles TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        policyname as policy_name,
        cmd as policy_cmd,
        CASE 
            WHEN roles = '{public}' THEN 'public'
            WHEN roles = '{authenticated}' THEN 'authenticated'
            WHEN roles = '{postgres}' THEN 'postgres'
            ELSE COALESCE(array_to_string(roles, ','), 'all')
        END as policy_roles
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
END;
$$ LANGUAGE plpgsql;

-- Test function to check feed access
CREATE OR REPLACE FUNCTION test_feed_access()
RETURNS TABLE(
    total_lost_found INTEGER,
    user_own_documents INTEGER,
    public_documents INTEGER
) AS $$
BEGIN
    -- This should work for any authenticated user
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.documents WHERE status IN ('lost', 'found')),
        (SELECT COUNT(*)::INTEGER FROM public.documents WHERE user_id = auth.uid()),
        (SELECT COUNT(*)::INTEGER FROM public.documents WHERE is_public = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
