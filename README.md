# FindMyDocs 2.0 - Sistema de Gestão de Documentos Perdidos

**App em desenvolvimento** - Find My Docs

Sistema completo de gestão de documentos perdidos e encontrados em Maputo, Moçambique. Versão 2.0 com frontend Vue.js moderno e backend Supabase.

## 🎉 Novidades da Versão 2.0

### ✨ Implementações Recentes

#### 🗺️ Sistema de Mapas com MapLibre
- Substituição completa do Leaflet por MapLibre GL
- Marcação interativa de localizações no mapa
- Navegação externa para Google Maps/Apple Maps
- Visualização de documentos perdidos e recuperados

#### 🔔 Sistema de Notificações Automáticas
- Triggers de banco de dados para notificações em tempo real
- Notificações de match de documentos
- Alertas de mudança de status
- Notificações de verificação de documentos
- Marcos de pontos (Bronze, Silver, Gold, Platinum)

#### 🏆 Sistema de Rankings
- Leaderboard com top 10 usuários
- Progressão de níveis visual
- Sistema de pontos por atividades:
  - Match de documento: +50 pontos
  - Reportar documento: +10 pontos
  - Verificar documento: +20 pontos
  - Ajudar outros: +15 pontos
  - Completar perfil: +25 pontos
  - Login diário: +5 pontos

#### 👤 Edição de Perfil Expandida
- Editar nome completo
- Atualizar telefone celular (+258)
- Adicionar endereço para entrega de documentos
- Validações robustas de formulário

#### 🌐 Melhorias de Tradução
- Renomeado "Encontrados" para "Recuperados" em PT/EN/FR
- Consistência em todos os idiomas (PT, EN, FR, TS, RO)

#### 💰 Preços Atualizados
- **Mensal**: 10 MZN/mês
- **Trimestral**: 27 MZN (economize 10%)
- **Anual**: 96 MZN (economize 20%, 2 meses grátis)

#### 🐛 Correções
- Corrigido carregamento de conversas (profiles → user_profiles)
- Limpeza de arquivos desnecessários
- Otimização da estrutura do projeto

---

## 📱 Características Principais

### Frontend (Vue.js 3 + TypeScript)

* ✅ **Mobile-First Design** - Interface otimizada para smartphones
* ✅ **Design Moderno** - Inspirado em Instagram/TikTok/Facebook
* ✅ **PWA** - Funciona offline, instalável no smartphone
* ✅ **Infinite Scroll** - Carregamento contínuo do feed
* ✅ **Swipe Gestures** - Gestos touch para interação rápida
* ✅ **Pull-to-Refresh** - Atualizar puxando para baixo
* ✅ **Dark Mode** - Tema escuro automático
* ✅ **Real-time Chat** - Comunicação entre usuários
* ✅ **Sistema de Rankings** - Gamificação com pontos e níveis
* ✅ **MapLibre Integration** - Mapas modernos e rápidos
* ✅ **Notificações em Tempo Real** - Sistema de alertas automático

### Backend (Supabase)

* ✅ **Autenticação JWT** - Sistema seguro de autenticação
* ✅ **Database Triggers** - Notificações automáticas
* ✅ **Row Level Security** - Segurança a nível de linha
* ✅ **Storage** - Armazenamento de imagens
* ✅ **Real-time** - Atualizações em tempo real
* ✅ **Validação** - Validação robusta de dados

---

## 🚀 Início Rápido

### Pré-requisitos

* Node.js >= 18.0.0
* npm ou yarn
* Conta Supabase (gratuita)

### 1. Clone o Repositório

```bash
git clone https://github.com/TBBV258/FMD.git
cd FMD-main
```

### 2. Configurar Database

1. Acesse seu projeto no Supabase
2. Vá para SQL Editor
3. Execute os scripts na ordem:
   - `database/migrations.sql` - Migrações de esquema
   - `database/notification_triggers.sql` - Triggers de notificações

### 3. Configurar Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas configurações do Supabase
nano .env
```

**.env do Frontend:**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Iniciar Aplicação

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

O frontend estará rodando em `http://localhost:5173`

---

## 📂 Estrutura do Projeto

```
FMD-main/
├── frontend/                 # Aplicação Vue.js
│   ├── src/
│   │   ├── api/             # APIs do Supabase
│   │   ├── components/      # Componentes Vue
│   │   │   ├── common/      # Componentes reutilizáveis
│   │   │   ├── feed/        # Componentes do feed
│   │   │   ├── layout/      # Layout components
│   │   │   ├── map/         # Componente de mapa (MapLibre)
│   │   │   └── profile/     # Componentes de perfil
│   │   ├── views/           # Páginas/Views
│   │   ├── stores/          # Pinia stores (state management)
│   │   ├── router/          # Vue Router
│   │   ├── composables/     # Composables reutilizáveis
│   │   ├── i18n/            # Internacionalização (PT, EN, FR, TS, RO)
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utilitários
│   ├── public/              # Arquivos públicos
│   └── package.json
│
├── database/                # Scripts SQL
│   ├── migrations.sql       # Migrações de esquema
│   └── notification_triggers.sql  # Triggers automáticos
│
├── .gitignore
├── QUICK_START.md
└── README.md
```

---

## 🔧 Funcionalidades Detalhadas

### 🗺️ Sistema de Mapas

**MapLibre GL** - Biblioteca de mapas open-source moderna

- **Visualização**: Documentos perdidos (vermelho) e recuperados (verde)
- **Marcação**: Clique no mapa para marcar localização ao reportar documento
- **Navegação**: Abra Google Maps/Apple Maps para direções
- **Controles**: Zoom, centralizar na localização do usuário
- **Performance**: Renderização GPU, suporta milhares de marcadores

### 🔔 Notificações Automáticas

Triggers do Supabase criam notificações automaticamente:

1. **Nova Mensagem** - Quando alguém envia mensagem
2. **Match de Documento** - Quando sistema encontra possível match
3. **Mudança de Status** - Quando documento muda de perdido para recuperado
4. **Verificação** - Quando documento é verificado/rejeitado
5. **Marco de Pontos** - Ao atingir Bronze (0), Silver (100), Gold (500), Platinum (1000)

### 🏆 Sistema de Rankings

**Níveis de Usuário:**

| Nível | Pontos | Ícone | Descrição |
|-------|--------|-------|-----------|
| 🥉 Bronze | 0-99 | 🥉 | Iniciante |
| 🥈 Silver | 100-499 | 🥈 | Usuário ativo |
| 🥇 Gold | 500-999 | 🥇 | Membro valioso |
| 💎 Platinum | 1000+ | 💎 | Lenda da comunidade |

**Como Ganhar Pontos:**

- Match de documento: +50 pontos
- Reportar documento: +10 pontos
- Verificar documento: +20 pontos
- Ajudar outros usuários: +15 pontos
- Completar perfil: +25 pontos
- Login diário: +5 pontos

### 💬 Sistema de Chat

- Chat em tempo real via Supabase Realtime
- Suporte para mensagens de texto, imagens, arquivos
- Status de leitura (lido/não lido)
- Histórico de conversas
- Notificações de novas mensagens

### 👤 Perfil de Usuário

**Informações Editáveis:**

- Nome completo (mínimo 3 caracteres)
- Telefone celular (+258 XX XXX XXXX)
- Endereço para entrega de documentos
- Foto de perfil

**Estatísticas:**

- Total de documentos reportados
- Pontos acumulados
- Ranking atual
- Plano de subscrição

---

## 💳 Planos de Subscrição

### Grátis
- Upload básico de documentos
- Acesso ao feed
- Chat com limitações

### Premium

#### Mensal - 10 MZN/mês
- Uploads ilimitados
- Sem anúncios
- Busca avançada
- Notificações push
- Suporte prioritário
- Backup automático

#### Trimestral - 27 MZN (economize 10%)
- Todos os benefícios do mensal
- 10% de desconto

#### Anual - 96 MZN (economize 20%)
- Todos os benefícios do mensal
- 20% de desconto
- 2 meses grátis

---

## 🌐 Internacionalização (i18n)

Idiomas suportados:

- 🇲🇿 **Português** (pt) - Padrão
- 🇬🇧 **English** (en)
- 🇫🇷 **Français** (fr)
- 🇲🇿 **Xitsonga** (ts)
- 🇲🇿 **Ronga** (ro)

O idioma é salvo localmente e persiste entre sessões.

---

## 🎨 Design System

### Cores

```css
--color-primary: #007BFF;      /* Azul */
--color-success: #28A745;      /* Verde */
--color-danger: #DC3545;       /* Vermelho */
--color-warning: #FFC107;      /* Amarelo */
--color-dark-bg: #1a1a1a;      /* Fundo escuro */
--color-dark-card: #2d2d2d;    /* Card escuro */
```

### Breakpoints

- **Mobile**: 320px - 767px (foco principal)
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

---

## 🔐 Segurança

### Implementadas

- ✅ JWT Authentication (Supabase Auth)
- ✅ Row Level Security (RLS)
- ✅ Input sanitization
- ✅ HTTPS only (produção)
- ✅ CORS configurado
- ✅ XSS protection
- ✅ SQL injection prevention
- ✅ Rate limiting (Supabase)

---

## 🚀 Deploy

### Frontend (Vercel/Netlify)

```bash
cd frontend
npm run build

# Deploy automático via Git
git push origin main
```

**Variáveis de Ambiente (Vercel/Netlify):**

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (Supabase)

1. Criar projeto no Supabase
2. Executar scripts SQL em ordem
3. Configurar Storage buckets
4. Configurar Authentication providers

---

## 📊 Performance

### Métricas Alvo

- **Bundle size**: < 250KB (gzipped)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: > 90

### Otimizações

- Code splitting automático
- Lazy loading de rotas
- Image optimization
- MapLibre (mais leve que Leaflet)
- Tree shaking
- Minification

---

## 🐛 Debugging

### Logs do Frontend

```bash
# Console do navegador (F12)
# Vue DevTools extension
```

### Logs do Supabase

```bash
# Supabase Dashboard > Logs
# Real-time logs
# Database logs
# Storage logs
```

---

## 🧪 Testes

```bash
cd frontend

# Rodar testes unitários
npm run test

# Rodar testes com UI
npm run test:ui

# Coverage
npm run test:coverage
```

---

## 📄 Licença

MIT © 2024 FindMyDocs Team

---

## 👥 Equipe

### Desenvolvimento
* **Ivan Paulo Cossa** - Desenvolvedor Full-stack
* **Kevin Zacarias Paulo Cossa** - Desenvolvedor Full-stack

### Gestão
* **Kevin Cossa** - Gestor de Projeto
* **Tiago Boca Rude** - Gestor de Projeto
* **Pedro Simbine** - Gestor de Projeto

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📞 Suporte

* **Email**: support@findmydocs.co.mz
* **Website**: [https://findmydocs.co.mz](https://findmydocs.co.mz)
* **GitHub Issues**: [Report Bug](https://github.com/TBBV258/FMD/issues)

---

## 🙏 Agradecimentos

- [Vue.js](https://vuejs.org/) - Framework frontend
- [Supabase](https://supabase.com/) - Backend as a Service
- [MapLibre GL](https://maplibre.org/) - Biblioteca de mapas
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- Comunidade open-source de Moçambique

---

**FindMyDocs 2.0** - Ajudando a reunir pessoas com seus documentos! 🎉
