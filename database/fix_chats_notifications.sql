-- ============================================
-- CORREÇÃO PARA CHATS E NOTIFICAÇÕES
-- VERSÃO CORRIGIDA - Adiciona colunas antes de usar
-- Execute no Supabase SQL Editor
-- ============================================

-- ============================================
-- PARTE 1: TABELA DE CHATS
-- ============================================

-- 1. CRIAR TABELA DE CHATS (se não existir)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADICIONAR COLUNA 'read' SE NÃO EXISTIR
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'chats' 
    AND column_name = 'read'
  ) THEN
    ALTER TABLE public.chats ADD COLUMN read BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna read adicionada em chats';
  ELSE
    RAISE NOTICE 'Coluna read já existe em chats';
  END IF;
END $$;

-- 3. ADICIONAR FOREIGN KEYS SE NÃO EXISTIREM
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
    RAISE NOTICE 'FK chats_document_id_fkey adicionada';
  END IF;

  -- FK para sender
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chats_sender_id_fkey'
  ) THEN
    ALTER TABLE public.chats 
    ADD CONSTRAINT chats_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK chats_sender_id_fkey adicionada';
  END IF;

  -- FK para receiver
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chats_receiver_id_fkey'
  ) THEN
    ALTER TABLE public.chats 
    ADD CONSTRAINT chats_receiver_id_fkey 
    FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK chats_receiver_id_fkey adicionada';
  END IF;
END $$;

-- ============================================
-- PARTE 2: TABELA DE NOTIFICAÇÕES
-- ============================================

-- 4. CRIAR TABELA DE NOTIFICAÇÕES (se não existir)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ADICIONAR COLUNAS QUE PODEM NÃO EXISTIR
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
    RAISE NOTICE 'Coluna read adicionada em notifications';
  ELSE
    RAISE NOTICE 'Coluna read já existe em notifications';
  END IF;

  -- Coluna 'data'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'data'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN data JSONB;
    RAISE NOTICE 'Coluna data adicionada em notifications';
  ELSE
    RAISE NOTICE 'Coluna data já existe em notifications';
  END IF;

  -- Coluna 'read_at'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'read_at'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN read_at TIMESTAMPTZ;
    RAISE NOTICE 'Coluna read_at adicionada em notifications';
  ELSE
    RAISE NOTICE 'Coluna read_at já existe em notifications';
  END IF;
END $$;

-- 6. ADICIONAR/ATUALIZAR CONSTRAINT DE TIPO
DO $$
BEGIN
  -- Drop constraint antiga se existir
  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  
  -- Adicionar constraint nova
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
  
  RAISE NOTICE 'Constraint notifications_type_check adicionada/atualizada';
END $$;

-- 7. ADICIONAR FK para user_id SE NÃO EXISTIR
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notifications_user_id_fkey'
  ) THEN
    ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK notifications_user_id_fkey adicionada';
  END IF;
END $$;

-- ============================================
-- PARTE 3: ÍNDICES PARA PERFORMANCE
-- ============================================

-- 8. CRIAR ÍNDICES PARA CHATS
CREATE INDEX IF NOT EXISTS idx_chats_document_id ON public.chats(document_id);
CREATE INDEX IF NOT EXISTS idx_chats_sender_id ON public.chats(sender_id);
CREATE INDEX IF NOT EXISTS idx_chats_receiver_id ON public.chats(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_read ON public.chats(read);

-- 9. CRIAR ÍNDICES PARA NOTIFICAÇÕES
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);

-- ============================================
-- PARTE 4: ROW LEVEL SECURITY (RLS)
-- ============================================

-- 10. HABILITAR RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 11. POLÍTICAS DE SEGURANÇA PARA CHATS
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

-- 12. POLÍTICAS DE SEGURANÇA PARA NOTIFICAÇÕES
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

-- 13. Habilitar publicação realtime (não gera erro se já existir)
DO $$
BEGIN
  -- Para chats
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
    RAISE NOTICE 'Tabela chats adicionada ao Realtime';
  EXCEPTION
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Tabela chats já está no Realtime';
    WHEN undefined_object THEN
      RAISE NOTICE 'Publication supabase_realtime não existe. Configure no Dashboard do Supabase.';
  END;

  -- Para notifications
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    RAISE NOTICE 'Tabela notifications adicionada ao Realtime';
  EXCEPTION
    WHEN duplicate_object THEN 
      RAISE NOTICE 'Tabela notifications já está no Realtime';
    WHEN undefined_object THEN
      RAISE NOTICE 'Publication supabase_realtime não existe. Configure no Dashboard do Supabase.';
  END;
END $$;

-- ============================================
-- PARTE 6: INSERIR NOTIFICAÇÕES DE TESTE
-- ============================================

-- 14. Inserir notificação de teste (somente se necessário)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Pegar o primeiro usuário para teste
  SELECT id INTO v_user_id
  FROM auth.users
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Verificar se já tem notificações de teste
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = v_user_id 
      AND type = 'system'
      AND title = 'Sistema Configurado!'
    ) THEN
      -- Inserir notificação de teste
      INSERT INTO public.notifications (user_id, type, title, message, data, read)
      VALUES (
        v_user_id,
        'system',
        'Sistema Configurado!',
        'Chats e notificações estão funcionando corretamente. ✅',
        '{"test": true, "configured_at": "' || NOW()::text || '"}'::jsonb,
        false
      );
      RAISE NOTICE 'Notificação de teste criada para usuário %', v_user_id;
    ELSE
      RAISE NOTICE 'Notificação de teste já existe';
    END IF;
  END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- ============================================
-- VERIFICAÇÕES FINAIS
-- ============================================

-- 15. Verificar estrutura das tabelas
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== ESTRUTURA DAS TABELAS ===';
END $$;

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('chats', 'notifications')
ORDER BY table_name, ordinal_position;

-- 16. Verificar se RLS está ativado
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== ROW LEVEL SECURITY ===';
END $$;

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('chats', 'notifications');

-- 17. Verificar políticas
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== POLÍTICAS DE SEGURANÇA ===';
END $$;

SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('chats', 'notifications')
ORDER BY tablename, policyname;

-- 18. Contar registros
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== CONTAGEM DE REGISTROS ===';
END $$;

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
-- MENSAGEM DE SUCESSO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '██████████████████████████████████████████████████';
  RAISE NOTICE '█                                                █';
  RAISE NOTICE '█  ✅ SCRIPT EXECUTADO COM SUCESSO!             █';
  RAISE NOTICE '█                                                █';
  RAISE NOTICE '█  Chats e Notificações configurados            █';
  RAISE NOTICE '█                                                █';
  RAISE NOTICE '██████████████████████████████████████████████████';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
  RAISE NOTICE '';
  RAISE NOTICE '1. HABILITAR REALTIME NO DASHBOARD:';
  RAISE NOTICE '   → Database > Replication';
  RAISE NOTICE '   → Ativar: chats, notifications';
  RAISE NOTICE '';
  RAISE NOTICE '2. TESTAR NO FRONTEND:';
  RAISE NOTICE '   → Enviar mensagem de chat';
  RAISE NOTICE '   → Verificar notificações em tempo real';
  RAISE NOTICE '';
  RAISE NOTICE '3. SE PROBLEMAS PERSISTIREM:';
  RAISE NOTICE '   → Verificar credenciais Supabase (.env)';
  RAISE NOTICE '   → Confirmar Replication no Dashboard';
  RAISE NOTICE '   → Verificar console do browser (F12)';
  RAISE NOTICE '';
END $$;
