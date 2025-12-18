# Configuração do Supabase Storage

## Erro 400 ao Fazer Upload

Se você está recebendo erro 400 ao fazer upload de documentos, é porque os buckets de storage não estão configurados corretamente no Supabase.

## Passo a Passo para Configurar

### 1. Acessar o Supabase Dashboard

1. Acesse https://supabase.com
2. Faça login no seu projeto
3. Vá para **Storage** no menu lateral

### 2. Criar o Bucket "documents"

1. Clique em **New bucket**
2. Configure:
   - **Name:** `documents`
   - **Public:** ✅ Ativado (para permitir acesso público às imagens)
   - **File size limit:** 50 MB
   - **Allowed MIME types:** `image/*, application/pdf`

3. Clique em **Create bucket**

### 3. Configurar Políticas de Acesso (RLS Policies)

No bucket `documents`, clique em **Policies** e adicione:

#### Política 1: Upload (INSERT)
```sql
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'documents'
);
```

#### Política 2: Leitura Pública (SELECT)
```sql
CREATE POLICY "Public can view documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');
```

#### Política 3: Deletar Próprios Arquivos (DELETE)
```sql
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'documents'
);
```

### 4. Criar o Bucket "profiles" (Para Fotos de Perfil)

1. Clique em **New bucket**
2. Configure:
   - **Name:** `profiles`
   - **Public:** ✅ Ativado
   - **File size limit:** 5 MB
   - **Allowed MIME types:** `image/*`

3. Adicione políticas similares:

```sql
-- Upload de avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
);

-- Leitura pública de avatares
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- Atualizar próprio avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profiles')
WITH CHECK (bucket_id = 'profiles');

-- Deletar próprio avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profiles');
```

## Verificar Configuração

Após configurar, teste:

1. **Upload de Documento:**
   - Vá para "Relatar Perda" ou "Relatar Encontrado"
   - Anexe uma imagem
   - Envie o formulário
   - Deve funcionar sem erro 400

2. **Upload de Foto de Perfil:**
   - Vá para Perfil
   - Clique no ícone da câmera
   - Escolha uma foto
   - Deve fazer upload sem erro 400

## Estrutura de Pastas

Os arquivos serão organizados assim:

```
documents/
├── documents/
│   ├── user-id_timestamp.jpg
│   ├── user-id_timestamp.pdf
│   └── ...
└── ...

profiles/
├── avatar_user-id_timestamp.jpg
└── ...
```

## Troubleshooting

### Erro: "Bucket not found"
- Verifique se o bucket foi criado com o nome exato: `documents` ou `profiles`

### Erro: "Policy violation"
- Verifique se as políticas RLS foram criadas corretamente
- Certifique-se de que o usuário está autenticado

### Erro: "File too large"
- Verifique o limite de tamanho do bucket
- Ajuste se necessário

### Erro de CORS
- Supabase Storage já vem configurado com CORS
- Se houver problemas, verifique no painel Storage > Configuration

## Comandos SQL Completos

Execute estes comandos no **SQL Editor** do Supabase para configurar tudo de uma vez:

```sql
-- Habilitar RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Políticas para bucket 'documents'
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Public can view documents"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'documents');

CREATE POLICY "Users can delete their documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents');

-- Políticas para bucket 'profiles'
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profiles');

CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profiles');

CREATE POLICY "Users can update avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profiles')
WITH CHECK (bucket_id = 'profiles');

CREATE POLICY "Users can delete avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profiles');
```

---

**Nota:** Após configurar os buckets e políticas, reinicie o servidor de desenvolvimento para garantir que as mudanças sejam refletidas.

