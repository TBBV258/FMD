# Fix Final das Políticas de Storage - Dashboard

## Problema Identificado

O código do frontend cria o path como:
```
documents/${userId}_${timestamp}.ext
```

Exemplo: `documents/862cb23f-e6e4-42bd-9ce1-017c641ec041_1766137702626.png`

A política RLS precisa verificar se o **nome do arquivo** (última parte do path) começa com o `userId_`.

---

## Solução: Criar Políticas no Dashboard

### 1. Acessar Storage Policies

1. Supabase Dashboard → **Storage**
2. Clique no bucket **`documents`**
3. Aba **Policies**

### 2. Deletar TODAS as políticas antigas relacionadas a `documents`

Delete todas as políticas que você criou antes (INSERT, SELECT, UPDATE, DELETE relacionadas a documents).

### 3. Criar as Novas Políticas (uma por uma)

---

#### ✅ Política 1: INSERT (Upload)

**Configuração:**
- **Policy name:** `Authenticated users can upload documents`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated` ✅
- **USING expression:** (deixe **vazio**)
- **WITH CHECK expression:** Cole este código:

```sql
bucket_id = 'documents' 
AND (
  -- Verifica se o primeiro folder é o userId (formato: userId/filename)
  auth.uid()::text = (storage.foldername(name))[1]
  OR
  -- Verifica se o nome do arquivo (último elemento) começa com userId_
  (
    array_length(storage.foldername(name), 1) > 0
    AND split_part(
      (storage.foldername(name))[array_length(storage.foldername(name), 1)], 
      '_', 
      1
    ) = auth.uid()::text
  )
  OR
  -- Verifica se algum folder no path é o userId
  auth.uid()::text = ANY(storage.foldername(name))
)
```

**Clique em Save**

---

#### ✅ Política 2: SELECT (Visualizar) - Authenticated

**Configuração:**
- **Policy name:** `Authenticated users can view documents`
- **Allowed operation:** `SELECT`
- **Target roles:** `authenticated` ✅
- **USING expression:** Cole este código:

```sql
bucket_id = 'documents'
```

- **WITH CHECK expression:** (deixe **vazio**)

**Clique em Save**

---

#### ✅ Política 3: SELECT (Visualizar) - Public

**Configuração:**
- **Policy name:** `Public can view documents`
- **Allowed operation:** `SELECT`
- **Target roles:** `public` ✅
- **USING expression:** Cole este código:

```sql
bucket_id = 'documents'
```

- **WITH CHECK expression:** (deixe **vazio**)

**Clique em Save**

---

#### ✅ Política 4: UPDATE (Opcional - se quiser permitir edição)

**Configuração:**
- **Policy name:** `Authenticated users can update documents`
- **Allowed operation:** `UPDATE`
- **Target roles:** `authenticated` ✅
- **USING expression:** Cole este código:

```sql
bucket_id = 'documents' 
AND (
  auth.uid()::text = (storage.foldername(name))[1]
  OR
  (
    array_length(storage.foldername(name), 1) > 0
    AND split_part(
      (storage.foldername(name))[array_length(storage.foldername(name), 1)], 
      '_', 
      1
    ) = auth.uid()::text
  )
  OR
  auth.uid()::text = ANY(storage.foldername(name))
)
```

- **WITH CHECK expression:** Cole o mesmo código acima

**Clique em Save**

---

#### ✅ Política 5: DELETE (Opcional - se quiser permitir deleção)

**Configuração:**
- **Policy name:** `Authenticated users can delete documents`
- **Allowed operation:** `DELETE`
- **Target roles:** `authenticated` ✅
- **USING expression:** Cole este código:

```sql
bucket_id = 'documents' 
AND (
  auth.uid()::text = (storage.foldername(name))[1]
  OR
  (
    array_length(storage.foldername(name), 1) > 0
    AND split_part(
      (storage.foldername(name))[array_length(storage.foldername(name), 1)], 
      '_', 
      1
    ) = auth.uid()::text
  )
  OR
  auth.uid()::text = ANY(storage.foldername(name))
)
```

- **WITH CHECK expression:** (deixe **vazio**)

**Clique em Save**

---

## Verificação

Após criar todas as políticas:

1. **Teste o upload** no seu app
2. Se ainda der erro, verifique:
   - Se o bucket `documents` está marcado como **Public** ✅
   - Se o usuário está autenticado corretamente
   - Se o formato do path está correto: `documents/userId_timestamp.ext`

---

## Debug: Verificar Path Real

Se ainda não funcionar, adicione este log temporário no código:

```typescript
// Em frontend/src/stores/documents.ts, linha ~147
filePath = `documents/${fileName}`
console.log('Upload path:', filePath) // DEBUG
console.log('User ID:', userId) // DEBUG
```

E verifique no console do navegador qual path está sendo usado.

