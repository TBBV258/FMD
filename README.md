# 🗂️ FindMyDocs - Sistema de Gestão de Documentos Perdidos e Encontrados

FindMyDocs é uma aplicação web moderna e responsiva para gerenciar documentos perdidos e encontrados, com funcionalidades avançadas de localização, chat e notificações em tempo real.

## ✨ Características Principais

### 🔐 **Sistema de Autenticação**
- Login/Registro com email e senha
- Autenticação Google OAuth
- Gerenciamento de sessões seguras
- Perfis de usuário personalizáveis

### 📄 **Gestão de Documentos**
- Adicionar, editar e gerenciar documentos pessoais
- Suporte a múltiplos tipos (BI, Passaporte, Carta de Condução)
- Upload de arquivos com validação
- Sistema de status (Normal, Perdido, Encontrado)

### 🚨 **Sistema de Relatórios**
- Reportar documentos perdidos
- Reportar documentos encontrados
- Geolocalização integrada
- Sistema de evidências com upload de arquivos

### 🔍 **Feed e Busca**
- Feed em tempo real de documentos perdidos/encontrados
- Filtros por tipo, status e localização
- Busca avançada com resultados relevantes
- Sistema de paginação otimizado

### 💬 **Sistema de Chat**
- Chat em tempo real entre usuários
- Conversas baseadas em documentos
- Histórico de mensagens persistente
- Notificações de novas mensagens

### 🗺️ **Integração com Mapas**
- Visualização geográfica de documentos
- Seleção de localização para relatórios
- Filtros por área geográfica
- Múltiplas visualizações (documentos, mapa de calor, agrupamentos)

### 🔔 **Sistema de Notificações**
- Notificações em tempo real
- Diferentes tipos (documento encontrado, chat, localização)
- Centro de notificações organizado
- Marcação de leitura

### 🌐 **Internacionalização**
- Suporte completo a Português e Inglês
- Interface adaptável ao idioma
- Traduções contextuais

### 📱 **Design Responsivo**
- Interface otimizada para mobile e desktop
- Navegação intuitiva com bottom navigation
- Componentes touch-friendly
- Suporte a dark/light mode

## 🚀 Tecnologias Utilizadas

### **Frontend**
- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework de estilos
- **React Router** - Roteamento
- **React Query** - Gerenciamento de estado e cache
- **Lucide React** - Ícones

### **Backend**
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Banco de dados
- **Real-time** - Atualizações em tempo real

### **Ferramentas de Desenvolvimento**
- **ESLint** - Linting de código
- **Prettier** - Formatação de código
- **Vitest** - Framework de testes
- **PostCSS** - Processamento de CSS

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **npm** ou **yarn**
- **Conta Supabase** (gratuita)
- **Navegador moderno** com suporte a ES6+

## 🛠️ Instalação e Configuração

### 1. **Clone o Repositório**
```bash
git clone https://github.com/seu-usuario/findmydocs.git
cd findmydocs
```

### 2. **Instale as Dependências**
```bash
npm install
```

### 3. **Configure as Variáveis de Ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
```

### 4. **Configure o Supabase**

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Execute o script SQL em `server/schema.sql`
4. Configure as políticas de segurança (RLS)
5. Copie as credenciais para o `.env.local`

### 5. **Inicie o Servidor de Desenvolvimento**
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5500`

## 🏗️ Estrutura do Projeto

```
src/
├── app/                    # Configuração da aplicação
│   ├── layouts/           # Layouts principais
│   └── router.tsx         # Configuração de rotas
├── components/            # Componentes reutilizáveis
│   ├── common/           # Componentes comuns (navegação)
│   └── ui/               # Componentes de interface
├── features/             # Funcionalidades organizadas por domínio
│   ├── auth/            # Autenticação
│   ├── documents/       # Gestão de documentos
│   ├── reports/         # Sistema de relatórios
│   ├── feed/            # Feed de documentos
│   ├── chat/            # Sistema de chat
│   ├── map/             # Integração com mapas
│   ├── profile/         # Perfil do usuário
│   └── notifications/   # Sistema de notificações
├── lib/                 # Utilitários e serviços
│   ├── api/             # APIs e comunicação com backend
│   ├── hooks/           # Hooks customizados
│   ├── services/        # Serviços de negócio
│   ├── types/           # Definições de tipos TypeScript
│   └── utils/           # Funções utilitárias
├── i18n/                # Internacionalização
└── styles/              # Estilos globais
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build de produção
npm run preview          # Preview do build de produção

# Testes
npm run test             # Executa testes
npm run test:ui          # Interface de testes
npm run test:coverage    # Cobertura de testes

# Qualidade de Código
npm run lint             # Verifica linting
npm run lint:fix         # Corrige problemas de linting
npm run format           # Formata código com Prettier
```

## 🧪 Testes

A aplicação inclui testes automatizados para garantir qualidade:

```bash
# Executar todos os testes
npm run test

# Executar testes com interface visual
npm run test:ui

# Executar testes com cobertura
npm run test:coverage
```

## 📱 Funcionalidades Mobile

- **Design responsivo** para todos os tamanhos de tela
- **Navegação touch-friendly** com bottom navigation
- **Gestos de swipe** para ações rápidas
- **Otimizações de performance** para dispositivos móveis
- **Suporte a PWA** (Progressive Web App)

## 🔒 Segurança

- **Autenticação JWT** com Supabase
- **Row Level Security (RLS)** no banco de dados
- **Validação de entrada** em todos os formulários
- **Sanitização de dados** para prevenir XSS
- **HTTPS obrigatório** em produção

## 🚀 Deploy

### **Vercel (Recomendado)**
```bash
npm install -g vercel
vercel
```

### **Netlify**
```bash
npm run build
# Upload da pasta dist/
```

### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5500
CMD ["npm", "start"]
```

## 🤝 Contribuição

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Documentação**: [docs.findmydocs.com](https://docs.findmydocs.com)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/findmydocs/issues)
- **Email**: suporte@findmydocs.com
- **Discord**: [Comunidade FindMyDocs](https://discord.gg/findmydocs)

## 🙏 Agradecimentos

- **Supabase** pela infraestrutura backend
- **Tailwind CSS** pelo sistema de design
- **React Community** pelas ferramentas e bibliotecas
- **Contribuidores** que ajudaram a construir esta aplicação

---

**Desenvolvido com ❤️ pela equipe FindMyDocs**

*Transformando a forma como as pessoas encontram seus documentos perdidos*