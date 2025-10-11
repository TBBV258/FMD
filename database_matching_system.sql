-- Database Schema Updates for Document Matching System

-- 1. Ensure the notifications table exists
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    action_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Add RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Add document_number column to documents table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'documents' 
                  AND column_name = 'document_number') THEN
        ALTER TABLE public.documents 
        ADD COLUMN document_number text;
    END IF;
END $$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_document_number ON public.documents(document_number);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 5. Create a function to check for document matches
CREATE OR REPLACE FUNCTION check_document_matches()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if it's a found or lost document
    IF NEW.status IN ('found', 'lost') AND NEW.document_number IS NOT NULL THEN
        -- Find matching documents with opposite status
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            action_url,
            metadata
        )
        SELECT 
            d.user_id,
            'document_match' as type,
            'Document Match Found!' as title,
            'A ' || NEW.status || ' ' || NEW.type || ' (#' || NEW.document_number || ') matches your ' || 
            CASE WHEN NEW.status = 'found' THEN 'lost' ELSE 'found' END || ' document.' as message,
            '/document/' || NEW.id as action_url,
            jsonb_build_object(
                'document_id', NEW.id,
                'match_type', NEW.status,
                'document_number', NEW.document_number,
                'document_type', NEW.type
            ) as metadata
        FROM 
            public.documents d
        WHERE 
            d.type = NEW.type 
            AND d.document_number = NEW.document_number
            AND d.status = CASE WHEN NEW.status = 'found' THEN 'lost' ELSE 'found' END
            AND d.user_id != NEW.user_id
            AND d.id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create a trigger to check for matches on document insert/update
DROP TRIGGER IF EXISTS document_matching_trigger ON public.documents;
CREATE TRIGGER document_matching_trigger
AFTER INSERT OR UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION check_document_matches();

-- 7. Create a function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true,
        read_at = NOW(),
        updated_at = NOW()
    WHERE id = notification_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create a function to get unread notifications count
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS bigint AS $$
DECLARE
    count bigint;
BEGIN
    SELECT COUNT(*) INTO count
    FROM public.notifications
    WHERE user_id = auth.uid()
    AND is_read = false;
    
    RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
