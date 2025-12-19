-- ============================================
-- FIX COMPLETO: Tabela documents
-- Resolve problemas de constraints e tipos de dados
-- ============================================

-- 1. Ajustar constraint de TYPE
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE public.documents 
ADD CONSTRAINT documents_type_check CHECK (
  type IN (
    'bi',                    -- Bilhete de Identidade
    'passport',              -- Passaporte
    'driver_license',        -- Carta de Condução
    'dire',                  -- DIRE
    'nuit',                  -- NUIT
    'work_card',             -- Cartão de Trabalho
    'student_card',          -- Cartão de Estudante
    'voter_card',            -- Cartão de Eleitor
    'birth_certificate',     -- Certidão de Nascimento
    'title_deed',            -- Título de Propriedade
    'other',                 -- Outro
    -- Valores antigos (para compatibilidade)
    'ID card',
    'DIRE',
    'Passport',
    'Bank Doc'
  )
);

-- 2. Ajustar constraint de STATUS
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_status_check;

ALTER TABLE public.documents 
ADD CONSTRAINT documents_status_check CHECK (
  status IN (
    'normal',
    'lost',
    'found',
    'matched',    -- Documento encontrou match
    'returned'    -- Documento foi devolvido
  )
);

-- 3. Ajustar campo location para aceitar string ou JSONB
-- IMPORTANTE: Dropar índice GIN primeiro (não funciona com TEXT)
DROP INDEX IF EXISTS idx_documents_location;

-- Converter para TEXT (mais simples para o frontend)
ALTER TABLE public.documents 
ALTER COLUMN location TYPE TEXT USING 
  CASE 
    WHEN location IS NULL THEN NULL
    WHEN jsonb_typeof(location) = 'string' THEN location::text
    WHEN jsonb_typeof(location) = 'object' THEN (location->>'address')::text
    ELSE location::text
  END;

-- Criar índice B-tree simples para location (opcional, para buscas)
-- CREATE INDEX IF NOT EXISTS idx_documents_location_text ON public.documents USING btree (location) WHERE location IS NOT NULL;

-- Ou manter JSONB e converter string para objeto no frontend
-- (Descomente a linha acima se quiser usar TEXT, ou mantenha JSONB e ajuste o frontend)

-- 4. Verificar constraints criadas
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.documents'::regclass
  AND contype = 'c'
ORDER BY conname;

-- 5. Verificar tipo da coluna location
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'documents'
  AND column_name IN ('location', 'type', 'status');

