-- Enable Row Level Security on the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for document uploads
CREATE POLICY "Users can upload to their own documents folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- Policy for viewing documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- Avatar policies (split instead of FOR ALL)
-- INSERT avatar into documents/avatars/{user_id}/...
CREATE POLICY "Users can insert avatars to their own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = 'avatars' AND
    (storage.foldername(name))[2] = (SELECT auth.uid())::text
);

-- SELECT avatars (authenticated users can read their own avatars)
CREATE POLICY "Users can select their own avatars"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = 'avatars' AND
    (storage.foldername(name))[2] = (SELECT auth.uid())::text
);

-- UPDATE avatar (users can update their own avatar)
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = 'avatars' AND
    (storage.foldername(name))[2] = (SELECT auth.uid())::text
)
WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = 'avatars' AND
    (storage.foldername(name))[2] = (SELECT auth.uid())::text
);

-- Allow public read access to avatars (so they can be displayed without authentication)
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT TO anon
USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = 'avatars'
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'documents' AND
    (
        (storage.foldername(name))[1] = (SELECT auth.uid())::text OR
        ((storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = (SELECT auth.uid())::text)
    )
);

-- Create or replace function to get the size of a folder
CREATE OR REPLACE FUNCTION storage.folder_size(bucket_id text, folder_path text)
RETURNS bigint AS $$
  SET search_path = '';
  SELECT COALESCE(SUM((storage.objects.metadata->>'size')::bigint), 0)
  FROM storage.objects
  WHERE storage.objects.bucket_id = $1
    AND storage.objects.name LIKE $2 || '%';
$$ LANGUAGE SQL STABLE;

-- Policy to enforce storage limits on INSERT (100 MB per user across documents and avatars)
CREATE POLICY "Enforce storage limits"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'documents' AND
    (
        (
          (SELECT storage.folder_size('documents', (SELECT auth.uid())::text || '/')) +
          (SELECT storage.folder_size('documents', 'avatars/' || (SELECT auth.uid())::text || '/'))
        ) < 100 * 1024 * 1024
    )
);
