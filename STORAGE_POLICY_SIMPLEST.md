# Política SUPER SIMPLES - Teste Primeiro

## ⚠️ IMPORTANTE: Teste esta versão PRIMEIRO

Esta é a versão **mais simples possível** para testar se o problema é a lógica da política ou algo else.

---

## Passo a Passo no Dashboard

### 1. Deletar TODAS as políticas antigas do bucket `documents`

### 2. Criar APENAS esta política (INSERT):

**Configuração:**
- **Policy name:** `Test upload - any authenticated user`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated` ✅
- **USING expression:** (vazio)
- **WITH CHECK expression:**

```sql
bucket_id = 'documents'
```

**Salvar e testar o upload.**

---

## Se funcionar:

Significa que o problema era a lógica complexa. Aí você pode adicionar as outras políticas (SELECT, UPDATE, DELETE) e depois refinar a política de INSERT para verificar ownership.

---

## Se NÃO funcionar:

Significa que há outro problema (permissões do bucket, RLS não habilitado, etc). Nesse caso:

1. Verifique se o bucket `documents` está marcado como **Public** ✅
2. Verifique se RLS está habilitado no bucket (deve estar por padrão)
3. Verifique se o usuário está realmente autenticado (role `authenticated` no JWT)

---

## Depois que funcionar, adicione as outras políticas:

### SELECT - Authenticated:
```sql
bucket_id = 'documents'
```

### SELECT - Public:
```sql
bucket_id = 'documents'
```

### UPDATE (opcional):
```sql
bucket_id = 'documents'
```

### DELETE (opcional):
```sql
bucket_id = 'documents'
```

Todas com a mesma lógica simples: apenas verificar `bucket_id = 'documents'`.

