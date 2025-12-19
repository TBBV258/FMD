# 📋 Changelog - FMD (FindMyDocs)

## [0.3.0] - 2025-01-19

### 🔐 Sistema de Permissões
- ✅ Modal de permissão de localização
  - Explicação clara do uso
  - Instruções por dispositivo (Android, iOS, Desktop)
  - Tratamento de permissão negada
  - Detecção automática de dispositivo
- ✅ Photo Picker para Mobile
  - Escolha entre Câmera ou Galeria
  - UI moderna e intuitiva
  - Suporte para todos dispositivos
- ✅ Composable `usePermissions`
  - Gerenciamento centralizado de permissões
  - Localização, Câmera, Notificações
  - Estados de permissão (granted, denied, prompt)
  - Detecção de tipo de dispositivo

### 📄 Gerenciamento de Documentos
- ✅ Menu de opções em cada documento
  - Marcar como Perdido
  - Marcar como Encontrado
  - Marcar como Normal (Privado)
- ✅ Confirmação antes de mudar status
- ✅ Atualização automática de `is_public`
  - `lost`/`found` → público (aparece no feed)
  - `normal` → privado (apenas no perfil)
- ✅ Feedback visual ao passar mouse
- ✅ Recarregamento automático após mudança

### 🗄️ Banco de Dados
- ✅ Trigger SQL `auto_normalize_found_documents`
  - Quando dono marca seu documento como "found"
  - Automaticamente vira "normal" (privado)
  - Previne documentos encontrados ficarem públicos
  - Script: `database/auto_normalize_found_trigger.sql`

### 💾 Sistema de Backup
- ✅ Backup agora gera arquivo JSON
- ✅ Contém todos os metadados dos documentos
- ✅ Nome: `FMD_Backup_YYYY-MM-DD.json`
- ✅ Mais leve e fácil de importar

### 🎨 UI/UX
- ✅ Modais de permissão com design moderno
- ✅ Instruções contextuais por dispositivo
- ✅ Ícones e cores consistentes
- ✅ Animações suaves
- ✅ Dropdown menu em documentos

### 📱 Mobile-First
- ✅ Photo picker otimizado para mobile
- ✅ Detecção automática de dispositivo
- ✅ Instruções específicas por plataforma
- ✅ Suporte para câmera e galeria

### 🔧 Melhorias Técnicas
- ✅ Novo composable `usePermissions.ts`
- ✅ Componentes reutilizáveis:
  - `LocationPermissionModal.vue`
  - `PhotoPickerModal.vue`
- ✅ TypeScript sem erros
- ✅ Código modular e manutenível

### 📚 Documentação
- ✅ `TODO_FEATURES.md` - Features pendentes detalhadas
- ✅ `database/auto_normalize_found_trigger.sql` - Documentado
- ✅ Instruções de teste para triggers

---

## [0.2.1] - 2025-01-19

### 🌍 Internacionalização (i18n)
- ✅ Sistema completo de tradução com Vue I18n
- ✅ Português (Moçambique) - 100% traduzido
- ✅ English (International/South Africa) - 100% traduzido
- ✅ Seletor de idioma no header
- ✅ Preferência salva no localStorage
- ✅ Traduções aplicadas em:
  - ProfileView
  - NotificationsView  
  - FeedView
  - BottomNavigation
  - TopBar
  - Todos os componentes principais

### 🔔 Sistema de Notificações
- ✅ Corrigido mapeamento de campos (`read` vs `is_read`, `data` vs `metadata`)
- ✅ Botão "Marcar todas como lidas"
- ✅ Badges com contador de notificações não lidas
- ✅ Notificações em tempo real via Supabase Realtime
- ✅ Tipos de notificação suportados:
  - `message` - Nova mensagem
  - `document_match` - Match encontrado
  - `document_found` - Documento encontrado
  - `document_status_change` - Status alterado
  - `points_milestone` - Marco de pontos
  - `system` - Notificação do sistema
  - `verification` - Verificação de documento
- ✅ Tempo relativo (Agora, 5m atrás, 1h atrás, etc.)
- ✅ Navegação automática ao clicar em notificação
- ✅ Destaque visual para notificações não lidas

### 👤 Perfil do Usuário
- ✅ Corrigido erro de propriedade 'name' undefined
- ✅ Opção para marcar documento como perdido
- ✅ Confirmação antes de marcar como perdido
- ✅ Feedback visual ao passar mouse sobre documentos
- ✅ Botão de backup de documentos
- ✅ Menu completamente traduzido
- ✅ Rankings traduzidos (Bronze, Prata, Ouro, Platina)

### 📱 Feed de Documentos
- ✅ Filtros traduzidos (Todos, Perdidos, Recuperados)
- ✅ Busca traduzida
- ✅ Estados vazios traduzidos

### 🎨 UI/UX
- ✅ Dark mode toggle traduzido
- ✅ Navegação inferior traduzida
- ✅ Estados de loading traduzidos
- ✅ Mensagens de erro/sucesso traduzidas

### 🗄️ Banco de Dados
- ✅ Triggers automáticos para notificações
- ✅ RLS (Row Level Security) configurado
- ✅ Índices para performance
- ✅ Documentação de setup para produção

### 🔧 Melhorias Técnicas
- ✅ TypeScript sem erros de linting
- ✅ Componentes otimizados
- ✅ Computed properties para traduções dinâmicas
- ✅ Consistência no uso de i18n em toda aplicação

### 📚 Documentação
- ✅ `PRODUCTION_SETUP.md` - Guia completo de produção
- ✅ Scripts SQL documentados
- ✅ Instruções de deploy

---

## [0.2.0] - 2024-12-XX

### 🎉 Features Anteriores
- Sistema básico de documentos perdidos e encontrados
- Autenticação com Supabase
- Feed de documentos
- Chat entre usuários
- Mapa de localização
- Sistema de pontos
- Perfil de usuário
- Notificações básicas

---

## 🚀 Próximas Features (Roadmap)

### v0.4.0 (Planejado)
- [ ] Tradução completa para Francês
- [ ] Tradução para Changana (língua local)
- [ ] Tradução para Ronga (língua local)
- [ ] Push notifications (mobile)
- [ ] Modo offline
- [ ] Backup automático na nuvem
- [ ] Verificação de documentos com IA
- [ ] Match automático avançado

### v0.4.0 (Planejado)
- [ ] Suporte a África do Sul
- [ ] Tipos de documentos sul-africanos
- [ ] Multi-moeda (MZN, ZAR)
- [ ] Analytics e dashboards
- [ ] Sistema de reputação
- [ ] Badges e conquistas

### v1.0.0 (Futuro)
- [ ] App mobile nativo (React Native)
- [ ] Integração com autoridades locais
- [ ] Sistema de recompensas
- [ ] API pública
- [ ] Expansão para outros países africanos

---

## 🐛 Bug Fixes

### v0.2.1
- Corrigido erro de propriedade 'name' undefined no ProfileView
- Corrigido mapeamento incorreto de campos de notificações
- Corrigido tipos de notificação não reconhecidos (`match` → `document_match`)
- Corrigido falta de tradução em textos hardcoded

---

## 🔄 Breaking Changes

### v0.2.1
- **Banco de Dados**: Coluna `is_read` → `read` em `notifications`
- **Banco de Dados**: Coluna `metadata` → `data` em `notifications`
- **API**: Método `markAsRead` agora atualiza apenas campo `read`
- **i18n**: Todos os textos agora devem usar `$t()` ou `t()`
- **Notificações**: Removido seed manual, usar triggers automáticos

---

## 📊 Estatísticas

- **Linhas de Código**: ~15,000+
- **Componentes Vue**: 25+
- **Views**: 12
- **Idiomas Suportados**: 5 (2 completos)
- **Tipos de Notificação**: 7
- **Tipos de Documento**: 11
- **Usuários Alvo**: 1000+ (Moçambique + África do Sul)

---

**Versão Atual: 0.3.0** 🎉  
**Status: ✅ Pronto para Produção (1000+ usuários)**

