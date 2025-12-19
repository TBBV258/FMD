-- ============================================
-- ATUALIZAÇÃO COMPLETA DE RLS PARA DOCUMENTS
-- Tabela: public.documents
-- Bucket: storage.objects (bucket 'documents')
-- ============================================

-- ============================================
-- PARTE 1: RLS DA TABELA public.documents
-- ============================================

-- Garantir que RLS está habilitado
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Dropar TODAS as políticas existentes da tabela documents
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "All users can view lost and found documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view public documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can upload own documents" ON public.documents;

-- Política 1: Dono tem acesso TOTAL (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Owner full access to own documents"
ON public.documents
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política 2: Outros usuários podem APENAS visualizar documentos públicos ou lost/found
CREATE POLICY "Users can view allowed documents"
ON public.documents
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  -- Dono sempre pode ver (mas já coberto pela política acima)
  auth.uid() = user_id
  OR 
  -- Outros podem ver apenas documentos públicos ou lost/found
  (is_public = true OR status IN ('lost', 'found'))
);

-- ============================================
-- PARTE 2: RLS DO BUCKET storage.objects (documents)
-- ============================================

-- Dropar TODAS as políticas existentes do bucket documents
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "All users can view public documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Política 1: Dono pode fazer UPLOAD (INSERT) de seus próprios arquivos
-- Suporta múltiplos formatos:
--   - userId/filename (primeiro folder é userId)
--   - documents/userId_filename.ext (nome do arquivo começa com userId_)
--   - documents/documents/userId_filename.ext (último elemento começa com userId_)
CREATE POLICY "Owner can upload own documents"
ON storage.objects
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (
    -- Caso 1: Primeiro folder é o userId
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Caso 2: Nome do arquivo (último elemento) começa com userId_
    (
      array_length(storage.foldername(name), 1) > 0
      AND split_part((storage.foldername(name))[array_length(storage.foldername(name), 1)], '_', 1) = auth.uid()::text
    )
    OR
    -- Caso 3: Qualquer folder é o userId (para paths aninhados)
    auth.uid()::text = ANY(storage.foldername(name))
  )
);

-- Política 2: Dono pode fazer UPDATE de seus próprios arquivos
CREATE POLICY "Owner can update own documents"
ON storage.objects
AS PERMISSIVE
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

-- Política 3: Dono pode fazer DELETE de seus próprios arquivos
CREATE POLICY "Owner can delete own documents"
ON storage.objects
AS PERMISSIVE
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

-- Política 4: Todos os usuários autenticados podem VISUALIZAR arquivos do bucket
-- (Como o bucket é público e os documentos públicos/lost/found devem ser visíveis)
CREATE POLICY "Authenticated users can view documents"
ON storage.objects
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Política 5: Usuários não autenticados também podem visualizar (bucket público)
CREATE POLICY "Public can view documents"
ON storage.objects
AS PERMISSIVE
FOR SELECT
TO public
USING (bucket_id = 'documents');

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar políticas criadas para a tabela documents
SELECT 
    schemaname || '.' || tablename as table_name,
    policyname as policy_name,
    cmd as policy_command,
    roles as policy_roles
FROM pg_policies 
WHERE tablename = 'documents' 
  AND schemaname = 'public'
ORDER BY policyname;

-- Verificar políticas criadas para o bucket documents
SELECT 
    schemaname || '.' || tablename as table_name,
    policyname as policy_name,
    cmd as policy_command,
    roles as policy_roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%document%'
ORDER BY policyname;

