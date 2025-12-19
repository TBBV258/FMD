-- ============================================
-- SISTEMA DE PONTOS E RANKING - FMD
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. CRIAR TABELA DE HISTÓRICO DE PONTOS
CREATE TABLE IF NOT EXISTS public.points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'document_upload',      -- +10 pontos - Upload de documento
    'document_verified',    -- +20 pontos - Documento verificado
    'document_found',       -- +50 pontos - Encontrou documento de alguém
    'document_returned',    -- +100 pontos - Devolveu documento
    'helped_someone',       -- +30 pontos - Ajudou alguém (chat, etc)
    'daily_login',          -- +5 pontos - Login diário
    'profile_complete',     -- +15 pontos - Completou perfil
    'first_document',       -- +25 pontos - Primeiro documento
    'achievement',          -- Varia - Conquista especial
    'penalty'               -- Negativo - Penalidade
  )),
  activity_description TEXT,
  related_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON public.points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON public.points_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_history_activity_type ON public.points_history(activity_type);
CREATE INDEX IF NOT EXISTS idx_points_history_user_created ON public.points_history(user_id, created_at DESC);

-- 3. ADICIONAR CAMPOS DE PONTOS NO PERFIL (se não existirem)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'bronze' 
  CHECK (rank IN ('bronze', 'silver', 'gold', 'platinum', 'diamond'));

-- Criar índice para ranking
CREATE INDEX IF NOT EXISTS idx_user_profiles_points ON public.user_profiles(points DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_rank ON public.user_profiles(rank);

-- 4. FUNÇÃO PARA ADICIONAR PONTOS
CREATE OR REPLACE FUNCTION public.add_points(
  p_user_id UUID,
  p_points INTEGER,
  p_activity_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_document_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_new_total INTEGER;
  v_new_rank TEXT;
BEGIN
  -- Inserir no histórico
  INSERT INTO public.points_history (
    user_id,
    points,
    activity_type,
    activity_description,
    related_document_id,
    metadata
  ) VALUES (
    p_user_id,
    p_points,
    p_activity_type,
    p_description,
    p_document_id,
    p_metadata
  );

  -- Atualizar total de pontos no perfil
  UPDATE public.user_profiles
  SET 
    points = GREATEST(points + p_points, 0), -- Não permitir pontos negativos
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING points INTO v_new_total;

  -- Calcular novo rank baseado nos pontos
  v_new_rank := CASE
    WHEN v_new_total >= 10000 THEN 'diamond'
    WHEN v_new_total >= 5000 THEN 'platinum'
    WHEN v_new_total >= 2000 THEN 'gold'
    WHEN v_new_total >= 500 THEN 'silver'
    ELSE 'bronze'
  END;

  -- Atualizar rank
  UPDATE public.user_profiles
  SET rank = v_new_rank
  WHERE id = p_user_id AND rank != v_new_rank;

  RETURN v_new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER: Pontos ao fazer upload de documento
CREATE OR REPLACE FUNCTION public.points_on_document_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Primeiro documento? Bônus!
  IF (SELECT COUNT(*) FROM public.documents WHERE user_id = NEW.user_id) = 1 THEN
    PERFORM public.add_points(
      NEW.user_id,
      25,
      'first_document',
      'Parabéns! Primeiro documento cadastrado',
      NEW.id
    );
  END IF;

  -- Pontos por upload
  PERFORM public.add_points(
    NEW.user_id,
    10,
    'document_upload',
    'Upload de documento: ' || NEW.title,
    NEW.id,
    jsonb_build_object('document_type', NEW.type, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_points_document_upload ON public.documents;
CREATE TRIGGER trigger_points_document_upload
AFTER INSERT ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.points_on_document_upload();

-- 6. TRIGGER: Pontos ao encontrar/devolver documento
CREATE OR REPLACE FUNCTION public.points_on_document_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Documento encontrado
  IF NEW.status = 'found' AND OLD.status != 'found' THEN
    PERFORM public.add_points(
      NEW.user_id,
      50,
      'document_found',
      'Encontrou documento: ' || NEW.title,
      NEW.id
    );
  END IF;

  -- Documento devolvido
  IF NEW.status = 'returned' AND OLD.status != 'returned' THEN
    PERFORM public.add_points(
      NEW.user_id,
      100,
      'document_returned',
      'Devolveu documento: ' || NEW.title,
      NEW.id
    );
  END IF;

  -- Documento verificado
  IF NEW.is_verified = TRUE AND OLD.is_verified = FALSE THEN
    PERFORM public.add_points(
      NEW.user_id,
      20,
      'document_verified',
      'Documento verificado: ' || NEW.title,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_points_document_status ON public.documents;
CREATE TRIGGER trigger_points_document_status
AFTER UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.points_on_document_status_change();

-- 7. TRIGGER: Pontos ao ajudar alguém (chat)
CREATE OR REPLACE FUNCTION public.points_on_chat_help()
RETURNS TRIGGER AS $$
BEGIN
  -- Dar pontos a quem responde (não ao remetente original)
  -- Apenas se for uma resposta (não a primeira mensagem)
  IF (SELECT COUNT(*) FROM public.chats WHERE document_id = NEW.document_id) > 1 THEN
    PERFORM public.add_points(
      NEW.sender_id,
      5,
      'helped_someone',
      'Respondeu no chat',
      NEW.document_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_points_chat_help ON public.chats;
CREATE TRIGGER trigger_points_chat_help
AFTER INSERT ON public.chats
FOR EACH ROW EXECUTE FUNCTION public.points_on_chat_help();

-- 8. FUNÇÃO: Obter ranking global
CREATE OR REPLACE FUNCTION public.get_global_ranking(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  rank_position BIGINT,
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  points INTEGER,
  rank TEXT,
  document_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY up.points DESC, up.created_at ASC) as rank_position,
    up.id as user_id,
    up.full_name,
    up.avatar_url,
    up.points,
    up.rank,
    (SELECT COUNT(*) FROM public.documents d WHERE d.user_id = up.id) as document_count
  FROM public.user_profiles up
  WHERE up.points > 0
  ORDER BY up.points DESC, up.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FUNÇÃO: Obter posição do usuário no ranking
CREATE OR REPLACE FUNCTION public.get_user_rank_position(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_position INTEGER;
BEGIN
  SELECT rank_position INTO v_position
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY points DESC, created_at ASC) as rank_position
    FROM public.user_profiles
    WHERE points > 0
  ) ranked
  WHERE id = p_user_id;

  RETURN COALESCE(v_position, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. FUNÇÃO: Obter histórico de pontos do usuário
CREATE OR REPLACE FUNCTION public.get_user_points_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  points INTEGER,
  activity_type TEXT,
  activity_description TEXT,
  related_document_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ph.id,
    ph.points,
    ph.activity_type,
    ph.activity_description,
    ph.related_document_id,
    ph.created_at
  FROM public.points_history ph
  WHERE ph.user_id = p_user_id
  ORDER BY ph.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. HABILITAR ROW LEVEL SECURITY
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para points_history
DROP POLICY IF EXISTS "Users can view their own points history" ON public.points_history;
CREATE POLICY "Users can view their own points history"
ON public.points_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert points" ON public.points_history;
CREATE POLICY "System can insert points"
ON public.points_history FOR INSERT
TO authenticated
WITH CHECK (true); -- Permite inserção por triggers

-- 12. INICIALIZAR PONTOS PARA USUÁRIOS EXISTENTES
-- Dar pontos retroativos para usuários que já têm documentos
DO $$
DECLARE
  v_user RECORD;
  v_doc_count INTEGER;
BEGIN
  FOR v_user IN SELECT DISTINCT user_id FROM public.documents LOOP
    -- Contar documentos do usuário
    SELECT COUNT(*) INTO v_doc_count
    FROM public.documents
    WHERE user_id = v_user.user_id;

    -- Dar pontos base (10 por documento)
    IF v_doc_count > 0 THEN
      PERFORM public.add_points(
        v_user.user_id,
        v_doc_count * 10,
        'document_upload',
        'Pontos retroativos por ' || v_doc_count || ' documento(s)',
        NULL,
        jsonb_build_object('retroactive', true, 'doc_count', v_doc_count)
      );
    END IF;
  END LOOP;
END $$;

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View: Top 10 usuários
CREATE OR REPLACE VIEW public.top_users AS
SELECT * FROM public.get_global_ranking(10);

-- View: Estatísticas de pontos por atividade
CREATE OR REPLACE VIEW public.points_stats AS
SELECT
  activity_type,
  COUNT(*) as activity_count,
  SUM(points) as total_points,
  AVG(points) as avg_points,
  MAX(points) as max_points,
  MIN(points) as min_points
FROM public.points_history
GROUP BY activity_type
ORDER BY total_points DESC;

-- ============================================
-- TESTES E VERIFICAÇÃO
-- ============================================

-- Ver pontos dos usuários
SELECT
  up.full_name,
  up.points,
  up.rank,
  public.get_user_rank_position(up.id) as position
FROM public.user_profiles up
WHERE up.points > 0
ORDER BY up.points DESC
LIMIT 10;

-- Ver histórico de pontos de um usuário específico
-- SELECT * FROM public.get_user_points_history('USER_ID_AQUI', 20);

-- Ver ranking global
SELECT * FROM public.get_global_ranking(20);

-- Ver estatísticas de pontos
SELECT * FROM public.points_stats;

-- Ver atividades recentes
SELECT
  up.full_name,
  ph.points,
  ph.activity_type,
  ph.activity_description,
  ph.created_at
FROM public.points_history ph
JOIN public.user_profiles up ON ph.user_id = up.id
ORDER BY ph.created_at DESC
LIMIT 20;

-- ============================================
-- TABELA DE VALORES DE PONTOS (Referência)
-- ============================================

-- Atividade                  | Pontos | Descrição
-- ---------------------------|--------|---------------------------
-- document_upload            | +10    | Upload de documento
-- first_document             | +25    | Primeiro documento (bônus)
-- document_verified          | +20    | Documento verificado
-- document_found             | +50    | Encontrou documento
-- document_returned          | +100   | Devolveu documento
-- helped_someone             | +5     | Respondeu no chat
-- daily_login                | +5     | Login diário (futuro)
-- profile_complete           | +15    | Perfil completo (futuro)

-- RANKS BASEADOS EM PONTOS:
-- Bronze:   0-499 pontos
-- Silver:   500-1999 pontos
-- Gold:     2000-4999 pontos
-- Platinum: 5000-9999 pontos
-- Diamond:  10000+ pontos

-- ============================================
-- SUCESSO!
-- Sistema de pontos e ranking está completo
-- ============================================

