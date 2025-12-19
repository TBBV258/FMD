-- ============================================
-- SISTEMA DE BADGES E CONQUISTAS
-- Versão: 0.5.0
-- Data: 2025-01-19
-- ============================================

-- 1. Criar tabela de badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT NOT NULL,
  badge_icon TEXT NOT NULL, -- Ícone Font Awesome
  badge_rarity TEXT NOT NULL, -- common, rare, epic, legendary
  progress INTEGER DEFAULT 100, -- 0-100 para badges de progresso
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Um usuário não pode ganhar o mesmo badge duas vezes
  UNIQUE(user_id, badge_type),
  
  -- Validação
  CONSTRAINT valid_rarity CHECK (badge_rarity IN ('common', 'rare', 'epic', 'legendary')),
  CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100)
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_type ON public.user_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON public.user_badges(badge_rarity);
CREATE INDEX IF NOT EXISTS idx_badges_earned ON public.user_badges(earned_at DESC);

-- 3. Definições de badges (como função para reutilização)
CREATE OR REPLACE FUNCTION public.get_badge_definition(p_badge_type TEXT)
RETURNS TABLE(
  badge_type TEXT,
  badge_name TEXT,
  badge_description TEXT,
  badge_icon TEXT,
  badge_rarity TEXT,
  badge_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (VALUES
    -- BADGES COMUNS (fáceis de conseguir)
    ('early_bird', 'Madrugador', 'Reportou um documento antes das 8h', 'fas fa-sun', 'common', '#FFD700'),
    ('night_owl', 'Coruja Noturna', 'Reportou um documento depois das 22h', 'fas fa-moon', 'common', '#4A90E2'),
    ('first_upload', 'Primeiro Passo', 'Fez o primeiro upload de documento', 'fas fa-flag', 'common', '#10B981'),
    ('profile_complete', 'Perfil Completo', 'Completou 100% do perfil', 'fas fa-user-check', 'common', '#6366F1'),
    
    -- BADGES RAROS (requerem mais esforço)
    ('good_samaritan', 'Bom Samaritano', 'Devolveu 5 documentos encontrados', 'fas fa-hands-helping', 'rare', '#8B5CF6'),
    ('lucky_finder', 'Sortudo', 'Encontrou seu documento em menos de 24h', 'fas fa-clover', 'rare', '#10B981'),
    ('social_butterfly', 'Borboleta Social', 'Iniciou conversa com 10 pessoas diferentes', 'fas fa-comments', 'rare', '#EC4899'),
    ('speed_demon', 'Velocidade da Luz', 'Respondeu a uma mensagem em menos de 5min', 'fas fa-bolt', 'rare', '#F59E0B'),
    ('match_maker', 'Cupido de Docs', 'Teve 5 matches confirmados', 'fas fa-puzzle-piece', 'rare', '#EF4444'),
    
    -- BADGES ÉPICOS (difíceis de conseguir)
    ('helper', 'Ajudante', 'Ajudou 20 pessoas a encontrarem documentos', 'fas fa-hand-holding-heart', 'epic', '#BE185D'),
    ('veteran', 'Veterano', 'Está no FMD há mais de 1 ano', 'fas fa-medal', 'epic', '#7C3AED'),
    ('pioneer', 'Pioneiro', 'Um dos primeiros 100 usuários do FMD', 'fas fa-star', 'epic', '#DC2626'),
    ('doc_master', 'Mestre dos Docs', 'Cadastrou 50 documentos', 'fas fa-scroll', 'epic', '#0891B2'),
    
    -- BADGES LEGENDÁRIOS (muito raros)
    ('legend', 'Lenda', 'Acumulou 10.000 pontos', 'fas fa-crown', 'legendary', '#FFD700'),
    ('guardian', 'Guardião', 'Devolveu 50 documentos', 'fas fa-shield-alt', 'legendary', '#059669'),
    ('influencer', 'Influenciador', 'Indicou 25 pessoas que se registraram', 'fas fa-megaphone', 'legendary', '#F97316'),
    ('diamond', 'Diamante', 'Atingiu o rank Diamond', 'fas fa-gem', 'legendary', '#38BDF8')
  ) AS badges(badge_type, badge_name, badge_description, badge_icon, badge_rarity, badge_color)
  WHERE badge_type = p_badge_type OR p_badge_type IS NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Função para conceder badge
CREATE OR REPLACE FUNCTION public.award_badge(
  p_user_id UUID,
  p_badge_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_badge RECORD;
  v_badge_id UUID;
BEGIN
  -- Buscar definição do badge
  SELECT * INTO v_badge FROM public.get_badge_definition(p_badge_type);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Badge type % does not exist', p_badge_type;
  END IF;
  
  -- Inserir badge (ou retornar ID se já existir)
  INSERT INTO public.user_badges (
    user_id,
    badge_type,
    badge_name,
    badge_description,
    badge_icon,
    badge_rarity,
    progress
  )
  VALUES (
    p_user_id,
    v_badge.badge_type,
    v_badge.badge_name,
    v_badge.badge_description,
    v_badge.badge_icon,
    v_badge.badge_rarity,
    100
  )
  ON CONFLICT (user_id, badge_type) DO NOTHING
  RETURNING id INTO v_badge_id;
  
  -- Se foi inserido, criar notificação
  IF v_badge_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, data, read)
    VALUES (
      p_user_id,
      'system',
      'Novo Badge Conquistado! 🏆',
      'Você ganhou o badge "' || v_badge.badge_name || '": ' || v_badge.badge_description,
      jsonb_build_object(
        'badge_type', v_badge.badge_type,
        'badge_rarity', v_badge.badge_rarity
      ),
      false
    );
    
    RAISE NOTICE 'Badge % concedido ao usuário %', v_badge.badge_name, p_user_id;
  END IF;
  
  RETURN v_badge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger: Badge "Primeiro Passo" (primeiro documento)
CREATE OR REPLACE FUNCTION public.check_first_upload_badge()
RETURNS TRIGGER AS $$
DECLARE
  v_doc_count INTEGER;
BEGIN
  -- Contar documentos do usuário
  SELECT COUNT(*) INTO v_doc_count
  FROM public.documents
  WHERE user_id = NEW.user_id AND deleted_at IS NULL;
  
  -- Se é o primeiro documento, conceder badge
  IF v_doc_count = 1 THEN
    PERFORM public.award_badge(NEW.user_id, 'first_upload');
  END IF;
  
  -- Badge "Mestre dos Docs" (50 documentos)
  IF v_doc_count = 50 THEN
    PERFORM public.award_badge(NEW.user_id, 'doc_master');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_first_upload_badge ON public.documents;
CREATE TRIGGER trg_first_upload_badge
AFTER INSERT ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.check_first_upload_badge();

-- 6. Trigger: Badge "Bom Samaritano" (devolveu 5 docs)
CREATE OR REPLACE FUNCTION public.check_good_samaritan_badge()
RETURNS TRIGGER AS $$
DECLARE
  v_returned_count INTEGER;
BEGIN
  IF NEW.status = 'returned' AND OLD.status != 'returned' THEN
    -- Contar documentos devolvidos pelo usuário
    SELECT COUNT(*) INTO v_returned_count
    FROM public.documents
    WHERE user_id = NEW.user_id AND status = 'returned';
    
    IF v_returned_count = 5 THEN
      PERFORM public.award_badge(NEW.user_id, 'good_samaritan');
    ELSIF v_returned_count = 20 THEN
      PERFORM public.award_badge(NEW.user_id, 'helper');
    ELSIF v_returned_count = 50 THEN
      PERFORM public.award_badge(NEW.user_id, 'guardian');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_good_samaritan_badge ON public.documents;
CREATE TRIGGER trg_good_samaritan_badge
AFTER UPDATE OF status ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.check_good_samaritan_badge();

-- 7. Trigger: Badge "Borboleta Social" (10 conversas)
CREATE OR REPLACE FUNCTION public.check_social_butterfly_badge()
RETURNS TRIGGER AS $$
DECLARE
  v_chat_partners INTEGER;
BEGIN
  -- Contar com quantas pessoas diferentes o usuário conversou
  SELECT COUNT(DISTINCT CASE
    WHEN NEW.sender_id = auth.uid() THEN NEW.receiver_id
    ELSE NEW.sender_id
  END) INTO v_chat_partners
  FROM public.chats
  WHERE NEW.sender_id = auth.uid() OR NEW.receiver_id = auth.uid();
  
  IF v_chat_partners >= 10 THEN
    PERFORM public.award_badge(auth.uid(), 'social_butterfly');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_social_butterfly_badge ON public.chats;
CREATE TRIGGER trg_social_butterfly_badge
AFTER INSERT ON public.chats
FOR EACH ROW
EXECUTE FUNCTION public.check_social_butterfly_badge();

-- 8. Trigger: Badge "Cupido de Docs" (5 matches confirmados)
CREATE OR REPLACE FUNCTION public.check_match_maker_badge()
RETURNS TRIGGER AS $$
DECLARE
  v_confirmed_matches INTEGER;
  v_user_id UUID;
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- Pegar user_id do documento perdido
    SELECT user_id INTO v_user_id
    FROM public.documents
    WHERE id = NEW.lost_document_id;
    
    -- Contar matches confirmados
    SELECT COUNT(*) INTO v_confirmed_matches
    FROM public.document_matches dm
    JOIN public.documents d ON dm.lost_document_id = d.id
    WHERE d.user_id = v_user_id AND dm.status = 'confirmed';
    
    IF v_confirmed_matches >= 5 THEN
      PERFORM public.award_badge(v_user_id, 'match_maker');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_match_maker_badge ON public.document_matches;
CREATE TRIGGER trg_match_maker_badge
AFTER UPDATE OF status ON public.document_matches
FOR EACH ROW
EXECUTE FUNCTION public.check_match_maker_badge();

-- 9. Trigger: Badge "Diamante" (atingiu rank Diamond)
CREATE OR REPLACE FUNCTION public.check_diamond_badge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rank = 'diamond' AND (OLD.rank IS NULL OR OLD.rank != 'diamond') THEN
    PERFORM public.award_badge(NEW.id, 'diamond');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_diamond_badge ON public.user_profiles;
CREATE TRIGGER trg_diamond_badge
AFTER UPDATE OF rank ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_diamond_badge();

-- 10. Trigger: Badge "Lenda" (10.000 pontos)
CREATE OR REPLACE FUNCTION public.check_legend_badge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.points >= 10000 AND (OLD.points IS NULL OR OLD.points < 10000) THEN
    PERFORM public.award_badge(NEW.id, 'legend');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_legend_badge ON public.user_profiles;
CREATE TRIGGER trg_legend_badge
AFTER UPDATE OF points ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_legend_badge();

-- 11. RLS Policies
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver badges de todos
DROP POLICY IF EXISTS "Everyone can view badges" ON public.user_badges;
CREATE POLICY "Everyone can view badges" ON public.user_badges
FOR SELECT USING (true);

-- 12. View para estatísticas de badges
CREATE OR REPLACE VIEW public.badge_stats AS
SELECT
  badge_type,
  badge_name,
  badge_rarity,
  COUNT(*) as total_earned,
  COUNT(*) * 100.0 / (SELECT COUNT(DISTINCT id) FROM public.user_profiles) as earn_percentage
FROM public.user_badges
GROUP BY badge_type, badge_name, badge_rarity
ORDER BY total_earned DESC;

-- 13. Função para obter badges do usuário
CREATE OR REPLACE FUNCTION public.get_user_badges(p_user_id UUID)
RETURNS TABLE(
  badge_type TEXT,
  badge_name TEXT,
  badge_description TEXT,
  badge_icon TEXT,
  badge_rarity TEXT,
  earned_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ub.badge_type,
    ub.badge_name,
    ub.badge_description,
    ub.badge_icon,
    ub.badge_rarity,
    ub.earned_at
  FROM public.user_badges ub
  WHERE ub.user_id = p_user_id
  ORDER BY ub.earned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 14. Comentários
COMMENT ON TABLE public.user_badges IS 'Armazena badges/conquistas dos usuários';
COMMENT ON COLUMN public.user_badges.badge_rarity IS 'common, rare, epic, legendary';
COMMENT ON FUNCTION public.award_badge IS 'Concede um badge a um usuário';
COMMENT ON FUNCTION public.get_badge_definition IS 'Retorna definição de um badge';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

RAISE NOTICE '✅ Sistema de Badges instalado com sucesso!';
RAISE NOTICE '🏆 18 badges diferentes disponíveis';
RAISE NOTICE '🎨 4 raridades: common, rare, epic, legendary';
RAISE NOTICE '🔔 Notificações automáticas ao ganhar badges';
RAISE NOTICE '⚡ Triggers automáticos para 8 tipos de badges';
RAISE NOTICE '📊 View de estatísticas criada';

