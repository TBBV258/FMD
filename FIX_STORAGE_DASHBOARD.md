# 🔧 Fix Final - Storage Policies (Dashboard)

## ✅ Problema Identificado

Você tem políticas `flreew_*` que são **muito restritivas** e bloqueiam uploads:
- ✅ Apenas para role `anon` (você está usando `authenticated`)
- ✅ Apenas arquivos JPG (você está fazendo upload de PNG)
- ✅ Apenas na pasta `public` (você está usando `documents/`)

**Não há nenhuma política que permita INSERT para `authenticated` no bucket `documents`!**

---

## 🎯 Solução: Criar Políticas Corretas no Dashboard

### Passo 1: Deletar Políticas Antigas

No Dashboard do Supabase:
1. **Storage** → bucket **`documents`** → aba **Policies**
2. **Delete** estas políticas (clique nos 3 pontinhos → Delete):
   - ❌ `Give anon users access to JPG images in folder flreew_0`
   - ❌ `Give anon users access to JPG images in folder flreew_1`
   - ❌ `Give anon users access to JPG images in folder flreew_2`
   - ❌ `Give anon users access to JPG images in folder flreew_3`
   - ❌ Qualquer outra política relacionada a `documents` que você tenha criado antes

---

### Passo 2: Criar Política de INSERT (Upload)

**Clique em "New Policy"** e configure:

- **Policy name:** `Authenticated users can upload documents`
- **Allowed operation:** `INSERT` ✅
- **Target roles:** Marque **`authenticated`** ✅
- **USING expression:** Deixe **vazio**
- **WITH CHECK expression:** Cole este código:

```sql
bucket_id = 'documents'
```

**Clique em Save**

---

### Passo 3: Criar Política de SELECT (Visualizar) - Authenticated

**Clique em "New Policy"** e configure:

- **Policy name:** `Authenticated users can view documents`
- **Allowed operation:** `SELECT` ✅
- **Target roles:** Marque **`authenticated`** ✅
- **USING expression:** Cole este código:

```sql
bucket_id = 'documents'
```

- **WITH CHECK expression:** Deixe **vazio**

**Clique em Save**

---

### Passo 4: Criar Política de SELECT (Visualizar) - Public

**Clique em "New Policy"** e configure:

- **Policy name:** `Public can view documents`
- **Allowed operation:** `SELECT` ✅
- **Target roles:** Marque **`public`** ✅
- **USING expression:** Cole este código:

```sql
bucket_id = 'documents'
```

- **WITH CHECK expression:** Deixe **vazio**

**Clique em Save**

---

## ✅ Verificação Final

Após criar as 3 políticas acima, você deve ter:

1. ✅ `Authenticated users can upload documents` (INSERT, authenticated)
2. ✅ `Authenticated users can view documents` (SELECT, authenticated)
3. ✅ `Public can view documents` (SELECT, public)

**E NÃO deve ter mais as políticas `flreew_*`**

---

## 🧪 Teste

1. Tente fazer upload de um documento no seu app
2. Deve funcionar agora! ✅

---

## 📝 Notas

- As políticas antigas `flreew_*` eram muito restritivas e não permitiam uploads de usuários autenticados
- A nova política permite que **qualquer usuário autenticado** faça upload no bucket `documents`
- Se quiser restringir por ownership depois, podemos adicionar verificações mais complexas, mas primeiro vamos fazer funcionar com esta versão simples

