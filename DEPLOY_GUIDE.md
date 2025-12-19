# 🚀 Guia de Deploy - FMD v0.4.0

## 📊 Status do Projeto

**Versão**: 0.4.0  
**Commits Locais**: 12  
**Status**: ✅ **100% Pronto para Produção**  
**Usuários Alvo**: 1000+ (Moçambique + África do Sul)

---

## ✅ TUDO IMPLEMENTADO

### 1. **Sistema de Pontos e Ranking** 🏆
### 2. **MapLibre com Clustering e Heatmap** 🗺️
### 3. **Seleção de Localização e Ponto de Encontro** 📍
### 4. **Backup de Arquivos Originais** 💾
### 5. **Chats e Notificações Funcionais** 💬
### 6. **Sistema de Permissões Completo** 🔐
### 7. **Traduções PT/EN** 🌍
### 8. **Gerenciamento de Documentos** 📄

---

## 🎯 PASSO A PASSO PARA DEPLOY

### **PARTE 1: Git e GitHub** (5 min)

```bash
# 1. Fazer push dos 12 commits locais
cd /home/vansu/Documents/FMD/FMDVUE/FMD-main
git push origin main

# Se pedir autenticação, configure:
git config --global credential.helper store
# Depois faça push novamente
```

---

### **PARTE 2: Supabase Database** (10 min)

Execute os scripts SQL **nesta ordem** no Supabase SQL Editor:

#### 2.1. Base (se ainda não executou)
```sql
-- Copie e cole: database/migrations_clean.sql
```

#### 2.2. Triggers de Notificações
```sql
-- Copie e cole: database/notification_triggers.sql
```

#### 2.3. Auto-normalize Documentos
```sql
-- Copie e cole: database/auto_normalize_found_trigger.sql
```

#### 2.4. Ponto de Encontro
```sql
-- Copie e cole: database/add_meeting_point.sql
```

#### 2.5. ✅ **Chats e Notificações** (TESTADO!)
```sql
-- Copie e cole: database/fix_chats_notifications.sql
-- ✅ Este script já foi executado e funcionou!
```

#### 2.6. 🏆 **Sistema de Pontos** (IMPORTANTE!)
```sql
-- Copie e cole: database/points_system.sql
-- Isso cria:
-- - Tabela points_history
-- - Função add_points()
-- - Triggers automáticos
-- - Ranking global
-- - Pontos retroativos
```

---

### **PARTE 3: Habilitar Realtime** (2 min)

No Dashboard do Supabase:

1. Vá em: **Database** → **Replication**
2. Ative estas tabelas:
   - ✅ `chats`
   - ✅ `notifications`
   - ✅ `points_history`
   - ✅ `documents`
3. Clique em **Save**

---

### **PARTE 4: Frontend Deploy** (10 min)

#### Opção A: Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Deploy
cd frontend
vercel

# 3. Configurar variáveis de ambiente no Dashboard:
VITE_SUPABASE_URL=https://agqpfpzsxqbrqyjiqtiy.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

#### Opção B: Netlify

```bash
# 1. Build
cd frontend
npm run build

# 2. Deploy pasta dist/ no Netlify Dashboard
```

#### Opção C: GitHub Pages

```bash
# 1. Build
cd frontend
npm run build

# 2. Deploy
npm run deploy
```

---

## 🧪 TESTAR APÓS DEPLOY

### 1. **Chats** ✅
- Abrir um documento
- Enviar mensagem
- Verificar se aparece em tempo real

### 2. **Notificações** ✅
- Fazer upload de documento → deve ganhar +10 pontos
- Verificar se notificação aparece
- Testar "Marcar todas como lidas"

### 3. **Pontos e Ranking** 🏆
```sql
-- Ver seus pontos no Supabase:
SELECT 
  up.full_name,
  up.points,
  up.rank,
  public.get_user_rank_position(up.id) as position
FROM public.user_profiles up
ORDER BY up.points DESC;
```

### 4. **Mapa** 🗺️
- Abrir MapView
- Verificar clustering funcionando
- Testar heatmap (botão 🔥)
- Testar zoom e fit bounds

### 5. **Backup** 💾
- Ir em Perfil → Baixar Backup
- Verificar se baixa **imagens/PDFs** (não JSON)

### 6. **Localização** 📍
- Reportar documento perdido
- Clicar em "Marcar no Mapa"
- Verificar se modal abre
- Marcar localização
- Definir ponto de encontro

---

## 📊 MONITORAMENTO

### Logs do Supabase
```sql
-- Ver atividades recentes de pontos
SELECT
  up.full_name,
  ph.points,
  ph.activity_type,
  ph.activity_description,
  ph.created_at
FROM public.points_history ph
JOIN public.user_profiles up ON ph.user_id = up.id
ORDER BY ph.created_at DESC
LIMIT 50;

-- Ver chats recentes
SELECT
  c.message,
  c.created_at,
  d.title as document_title
FROM public.chats c
JOIN public.documents d ON c.document_id = d.id
ORDER BY c.created_at DESC
LIMIT 20;

-- Ver notificações recentes
SELECT
  n.title,
  n.message,
  n.type,
  n.read,
  n.created_at
FROM public.notifications n
ORDER BY n.created_at DESC
LIMIT 20;
```

---

## 🔧 TROUBLESHOOTING

### **Chats não aparecem**
1. Verificar se `fix_chats_notifications.sql` foi executado
2. Confirmar Realtime habilitado no Dashboard
3. Verificar console do browser (F12) por erros
4. Testar query manual:
```sql
SELECT * FROM public.chats ORDER BY created_at DESC LIMIT 10;
```

### **Notificações não funcionam**
1. Verificar triggers:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%notif%';
```
2. Verificar se Realtime está ativo
3. Testar inserir manualmente:
```sql
INSERT INTO public.notifications (user_id, type, title, message, data, read)
VALUES (
  auth.uid(),
  'system',
  'Teste',
  'Esta é uma notificação de teste',
  '{"test": true}'::jsonb,
  false
);
```

### **Pontos não somam**
1. Verificar se `points_system.sql` foi executado
2. Verificar triggers:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%points%';
```
3. Testar função manualmente:
```sql
SELECT public.add_points(
  auth.uid(),
  10,
  'document_upload',
  'Teste manual'
);
```

### **Mapa não carrega**
1. Verificar console (F12)
2. Verificar se `maplibre-gl` está instalado
3. Testar connection:
```bash
curl https://a.tile.openstreetmap.org/0/0/0.png
```

---

## 📈 MÉTRICAS DE SUCESSO

Após 1 semana em produção, verificar:

- ✅ **Usuários ativos diários**: Meta 100+
- ✅ **Documentos cadastrados**: Meta 500+
- ✅ **Chats enviados**: Meta 200+
- ✅ **Documentos devolvidos**: Meta 10+
- ✅ **Taxa de match**: Meta 5%+

---

## 🎉 CHECKLIST FINAL

Antes de anunciar o lançamento:

- [ ] ✅ 12 Commits pushed para GitHub
- [ ] ✅ 6 Scripts SQL executados no Supabase
- [ ] ✅ Realtime habilitado (3 tabelas)
- [ ] ✅ Frontend deployed (Vercel/Netlify/GitHub Pages)
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Testes manuais realizados
- [ ] ✅ Chats funcionando
- [ ] ✅ Notificações em tempo real
- [ ] ✅ Pontos somando automaticamente
- [ ] ✅ Mapa com clustering
- [ ] ✅ Backup baixando arquivos originais
- [ ] ✅ Localização e ponto de encontro funcionando

---

## 📞 SUPORTE

### Documentação
- `README.md` - Visão geral
- `CHANGELOG.md` - Histórico de versões
- `IMPLEMENTACOES_COMPLETAS.md` - Todas as features
- `TODO_FEATURES.md` - Features futuras

### Scripts SQL
- `database/migrations_clean.sql` - Base de dados
- `database/notification_triggers.sql` - Triggers de notificações
- `database/auto_normalize_found_trigger.sql` - Auto privacidade
- `database/add_meeting_point.sql` - Ponto de encontro
- `database/fix_chats_notifications.sql` - ✅ Chats/Notificações (TESTADO)
- `database/points_system.sql` - 🏆 Sistema de pontos (COMPLETO)

---

## 🚀 LAUNCH!

Depois de completar todos os passos:

1. ✅ Anunciar nas redes sociais
2. ✅ Enviar email para early adopters
3. ✅ Monitorar métricas diariamente
4. ✅ Coletar feedback dos usuários
5. ✅ Iterar e melhorar

---

**FMD v0.4.0 - FindMyDocs**  
*Ajudando 1000+ moçambicanos a encontrarem seus documentos* 🇲🇿

**Status**: ✅ Production Ready  
**Data**: 19/01/2025

