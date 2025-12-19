-- ============================================
-- CORREÇÃO PARA CHATS E NOTIFICAÇÕES V2
-- VERSÃO CORRIGIDA - Adiciona colunas antes de usar
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. VERIFICAR SE AS TABELAS EXISTEM
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('chats', 'notifications');

-- ============================================
-- PARTE 1: TABELA DE CHATS
-- ============================================

-- 2. CRIAR TABELA DE CHATS (se não existir)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ADICIONAR COLUNA 'read' SE NÃO EXISTIR
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'chats' 
    AND column_name = 'read'
  ) THEN
    ALTER TABLE public.chats ADD COLUMN read BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 4. ADICIONAR FOREIGN KEYS SE NÃO EXISTIREM
DO $$
BEGIN
  -- FK para documents
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chats_document_id_fkey'
  ) THEN
    ALTER TABLE public.chats 
    ADD CONSTRAINT chats_document_id_fkey 
    FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
  END IF;

  -- FK para sender
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chats_sender_id_fkey'
  ) THEN
    ALTER TABLE public.chats 
    ADD CONSTRAINT chats_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- FK para receiver
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chats_receiver_id_fkey'
  ) THEN
    ALTER TABLE public.chats 
    ADD CONSTRAINT chats_receiver_id_fkey 
    FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- PARTE 2: TABELA DE NOTIFICAÇÕES
-- ============================================

-- 5. CRIAR TABELA DE NOTIFICAÇÕES (se não existir)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ADICIONAR COLUNAS QUE PODEM NÃO EXISTIR
DO $$ 
BEGIN
  -- Coluna 'read'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'read'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN read BOOLEAN DEFAULT FALSE;
  END IF;

  -- Coluna 'data'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'data'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN data JSONB;
  END IF;

  -- Coluna 'read_at'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'read_at'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN read_at TIMESTAMPTZ;
  END IF;
END $$;

-- 7. ADICIONAR CONSTRAINT DE TIPO SE NÃO EXISTIR
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'notifications_type_check'
  ) THEN
    ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'message',
      'document_match',
      'document_found',
      'document_status_change',
      'points_milestone',
      'system',
      'verification'
    ));
  END IF;
END $$;

-- 8. ADICIONAR FK para user_id SE NÃO EXISTIR
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notifications_user_id_fkey'
  ) THEN
    ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- PARTE 3: ÍNDICES PARA PERFORMANCE
-- ============================================

-- 9. CRIAR ÍNDICES PARA CHATS
CREATE INDEX IF NOT EXISTS idx_chats_document_id ON public.chats(document_id);
CREATE INDEX IF NOT EXISTS idx_chats_sender_id ON public.chats(sender_id);
CREATE INDEX IF NOT EXISTS idx_chats_receiver_id ON public.chats(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_read ON public.chats(read);

-- 10. CRIAR ÍNDICES PARA NOTIFICAÇÕES
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);

-- ============================================
-- PARTE 4: ROW LEVEL SECURITY (RLS)
-- ============================================

-- 11. HABILITAR RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 12. POLÍTICAS DE SEGURANÇA PARA CHATS
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can insert chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their received chats" ON public.chats;

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

-- 13. POLÍTICAS DE SEGURANÇA PARA NOTIFICAÇÕES
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

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
WITH CHECK (true);

-- ============================================
-- PARTE 5: HABILITAR REALTIME
-- ============================================

-- 14. Habilitar publicação realtime
DO $$
BEGIN
  -- Para chats
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN
      RAISE NOTICE 'Publication supabase_realtime does not exist. Create it in Supabase Dashboard.';
  END;

  -- Para notifications
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN
      RAISE NOTICE 'Publication supabase_realtime does not exist. Create it in Supabase Dashboard.';
  END;
END $$;

-- ============================================
-- PARTE 6: INSERIR NOTIFICAÇÕES DE TESTE
-- ============================================

-- 15. Inserir notificação de teste (somente se a tabela estiver vazia)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.notifications) = 0 THEN
    INSERT INTO public.notifications (user_id, type, title, message, data, read)
    SELECT 
      id,
      'system',
      'Bem-vindo ao FMD!',
      'Sistema de notificações está funcionando corretamente.',
      '{"test": true, "welcome": true}'::jsonb,
      false
    FROM auth.users
    LIMIT 5; -- Inserir para os primeiros 5 usuários
  END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- 16. Verificar estrutura das tabelas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('chats', 'notifications')
ORDER BY table_name, ordinal_position;

-- 17. Verificar se RLS está ativado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('chats', 'notifications');

-- 18. Verificar políticas
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

-- 19. Contar registros
SELECT 
  'chats' as table_name,
  COUNT(*) as record_count
FROM public.chats
UNION ALL
SELECT 
  'notifications' as table_name,
  COUNT(*) as record_count
FROM public.notifications;

-- ============================================
-- INSTRUÇÕES FINAIS
-- ============================================

-- ✅ Script executado com sucesso!
-- 
-- PRÓXIMOS PASSOS:
-- 
-- 1. HABILITAR REALTIME NO DASHBOARD:
--    - Vá em: Database > Replication
--    - Ative as tabelas: chats, notifications
--
-- 2. TESTAR NO FRONTEND:
--    - Enviar mensagem de chat
--    - Ver se notificação aparece
--    - Verificar Realtime funcionando
--
-- 3. SE REALTIME NÃO FUNCIONAR:
--    - Verifique as credenciais do Supabase (.env)
--    - Confirme que as tabelas estão em Replication
--    - Verifique o console do browser (F12)
--
-- ============================================
-- FIM DO SCRIPT
-- ============================================

SELECT 
  '✅ SCRIPT EXECUTADO COM SUCESSO!' as status,
  'Chats e Notificações estão configurados' as message;

