-- ============================================
-- SISTEMA DE MATCH AUTOMÁTICO DE DOCUMENTOS
-- Versão: 0.5.0
-- Data: 2025-01-19
-- ============================================

-- 1. Criar tabela de matches sugeridos
CREATE TABLE IF NOT EXISTS public.document_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lost_document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  found_document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  match_score DECIMAL(5, 2) NOT NULL, -- 0.00 to 100.00
  match_reasons JSONB DEFAULT '[]'::jsonb, -- Array of reasons why they match
  status TEXT DEFAULT 'pending', -- pending, confirmed, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que um par de documentos só seja matchado uma vez
  UNIQUE(lost_document_id, found_document_id),
  
  -- Garantir que o score está entre 0 e 100
  CONSTRAINT match_score_range CHECK (match_score >= 0 AND match_score <= 100),
  
  -- Garantir que status é válido
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'rejected'))
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_matches_lost_doc ON public.document_matches(lost_document_id);
CREATE INDEX IF NOT EXISTS idx_matches_found_doc ON public.document_matches(found_document_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON public.document_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.document_matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created ON public.document_matches(created_at DESC);

-- 3. Função para calcular similaridade de texto (Levenshtein simplificado)
CREATE OR REPLACE FUNCTION public.text_similarity(text1 TEXT, text2 TEXT)
RETURNS DECIMAL AS $$
DECLARE
  max_len INTEGER;
  distance INTEGER;
BEGIN
  -- Se ambos forem nulos ou vazios, retorna 0
  IF (text1 IS NULL OR text1 = '') AND (text2 IS NULL OR text2 = '') THEN
    RETURN 0;
  END IF;
  
  -- Se apenas um for nulo/vazio, retorna 0
  IF (text1 IS NULL OR text1 = '') OR (text2 IS NULL OR text2 = '') THEN
    RETURN 0;
  END IF;
  
  -- Converte para lowercase para comparação case-insensitive
  text1 := LOWER(text1);
  text2 := LOWER(text2);
  
  -- Se forem idênticos, retorna 100
  IF text1 = text2 THEN
    RETURN 100;
  END IF;
  
  -- Usa a função levenshtein se disponível (requer extensão fuzzystrmatch)
  -- Caso contrário, usa comparação básica
  BEGIN
    distance := levenshtein(text1, text2);
    max_len := GREATEST(LENGTH(text1), LENGTH(text2));
    
    IF max_len = 0 THEN
      RETURN 0;
    END IF;
    
    -- Retorna porcentagem de similaridade
    RETURN GREATEST(0, (1 - (distance::DECIMAL / max_len)) * 100);
  EXCEPTION
    WHEN undefined_function THEN
      -- Se levenshtein não estiver disponível, usa comparação simples
      IF text1 ILIKE '%' || text2 || '%' OR text2 ILIKE '%' || text1 || '%' THEN
        RETURN 50;
      ELSE
        RETURN 0;
      END IF;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Função para calcular distância geográfica (em km)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DECIMAL, lng1 DECIMAL,
  lat2 DECIMAL, lng2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371; -- Raio da Terra em km
  dlat DECIMAL;
  dlng DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Se qualquer coordenada for nula, retorna distância infinita
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN 999999;
  END IF;
  
  -- Converte graus para radianos
  dlat := RADIANS(lat2 - lat1);
  dlng := RADIANS(lng2 - lng1);
  
  -- Fórmula de Haversine
  a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlng/2) * SIN(dlng/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Função principal para encontrar matches
CREATE OR REPLACE FUNCTION public.find_document_matches(
  p_document_id UUID,
  p_min_score DECIMAL DEFAULT 30.0
)
RETURNS TABLE(
  match_id UUID,
  other_document_id UUID,
  match_score DECIMAL,
  match_reasons JSONB
) AS $$
DECLARE
  v_doc RECORD;
  v_other_doc RECORD;
  v_score DECIMAL := 0;
  v_reasons JSONB := '[]'::jsonb;
  v_title_similarity DECIMAL;
  v_description_similarity DECIMAL;
  v_location_similarity DECIMAL;
  v_distance DECIMAL;
BEGIN
  -- Buscar o documento de referência
  SELECT * INTO v_doc FROM public.documents WHERE id = p_document_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Encontrar documentos potenciais (status oposto)
  FOR v_other_doc IN
    SELECT *
    FROM public.documents
    WHERE id != p_document_id
      AND (
        (v_doc.status = 'lost' AND status = 'found') OR
        (v_doc.status = 'found' AND status = 'lost')
      )
      AND is_public = TRUE
      AND deleted_at IS NULL
  LOOP
    v_score := 0;
    v_reasons := '[]'::jsonb;
    
    -- 1. Comparar tipo de documento (peso: 30 pontos)
    IF v_doc.document_type = v_other_doc.document_type THEN
      v_score := v_score + 30;
      v_reasons := v_reasons || jsonb_build_object(
        'reason', 'same_document_type',
        'points', 30,
        'description', 'Mesmo tipo de documento: ' || v_doc.document_type
      );
    END IF;
    
    -- 2. Comparar título (peso: 25 pontos)
    v_title_similarity := public.text_similarity(v_doc.title, v_other_doc.title);
    IF v_title_similarity > 50 THEN
      v_score := v_score + (v_title_similarity * 0.25);
      v_reasons := v_reasons || jsonb_build_object(
        'reason', 'similar_title',
        'points', ROUND(v_title_similarity * 0.25, 2),
        'description', 'Títulos similares: ' || ROUND(v_title_similarity, 0) || '% de semelhança'
      );
    END IF;
    
    -- 3. Comparar descrição (peso: 20 pontos)
    IF v_doc.description IS NOT NULL AND v_other_doc.description IS NOT NULL THEN
      v_description_similarity := public.text_similarity(v_doc.description, v_other_doc.description);
      IF v_description_similarity > 40 THEN
        v_score := v_score + (v_description_similarity * 0.20);
        v_reasons := v_reasons || jsonb_build_object(
          'reason', 'similar_description',
          'points', ROUND(v_description_similarity * 0.20, 2),
          'description', 'Descrições similares: ' || ROUND(v_description_similarity, 0) || '% de semelhança'
        );
      END IF;
    END IF;
    
    -- 4. Comparar localização (peso: 25 pontos)
    IF v_doc.location_metadata IS NOT NULL AND v_other_doc.location_metadata IS NOT NULL THEN
      -- Calcular distância geográfica
      v_distance := public.calculate_distance(
        (v_doc.location_metadata->>'lat')::DECIMAL,
        (v_doc.location_metadata->>'lng')::DECIMAL,
        (v_other_doc.location_metadata->>'lat')::DECIMAL,
        (v_other_doc.location_metadata->>'lng')::DECIMAL
      );
      
      -- Pontos baseados na distância (0-5km = 25 pontos, 5-10km = 15, 10-20km = 5)
      IF v_distance <= 5 THEN
        v_score := v_score + 25;
        v_reasons := v_reasons || jsonb_build_object(
          'reason', 'very_close_location',
          'points', 25,
          'description', 'Localização muito próxima: ' || ROUND(v_distance, 2) || ' km'
        );
      ELSIF v_distance <= 10 THEN
        v_score := v_score + 15;
        v_reasons := v_reasons || jsonb_build_object(
          'reason', 'close_location',
          'points', 15,
          'description', 'Localização próxima: ' || ROUND(v_distance, 2) || ' km'
        );
      ELSIF v_distance <= 20 THEN
        v_score := v_score + 5;
        v_reasons := v_reasons || jsonb_build_object(
          'reason', 'nearby_location',
          'points', 5,
          'description', 'Localização na mesma região: ' || ROUND(v_distance, 2) || ' km'
        );
      END IF;
    ELSIF v_doc.location IS NOT NULL AND v_other_doc.location IS NOT NULL THEN
      -- Comparar texto da localização se não houver coordenadas
      v_location_similarity := public.text_similarity(v_doc.location, v_other_doc.location);
      IF v_location_similarity > 60 THEN
        v_score := v_score + (v_location_similarity * 0.25);
        v_reasons := v_reasons || jsonb_build_object(
          'reason', 'similar_location_text',
          'points', ROUND(v_location_similarity * 0.25, 2),
          'description', 'Localizações similares: ' || ROUND(v_location_similarity, 0) || '% de semelhança'
        );
      END IF;
    END IF;
    
    -- Se o score for maior que o mínimo, retornar o match
    IF v_score >= p_min_score THEN
      RETURN QUERY
      SELECT
        gen_random_uuid(),
        v_other_doc.id,
        ROUND(v_score, 2),
        v_reasons;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para criar matches automaticamente quando um documento é criado
CREATE OR REPLACE FUNCTION public.auto_create_matches()
RETURNS TRIGGER AS $$
DECLARE
  v_match RECORD;
BEGIN
  -- Apenas criar matches para documentos públicos
  IF NEW.is_public = TRUE AND NEW.status IN ('lost', 'found') THEN
    -- Encontrar matches e inseri-los na tabela
    FOR v_match IN
      SELECT * FROM public.find_document_matches(NEW.id, 30.0)
    LOOP
      INSERT INTO public.document_matches (
        lost_document_id,
        found_document_id,
        match_score,
        match_reasons,
        status
      )
      VALUES (
        CASE WHEN NEW.status = 'lost' THEN NEW.id ELSE v_match.other_document_id END,
        CASE WHEN NEW.status = 'found' THEN NEW.id ELSE v_match.other_document_id END,
        v_match.match_score,
        v_match.match_reasons,
        'pending'
      )
      ON CONFLICT (lost_document_id, found_document_id) DO UPDATE
      SET
        match_score = EXCLUDED.match_score,
        match_reasons = EXCLUDED.match_reasons,
        updated_at = NOW();
      
      -- Criar notificação para o dono do documento perdido
      IF NEW.status = 'found' THEN
        INSERT INTO public.notifications (user_id, type, title, message, data, read)
        SELECT
          d.user_id,
          'document_match',
          'Possível Match Encontrado! 🎯',
          'Encontramos um documento que pode ser o seu: ' || NEW.title || ' (Score: ' || ROUND(v_match.match_score, 0) || '%)',
          jsonb_build_object(
            'match_score', v_match.match_score,
            'found_document_id', NEW.id,
            'lost_document_id', v_match.other_document_id,
            'match_reasons', v_match.match_reasons
          ),
          false
        FROM public.documents d
        WHERE d.id = v_match.other_document_id;
      ELSE
        INSERT INTO public.notifications (user_id, type, title, message, data, read)
        SELECT
          d.user_id,
          'document_match',
          'Possível Match Encontrado! 🎯',
          'Seu documento perdido pode ter sido encontrado: ' || NEW.title || ' (Score: ' || ROUND(v_match.match_score, 0) || '%)',
          jsonb_build_object(
            'match_score', v_match.match_score,
            'lost_document_id', NEW.id,
            'found_document_id', v_match.other_document_id,
            'match_reasons', v_match.match_reasons
          ),
          false
        FROM public.documents d
        WHERE d.id = v_match.other_document_id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar trigger
DROP TRIGGER IF EXISTS trg_auto_create_matches ON public.documents;
CREATE TRIGGER trg_auto_create_matches
AFTER INSERT OR UPDATE OF status, is_public ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_matches();

-- 8. RLS Policies
ALTER TABLE public.document_matches ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver matches de seus próprios documentos
DROP POLICY IF EXISTS "Users can view their own matches" ON public.document_matches;
CREATE POLICY "Users can view their own matches" ON public.document_matches
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE (d.id = document_matches.lost_document_id OR d.id = document_matches.found_document_id)
      AND d.user_id = auth.uid()
  )
);

-- Usuários podem confirmar ou rejeitar matches de seus documentos
DROP POLICY IF EXISTS "Users can update their own matches" ON public.document_matches;
CREATE POLICY "Users can update their own matches" ON public.document_matches
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    WHERE (d.id = document_matches.lost_document_id OR d.id = document_matches.found_document_id)
      AND d.user_id = auth.uid()
  )
);

-- 9. Função para confirmar match
CREATE OR REPLACE FUNCTION public.confirm_match(p_match_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_match RECORD;
BEGIN
  -- Buscar o match
  SELECT * INTO v_match FROM public.document_matches WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Atualizar status do match
  UPDATE public.document_matches
  SET status = 'confirmed', updated_at = NOW()
  WHERE id = p_match_id;
  
  -- Criar notificação para ambos os usuários
  INSERT INTO public.notifications (user_id, type, title, message, data, read)
  SELECT
    d.user_id,
    'system',
    'Match Confirmado! ✅',
    'Um match foi confirmado! Entre em contato para combinar a devolução.',
    jsonb_build_object(
      'match_id', p_match_id,
      'lost_document_id', v_match.lost_document_id,
      'found_document_id', v_match.found_document_id
    ),
    false
  FROM public.documents d
  WHERE d.id = v_match.lost_document_id OR d.id = v_match.found_document_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Comentários para documentação
COMMENT ON TABLE public.document_matches IS 'Armazena matches automáticos entre documentos perdidos e encontrados';
COMMENT ON COLUMN public.document_matches.match_score IS 'Score de 0-100 indicando a probabilidade de match';
COMMENT ON COLUMN public.document_matches.match_reasons IS 'Array JSON com os motivos do match';
COMMENT ON FUNCTION public.find_document_matches IS 'Encontra matches potenciais para um documento';
COMMENT ON FUNCTION public.text_similarity IS 'Calcula similaridade entre dois textos (0-100)';
COMMENT ON FUNCTION public.calculate_distance IS 'Calcula distância em km entre duas coordenadas';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

RAISE NOTICE '✅ Sistema de Match Automático instalado com sucesso!';
RAISE NOTICE '📊 Tabela document_matches criada';
RAISE NOTICE '🤖 Funções de IA e matching configuradas';
RAISE NOTICE '🔔 Notificações automáticas habilitadas';
RAISE NOTICE '🎯 Trigger de auto-matching ativo';

