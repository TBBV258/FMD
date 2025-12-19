# Deploy na Branch Main - Configuração

## ✅ Configuração Aplicada

O workflow foi configurado para fazer deploy diretamente na branch `main`, sem usar `gh-pages`.

### Como Funciona

1. **Build do Frontend**: O workflow faz build do Vue em `frontend/dist/`
2. **Copia para `docs/`**: Os arquivos são copiados para a pasta `docs/` na raiz
3. **Commit na Main**: Os arquivos são commitados na branch `main`
4. **GitHub Pages**: Serve os arquivos da pasta `docs/` na branch `main`

## 🔧 Configuração do GitHub Pages

No GitHub, configure:

1. Vá em **Settings** → **Pages**
2. Em **Source**, selecione:
   - **Branch**: `main`
   - **Folder**: `/docs` (não `/ (root)`)
3. Clique em **Save**

## 📁 Estrutura

Após o deploy, a estrutura será:

```
FMD-main/
├── docs/              # Arquivos buildados (servidos pelo GitHub Pages)
│   ├── index.html
│   ├── assets/
│   └── .nojekyll
├── frontend/
│   └── src/          # Código fonte
└── ...
```

## 🚀 Deploy Automático

O workflow executa automaticamente quando você faz push para `main`.

Para forçar um deploy:
1. Vá em **Actions**
2. Clique em **Deploy Vue Frontend to GitHub Pages (main branch)**
3. Clique em **Run workflow**

## ⚠️ Importante

- A pasta `docs/` será criada/atualizada automaticamente
- Não edite manualmente os arquivos em `docs/` (serão sobrescritos)
- O arquivo `.nojekyll` é criado automaticamente para desabilitar Jekyll

## 🔍 Verificação

Após o deploy:
1. Aguarde 2-3 minutos
2. Acesse: `https://kceryeus.github.io/FMD-main/`
3. Deve mostrar a aplicação Vue

Se ainda mostrar README:
- Verifique se o GitHub Pages está configurado para `/docs` folder
- Limpe o cache do navegador
- Aguarde alguns minutos para o GitHub atualizar

