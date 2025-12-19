-- ============================================
-- SISTEMA DE NOTIFICAÇÕES SMS
-- Versão: 0.5.0
-- Data: 2025-01-19
-- ============================================

-- 1. Criar tabela de notificações SMS
CREATE TABLE IF NOT EXISTS public.sms_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  phone TEXT NOT NULL, -- Número de telefone com código do país
  message TEXT NOT NULL, -- Mensagem SMS (máx 160 caracteres)
  notification_type TEXT NOT NULL, -- match, document_found, message, system
  related_id UUID, -- ID do documento/match/notificação relacionada
  status TEXT DEFAULT 'pending', -- pending, sent, failed, delivered
  provider TEXT DEFAULT 'movitel', -- movitel, vodacom, tmcel, twilio, vonage
  provider_response JSONB, -- Resposta da API do provedor
  cost_usd DECIMAL(10, 4), -- Custo em USD
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'delivered', 'cancelled')),
  CONSTRAINT valid_provider CHECK (provider IN ('movitel', 'vodacom', 'tmcel', 'twilio', 'vonage', 'africastalking')),
  CONSTRAINT message_length CHECK (LENGTH(message) <= 160)
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_sms_user_id ON public.sms_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_status ON public.sms_notifications(status);
CREATE INDEX IF NOT EXISTS idx_sms_created ON public.sms_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_phone ON public.sms_notifications(phone);

-- 3. Função para detectar operadora moçambicana
CREATE OR REPLACE FUNCTION public.detect_mozambique_provider(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove espaços e caracteres especiais
  phone := REGEXP_REPLACE(phone, '[^0-9+]', '', 'g');
  
  -- Movitel: +258 84, 85 (antigos: 81, 82, 83)
  IF phone ~ '^\+?258\s*8[1-5]' THEN
    RETURN 'movitel';
  END IF;
  
  -- Vodacom: +258 86, 87
  IF phone ~ '^\+?258\s*8[6-7]' THEN
    RETURN 'vodacom';
  END IF;
  
  -- TMcel: +258 82, 83 (novo: 88, 89)
  IF phone ~ '^\+?258\s*8[2-3,8-9]' THEN
    RETURN 'tmcel';
  END IF;
  
  -- Padrão: usar Movitel (maior operadora)
  RETURN 'movitel';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Função para formatar mensagem SMS curta
CREATE OR REPLACE FUNCTION public.format_sms_message(
  p_type TEXT,
  p_title TEXT,
  p_details TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_message TEXT;
BEGIN
  CASE p_type
    WHEN 'document_match' THEN
      v_message := 'FMD: Match encontrado! ' || LEFT(p_title, 80) || '. Veja: https://fmd.app';
    
    WHEN 'document_found' THEN
      v_message := 'FMD: Documento encontrado! ' || LEFT(p_title, 70) || '. Veja: https://fmd.app';
    
    WHEN 'message' THEN
      v_message := 'FMD: Nova mensagem sobre ' || LEFT(p_title, 60) || '. Abra o app.';
    
    WHEN 'verification' THEN
      v_message := 'FMD: Verificacao: ' || p_details || '. Valido por 10min.';
    
    WHEN 'status_change' THEN
      v_message := 'FMD: Status atualizado - ' || LEFT(p_title, 90) || '.';
    
    WHEN 'system' THEN
      v_message := 'FMD: ' || LEFT(p_title, 140) || '.';
    
    ELSE
      v_message := 'FMD: ' || LEFT(p_title, 140) || '.';
  END CASE;
  
  -- Garantir que não excede 160 caracteres
  RETURN LEFT(v_message, 160);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Função para enviar SMS (stub - será implementada com API real)
CREATE OR REPLACE FUNCTION public.send_sms(
  p_user_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_details TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_phone TEXT;
  v_message TEXT;
  v_provider TEXT;
  v_sms_id UUID;
  v_user_preferences JSONB;
BEGIN
  -- Buscar telefone do usuário
  SELECT phone, preferences INTO v_phone, v_user_preferences
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  -- Verificar se usuário tem telefone
  IF v_phone IS NULL OR v_phone = '' THEN
    RAISE NOTICE 'Usuário % não tem telefone cadastrado', p_user_id;
    RETURN NULL;
  END IF;
  
  -- Verificar se usuário quer receber SMS (se preferências existirem)
  IF v_user_preferences IS NOT NULL THEN
    IF (v_user_preferences->>'sms_notifications')::BOOLEAN = FALSE THEN
      RAISE NOTICE 'Usuário % desativou notificações SMS', p_user_id;
      RETURN NULL;
    END IF;
  END IF;
  
  -- Detectar operadora
  v_provider := public.detect_mozambique_provider(v_phone);
  
  -- Formatar mensagem
  v_message := public.format_sms_message(p_notification_type, p_title, p_details);
  
  -- Inserir registro de SMS
  INSERT INTO public.sms_notifications (
    user_id,
    phone,
    message,
    notification_type,
    related_id,
    status,
    provider
  )
  VALUES (
    p_user_id,
    v_phone,
    v_message,
    p_notification_type,
    p_related_id,
    'pending', -- Status inicial
    v_provider
  )
  RETURNING id INTO v_sms_id;
  
  -- Aqui você integraria com APIs reais:
  -- - Movitel: https://api.movitel.co.mz/sms
  -- - Vodacom: https://api.vodacom.co.mz/sms
  -- - Twilio: https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages
  -- - Africa's Talking: https://api.africastalking.com/version1/messaging
  
  RAISE NOTICE 'SMS % criado para % via %', v_sms_id, v_phone, v_provider;
  
  RETURN v_sms_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para enviar SMS em matches importantes
CREATE OR REPLACE FUNCTION public.trigger_sms_on_high_score_match()
RETURNS TRIGGER AS $$
DECLARE
  v_lost_doc RECORD;
  v_found_doc RECORD;
BEGIN
  -- Apenas para matches com score alto (>= 70%)
  IF NEW.match_score >= 70 AND NEW.status = 'pending' THEN
    -- Buscar documentos
    SELECT d.*, up.phone
    INTO v_lost_doc
    FROM public.documents d
    JOIN public.user_profiles up ON d.user_id = up.id
    WHERE d.id = NEW.lost_document_id;
    
    SELECT d.*, up.phone
    INTO v_found_doc
    FROM public.documents d
    JOIN public.user_profiles up ON d.user_id = up.id
    WHERE d.id = NEW.found_document_id;
    
    -- Enviar SMS para dono do documento perdido
    IF v_lost_doc.phone IS NOT NULL THEN
      PERFORM public.send_sms(
        v_lost_doc.user_id,
        'document_match',
        v_lost_doc.title || ' - ' || ROUND(NEW.match_score, 0) || '% match',
        NULL,
        NEW.id
      );
    END IF;
    
    -- Enviar SMS para quem encontrou (opcional, apenas se score >= 90%)
    IF NEW.match_score >= 90 AND v_found_doc.phone IS NOT NULL THEN
      PERFORM public.send_sms(
        v_found_doc.user_id,
        'document_match',
        v_found_doc.title || ' - ' || ROUND(NEW.match_score, 0) || '% match',
        NULL,
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar trigger
DROP TRIGGER IF EXISTS trg_sms_on_high_score_match ON public.document_matches;
CREATE TRIGGER trg_sms_on_high_score_match
AFTER INSERT ON public.document_matches
FOR EACH ROW
EXECUTE FUNCTION public.trigger_sms_on_high_score_match();

-- 8. RLS Policies
ALTER TABLE public.sms_notifications ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios SMS
DROP POLICY IF EXISTS "Users can view their own SMS" ON public.sms_notifications;
CREATE POLICY "Users can view their own SMS" ON public.sms_notifications
FOR SELECT USING (auth.uid() = user_id);

-- 9. Adicionar coluna de preferências ao user_profiles (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'preferences'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN preferences JSONB DEFAULT '{
      "sms_notifications": true,
      "email_notifications": true,
      "push_notifications": true,
      "sms_high_priority_only": true
    }'::jsonb;
    
    RAISE NOTICE 'Coluna preferences adicionada a user_profiles';
  END IF;
END $$;

-- 10. Função para atualizar preferências de SMS
CREATE OR REPLACE FUNCTION public.update_sms_preferences(
  p_user_id UUID,
  p_enabled BOOLEAN,
  p_high_priority_only BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.user_profiles
  SET preferences = COALESCE(preferences, '{}'::jsonb) ||
    jsonb_build_object(
      'sms_notifications', p_enabled,
      'sms_high_priority_only', p_high_priority_only
    )
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. View para estatísticas de SMS
CREATE OR REPLACE VIEW public.sms_stats AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  provider,
  status,
  COUNT(*) as total_sms,
  SUM(cost_usd) as total_cost,
  AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_delay_seconds
FROM public.sms_notifications
GROUP BY DATE_TRUNC('day', created_at), provider, status
ORDER BY date DESC, total_sms DESC;

-- 12. Comentários
COMMENT ON TABLE public.sms_notifications IS 'Armazena todas as notificações SMS enviadas';
COMMENT ON COLUMN public.sms_notifications.message IS 'Mensagem SMS (máx 160 caracteres)';
COMMENT ON COLUMN public.sms_notifications.provider IS 'Operadora/provedor SMS';
COMMENT ON FUNCTION public.detect_mozambique_provider IS 'Detecta operadora moçambicana pelo número';
COMMENT ON FUNCTION public.send_sms IS 'Cria e envia SMS para usuário';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de SMS instalado com sucesso!';
  RAISE NOTICE '📱 Suporte para Movitel, Vodacom, TMcel';
  RAISE NOTICE '🔔 SMS automático para matches >= 70%%';
  RAISE NOTICE '⚙️  Preferências de usuário configuráveis';
  RAISE NOTICE '📊 View de estatísticas criada';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  PRÓXIMO PASSO: Integrar APIs reais dos provedores';
  RAISE NOTICE '   - Movitel API: Contactar departamento comercial';
  RAISE NOTICE '   - Vodacom API: https://developer.vodacom.co.mz';
  RAISE NOTICE '   - Africa''s Talking: https://africastalking.com (recomendado)';
END $$;

