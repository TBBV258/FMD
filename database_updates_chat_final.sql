-- Chat System Database Updates - Final Version
-- Execute these SQL commands in your Supabase SQL Editor in order

-- 1. First, update the existing chats table with new columns
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'system'));

-- 2. Create indexes for the new columns in chats table
CREATE INDEX IF NOT EXISTS idx_chats_status ON public.chats USING btree (status);
CREATE INDEX IF NOT EXISTS idx_chats_read_at ON public.chats USING btree (read_at);
CREATE INDEX IF NOT EXISTS idx_chats_delivered_at ON public.chats USING btree (delivered_at);

-- 3. Create a new table for chat participants/rooms
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    document_id UUID NOT NULL,
    participant_1_id UUID NOT NULL,
    participant_2_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT chat_rooms_pkey PRIMARY KEY (id),
    CONSTRAINT chat_rooms_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
    CONSTRAINT chat_rooms_participant_1_fkey FOREIGN KEY (participant_1_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT chat_rooms_participant_2_fkey FOREIGN KEY (participant_2_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT chat_rooms_unique_participants UNIQUE (participant_1_id, participant_2_id, document_id)
);

-- 4. Create indexes for chat_rooms table
CREATE INDEX IF NOT EXISTS idx_chat_rooms_document_id ON public.chat_rooms USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participant_1 ON public.chat_rooms USING btree (participant_1_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participant_2 ON public.chat_rooms USING btree (participant_2_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_updated_at ON public.chat_rooms USING btree (updated_at DESC);

-- 5. Create a function to automatically update chat_rooms when new messages are inserted
CREATE OR REPLACE FUNCTION update_chat_room_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the chat room's last message info
    UPDATE public.chat_rooms 
    SET 
        last_message_at = NEW.created_at,
        last_message_id = NEW.id,
        updated_at = timezone('utc'::text, now())
    WHERE document_id = NEW.document_id 
    AND (
        (participant_1_id = NEW.sender_id AND participant_2_id = NEW.receiver_id) OR
        (participant_1_id = NEW.receiver_id AND participant_2_id = NEW.sender_id)
    );
    
    -- If no chat room exists, create one
    IF NOT FOUND THEN
        INSERT INTO public.chat_rooms (document_id, participant_1_id, participant_2_id, last_message_at, last_message_id)
        VALUES (NEW.document_id, NEW.sender_id, NEW.receiver_id, NEW.created_at, NEW.id)
        ON CONFLICT (participant_1_id, participant_2_id, document_id) 
        DO UPDATE SET 
            last_message_at = NEW.created_at,
            last_message_id = NEW.id,
            updated_at = timezone('utc'::text, now()),
            is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update chat rooms
DROP TRIGGER IF EXISTS trigger_update_chat_room ON public.chats;
CREATE TRIGGER trigger_update_chat_room
    AFTER INSERT ON public.chats
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_room_on_message();

-- 7. Create a function to mark messages as read
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

-- 8. Create a function to mark messages as delivered
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

-- 9. Create a view for active chat rooms with participant info
CREATE OR REPLACE VIEW public.active_chat_rooms AS
SELECT 
    cr.id,
    cr.document_id,
    cr.participant_1_id,
    cr.participant_2_id,
    cr.created_at,
    cr.updated_at,
    cr.last_message_at,
    cr.last_message_id,
    d.title as document_title,
    d.type as document_type,
    up1.full_name as participant_1_name,
    up2.full_name as participant_2_name,
    lm.message as last_message,
    lm.sender_id as last_message_sender_id
FROM public.chat_rooms cr
JOIN public.documents d ON cr.document_id = d.id
LEFT JOIN public.user_profiles up1 ON cr.participant_1_id = up1.id
LEFT JOIN public.user_profiles up2 ON cr.participant_2_id = up2.id
LEFT JOIN public.chats lm ON cr.last_message_id = lm.id
WHERE cr.is_active = true
ORDER BY cr.updated_at DESC;

-- 10. Enable Row Level Security (RLS) for better security
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies for chat_rooms
CREATE POLICY "Users can view their own chat rooms" ON public.chat_rooms
    FOR SELECT USING (
        auth.uid() = participant_1_id OR 
        auth.uid() = participant_2_id
    );

CREATE POLICY "Users can insert their own chat rooms" ON public.chat_rooms
    FOR INSERT WITH CHECK (
        auth.uid() = participant_1_id OR 
        auth.uid() = participant_2_id
    );

CREATE POLICY "Users can update their own chat rooms" ON public.chat_rooms
    FOR UPDATE USING (
        auth.uid() = participant_1_id OR 
        auth.uid() = participant_2_id
    );

-- 12. Create RLS policies for chats
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

-- 13. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.chat_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.chats TO authenticated;
GRANT SELECT ON public.active_chat_rooms TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_delivered(UUID, UUID) TO authenticated;

-- 14. Create a function to get unread message count
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

-- 15. Add missing columns to user_profiles if they don't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 16. Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_points ON public.user_profiles(points DESC);

-- 17. Add constraints for points
-- Drop existing constraint first to avoid conflicts
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS check_points_positive;
ALTER TABLE public.user_profiles 
ADD CONSTRAINT check_points_positive CHECK (points >= 0);

-- 18. Create a function to award points
CREATE OR REPLACE FUNCTION award_user_points(user_id uuid, points_to_award integer, activity_type text)
RETURNS void AS $$
BEGIN
    UPDATE public.user_profiles 
    SET points = points + points_to_award,
        updated_at = timezone('utc'::text, now())
    WHERE id = user_id;
    
    -- Log the activity (optional - you can create a separate activity log table)
    RAISE NOTICE 'Awarded % points to user % for activity: %', points_to_award, user_id, activity_type;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION award_user_points(UUID, INTEGER, TEXT) TO authenticated;
