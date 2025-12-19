-- ============================================
-- POLÍTICAS RLS SUPER SIMPLES PARA BUCKET AVATARS
-- ============================================

-- IMPORTANTE: Execute este SQL no Supabase SQL Editor
-- Ou use o Dashboard: Storage > avatars > Policies

-- 1. Deletar políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;

-- 2. Política SUPER SIMPLES: INSERT (Upload)
-- Qualquer usuário autenticado pode fazer upload no bucket avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 3. Política SUPER SIMPLES: SELECT (Visualizar)
-- Qualquer pessoa (pública) pode ver avatares
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 4. Política SUPER SIMPLES: UPDATE (Atualizar)
-- Qualquer usuário autenticado pode atualizar arquivos no bucket avatars
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 5. Política SUPER SIMPLES: DELETE (Deletar)
-- Qualquer usuário autenticado pode deletar arquivos no bucket avatars
CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- ============================================
-- NOTAS:
-- ============================================
-- Estas políticas são MUITO permissivas (qualquer usuário autenticado pode fazer qualquer coisa)
-- Se quiser adicionar verificação de ownership depois, você pode refinar as políticas.
-- 
-- Para verificar ownership, você pode usar:
--   - Verificar se o nome do arquivo contém o user_id: name LIKE '%' || auth.uid()::text || '%'
--   - Ou usar storage.foldername(name) para verificar estrutura de pastas
--
-- Exemplo de política com ownership (para usar depois):
-- WITH CHECK (
--   bucket_id = 'avatars' 
--   AND name LIKE '%' || auth.uid()::text || '%'
-- )

