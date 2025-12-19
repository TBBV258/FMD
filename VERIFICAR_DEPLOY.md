# 🔍 Verificação Rápida do Deploy

## O Problema

Se você está vendo o README.md ao invés da aplicação Vue, o GitHub Pages provavelmente está servindo da branch **`main`** ao invés da branch **`gh-pages`**.

## ✅ Solução Rápida (2 minutos)

### 1. Verificar Configuração do GitHub Pages

1. No GitHub, vá para: **Settings** → **Pages**
2. Em **Source**, verifique qual branch está selecionada
3. **DEVE SER**: `gh-pages` (não `main`!)
4. Se estiver `main`, mude para `gh-pages` e salve

### 2. Verificar se a Branch gh-pages Existe

1. No repositório, clique no seletor de branches (canto superior esquerdo)
2. Digite `gh-pages` na busca
3. Se **NÃO existir**, o workflow ainda não executou
4. Se **existir**, clique nela e verifique se tem `index.html`

### 3. Executar o Workflow

1. Vá para **Actions** (aba no topo do repositório)
2. Clique em **Deploy Vue Frontend**
3. Se houver um botão **"Run workflow"**, clique nele
4. Aguarde 2-3 minutos

### 4. Aguardar e Testar

1. Aguarde 2-3 minutos após o workflow completar
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Acesse: `https://kceryeus.github.io/FMD-main/`

## 🚨 Se Ainda Não Funcionar

### Verificar Permissões

1. **Settings** → **Actions** → **General**
2. Em **Workflow permissions**, deve estar: **"Read and write permissions"**
3. Salve

### Deploy Manual (Último Recurso)

Execute no terminal local:

```bash
cd frontend
npm install
VITE_BASE_URL=/FMD-main/ npm run build
npx gh-pages -d dist
```

Isso criará a branch `gh-pages` manualmente.

## 📝 Checklist

- [ ] GitHub Pages configurado para `gh-pages` (não `main`)
- [ ] Branch `gh-pages` existe
- [ ] Workflow executado com sucesso
- [ ] Cache do navegador limpo
- [ ] Aguardou alguns minutos após deploy

## 💡 Dica

O GitHub Pages pode levar alguns minutos para atualizar após mudanças. Se você mudou a configuração, aguarde 5-10 minutos antes de testar novamente.

