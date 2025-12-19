-- ============================================
-- FIX FINAL - Storage Policies para documents
-- Problema identificado: Não há política de INSERT para authenticated no bucket documents
-- ============================================

-- 1. Deletar políticas estranhas do bucket documents (flreew_*)
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder flreew_0" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder flreew_1" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder flreew_2" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder flreew_3" ON storage.objects;

-- 2. Deletar qualquer outra política relacionada a documents (se existir)
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Owner can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Test upload - any authenticated user" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- 3. Criar política de INSERT para authenticated no bucket documents
-- ⚠️ IMPORTANTE: Execute este comando no Dashboard, não via SQL (pode dar erro de permissão)
-- Se der erro, crie manualmente no Dashboard com estas configurações:

/*
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
);
*/

-- 4. Criar política de SELECT para authenticated
/*
CREATE POLICY "Authenticated users can view documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
);
*/

-- 5. Criar política de SELECT para public (se o bucket for público)
/*
CREATE POLICY "Public can view documents"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'documents'
);
*/

-- ============================================
-- INSTRUÇÕES PARA DASHBOARD
-- ============================================
-- Como o SQL pode dar erro de permissão, faça pelo Dashboard:
--
-- 1. Supabase Dashboard → Storage → bucket "documents" → Policies
-- 2. Delete as políticas "flreew_0", "flreew_1", "flreew_2", "flreew_3"
-- 3. Crie estas 3 políticas novas:
--
--    Política 1: INSERT
--    - Name: "Authenticated users can upload documents"
--    - Operation: INSERT
--    - Roles: authenticated
--    - USING: (vazio)
--    - WITH CHECK: bucket_id = 'documents'
--
--    Política 2: SELECT (authenticated)
--    - Name: "Authenticated users can view documents"
--    - Operation: SELECT
--    - Roles: authenticated
--    - USING: bucket_id = 'documents'
--    - WITH CHECK: (vazio)
--
--    Política 3: SELECT (public)
--    - Name: "Public can view documents"
--    - Operation: SELECT
--    - Roles: public
--    - USING: bucket_id = 'documents'
--    - WITH CHECK: (vazio)

