-- ============================================
-- FMD - DATABASE MIGRATIONS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Adicionar coluna delivery_address em user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- 2. Adicionar coluna rank em user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'bronze' 
CHECK (rank IN ('bronze', 'silver', 'gold', 'platinum'));

-- 3. Atualizar ranks existentes baseado em pontos
UPDATE public.user_profiles 
SET rank = CASE 
  WHEN points >= 1000 THEN 'platinum'
  WHEN points >= 500 THEN 'gold'
  WHEN points >= 100 THEN 'silver'
  ELSE 'bronze'
END
WHERE rank IS NULL OR rank = 'bronze';

-- 4. Adicionar location_metadata em documents para armazenar coordenadas
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS location_metadata JSONB;

-- 5. Criar índice para melhor performance em buscas por localização
CREATE INDEX IF NOT EXISTS idx_documents_location_metadata 
ON public.documents USING gin (location_metadata);

-- 6. Comentários para documentação
COMMENT ON COLUMN public.user_profiles.delivery_address IS 'Endereço para entrega de documentos recuperados';
COMMENT ON COLUMN public.user_profiles.rank IS 'Ranking do usuário baseado em pontos (bronze, silver, gold, platinum)';
COMMENT ON COLUMN public.documents.location_metadata IS 'Metadados de localização em formato JSON: {lat, lng, address}';

-- 7. Função para atualizar rank automaticamente ao atualizar pontos
CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rank := CASE 
    WHEN NEW.points >= 1000 THEN 'platinum'
    WHEN NEW.points >= 500 THEN 'gold'
    WHEN NEW.points >= 100 THEN 'silver'
    ELSE 'bronze'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_rank ON public.user_profiles;
CREATE TRIGGER trigger_update_user_rank
BEFORE UPDATE OF points ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_rank();

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================
-- 1. Execute este script completo no Supabase SQL Editor
-- 2. Verifique se as colunas foram adicionadas corretamente
-- 3. Os ranks serão atualizados automaticamente quando os pontos mudarem

