-- Complete Database Schema for FindMyDocs
-- Execute these SQL commands in your Supabase SQL Editor in order

-- 1. First, create the documents table (this was missing!)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ID card', 'DIRE', 'Passport', 'Bank Doc')),
    status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'lost', 'found')),
    location JSONB,
    file_url TEXT DEFAULT '',
    description TEXT,
    document_number TEXT,
    issue_date DATE,
    expiry_date DATE,
    issue_place TEXT,
    issuing_authority TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT documents_pkey PRIMARY KEY (id),
    CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 2. Create indexes for documents table
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents USING btree (status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents USING btree (type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_is_public ON public.documents USING btree (is_public);

-- 3. Enable RLS for documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for documents
CREATE POLICY "Users can view their own documents" ON public.documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public documents" ON public.documents
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON public.documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON public.documents
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Now update the existing chats table with new columns
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'system'));

-- 6. Create a new table for chat participants/rooms
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

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_document_id ON public.chat_rooms USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participant_1 ON public.chat_rooms USING btree (participant_1_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participant_2 ON public.chat_rooms USING btree (participant_2_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_updated_at ON public.chat_rooms USING btree (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_status ON public.chats USING btree (status);
CREATE INDEX IF NOT EXISTS idx_chats_read_at ON public.chats USING btree (read_at);
CREATE INDEX IF NOT EXISTS idx_chats_delivered_at ON public.chats USING btree (delivered_at);

-- 8. Create a function to automatically update chat_rooms when new messages are inserted
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

-- 9. Create trigger to automatically update chat rooms
DROP TRIGGER IF EXISTS trigger_update_chat_room ON public.chats;
CREATE TRIGGER trigger_update_chat_room
    AFTER INSERT ON public.chats
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_room_on_message();

-- 10. Create a function to mark messages as read
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

-- 11. Create a function to mark messages as delivered
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

-- 12. Create a view for active chat rooms with participant info
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

-- 13. Enable Row Level Security (RLS) for better security
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- 14. Create RLS policies for chat_rooms
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

-- 15. Create RLS policies for chats
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

-- 16. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.chat_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.chats TO authenticated;
GRANT SELECT ON public.active_chat_rooms TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_delivered(UUID, UUID) TO authenticated;

-- 17. Create a function to get unread message count
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

-- 18. Create storage bucket for documents (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 19. Set up RLS policies for the documents bucket
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view public documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view public documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[2] = 'public'
);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 20. Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 21. Create trigger for documents table to update updated_at
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON public.documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 22. Create trigger for user_profiles table to update updated_at
-- Drop existing trigger first to avoid conflicts
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 23. Add missing columns to user_profiles if they don't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 24. Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_points ON public.user_profiles(points DESC);

-- 25. Add constraints for points
ALTER TABLE public.user_profiles 
ADD CONSTRAINT IF NOT EXISTS check_points_positive CHECK (points >= 0);

-- 26. Create a function to award points
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
