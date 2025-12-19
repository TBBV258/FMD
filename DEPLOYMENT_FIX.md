# Correção do Deploy - GitHub Pages

## Problema Identificado

O GitHub Pages estava mostrando o README.md ao invés da aplicação Vue porque:
1. O `base` URL não estava configurado para `/FMD-main/`
2. O Jekyll estava processando os arquivos (precisa desabilitar)

## Correções Aplicadas

### 1. Base URL Configurado
- **Arquivo**: `frontend/vite.config.ts`
- **Mudança**: Base definido como `/FMD-main/` (nome do repositório)
- **Motivo**: GitHub Pages serve em `usuario.github.io/repositorio/`

### 2. Workflow Atualizado
- **Arquivo**: `.github/workflows/deploy.yml`
- **Mudanças**:
  - Adicionada variável `VITE_BASE_URL: /FMD-main/` no build
  - Criado arquivo `.nojekyll` para desabilitar processamento Jekyll
  - Garantido que o arquivo seja copiado para o dist

### 3. Arquivo .nojekyll
- **Arquivo**: `frontend/public/.nojekyll`
- **Função**: Desabilita o processamento Jekyll no GitHub Pages
- **Importante**: Este arquivo será copiado para `dist/` durante o build

## Como Aplicar as Correções

### Opção 1: Push para GitHub (Recomendado)
```bash
git add .
git commit -m "Fix: Configure base URL for GitHub Pages deployment"
git push origin main
```

O GitHub Actions irá:
1. Fazer build com `VITE_BASE_URL=/FMD-main/`
2. Criar `.nojekyll` no dist
3. Fazer deploy para gh-pages branch

### Opção 2: Build e Deploy Manual
```bash
cd frontend
VITE_BASE_URL=/FMD-main/ npm run build
# O arquivo .nojekyll já está em public/, será copiado automaticamente
npm run deploy
```

## Verificação Pós-Deploy

Após o deploy, verifique:

1. **URL da aplicação**: `https://kceryeus.github.io/FMD-main/`
   - Deve mostrar a aplicação Vue, não o README

2. **Rotas funcionando**:
   - `/FMD-main/` - Feed principal
   - `/FMD-main/login` - Login
   - `/FMD-main/profile` - Perfil
   - Todas as rotas devem funcionar

3. **Assets carregando**:
   - Imagens, CSS, JS devem carregar corretamente
   - Verifique o console do navegador para erros 404

## Se Ainda Não Funcionar

### Verificar Configuração do GitHub Pages
1. Vá em Settings > Pages do repositório
2. Source: `gh-pages` branch
3. Path: `/ (root)`

### Limpar Cache
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Ou teste em aba anônima

### Verificar Build Local
```bash
cd frontend
VITE_BASE_URL=/FMD-main/ npm run build
npm run preview
# Acesse http://localhost:4173/FMD-main/
```

### Verificar Arquivos no gh-pages
1. Vá na branch `gh-pages` do repositório
2. Deve ter:
   - `index.html`
   - `.nojekyll`
   - Pasta `assets/` com JS/CSS
   - Outros arquivos estáticos

## Notas Importantes

- O `base` deve corresponder ao nome do repositório no GitHub
- Se mudar o nome do repositório, atualize o `base` também
- O arquivo `.nojekyll` é essencial para desabilitar Jekyll
- Após mudanças, pode levar alguns minutos para o GitHub Pages atualizar

