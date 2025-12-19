# Configuração RLS para Bucket Avatars

## Problema
Erro: `StorageApiError: new row violates row-level security policy` ao fazer upload de foto de perfil.

## Solução: Políticas RLS Super Simples

### Opção 1: Via SQL Editor (Recomendado)

1. Acesse o **Supabase Dashboard** → **SQL Editor**
2. Execute o arquivo `fix_avatars_rls_simple.sql`
3. Pronto! ✅

### Opção 2: Via Dashboard (Manual)

1. Acesse **Storage** → **avatars** → **Policies**
2. Delete todas as políticas antigas (se existirem)
3. Crie as seguintes políticas:

#### Política 1: INSERT (Upload)
- **Policy name:** `Authenticated users can upload avatars`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated` ✅
- **WITH CHECK expression:**
```sql
bucket_id = 'avatars'
```

#### Política 2: SELECT (Visualizar)
- **Policy name:** `Public can view avatars`
- **Allowed operation:** `SELECT`
- **Target roles:** `public` ✅
- **USING expression:**
```sql
bucket_id = 'avatars'
```

#### Política 3: UPDATE (Atualizar)
- **Policy name:** `Authenticated users can update avatars`
- **Allowed operation:** `UPDATE`
- **Target roles:** `authenticated` ✅
- **USING expression:**
```sql
bucket_id = 'avatars'
```
- **WITH CHECK expression:**
```sql
bucket_id = 'avatars'
```

#### Política 4: DELETE (Deletar)
- **Policy name:** `Authenticated users can delete avatars`
- **Allowed operation:** `DELETE`
- **Target roles:** `authenticated` ✅
- **USING expression:**
```sql
bucket_id = 'avatars'
```

## Verificação

Após aplicar as políticas, teste o upload de foto de perfil. Deve funcionar sem erros de RLS.

## Nota de Segurança

⚠️ **Atenção:** Estas políticas são muito permissivas - qualquer usuário autenticado pode fazer upload, atualizar ou deletar qualquer arquivo no bucket `avatars`.

Se quiser adicionar verificação de ownership depois, você pode refinar as políticas para verificar se o nome do arquivo contém o `user_id` do usuário autenticado.

Exemplo de política com ownership:
```sql
WITH CHECK (
  bucket_id = 'avatars' 
  AND name LIKE '%' || auth.uid()::text || '%'
)
```

