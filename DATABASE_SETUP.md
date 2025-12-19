# 🗄️ Configuração do Banco de Dados

## Instruções para executar as migrações no Supabase

### 📋 Passo a Passo:

1. **Acesse o Dashboard do Supabase**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione o projeto: `agqpfpzsxqbrqyjiqtiy`

2. **Abra o SQL Editor**
   - No menu lateral, clique em **"SQL Editor"**
   - Clique em **"New query"**

3. **Execute as Migrações**

   Copie e cole o SQL abaixo e clique em **"RUN"**:

---

### 🔧 Migração 1: Adicionar Novos Campos

```sql
-- 1. Adicionar novos tipos de notificação
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

-- 2. Adicionar campos em user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT 'bronze'
  CHECK (rank IN ('bronze', 'silver', 'gold', 'platinum'));

-- 3. Adicionar location_metadata em documents
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS location_metadata JSONB;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_documents_location ON public.documents USING GIN (location_metadata);
CREATE INDEX IF NOT EXISTS idx_user_profiles_rank ON public.user_profiles (rank);

-- 5. Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
  AND column_name IN ('delivery_address', 'rank');
```

---

### 🔔 Migração 2: Triggers de Notificações

```sql
-- Trigger 1: Notificação de nova mensagem de chat
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_id != NEW.receiver_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, action_url, metadata)
    VALUES (
      NEW.receiver_id,
      'message',
      'Nova Mensagem',
      'Você recebeu uma nova mensagem.',
      '/chat/' || NEW.document_id,
      jsonb_build_object('documentId', NEW.document_id, 'senderId', NEW.sender_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chat_message_notification ON public.chats;
CREATE TRIGGER chat_message_notification
AFTER INSERT ON public.chats
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- Trigger 2: Notificação de mudança de status de documento
CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO public.notifications (user_id, type, title, message, action_url, metadata)
    VALUES (
      NEW.user_id,
      'document_status_change',
      CASE 
        WHEN NEW.status = 'recovered' THEN 'Documento Recuperado!'
        WHEN NEW.status = 'matched' THEN 'Match Encontrado!'
        WHEN NEW.status = 'returned' THEN 'Documento Devolvido!'
        ELSE 'Status do Documento Atualizado'
      END,
      'Seu documento "' || NEW.title || '" mudou de status.',
      '/document/' || NEW.id,
      jsonb_build_object('documentId', NEW.id, 'oldStatus', OLD.status, 'newStatus', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS document_status_change_notification ON public.documents;
CREATE TRIGGER document_status_change_notification
AFTER UPDATE OF status ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.notify_status_change();

-- Trigger 3: Notificação de verificação de documento
CREATE OR REPLACE FUNCTION public.notify_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.notifications (user_id, type, title, message, action_url, metadata)
    VALUES (
      NEW.requested_by,
      'verification',
      'Documento Verificado!',
      'Seu documento foi verificado com sucesso.',
      '/document/' || NEW.document_id,
      jsonb_build_object('documentId', NEW.document_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS document_verification_notification ON public.verification_requests;
CREATE TRIGGER document_verification_notification
AFTER UPDATE OF status ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_verification();

-- Trigger 4: Notificação de marcos de pontos
CREATE OR REPLACE FUNCTION public.notify_points_milestone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.points >= 100 AND OLD.points < 100 THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (NEW.id, 'points_milestone', 'Novo Ranking!', 'Parabéns! Você alcançou o ranking Prata!', jsonb_build_object('rank', 'silver'));
  ELSIF NEW.points >= 500 AND OLD.points < 500 THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (NEW.id, 'points_milestone', 'Novo Ranking!', 'Incrível! Você alcançou o ranking Ouro!', jsonb_build_object('rank', 'gold'));
  ELSIF NEW.points >= 1000 AND OLD.points < 1000 THEN
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (NEW.id, 'points_milestone', 'Novo Ranking!', 'Lenda! Você alcançou o ranking Platina!', jsonb_build_object('rank', 'platinum'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS points_milestone_notification ON public.user_profiles;
CREATE TRIGGER points_milestone_notification
AFTER UPDATE OF points ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_points_milestone();
```

---

### ✅ Verificação

Após executar, verifique se tudo está OK:

```sql
-- Verificar colunas adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('delivery_address', 'rank');

-- Verificar triggers criados
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

---

## ⚠️ Importante

- Execute as migrações **uma vez** no ambiente de produção
- Faça backup do banco antes de executar
- Se houver erros, verifique os logs no Supabase Dashboard

---

## 🔄 Row-Level Security (RLS)

Certifique-se de que as políticas RLS estão configuradas:

```sql
-- Permitir usuários atualizarem seus próprios perfis
CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE USING (auth.uid() = id);

-- Permitir usuários lerem notificações próprias
CREATE POLICY "Users can read own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);
```

---

## 📞 Suporte

Se houver problemas, verifique:
- Dashboard do Supabase → Logs
- Console do navegador (F12)
- Arquivo `frontend/src/api/supabase.ts`

