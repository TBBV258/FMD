# 🚀 FMD - Setup para Produção

## Sistema de Notificações Automáticas

O FMD está configurado para **criar notificações automaticamente** através de triggers do banco de dados. Não é necessário popular manualmente.

---

## ✅ Triggers Configurados

### 1. **Nova Mensagem** (`trigger_notify_new_message`)
- **Quando**: Usuário envia mensagem no chat
- **Notifica**: Receptor da mensagem
- **Tipo**: `message`

### 2. **Mudança de Status** (`trigger_notify_document_status_change`)
- **Quando**: Documento muda de status (lost → found, etc.)
- **Notifica**: Dono do documento
- **Tipo**: `document_status_change`

### 3. **Match de Documento** (`trigger_notify_document_match`)
- **Quando**: Sistema encontra possível match
- **Notifica**: Ambos os usuários envolvidos
- **Tipo**: `document_match`

### 4. **Marco de Pontos** (`trigger_notify_points_milestone`)
- **Quando**: Usuário atinge 100, 500 ou 1000 pontos
- **Notifica**: Usuário que ganhou pontos
- **Tipo**: `points_milestone`

---

## 🔧 Configuração Inicial (Supabase)

### 1. Executar Scripts na Ordem:

```bash
# 1. Estrutura básica
database/migrations_clean.sql

# 2. Triggers de notificação
database/notification_triggers.sql
```

### 2. Verificar Instalação:

```sql
-- Verificar triggers ativos
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('chats', 'documents', 'user_profiles')
ORDER BY event_object_table, trigger_name;
```

Deve retornar pelo menos 4 triggers.

---

## 🌍 Suporte Multi-Idioma

### Idiomas Configurados:
- ✅ **Português (pt)** - Moçambique (padrão)
- ✅ **English (en)** - International / South Africa
- 🔄 **Francês (fr)** - Países francófonos da África
- 🔄 **Changana (ts)** - Língua local de Moçambique
- 🔄 **Ronga (ro)** - Língua local de Moçambique

### Estrutura de Traduções:
```
frontend/src/i18n/
├── index.ts (configuração)
└── locales/
    ├── pt.json ✅ Completo
    ├── en.json ✅ Completo
    ├── fr.json 🔄 Básico
    ├── ts.json 🔄 Básico
    └── ro.json 🔄 Básico
```

### Trocar Idioma:
- Usuário clica no **seletor de idioma** no header
- Preferência salva em `localStorage`
- Todo o app atualiza instantaneamente

---

## 📊 Escalabilidade

### Otimizações Implementadas:

1. **Índices no Banco:**
```sql
-- Notificações por usuário (rápido)
CREATE INDEX idx_notifications_user_id ON notifications (user_id);

-- Notificações não lidas (filtro rápido)
CREATE INDEX idx_notifications_is_read ON notifications (read);

-- Ordenação por data (performance)
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);
```

2. **Realtime Supabase:**
- Notificações aparecem instantaneamente
- Sem polling (economia de requests)
- Apenas 1 conexão WebSocket por usuário

3. **Paginação:**
- Feed carrega 20 documentos por vez
- Infinite scroll implementado
- Reduce carga do servidor

---

## 🔐 Segurança (RLS - Row Level Security)

### Políticas Configuradas:

```sql
-- Usuários só veem suas próprias notificações
CREATE POLICY "Users can read own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Usuários podem marcar como lidas
CREATE POLICY "Users can update own notifications" 
ON notifications FOR UPDATE 
USING (auth.uid() = user_id);
```

---

## 📈 Monitoramento

### Queries Úteis:

```sql
-- Total de usuários ativos
SELECT COUNT(DISTINCT user_id) as usuarios_ativos
FROM notifications
WHERE created_at > NOW() - INTERVAL '30 days';

-- Notificações por tipo (últimos 7 dias)
SELECT 
  type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE read = false) as nao_lidas
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY type
ORDER BY total DESC;

-- Taxa de leitura
SELECT 
  COUNT(*) FILTER (WHERE read = true)::float / COUNT(*) * 100 as taxa_leitura_pct
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 🚀 Deploy

### Checklist Pré-Produção:

- [x] Triggers de notificação instalados
- [x] RLS configurado
- [x] Índices criados
- [x] Traduções PT e EN completas
- [x] Realtime habilitado no Supabase
- [ ] Domínio customizado configurado
- [ ] SSL/HTTPS ativo
- [ ] Analytics configurado (opcional)
- [ ] Monitoring de erros (Sentry, etc.)

### Variáveis de Ambiente:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

---

## 📱 Teste em Produção

### Para testar notificações:

1. **Criar 2 contas de usuário**
2. **Usuário A**: Reporta documento perdido
3. **Usuário B**: Reporta documento encontrado
4. **Sistema**: Cria notificação de match automaticamente
5. **Usuário B**: Envia mensagem para A
6. **Usuário A**: Recebe notificação de nova mensagem

✅ **Tudo automático!** Sem seed manual necessário.

---

## 🌍 Expansão África do Sul

### Considerações:

1. **Idioma**: Inglês já implementado ✅
2. **Tipos de Documentos**: 
   - Adicionar "South African ID"
   - "Driver's License" (RSA)
   - "Passport" (já existe)

3. **Moedas**: 
   - Metical (MZN) para Moçambique
   - Rand (ZAR) para África do Sul
   - (Se houver planos premium)

4. **Telefone**:
   - Formato: +258 (Moçambique)
   - Formato: +27 (África do Sul)

---

## 🆘 Suporte

Para dúvidas sobre notificações:
1. Verificar se triggers estão ativos
2. Checar logs do Supabase
3. Validar RLS policies
4. Testar conexão Realtime

---

**Sistema pronto para 1000+ usuários simultâneos!** 🎉

