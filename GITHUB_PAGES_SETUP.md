# Configuração do GitHub Pages - Guia Completo

## ⚠️ Problema Atual

O GitHub Pages está mostrando o README.md ao invés da aplicação Vue. Isso geralmente acontece porque:

1. **GitHub Pages está configurado para servir da branch `main`** ao invés de `gh-pages`
2. **O workflow não foi executado ainda** ou falhou
3. **A branch `gh-pages` não existe** ou está vazia

## ✅ Solução Passo a Passo

### Passo 1: Verificar Configuração do GitHub Pages

1. Vá para o repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Pages**
4. Em **Source**, verifique:
   - **Deve estar**: `gh-pages` branch
   - **NÃO deve estar**: `main` branch ou `/docs` folder
5. Se estiver errado, mude para `gh-pages` branch e salve

### Passo 2: Verificar se o Workflow Executou

1. Vá para a aba **Actions** no GitHub
2. Verifique se há um workflow chamado "Deploy Vue Frontend"
3. Se houver, clique nele e verifique:
   - Se está verde (sucesso) ou vermelho (erro)
   - Se completou todos os steps
4. Se não houver workflow ou falhou, continue para o Passo 3

### Passo 3: Executar o Workflow Manualmente

1. Vá para **Actions** > **Deploy Vue Frontend**
2. Clique em **Run workflow** (botão no canto superior direito)
3. Selecione a branch `main`
4. Clique em **Run workflow**
5. Aguarde a execução (2-3 minutos)

### Passo 4: Verificar a Branch gh-pages

1. No repositório, clique no seletor de branches
2. Procure pela branch `gh-pages`
3. Se existir, clique nela
4. Verifique se contém:
   - `index.html`
   - Pasta `assets/` com JS e CSS
   - Arquivo `.nojekyll`

### Passo 5: Limpar Cache e Testar

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Ou teste em aba anônima/privada
3. Acesse: `https://kceryeus.github.io/FMD-main/`

## 🔧 Se Ainda Não Funcionar

### Opção A: Deploy Manual

Execute localmente:

```bash
cd frontend
npm install
VITE_BASE_URL=/FMD-main/ npm run build
npx gh-pages -d dist
```

Isso criará/atualizará a branch `gh-pages` manualmente.

### Opção B: Verificar Permissões do Workflow

1. Vá em **Settings** > **Actions** > **General**
2. Em **Workflow permissions**, certifique-se que está:
   - ✅ **Read and write permissions** (não apenas read)
3. Salve as mudanças

### Opção C: Verificar Nome do Repositório

Se o nome do repositório for diferente de `FMD-main`, você precisa atualizar:

1. `frontend/vite.config.ts` - linha 12: `base: '/NOME-DO-REPO/'`
2. `.github/workflows/deploy.yml` - linha 37: `VITE_BASE_URL: /NOME-DO-REPO/`

## 📋 Checklist de Verificação

- [ ] GitHub Pages configurado para branch `gh-pages`
- [ ] Workflow executado com sucesso
- [ ] Branch `gh-pages` existe e tem arquivos
- [ ] Arquivo `.nojekyll` está na branch `gh-pages`
- [ ] `index.html` está na branch `gh-pages`
- [ ] Cache do navegador limpo
- [ ] Base URL correto (`/FMD-main/`)

## 🐛 Troubleshooting Comum

### "404 Not Found"
- Verifique se a branch `gh-pages` existe
- Verifique se o GitHub Pages está ativado
- Aguarde alguns minutos após o deploy

### "Página em branco"
- Abra o console do navegador (F12)
- Verifique erros 404 nos assets
- Verifique se o `base` está correto

### "Ainda mostra README"
- GitHub Pages pode estar servindo da branch `main`
- Mude para `gh-pages` em Settings > Pages
- Aguarde alguns minutos para atualizar

## 📞 Próximos Passos

Após seguir estes passos, a aplicação Vue deve aparecer corretamente. Se ainda não funcionar, verifique:

1. Logs do workflow em Actions
2. Conteúdo da branch `gh-pages`
3. Console do navegador para erros


