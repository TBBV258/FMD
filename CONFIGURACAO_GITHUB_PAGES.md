# ⚙️ Configuração do GitHub Pages - Branch Main

## Passo a Passo para Configurar

### 1. No GitHub, vá em Settings → Pages

### 2. Em "Build and deployment", configure:

- **Source**: "Deploy from a branch"
- **Branch**: `main`
- **Folder**: `/docs` ⚠️ **IMPORTANTE: Deve ser `/docs`, não `/ (root)`**

### 3. Clique em "Save"

## ✅ Como Funciona Agora

1. O workflow faz build do frontend Vue
2. Copia os arquivos para a pasta `docs/` na raiz do repositório
3. Faz commit na branch `main`
4. GitHub Pages serve os arquivos de `docs/`

## 🔄 Após Configurar

1. Execute o workflow manualmente (Actions → Run workflow)
2. Aguarde 2-3 minutos
3. Acesse: `https://kceryeus.github.io/FMD-main/`

## 📝 Nota

A pasta `docs/` será criada automaticamente pelo workflow. Não precisa criar manualmente.

