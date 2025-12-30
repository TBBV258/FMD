# Guia de Deploy - FindMyDocs

Este documento explica como fazer o deploy da aplicação FindMyDocs, que utiliza o frontend Vue.js como UI principal.

## 📋 Pré-requisitos

- Node.js 20+ instalado
- npm ou yarn instalado
- Conta no GitHub (para GitHub Pages)
- Variáveis de ambiente configuradas

## 🏗️ Estrutura do Projeto

```
FMD-main-2/
├── frontend/          # Frontend Vue.js (UI Principal)
│   ├── src/          # Código fonte Vue
│   ├── dist/         # Build de produção (gerado)
│   └── package.json
├── server/           # Backend Node.js/Express
│   └── server.js    # Servidor que serve o frontend em produção
└── package.json      # Scripts de build e deploy
```

## 🚀 Opções de Deploy

### Opção 1: Deploy Automático via GitHub Actions (Recomendado)

O projeto está configurado com GitHub Actions para fazer deploy automático do frontend Vue para GitHub Pages.

#### Configuração

1. **Ativar GitHub Pages no repositório**:
   - Vá em Settings > Pages
   - Source: `gh-pages` branch
   - Path: `/ (root)`

2. **Push para main branch**:
   ```bash
   git push origin main
   ```

3. **O workflow irá**:
   - Fazer build do frontend Vue
   - Fazer deploy para GitHub Pages automaticamente

#### Acesso

Após o deploy, a aplicação estará disponível em:
- `https://seu-usuario.github.io/FMD/` (se base for `/FMD/`)
- Ou `https://seu-usuario.github.io/` (se base for `/`)

### Opção 2: Deploy Manual do Frontend

#### Build Local

```bash
# Na raiz do projeto
npm run build:frontend
```

Isso irá gerar os arquivos em `frontend/dist/`.

#### Deploy para GitHub Pages

```bash
npm run deploy:frontend
```

Ou manualmente:

```bash
cd frontend
npm run build
npm run deploy
```

### Opção 3: Deploy com Servidor Node.js (Full Stack)

Para servir tanto o backend API quanto o frontend Vue:

#### 1. Build do Frontend

```bash
npm run build:frontend
```

#### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=sua-url-supabase
SUPABASE_ANON_KEY=sua-chave-anon
# ... outras variáveis
```

#### 3. Iniciar Servidor

```bash
npm start
```

O servidor irá:
- Servir a API em `/api/*`
- Servir o frontend Vue em todas as outras rotas
- O Vue Router gerencia o roteamento no cliente

#### 4. Deploy em Plataformas

**Vercel** (Frontend apenas):
```bash
cd frontend
vercel --prod
```

**Railway/Render** (Full Stack):
1. Conecte o repositório
2. Configure variáveis de ambiente
3. Build command: `npm run build:frontend`
4. Start command: `npm start`

## 🔧 Configuração do Base URL

O `base` do Vite precisa ser configurado dependendo de onde você faz deploy:

### Para GitHub Pages (subdiretório)

Edite `frontend/vite.config.ts`:

```typescript
base: '/FMD/',  // ou '/seu-repositorio/'
```

### Para domínio raiz

```typescript
base: '/',
```

### Via variável de ambiente

```bash
VITE_BASE_URL=/FMD/ npm run build
```

## 📝 Scripts Disponíveis

### Na raiz do projeto:

- `npm run dev` - Inicia servidor backend em desenvolvimento
- `npm run dev:frontend` - Inicia frontend Vue em desenvolvimento
- `npm run build` ou `npm run build:frontend` - Build do frontend
- `npm run preview` - Preview do build local
- `npm start` - Inicia servidor em produção (serve frontend + API)
- `npm run deploy:frontend` - Build e deploy para GitHub Pages

### No frontend:

- `npm run dev` - Servidor de desenvolvimento (porta 5173)
- `npm run build` - Build de produção
- `npm run build:ci` - Build para CI/CD
- `npm run preview` - Preview do build
- `npm run deploy` - Deploy para GitHub Pages

## 🔍 Verificação Pós-Deploy

1. **Verificar se o frontend carrega**:
   - Acesse a URL de deploy
   - Deve ver a interface Vue

2. **Verificar rotas**:
   - `/login` - Página de login
   - `/` - Feed principal
   - `/profile` - Perfil do usuário
   - Todas as rotas devem funcionar (Vue Router)

3. **Verificar API**:
   - Se usando servidor Node.js: `/api/health`
   - Deve retornar status 200

## 🐛 Troubleshooting

### Frontend não carrega

- Verifique se o build foi feito: `ls frontend/dist/`
- Verifique o `base` no `vite.config.ts`
- Verifique os logs do GitHub Actions

### Rotas retornam 404

- Certifique-se de que o servidor está servindo `index.html` para rotas não-API
- Verifique a configuração do servidor em `server/server.js`

### Assets não carregam

- Verifique se o `base` está correto
- Verifique se os caminhos dos assets estão corretos
- Limpe o cache do navegador

## 📚 Recursos Adicionais

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vue Router History Mode](https://router.vuejs.org/guide/essentials/history-mode.html)
- [GitHub Pages](https://pages.github.com/)


