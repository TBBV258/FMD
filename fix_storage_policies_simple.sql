-- ============================================
-- SQL SIMPLIFICADO PARA STORAGE POLICIES
-- Use este SQL apenas se tiver permissões de superusuário
-- Caso contrário, use o guia manual em STORAGE_POLICIES_MANUAL_SETUP.md
-- ============================================

-- IMPORTANTE: Este SQL pode falhar com erro de permissão.
-- Se isso acontecer, use o Dashboard do Supabase para criar as políticas manualmente.

-- Dropar políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "All users can view public documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Owner can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Owner can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Owner can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;

-- Política 1: Upload (INSERT)
CREATE POLICY "Owner can upload own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    (
      array_length(storage.foldername(name), 1) > 0
      AND split_part((storage.foldername(name))[array_length(storage.foldername(name), 1)], '_', 1) = auth.uid()::text
    )
    OR
    auth.uid()::text = ANY(storage.foldername(name))
  )
);

-- Política 2: Update
CREATE POLICY "Owner can update own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    (
      array_length(storage.foldername(name), 1) > 0
      AND split_part((storage.foldername(name))[array_length(storage.foldername(name), 1)], '_', 1) = auth.uid()::text
    )
    OR
    auth.uid()::text = ANY(storage.foldername(name))
  )
)
WITH CHECK (
  bucket_id = 'documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    (
      array_length(storage.foldername(name), 1) > 0
      AND split_part((storage.foldername(name))[array_length(storage.foldername(name), 1)], '_', 1) = auth.uid()::text
    )
    OR
    auth.uid()::text = ANY(storage.foldername(name))
  )
);

-- Política 3: Delete
CREATE POLICY "Owner can delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    (
      array_length(storage.foldername(name), 1) > 0
      AND split_part((storage.foldername(name))[array_length(storage.foldername(name), 1)], '_', 1) = auth.uid()::text
    )
    OR
    auth.uid()::text = ANY(storage.foldername(name))
  )
);

-- Política 4: Select (authenticated)
CREATE POLICY "Authenticated users can view documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Política 5: Select (public)
CREATE POLICY "Public can view documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');

