-- ============================================
-- FIX: Ajustar Constraints da Tabela documents
-- Problema: Valores do frontend não batem com constraints do banco
-- ============================================

-- 1. Dropar constraints antigas
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_status_check;

-- 2. Criar nova constraint para TYPE (aceita valores do frontend)
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

-- 3. Criar nova constraint para STATUS (aceita valores do frontend)
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

-- 4. Verificar se a constraint de verification_status está correta
-- (Deve estar OK, mas vamos garantir)
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_verification_status_check;

ALTER TABLE public.documents 
ADD CONSTRAINT documents_verification_status_check CHECK (
  verification_status IN (
    'pending',
    'verified',
    'rejected',
    'expired'
  )
);

-- 5. Verificar constraints criadas
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.documents'::regclass
  AND contype = 'c'
ORDER BY conname;

