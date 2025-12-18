-- FEED Table Migration for Lost/Found Documents
-- This table creates a public feed where users can see documents marked as lost
-- Only the user who marked the document as lost can delete/update the feed entry

-- 1. Create the FEED table
CREATE TABLE IF NOT EXISTS public.feed (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    document_id UUID NOT NULL,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    document_type TEXT NOT NULL CHECK (document_type IN ('ID card', 'DIRE', 'Passport', 'Bank Doc')),
    document_number TEXT,
    location JSONB,
    file_url TEXT,
    status TEXT NOT NULL DEFAULT 'lost' CHECK (status IN ('lost', 'found')),
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT feed_pkey PRIMARY KEY (id),
    CONSTRAINT feed_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents (id) ON DELETE CASCADE,
    CONSTRAINT feed_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT feed_unique_document UNIQUE (document_id)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feed_user_id ON public.feed USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_feed_document_id ON public.feed USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_feed_status ON public.feed USING btree (status);
CREATE INDEX IF NOT EXISTS idx_feed_created_at ON public.feed USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_is_visible ON public.feed USING btree (is_visible);
CREATE INDEX IF NOT EXISTS idx_feed_document_type ON public.feed USING btree (document_type);

-- 3. Enable Row Level Security
ALTER TABLE public.feed ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for FEED table

-- Policy 1: All authenticated users can view visible feed entries (READ)
CREATE POLICY "All users can view visible feed entries" ON public.feed
    FOR SELECT 
    USING (is_visible = true);

-- Policy 2: Only the document owner can insert feed entries (INSERT)
CREATE POLICY "Users can create feed entries for their own documents" ON public.feed
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Only the document owner can update their feed entries (UPDATE)
-- This includes marking as hidden, updating description, etc.
CREATE POLICY "Users can update their own feed entries" ON public.feed
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Only the document owner can delete their feed entries (DELETE)
CREATE POLICY "Users can delete their own feed entries" ON public.feed
    FOR DELETE 
    USING (auth.uid() = user_id);

-- 5. Create a function to automatically create feed entry when document is marked as lost
CREATE OR REPLACE FUNCTION create_feed_entry_on_lost()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create feed entry if status changed to 'lost' or 'found'
    IF NEW.status IN ('lost', 'found') AND (OLD.status IS NULL OR OLD.status = 'normal') THEN
        INSERT INTO public.feed (
            document_id,
            user_id,
            title,
            description,
            document_type,
            document_number,
            location,
            file_url,
            status
        ) VALUES (
            NEW.id,
            NEW.user_id,
            NEW.title,
            NEW.description,
            NEW.type,
            NEW.document_number,
            NEW.location,
            NEW.file_url,
            NEW.status
        )
        ON CONFLICT (document_id) 
        DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            document_type = EXCLUDED.document_type,
            document_number = EXCLUDED.document_number,
            location = EXCLUDED.location,
            file_url = EXCLUDED.file_url,
            status = EXCLUDED.status,
            is_visible = true,
            updated_at = timezone('utc'::text, now());
    
    -- If status changed back to normal, hide the feed entry
    ELSIF NEW.status = 'normal' AND OLD.status IN ('lost', 'found') THEN
        UPDATE public.feed
        SET is_visible = false,
            updated_at = timezone('utc'::text, now())
        WHERE document_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger to automatically manage feed entries
DROP TRIGGER IF EXISTS trigger_create_feed_entry ON public.documents;
CREATE TRIGGER trigger_create_feed_entry
    AFTER INSERT OR UPDATE OF status ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION create_feed_entry_on_lost();

-- 7. Create a function to hide/unhide feed entry
CREATE OR REPLACE FUNCTION toggle_feed_visibility(
    p_feed_id UUID,
    p_is_visible BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
    row_count INTEGER;
BEGIN
    UPDATE public.feed
    SET is_visible = p_is_visible,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_feed_id
    AND user_id = auth.uid();
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN row_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create a view for feed entries with user information
CREATE OR REPLACE VIEW public.feed_with_user_info AS
SELECT 
    f.id,
    f.document_id,
    f.user_id,
    f.title,
    f.description,
    f.document_type,
    f.document_number,
    f.location,
    f.file_url,
    f.status,
    f.is_visible,
    f.created_at,
    f.updated_at,
    up.full_name as user_name,
    up.avatar_url as user_avatar,
    up.phone_number as user_phone
FROM public.feed f
LEFT JOIN public.user_profiles up ON f.user_id = up.id
WHERE f.is_visible = true
ORDER BY f.created_at DESC;

-- 9. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed TO authenticated;
GRANT SELECT ON public.feed_with_user_info TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_feed_visibility(UUID, BOOLEAN) TO authenticated;

-- 10. Create trigger to update updated_at timestamp
CREATE TRIGGER update_feed_updated_at 
    BEFORE UPDATE ON public.feed 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Create a function to get feed entries count
CREATE OR REPLACE FUNCTION get_feed_entries_count()
RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO count
    FROM public.feed
    WHERE is_visible = true;
    
    RETURN COALESCE(count, 0);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_feed_entries_count() TO authenticated;

-- 12. Create a function to get user's own feed entries
CREATE OR REPLACE FUNCTION get_my_feed_entries()
RETURNS TABLE (
    id UUID,
    document_id UUID,
    title TEXT,
    description TEXT,
    document_type TEXT,
    document_number TEXT,
    location JSONB,
    file_url TEXT,
    status TEXT,
    is_visible BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.document_id,
        f.title,
        f.description,
        f.document_type,
        f.document_number,
        f.location,
        f.file_url,
        f.status,
        f.is_visible,
        f.created_at,
        f.updated_at
    FROM public.feed f
    WHERE f.user_id = auth.uid()
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_my_feed_entries() TO authenticated;
