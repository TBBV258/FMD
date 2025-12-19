# Configuração Manual das Políticas RLS do Storage

Como não temos permissão para criar políticas via SQL no `storage.objects`, você precisa criar manualmente no Dashboard do Supabase.

## Passo a Passo

### 1. Acessar o Supabase Dashboard
1. Acesse https://supabase.com
2. Faça login e selecione seu projeto
3. Vá para **Storage** no menu lateral
4. Clique no bucket **`documents`**

### 2. Acessar a aba Policies
1. No bucket `documents`, clique na aba **Policies**
2. Você verá as políticas existentes

### 3. Deletar Políticas Antigas (se existirem)
Para cada política listada relacionada a `documents`, clique no menu (3 pontos) e selecione **Delete**:
- "Users can upload own documents"
- "Users can view own documents"
- "All users can view public documents"
- "Users can delete own documents"
- "Owner can upload own documents"
- "Owner can update own documents"
- "Owner can delete own documents"
- "Authenticated users can view documents"
- "Public can view documents"

### 4. Criar Novas Políticas

Clique em **New Policy** e crie as seguintes políticas uma por uma:

---

#### Política 1: Owner can upload own documents

**Configuração:**
- **Policy name:** `Owner can upload own documents`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated`
- **USING expression:** (deixe vazio)
- **WITH CHECK expression:** Cole o seguinte:

```sql
bucket_id = 'documents' 
AND (
  auth.uid()::text = (storage.foldername(name))[1]
  OR
  (
    array_length(storage.foldername(name), 1) > 0
    AND split_part((storage.foldername(name))[array_length(storage.foldername(name), 1)], '_', 1) = auth.uid()::text
  )
  OR
  auth.uid()::text = ANY(storage.foldername(name))
)
```

---

#### Política 2: Owner can update own documents

**Configuração:**
- **Policy name:** `Owner can update own documents`
- **Allowed operation:** `UPDATE`
- **Target roles:** `authenticated`
- **USING expression:** Cole o seguinte:

```sql
bucket_id = 'documents' 
AND (
  auth.uid()::text = (storage.foldername(name))[1]
  OR
  (
    array_length(storage.foldername(name), 1) > 0
    AND split_part((storage.foldername(name))[array_length(storage.foldername(name), 1)], '_', 1) = auth.uid()::text
  )
  OR
  auth.uid()::text = ANY(storage.foldername(name))
)
```

- **WITH CHECK expression:** Cole o mesmo código acima

---

#### Política 3: Owner can delete own documents

**Configuração:**
- **Policy name:** `Owner can delete own documents`
- **Allowed operation:** `DELETE`
- **Target roles:** `authenticated`
- **USING expression:** Cole o seguinte:

```sql
bucket_id = 'documents' 
AND (
  auth.uid()::text = (storage.foldername(name))[1]
  OR
  (
    array_length(storage.foldername(name), 1) > 0
    AND split_part((storage.foldername(name))[array_length(storage.foldername(name), 1)], '_', 1) = auth.uid()::text
  )
  OR
  auth.uid()::text = ANY(storage.foldername(name))
)
```

- **WITH CHECK expression:** (deixe vazio)

---

#### Política 4: Authenticated users can view documents

**Configuração:**
- **Policy name:** `Authenticated users can view documents`
- **Allowed operation:** `SELECT`
- **Target roles:** `authenticated`
- **USING expression:** Cole o seguinte:

```sql
bucket_id = 'documents'
```

- **WITH CHECK expression:** (deixe vazio)

---

#### Política 5: Public can view documents

**Configuração:**
- **Policy name:** `Public can view documents`
- **Allowed operation:** `SELECT`
- **Target roles:** `public`
- **USING expression:** Cole o seguinte:

```sql
bucket_id = 'documents'
```

- **WITH CHECK expression:** (deixe vazio)

---

## Verificação

Após criar todas as políticas, teste fazendo upload de um documento. O erro `new row violates row-level security policy` deve desaparecer.

## Nota Importante

Se você ainda tiver problemas, verifique:
1. Se o bucket `documents` está marcado como **Public** (deve estar)
2. Se o usuário está autenticado corretamente
3. Se o formato do path do arquivo está correto (deve ser `documents/userId_timestamp.ext` ou similar)

