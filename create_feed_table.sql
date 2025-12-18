-- Step 1: Create FEED table
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

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_feed_user_id ON public.feed USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_feed_document_id ON public.feed USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_feed_status ON public.feed USING btree (status);
CREATE INDEX IF NOT EXISTS idx_feed_created_at ON public.feed USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_is_visible ON public.feed USING btree (is_visible);
CREATE INDEX IF NOT EXISTS idx_feed_document_type ON public.feed USING btree (document_type);

-- Step 3: Enable RLS
ALTER TABLE public.feed ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist
DROP POLICY IF EXISTS "All users can view visible feed entries" ON public.feed;
DROP POLICY IF EXISTS "Users can create feed entries for their own documents" ON public.feed;
DROP POLICY IF EXISTS "Users can update their own feed entries" ON public.feed;
DROP POLICY IF EXISTS "Users can delete their own feed entries" ON public.feed;

-- Step 5: Create RLS Policies

-- Policy 1: READ - All users can view visible feed entries
CREATE POLICY "All users can view visible feed entries" ON public.feed
    FOR SELECT 
    USING (is_visible = true);

-- Policy 2: INSERT - Only document owner can create feed entries
CREATE POLICY "Users can create feed entries for their own documents" ON public.feed
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: UPDATE - Only document owner can update their feed entries
CREATE POLICY "Users can update their own feed entries" ON public.feed
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: DELETE - Only document owner can delete their feed entries
CREATE POLICY "Users can delete their own feed entries" ON public.feed
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Step 5: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed TO authenticated;
