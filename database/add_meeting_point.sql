-- ============================================
-- ADICIONAR PONTO DE ENCONTRO AOS DOCUMENTOS
-- Permite que usuários marquem um local de encontro para devolução
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. Adicionar coluna para ponto de encontro
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS meeting_point_metadata JSONB;

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN public.documents.meeting_point_metadata IS 
'Ponto de encontro opcional para devolução do documento. 
Formato: {"lat": -25.9655, "lng": 32.5832, "address": "Praça da Independência, Maputo"}';

-- 3. Criar índice GIN para busca eficiente
CREATE INDEX IF NOT EXISTS idx_documents_meeting_point 
ON public.documents USING GIN (meeting_point_metadata);

-- 4. Atualizar location_metadata para documentos existentes sem localização
-- (Opcional: apenas se quiser adicionar Maputo como localização padrão)
-- UPDATE public.documents
-- SET location_metadata = jsonb_build_object('lat', -25.9655, 'lng', 32.5832)
-- WHERE location_metadata IS NULL;

-- 5. Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'documents'
  AND column_name IN ('location_metadata', 'meeting_point_metadata');

-- ============================================
-- EXEMPLOS DE USO
-- ============================================

-- Inserir documento com localização e ponto de encontro
/*
INSERT INTO public.documents (
  user_id,
  title,
  type,
  status,
  location,
  location_metadata,
  meeting_point_metadata
) VALUES (
  'user-uuid-aqui',
  'Meu BI',
  'bi',
  'lost',
  'Perdido perto da Praça da Independência',
  '{"lat": -25.9655, "lng": 32.5832, "address": "Praça da Independência"}',
  '{"lat": -25.9664, "lng": 32.5731, "address": "Café Continental - Ponto de Encontro"}'
);
*/

-- Atualizar ponto de encontro em documento existente
/*
UPDATE public.documents
SET meeting_point_metadata = jsonb_build_object(
  'lat', -25.9664,
  'lng', 32.5731,
  'address', 'Café Continental - Centro de Maputo'
)
WHERE id = 'document-uuid-aqui';
*/

-- Buscar documentos próximos a um ponto
/*
SELECT 
  id,
  title,
  location,
  location_metadata->>'lat' as lat,
  location_metadata->>'lng' as lng,
  meeting_point_metadata->>'address' as ponto_encontro
FROM public.documents
WHERE location_metadata IS NOT NULL
  AND status = 'lost'
ORDER BY created_at DESC
LIMIT 10;
*/

-- ============================================
-- SUCESSO!
-- Agora documentos podem ter:
-- - location_metadata: Onde o documento foi perdido/encontrado
-- - meeting_point_metadata: Onde combinar para devolver (opcional)
-- ============================================

