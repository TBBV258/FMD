-- ============================================
-- FMD - NOTIFICATION TRIGGERS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Atualizar tipos permitidos em notifications
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

-- ============================================
-- 2. TRIGGER: Notificar nova mensagem
-- ============================================
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar notificação para o receptor
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    NEW.receiver_id,
    'message',
    'Nova mensagem',
    'Você recebeu uma nova mensagem',
    jsonb_build_object(
      'chat_id', NEW.id,
      'document_id', NEW.document_id,
      'sender_id', NEW.sender_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.chats;
CREATE TRIGGER trigger_notify_new_message
AFTER INSERT ON public.chats
FOR EACH ROW
WHEN (NEW.message_type = 'text' OR NEW.message_type = 'image')
EXECUTE FUNCTION notify_new_message();

-- ============================================
-- 3. TRIGGER: Notificar mudança de status do documento
-- ============================================
CREATE OR REPLACE FUNCTION notify_document_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar apenas se status mudou de 'lost' para 'found' ou vice-versa
  IF (OLD.status != NEW.status) AND 
     (NEW.status = 'found' OR NEW.status = 'lost' OR NEW.status = 'matched') THEN
    
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.user_id,
      'document_status_change',
      'Status do documento atualizado',
      'Seu documento "' || NEW.title || '" mudou para: ' || NEW.status,
      jsonb_build_object(
        'document_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_document_status_change ON public.documents;
CREATE TRIGGER trigger_notify_document_status_change
AFTER UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION notify_document_status_change();

-- ============================================
-- 4. TRIGGER: Notificar verificação de documento
-- ============================================
CREATE OR REPLACE FUNCTION notify_document_verification()
RETURNS TRIGGER AS $$
DECLARE
  doc_record RECORD;
BEGIN
  -- Buscar informações do documento
  SELECT user_id, title INTO doc_record
  FROM public.documents
  WHERE id = NEW.document_id;
  
  -- Notificar o dono do documento
  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      doc_record.user_id,
      'verification',
      'Documento verificado',
      'Seu documento "' || doc_record.title || '" foi verificado com sucesso!',
      jsonb_build_object(
        'document_id', NEW.document_id,
        'verification_id', NEW.id
      )
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      doc_record.user_id,
      'verification',
      'Verificação rejeitada',
      'A verificação do seu documento "' || doc_record.title || '" foi rejeitada.',
      jsonb_build_object(
        'document_id', NEW.document_id,
        'verification_id', NEW.id,
        'notes', NEW.verification_notes
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_verification ON public.verification_requests;
CREATE TRIGGER trigger_notify_verification
AFTER UPDATE ON public.verification_requests
FOR EACH ROW
WHEN (OLD.status != NEW.status AND (NEW.status = 'approved' OR NEW.status = 'rejected'))
EXECUTE FUNCTION notify_document_verification();

-- ============================================
-- 5. TRIGGER: Notificar marcos de pontos
-- ============================================
CREATE OR REPLACE FUNCTION notify_points_milestone()
RETURNS TRIGGER AS $$
DECLARE
  milestone_reached TEXT;
  milestone_points INT;
BEGIN
  -- Verificar se atingiu um marco importante
  IF OLD.points < 100 AND NEW.points >= 100 THEN
    milestone_reached := 'Silver';
    milestone_points := 100;
  ELSIF OLD.points < 500 AND NEW.points >= 500 THEN
    milestone_reached := 'Gold';
    milestone_points := 500;
  ELSIF OLD.points < 1000 AND NEW.points >= 1000 THEN
    milestone_reached := 'Platinum';
    milestone_points := 1000;
  END IF;
  
  -- Criar notificação se atingiu um marco
  IF milestone_reached IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.id,
      'points_milestone',
      'Novo nível alcançado! 🎉',
      'Parabéns! Você atingiu o nível ' || milestone_reached || ' com ' || milestone_points || ' pontos!',
      jsonb_build_object(
        'rank', milestone_reached,
        'points', NEW.points
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_points_milestone ON public.user_profiles;
CREATE TRIGGER trigger_notify_points_milestone
AFTER UPDATE ON public.user_profiles
FOR EACH ROW
WHEN (OLD.points IS DISTINCT FROM NEW.points)
EXECUTE FUNCTION notify_points_milestone();

-- ============================================
-- 6. TRIGGER: Notificar match de documentos (opcional - requer lógica de matching)
-- ============================================
CREATE OR REPLACE FUNCTION notify_document_match()
RETURNS TRIGGER AS $$
DECLARE
  potential_match RECORD;
BEGIN
  -- Apenas para documentos perdidos
  IF NEW.status = 'lost' AND NEW.is_public = true THEN
    
    -- Buscar documentos encontrados similares (mesmo tipo e número)
    FOR potential_match IN 
      SELECT id, user_id, title, document_number
      FROM public.documents
      WHERE status = 'found'
        AND type = NEW.type
        AND document_number IS NOT NULL
        AND NEW.document_number IS NOT NULL
        AND document_number = NEW.document_number
        AND user_id != NEW.user_id
        AND is_public = true
      LIMIT 1
    LOOP
      -- Notificar o usuário que perdeu o documento
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        metadata
      ) VALUES (
        NEW.user_id,
        'document_match',
        'Possível match encontrado! 🎯',
        'Encontramos um documento que pode ser o seu: ' || potential_match.title,
        jsonb_build_object(
          'document_id', potential_match.id,
          'my_document_id', NEW.id
        )
      );
      
      -- Notificar quem encontrou o documento
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        metadata
      ) VALUES (
        potential_match.user_id,
        'document_match',
        'Possível dono encontrado! 🎯',
        'Alguém reportou perda de um documento similar ao que você encontrou',
        jsonb_build_object(
          'document_id', NEW.id,
          'my_document_id', potential_match.id
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_document_match ON public.documents;
CREATE TRIGGER trigger_notify_document_match
AFTER INSERT ON public.documents
FOR EACH ROW
EXECUTE FUNCTION notify_document_match();

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================
-- 1. Execute este script completo no Supabase SQL Editor
-- 2. Teste os triggers criando/atualizando registros
-- 3. Verifique as notificações na tabela 'notifications'
-- 4. Os triggers funcionarão automaticamente para todas as novas operações

