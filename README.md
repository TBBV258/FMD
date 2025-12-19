# FindMyDocs 2.0 - Sistema de Gestão de Documentos Perdidos

Sistema completo de gestão de documentos perdidos e encontrados em Maputo, Moçambique. Versão 2.0 com frontend Vue.js moderno e backend Node.js seguro.

## 📱 Características Principais

### Frontend (Vue.js 3)
- ✅ **Mobile-First Design** - Interface otimizada para smartphones
- ✅ **Design Moderno** - Inspirado em Instagram/TikTok/Facebook
- ✅ **PWA** - Funciona offline, instalável no smartphone
- ✅ **Infinite Scroll** - Carregamento contínuo do feed
- ✅ **Swipe Gestures** - Gestos touch para interação rápida
- ✅ **Pull-to-Refresh** - Atualizar puxando para baixo
- ✅ **Dark Mode** - Tema escuro automático
- ✅ **Skeleton Loading** - Loading states elegantes
- ✅ **Real-time Chat** - Comunicação entre usuários
- ✅ **Notificações** - Sistema de alertas em tempo real

### Backend (Node.js + Express)
- ✅ **Segurança Avançada** - JWT refresh tokens, rate limiting
- ✅ **Audit Logging** - Registro de todas operações críticas
- ✅ **HTTPS Support** - Suporte para SSL/TLS
- ✅ **API RESTful** - Endpoints bem documentados
- ✅ **Validação** - Validação robusta de inputs
- ✅ **CORS** - Configuração segura de CORS
- ✅ **Rate Limiting** - Proteção contra abuso

## 🚀 Início Rápido

### Pré-requisitos
- Node.js >= 14.0.0
- npm ou yarn
- Conta Supabase (gratuita)

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd "FMD Dezembro"
```

### 2. Configurar Backend
```bash
# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas configurações
nano .env

# Instalar dependências do backend
npm install

# Iniciar servidor backend
npm run dev
```

O backend estará rodando em `http://localhost:3000`

### 3. Configurar Frontend
```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## 📂 Estrutura do Projeto

```
FMD Dezembro/
├── frontend/                 # Aplicação Vue.js
│   ├── src/
│   │   ├── components/      # Componentes Vue
│   │   ├── views/           # Páginas
│   │   ├── stores/          # Pinia stores
│   │   ├── router/          # Vue Router
│   │   └── assets/          # Assets (CSS, imagens)
│   ├── public/              # Arquivos públicos
│   └── package.json
│
├── server/                  # Backend Node.js
│   ├── controllers/         # Controladores
│   ├── middleware/          # Middlewares
│   │   ├── auth.js
│   │   ├── rateLimiters.js
│   │   ├── jwtRefresh.js
│   │   └── securityHeaders.js
│   ├── routes/             # Rotas da API
│   ├── utils/              # Utilit ários
│   │   └── audit-logger.js
│   └── server.js           # Entry point
│
├── logs/                   # Logs do sistema
├── .env.example           # Exemplo de variáveis de ambiente
├── package.json
└── README.md
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
# Server
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# HTTPS (opcional)
ENABLE_HTTPS=false
SSL_KEY_PATH=./ssl/key.pem
SSL_CERT_PATH=./ssl/cert.pem

# Logging
ENABLE_AUDIT_LOGGING=true
```

## 🔐 Segurança

### Implementadas
- ✅ JWT Access + Refresh Tokens
- ✅ Token Rotation automático
- ✅ Rate Limiting por rota
- ✅ Audit Logging completo
- ✅ Input sanitization (XSS, SQL injection)
- ✅ HTTPS support
- ✅ CORS configurável
- ✅ Helmet security headers
- ✅ Request signing (anti-replay)

### Backend Endpoints Principais

#### Autenticação
```
POST /api/v1/auth/login       - Login
POST /api/v1/auth/register    - Registro
POST /api/v1/auth/refresh     - Refresh token
POST /api/v1/auth/logout      - Logout
```

#### Documentos
```
GET    /api/v1/documents           - Listar documentos
GET    /api/v1/documents/:id       - Detalhes
POST   /api/v1/documents           - Criar documento
PUT    /api/v1/documents/:id       - Atualizar
DELETE /api/v1/documents/:id       - Deletar
```

## 📱 Progressive Web App (PWA)

A aplicação funciona como PWA, permitindo:
- Instalação no smartphone
- Funcionalidade offline
- Notificações push (futuro)
- Ícone na tela inicial
- Experiência nativa

### Instalar PWA
1. Abra o site no Chrome/Safari mobile
2. Toque no menu
3. "Adicionar à tela inicial"
4. Use como app nativo!

## 🎨 Design System

### Cores
- **Primary**: #007BFF (Azul)
- **Success**: #28A745 (Verde)
- **Danger**: #DC3545 (Vermelho)
- **Warning**: #FFC107 (Amarelo)

### Breakpoints
- **Mobile**: 320px - 767px (foco principal)
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

## 🚀 Deploy

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

### Backend (Railway/Render)
```bash
# Push para GitHub
git push origin main

# Conectar no Railway/Render
# Configurar variáveis de ambiente
# Deploy automático!
```

## 📊 Performance

### Métricas Alvo
- Bundle size: < 200KB
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90

## 🐛 Debug

### Logs
```bash
# Ver logs do backend
tail -f logs/audit.log

# Ver logs do servidor
npm run dev
```

### Ferramentas
- Vue DevTools (Chrome/Firefox extension)
- Network tab (inspecionar requests)
- Supabase Dashboard (dados em tempo real)

## 📄 Licença

MIT © 2024 FindMyDocs Team

## 👥 Autores

- Ivan Paulo Cossa
- Kevin Zacarias Paulo Cossa

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

- Email: support@findmydoc.co.mz
- Website: https://findmydocs.co.mz
- GitHub Issues: [Report Bug](issues)

---

**FindMyDocs 2.0** - Ajudando a reunir pessoas com seus documentos! 🎉

