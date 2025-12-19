-- ============================================
-- STORAGE BUCKETS AND POLICIES
-- Execute this after RLS policies
-- ============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- Documents bucket policies
-- Users can upload their own documents
CREATE POLICY "Users can upload own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own documents
CREATE POLICY "Users can view own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- All users can view public documents (lost/found)
CREATE POLICY "All users can view public documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[2] = 'public'
);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Avatars bucket policies
-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- All users can view avatars (public)
CREATE POLICY "All users can view avatars" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars'
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Chat files bucket policies (private)
-- Users can upload chat files if they are part of the chat
CREATE POLICY "Users can upload chat files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view chat files if they are part of the chat
CREATE POLICY "Users can view chat files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-files' AND 
  auth.uid()::text = ANY(string_to_array((storage.foldername(name))[1], ','))
);

-- Users can delete their own chat files
CREATE POLICY "Users can delete own chat files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- REALTIME SUBSCRIPTIONS SETUP
-- ============================================

-- Enable realtime for tables that need it
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

-- ============================================
-- USEFUL FUNCTIONS FOR THE APPLICATION
-- ============================================

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM public.chats
    WHERE receiver_id = p_user_id
    AND read = false;
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM public.notifications
    WHERE user_id = p_user_id
    AND is_read = false;
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS FOR STORAGE AND FUNCTIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_points(UUID, INTEGER, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
-- GRANT EXECUTE ON FUNCTION verify_rls_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION test_feed_access() TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all tables were created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check all RLS policies (function now works correctly)
-- SELECT * FROM verify_rls_policies();

-- Test feed access (run this as an authenticated user)
-- SELECT * FROM test_feed_access();
