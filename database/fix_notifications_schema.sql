-- ============================================
-- Corrigir Schema de Notificações
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Verificar schema atual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar colunas faltantes se não existirem
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Migrar dados antigos (se houver coluna 'read')
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'notifications' 
             AND column_name = 'read') THEN
    -- Copiar valores de 'read' para 'is_read'
    UPDATE public.notifications 
    SET is_read = read 
    WHERE is_read IS NULL OR is_read = false;
    
    -- Remover coluna antiga 'read'
    ALTER TABLE public.notifications DROP COLUMN IF EXISTS read;
  END IF;
END $$;

-- 4. Migrar 'data' para 'metadata' (se houver)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'notifications' 
             AND column_name = 'data') THEN
    -- Copiar valores de 'data' para 'metadata'
    UPDATE public.notifications 
    SET metadata = data 
    WHERE metadata = '{}'::jsonb AND data IS NOT NULL;
    
    -- Remover coluna antiga 'data'
    ALTER TABLE public.notifications DROP COLUMN IF EXISTS data;
  END IF;
END $$;

-- 5. Atualizar constraint de tipos de notificação
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type = ANY (ARRAY[
  'message'::text,
  'document_match'::text,
  'document_found'::text,
  'document_status_change'::text,
  'points_milestone'::text,
  'system'::text,
  'verification'::text
]));

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON public.notifications USING GIN (metadata);

-- 7. Verificar schema final
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- SUCESSO!
-- Schema de notificações atualizado
-- ============================================

