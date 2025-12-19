-- ============================================
-- FIX: Ajustar campo location para aceitar string ou JSONB
-- Problema: Frontend envia string, banco espera JSONB
-- ============================================

-- Opção 1: Alterar tipo da coluna para TEXT (mais simples)
-- Descomente se quiser usar esta opção:
/*
ALTER TABLE public.documents 
ALTER COLUMN location TYPE TEXT USING location::text;
*/

-- Opção 2: Manter JSONB mas converter string para JSONB no insert
-- (Melhor manter JSONB para queries mais complexas)
-- O frontend precisa enviar como objeto JSON, não string

-- Verificar tipo atual da coluna
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'documents'
  AND column_name = 'location';

