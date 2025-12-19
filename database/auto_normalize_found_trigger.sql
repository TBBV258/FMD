-- ============================================
-- AUTO-NORMALIZAR DOCUMENTOS ENCONTRADOS
-- Trigger para marcar documentos do próprio user como "normal" quando ele marca como "found"
-- Execute no Supabase SQL Editor
-- ============================================

-- Criar função do trigger
CREATE OR REPLACE FUNCTION auto_normalize_found_documents()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário que está marcando como "found" é o dono do documento
  -- E o status mudou para "found"
  -- Então automaticamente muda para "normal" e is_public = false
  IF NEW.status = 'found' AND 
     OLD.status != 'found' AND 
     NEW.user_id = auth.uid() THEN
    
    -- Mudar status para normal e tornar privado
    NEW.status := 'normal';
    NEW.is_public := false;
    
    -- Log opcional (comentar se não quiser)
    RAISE NOTICE 'Documento % do user % automaticamente normalizado', NEW.id, NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger anterior se existir
DROP TRIGGER IF EXISTS trigger_auto_normalize_found ON public.documents;

-- Criar trigger
CREATE TRIGGER trigger_auto_normalize_found
BEFORE UPDATE OF status ON public.documents
FOR EACH ROW
EXECUTE FUNCTION auto_normalize_found_documents();

-- ============================================
-- TESTE DO TRIGGER
-- ============================================

-- 1. Verificar se o trigger está ativo
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_normalize_found';

-- 2. Testar o trigger (substitua USER_ID e DOC_ID pelos seus valores)
-- Marcar documento do próprio user como "found" deve virar "normal" automaticamente
-- UPDATE documents 
-- SET status = 'found' 
-- WHERE id = 'SEU_DOCUMENTO_ID' AND user_id = 'SEU_USER_ID';

-- Verificar resultado
-- SELECT id, title, status, is_public 
-- FROM documents 
-- WHERE id = 'SEU_DOCUMENTO_ID';
-- Deve mostrar status = 'normal' e is_public = false

-- ============================================
-- COMPORTAMENTO ESPERADO
-- ============================================

-- Cenário 1: Dono marca seu próprio documento como "found"
-- ANTES: status = 'lost', is_public = true
-- DEPOIS: status = 'normal', is_public = false (AUTOMÁTICO)

-- Cenário 2: Outra pessoa reporta ter encontrado (não é implementado ainda)
-- Isso seria feito via UI separada, não afeta este trigger

-- Cenário 3: Dono marca como "lost"
-- NORMAL: status = 'lost', is_public = true (sem alteração)

-- ============================================
-- SUCESSO!
-- Trigger instalado e funcionando
-- ============================================

