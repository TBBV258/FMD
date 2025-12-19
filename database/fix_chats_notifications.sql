-- ============================================
-- CORREÇÃO PARA CHATS E NOTIFICAÇÕES
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. VERIFICAR SE AS TABELAS EXISTEM
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('chats', 'notifications');

-- 2. CRIAR TABELA DE CHATS (se não existir)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CRIAR TABELA DE NOTIFICAÇÕES (se não existir)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'message',
    'document_match',
    'document_found',
    'document_status_change',
    'points_milestone',
    'system',
    'verification'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_chats_document_id ON public.chats(document_id);
CREATE INDEX IF NOT EXISTS idx_chats_sender_id ON public.chats(sender_id);
CREATE INDEX IF NOT EXISTS idx_chats_receiver_id ON public.chats(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS DE SEGURANÇA PARA CHATS
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can insert chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their received chats" ON public.chats;

-- Create new policies
CREATE POLICY "Users can view their own chats"
ON public.chats FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert chats"
ON public.chats FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received chats"
ON public.chats FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- 7. POLÍTICAS DE SEGURANÇA PARA NOTIFICAÇÕES
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create new policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true); -- Permite inserção por triggers

-- 8. HABILITAR REALTIME
-- No Supabase Dashboard:
-- 1. Vá em Database > Replication
-- 2. Ative as tabelas: chats, notifications
-- 3. Ou execute via SQL:

-- Habilitar publicação realtime para chats
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;

-- Habilitar publicação realtime para notifications  
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 9. INSERIR NOTIFICAÇÕES DE TESTE
-- Insira algumas notificações de teste para o usuário logado
INSERT INTO public.notifications (user_id, type, title, message, data, read)
VALUES 
(
  auth.uid(), -- substitua pelo ID do usuário se necessário
  'system',
  'Bem-vindo ao FMD!',
  'Sistema de notificações está funcionando corretamente.',
  '{"test": true}',
  false
),
(
  auth.uid(),
  'system',
  'Teste de Notificação',
  'Esta é uma notificação de teste. Você está recebendo notificações!',
  '{"test": true, "timestamp": "' || NOW()::text || '"}',
  false
);

-- 10. INSERIR CHAT DE TESTE (substitua os IDs)
-- Primeiro, encontre um documento para testar:
-- SELECT id, title, user_id FROM public.documents LIMIT 1;
-- 
-- Depois insira:
-- INSERT INTO public.chats (document_id, sender_id, receiver_id, message)
-- VALUES (
--   'DOCUMENT_ID_AQUI',
--   'USER_1_ID_AQUI',
--   'USER_2_ID_AQUI',
--   'Olá! Esta é uma mensagem de teste.'
-- );

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se os índices foram criados
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('chats', 'notifications')
ORDER BY tablename, indexname;

-- Verificar se RLS está ativado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('chats', 'notifications');

-- Verificar políticas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('chats', 'notifications')
ORDER BY tablename, policyname;

-- Contar notificações existentes
SELECT
  type,
  read,
  COUNT(*) as count
FROM public.notifications
GROUP BY type, read
ORDER BY type, read;

-- Contar chats existentes
SELECT
  document_id,
  COUNT(*) as message_count,
  MAX(created_at) as last_message
FROM public.chats
GROUP BY document_id
ORDER BY last_message DESC
LIMIT 10;

-- ============================================
-- SUCESSO!
-- Chats e Notificações devem estar funcionando agora
-- ============================================

-- NOTAS IMPORTANTES:
-- 1. Certifique-se de que Realtime está habilitado no Dashboard
-- 2. Verifique se as credenciais do Supabase estão corretas no .env
-- 3. Teste criando uma notificação/chat e veja se aparece em tempo real

