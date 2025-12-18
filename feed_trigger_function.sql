-- Trigger function to automatically create feed entries when document status changes

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION create_feed_entry_on_lost()
RETURNS TRIGGER AS $$
BEGIN
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
    
    ELSIF NEW.status = 'normal' AND OLD.status IN ('lost', 'found') THEN
        UPDATE public.feed
        SET is_visible = false,
            updated_at = timezone('utc'::text, now())
        WHERE document_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger
DROP TRIGGER IF EXISTS trigger_create_feed_entry ON public.documents;
CREATE TRIGGER trigger_create_feed_entry
    AFTER INSERT OR UPDATE OF status ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION create_feed_entry_on_lost();

-- Step 3: Create helper function to toggle visibility
CREATE OR REPLACE FUNCTION toggle_feed_visibility(
    p_feed_id UUID,
    p_is_visible BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.feed
    SET is_visible = p_is_visible,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_feed_id
    AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION toggle_feed_visibility(UUID, BOOLEAN) TO authenticated;

-- Step 4: Create view with user information
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

GRANT SELECT ON public.feed_with_user_info TO authenticated;
