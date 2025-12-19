# FindMyDocs - Frontend Vue.js

Sistema de gestão de documentos perdidos e encontrados - Frontend moderno em Vue.js 3 + TypeScript.

## 🚀 Tecnologias

- **Vue 3** - Framework JavaScript progressivo
- **TypeScript** - Tipagem estática
- **Vite** - Build tool rápido
- **Pinia** - State management
- **Vue Router** - Roteamento
- **Tailwind CSS** - Framework CSS utility-first
- **Supabase** - Backend as a Service
- **PWA** - Progressive Web App

## 📱 Features

- ✅ Mobile-first design (Instagram/TikTok/Facebook style)
- ✅ Infinite scroll no feed
- ✅ Swipe gestures (like/dismiss)
- ✅ Pull-to-refresh
- ✅ Dark mode
- ✅ PWA offline-first
- ✅ Autenticação com Supabase
- ✅ Upload de imagens
- ✅ Chat em tempo real
- ✅ Sistema de notificações
- ✅ Skeleton loading states

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🔧 Configuração

1. Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure as variáveis no `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 📂 Estrutura do Projeto

```
frontend/
├── public/              # Arquivos estáticos
├── src/
│   ├── assets/         # Imagens, estilos globais
│   ├── components/     # Componentes Vue
│   │   ├── common/     # Componentes reutilizáveis
│   │   ├── feed/       # Componentes do feed
│   │   └── layout/     # Layout components
│   ├── composables/    # Composables Vue
│   ├── router/         # Configuração de rotas
│   ├── stores/         # Pinia stores
│   ├── types/          # TypeScript types
│   ├── utils/          # Utilitários
│   ├── views/          # Views/Páginas
│   ├── App.vue         # Componente raiz
│   └── main.ts         # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎨 Componentes Principais

### Componentes Comuns
- `BaseButton` - Botão reutilizável com variantes
- `BaseInput` - Input com validação
- `BaseCard` - Card container
- `BaseModal` - Modal responsivo
- `LoadingSkeleton` - Loading states
- `SwipeGestures` - Gestos swipe mobile
- `ToastContainer` - Notificações toast

### Layout
- `MainLayout` - Layout principal com nav
- `TopBar` - Barra superior
- `BottomNavigation` - Navegação inferior mobile
- `PullToRefresh` - Pull to refresh component

### Feed
- `FeedCard` - Card de documento
- `FeedSkeleton` - Loading skeleton do feed

## 📱 Views

- `/` - Feed principal (FeedView)
- `/login` - Autenticação (LoginView)
- `/document/:id` - Detalhes do documento
- `/report-lost` - Relatar documento perdido
- `/report-found` - Relatar documento encontrado
- `/profile` - Perfil do usuário
- `/notifications` - Notificações
- `/chat/:documentId` - Chat

## 🔐 Autenticação

O sistema usa Supabase Auth com:
- Login/Registro por email
- Social login (Google)
- JWT tokens com refresh
- Route guards
- Persistent sessions

## 📦 Build

O build de produção é otimizado com:
- Code splitting por rota
- Tree shaking
- Minificação
- PWA assets
- Service Worker para cache

```bash
npm run build
```

Resultado em `dist/`

## 🚀 Deploy

### Vercel (Recomendado para frontend)
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod
```

### Build manual
```bash
npm run build
# Deploy a pasta dist/ para qualquer hosting estático
```

## 📊 Performance

- Bundle size < 200KB (inicial)
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse score > 90

## 🧪 Testing

```bash
# Unit tests (futuro)
npm run test

# E2E tests (futuro)
npm run test:e2e
```

## 📄 Licença

MIT © FindMyDocs Team

