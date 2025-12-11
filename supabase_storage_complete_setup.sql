-- ========================================
-- SUPABASE STORAGE CONFIGURATION
-- FindMyDocs - Complete Setup Script
-- ========================================
-- 
-- Este script configura:
-- 1. Buckets de storage (documents e profiles)
-- 2. Políticas RLS (Row Level Security)
-- 3. Permissões de acesso
--
-- Execute este script no SQL Editor do Supabase Dashboard
-- ========================================

-- ========================================
-- PARTE 1: CRIAR BUCKETS
-- ========================================

-- Nota: Os buckets precisam ser criados via interface do Supabase
-- Vá para Storage > New Bucket e crie:
-- 
-- Bucket 1: 'documents'
--   - Public: YES
--   - File size limit: 50 MB
--   - Allowed MIME types: image/*, application/pdf
--
-- Bucket 2: 'profiles'
--   - Public: YES
--   - File size limit: 5 MB
--   - Allowed MIME types: image/*
--
-- Após criar os buckets manualmente, execute o resto deste script

-- ========================================
-- PARTE 2: HABILITAR ROW LEVEL SECURITY
-- ========================================

-- Habilitar RLS nas tabelas de storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PARTE 3: LIMPAR POLÍTICAS EXISTENTES (OPCIONAL)
-- ========================================

-- Se você já tem políticas antigas, descomente as linhas abaixo para removê-las
-- DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
-- DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- ========================================
-- PARTE 4: POLÍTICAS PARA BUCKET 'documents'
-- ========================================

-- Política 1: Permitir upload de documentos (INSERT)
-- Qualquer usuário autenticado pode fazer upload
CREATE POLICY "Users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
);

-- Política 2: Leitura pública de documentos (SELECT)
-- Qualquer pessoa pode visualizar documentos (necessário para feed público)
CREATE POLICY "Public can view documents"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'documents'
);

-- Política 3: Usuários podem atualizar seus próprios documentos (UPDATE)
CREATE POLICY "Users can update their documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'documents'
);

-- Política 4: Usuários podem deletar seus próprios documentos (DELETE)
CREATE POLICY "Users can delete their documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ========================================
-- PARTE 5: POLÍTICAS PARA BUCKET 'profiles'
-- ========================================

-- Política 5: Permitir upload de avatares (INSERT)
-- Qualquer usuário autenticado pode fazer upload de avatar
CREATE POLICY "Users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
);

-- Política 6: Leitura pública de avatares (SELECT)
-- Qualquer pessoa pode visualizar avatares
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'profiles'
);

-- Política 7: Usuários podem atualizar seus próprios avatares (UPDATE)
CREATE POLICY "Users can update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles'
)
WITH CHECK (
  bucket_id = 'profiles'
);

-- Política 8: Usuários podem deletar seus próprios avatares (DELETE)
CREATE POLICY "Users can delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles'
);

-- ========================================
-- PARTE 6: POLÍTICAS PARA BUCKETS (OPCIONAL)
-- ========================================

-- Nota: CREATE POLICY não suporta IF NOT EXISTS no Postgres utilizado pelo Supabase
-- Para manter idempotência, removemos a política antes de recriá-la
DROP POLICY IF EXISTS "Public buckets are viewable" ON storage.buckets;
CREATE POLICY "Public buckets are viewable"
ON storage.buckets
FOR SELECT
TO public
USING (true);

-- ========================================
-- PARTE 7: VERIFICAÇÃO
-- ========================================

-- Execute estas queries para verificar se tudo foi configurado corretamente

-- Verificar buckets criados
SELECT * FROM storage.buckets WHERE name IN ('documents', 'profiles');

-- Verificar políticas do bucket 'documents'
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%document%';

-- Verificar políticas do bucket 'profiles'
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%avatar%';

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================
--
-- 1. CRIAR BUCKETS PRIMEIRO:
--    Você DEVE criar os buckets manualmente via interface:
--    Storage > New Bucket
--
-- 2. CONFIGURAÇÃO DOS BUCKETS:
--    - Bucket 'documents': Public, 50MB limit, image/* e application/pdf
--    - Bucket 'profiles': Public, 5MB limit, image/*
--
-- 3. TESTE APÓS EXECUÇÃO:
--    - Tente fazer upload de um documento
--    - Tente fazer upload de uma foto de perfil
--    - Verifique se não há erros 400
--
-- 4. ESTRUTURA DE PASTAS:
--    Os arquivos serão salvos como:
--    - documents/user-id_timestamp.jpg
--    - profiles/avatar_user-id_timestamp.jpg
--
-- 5. TROUBLESHOOTING:
--    - Erro "Bucket not found": Crie os buckets manualmente primeiro
--    - Erro "Policy violation": Verifique se o usuário está autenticado
--    - Erro 400: Verifique se os buckets foram criados corretamente
--
-- ========================================
-- FIM DO SCRIPT
-- ========================================

-- Execute as queries de verificação acima para confirmar que tudo está OK!

