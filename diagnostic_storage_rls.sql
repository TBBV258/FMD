-- ============================================
-- DIAGNÓSTICO COMPLETO - Storage RLS Policies
-- Execute este SQL e me envie TODOS os resultados
-- ============================================

-- 1. Ver TODAS as políticas do storage.objects
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;

-- 2. Ver configuração do bucket documents
SELECT 
    id,
    name,
    public as is_public,
    file_size_limit,
    allowed_mime_types,
    created_at,
    updated_at
FROM storage.buckets
WHERE id = 'documents';

-- 3. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- 4. Ver TODAS as políticas relacionadas a 'documents' (qualquer menção)
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (
    policyname ILIKE '%document%' 
    OR qual::text ILIKE '%document%'
    OR with_check::text ILIKE '%document%'
  )
ORDER BY policyname;

-- 5. Gerar comandos DROP para todas as políticas de documents
SELECT 
    'DROP POLICY IF EXISTS "' || policyname || '" ON storage.objects;' as drop_command
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (
    policyname ILIKE '%document%'
    OR qual::text ILIKE '%document%'
    OR with_check::text ILIKE '%document%'
  )
ORDER BY policyname;

-- 6. Verificar se há políticas padrão do Supabase que podem estar interferindo
SELECT 
    policyname,
    cmd,
    roles,
    CASE 
        WHEN qual IS NULL THEN 'NULL'
        ELSE qual::text
    END as using_expr,
    CASE 
        WHEN with_check IS NULL THEN 'NULL'
        ELSE with_check::text
    END as with_check_expr
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;

