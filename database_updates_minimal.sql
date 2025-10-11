-- Minimal Chat System Database Updates
-- This file only adds the essential columns to make basic chat work

-- 1. Add only the essential columns to the existing chats table
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- 2. Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_chats_status ON public.chats USING btree (status);
CREATE INDEX IF NOT EXISTS idx_chats_read_at ON public.chats USING btree (read_at);
CREATE INDEX IF NOT EXISTS idx_chats_delivered_at ON public.chats USING btree (delivered_at);

-- 3. Enable Row Level Security (RLS) for chats if not already enabled
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for chats
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chats;
DROP POLICY IF EXISTS "Users can send messages" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chats;

CREATE POLICY "Users can view messages in their conversations" ON public.chats
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

CREATE POLICY "Users can send messages" ON public.chats
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

CREATE POLICY "Users can update their own messages" ON public.chats
    FOR UPDATE USING (
        auth.uid() = sender_id
    );

-- 5. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.chats TO authenticated;

-- 6. Create a function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_document_id UUID,
    p_user_id UUID,
    p_other_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.chats 
    SET 
        status = 'read',
        read_at = timezone('utc'::text, now())
    WHERE document_id = p_document_id
    AND sender_id = p_other_user_id
    AND receiver_id = p_user_id
    AND status IN ('sent', 'delivered');
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Create a function to mark messages as delivered
CREATE OR REPLACE FUNCTION mark_messages_as_delivered(
    p_document_id UUID,
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.chats 
    SET 
        status = 'delivered',
        delivered_at = timezone('utc'::text, now())
    WHERE document_id = p_document_id
    AND receiver_id = p_user_id
    AND status = 'sent';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Grant permissions for the functions
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_delivered(UUID, UUID) TO authenticated;

-- 9. Create a function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM public.chats
    WHERE receiver_id = p_user_id
    AND status IN ('sent', 'delivered');
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
