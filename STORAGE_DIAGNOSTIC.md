# Diagnóstico Completo - Storage RLS

## ⚠️ Problema Persistente

Mesmo com política super simples (`bucket_id = 'documents'`), o erro continua. Isso indica que pode haver:

1. **Políticas conflitantes** ainda ativas
2. **RLS não habilitado** corretamente no bucket
3. **Problema de configuração** do bucket
4. **Políticas antigas** não deletadas

---

## Passo 1: Verificar Políticas Existentes via SQL

Execute este SQL no **SQL Editor** do Supabase para ver TODAS as políticas do storage:

```sql
-- Ver TODAS as políticas do storage.objects
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;
```

**Me envie o resultado completo** para eu ver o que está ativo.

---

## Passo 2: Verificar Configuração do Bucket

Execute este SQL para ver a configuração do bucket:

```sql
-- Ver configuração do bucket documents
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at,
    updated_at
FROM storage.buckets
WHERE id = 'documents';
```

Verifique se:
- ✅ `public` está como `true`
- ✅ O bucket existe

---

## Passo 3: Verificar se RLS está Habilitado

```sql
-- Verificar se RLS está habilitado no storage.objects
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' 
  AND tablename = 'objects';
```

Deve retornar `rowsecurity = true`.

---

## Passo 4: Deletar TODAS as Políticas Manualmente

Se você não conseguir deletar pelo Dashboard, tente pelo SQL (pode dar erro de permissão, mas tente):

```sql
-- Listar políticas para deletar
SELECT 'DROP POLICY IF EXISTS "' || policyname || '" ON storage.objects;' as drop_command
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%document%';
```

Execute os comandos gerados (ou copie e cole manualmente).

---

## Passo 5: Criar Política ÚNICA e Simples

**No Dashboard**, crie APENAS esta política:

### Política de INSERT:

- **Policy name:** `Allow authenticated uploads`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated`
- **USING expression:** (vazio)
- **WITH CHECK expression:**

```sql
bucket_id = 'documents'
```

**IMPORTANTE:** 
- Certifique-se de que **não há outras políticas** de INSERT ativas
- Verifique se a política foi criada corretamente (deve aparecer na lista)

---

## Passo 6: Teste com Política Temporária SEM RLS

Se ainda não funcionar, tente **desabilitar temporariamente o RLS** para testar:

```sql
-- ⚠️ CUIDADO: Isso remove TODA a segurança do storage!
-- Use apenas para teste e reative depois!

ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Teste o upload.** Se funcionar, o problema é 100% nas políticas.

**Depois, reative o RLS:**

```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

---

## Passo 7: Verificar Logs Detalhados

No Supabase Dashboard:
1. Vá em **Logs** → **Postgres Logs**
2. Filtre por `storage` ou `documents`
3. Veja se há mensagens de erro mais detalhadas sobre qual política está falhando

---

## Possíveis Causas

### Causa 1: Política com nome diferente
Pode haver uma política com nome diferente que está bloqueando. Use o SQL do Passo 1 para encontrar.

### Causa 2: Bucket não está público
O bucket precisa estar marcado como `public = true` na tabela `storage.buckets`.

### Causa 3: Múltiplas políticas conflitantes
Se houver várias políticas de INSERT, todas precisam passar (são OR logic). Uma política restritiva pode estar bloqueando.

### Causa 4: Problema com o JWT
O JWT pode não estar sendo enviado corretamente. Verifique no log que `role: "authenticated"` está presente.

---

## Solução Alternativa: Usar Service Role Temporariamente

Se nada funcionar, você pode temporariamente usar a `service_role` key no frontend (⚠️ **NUNCA em produção!**):

```typescript
// ⚠️ APENAS PARA TESTE - NUNCA EM PRODUÇÃO!
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY // Esta key bypassa RLS
)
```

Se funcionar com service_role, confirma que o problema é 100% nas políticas RLS.

---

## Próximos Passos

1. Execute o SQL do **Passo 1** e me envie o resultado
2. Execute o SQL do **Passo 2** e confirme que `public = true`
3. Tente o **Passo 5** (criar política única)
4. Se não funcionar, tente o **Passo 6** (desabilitar RLS temporariamente)

Me envie os resultados para eu ajudar a identificar o problema exato.

