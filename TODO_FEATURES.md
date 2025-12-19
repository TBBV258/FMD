# 📋 Features Pendentes - FMD v0.2.2

## ✅ Completado (v0.2.1)
- [x] Sistema completo de traduções (PT/EN)
- [x] Backup de documentos em formato JSON
- [x] Correção de erro ao clicar no ranking/pontos
- [x] Botão "Marcar todas como lidas" em notificações
- [x] Badges com contador de notificações

## 🔄 Em Desenvolvimento

### 1. Opções de Status para Documentos 🔴 ALTA PRIORIDADE
**Problema**: Documentos carregados pelo user não têm opção de marcar como perdido/encontrado.

**Solução Planejada**:
- [ ] Adicionar menu dropdown em cada documento na view "Meus Documentos"
- [ ] Opções no menu:
  - "Marcar como Perdido" (muda status → `lost`, `is_public` → `true`)
  - "Marcar como Encontrado" (muda status → `found`, `is_public` → `true`)
  - "Marcar como Normal/Privado" (muda status → `normal`, `is_public` → `false`)
- [ ] Confirmação antes de mudar status
- [ ] Feedback visual após mudança
- [ ] Atualizar feed automaticamente

**Arquivos a Modificar**:
- `frontend/src/views/DocumentsView.vue`
- `frontend/src/views/ProfileView.vue` (lista de documentos)
- `frontend/src/api/documents.ts` (adicionar método `updateStatus`)

### 2. Auto-marcar Encontrados como Normal 🟡 MÉDIA PRIORIDADE
**Problema**: Documentos marcados como "encontrados" pelo user devem ser automaticamente marcados como normal/privado.

**Solução Planejada**:
- [ ] Criar trigger no Supabase:
```sql
CREATE OR REPLACE FUNCTION auto_normalize_found_documents()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário que marcou como "found" é o dono do documento
  -- E o status mudou para "found"
  -- Então automaticamente muda para "normal" e is_public = false
  IF NEW.status = 'found' AND OLD.status != 'found' AND NEW.user_id = auth.uid() THEN
    NEW.status := 'normal';
    NEW.is_public := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_normalize_found
BEFORE UPDATE OF status ON public.documents
FOR EACH ROW EXECUTE FUNCTION auto_normalize_found_documents();
```

**Arquivos a Criar**:
- `database/auto_normalize_found_trigger.sql`

### 3. Sistema de Permissões 🟢 BAIXA PRIORIDADE (mas importante para UX)
**Problema**: Deve pedir permissões de localização, câmera e fotos aos users em todos dispositivos.

**Solução Planejada**:

#### 3.1 Permissão de Localização
- [ ] Pedir ao abrir MapView
- [ ] Pedir ao reportar documento perdido/encontrado
- [ ] Modal explicativo antes de pedir
- [ ] Opção "Não perguntar novamente"
- [ ] Salvar preferência no localStorage

**Implementação**:
```typescript
// composables/useGeolocation.ts - já existe, precisa melhorar UI
// Adicionar modal explicativo
// Adicionar tratamento de erro amigável
```

#### 3.2 Permissão de Câmera
- [ ] Pedir ao tentar tirar foto
- [ ] Modal explicativo: "Para capturar foto do documento"
- [ ] Fallback para galeria se negar
- [ ] Detectar dispositivo (mobile/desktop)

**Implementação**:
```typescript
// composables/useCamera.ts - já existe, funciona bem
// Melhorar UI do PermissionModal
// Adicionar instruções específicas por dispositivo
```

#### 3.3 Permissão de Galeria/Fotos
- [ ] Input file com accept="image/*"
- [ ] Mobile: Opções "Câmera" ou "Galeria"
- [ ] Desktop: Dialog de seleção de arquivo
- [ ] Drag & drop para desktop

**Já Implementado**:
- ✅ SaveDocumentView tem drag & drop
- ✅ ReportLostView/Found têm file input
- ⚠️ Falta: Menu de escolha "Câmera vs Galeria" em mobile

#### 3.4 Componente Unificado de Permissões
- [ ] Criar `PermissionsManager.vue` component
- [ ] Centralizar lógica de pedidos de permissão
- [ ] UI consistente em todo o app
- [ ] Instruções por tipo de dispositivo:
  - **Mobile Android**: Como permitir no Chrome/Firefox
  - **iOS/Safari**: Como permitir no Safari/iOS
  - **Desktop**: Instruções do browser

**Estrutura**:
```
components/
  permissions/
    PermissionsManager.vue     (novo)
    LocationPermissionModal.vue (novo)
    CameraPermissionModal.vue   (existe como PermissionModal)
    PhotoPickerModal.vue        (novo - escolher câmera/galeria)
```

---

## 🎯 Prioridade de Implementação

### Sprint 1 (Urgente - v0.2.2)
1. **Opções de Status** ⏱️ 2-3 horas
2. **Auto-normalize Found** ⏱️ 1 hora

### Sprint 2 (Importante - v0.3.0)
3. **Sistema de Permissões** ⏱️ 4-6 horas
   - Modal de localização
   - Melhorar modal de câmera
   - Photo picker mobile

---

## 📝 Notas Técnicas

### Mudança de Status de Documentos

**Fluxo Atual**:
```
SaveDocumentView → status: "normal", is_public: false
ReportLostView → status: "lost", is_public: true  
ReportFoundView → status: "found", is_public: true
```

**Fluxo Desejado**:
```
User carrega documento → "normal" (privado)
User marca como perdido → "lost" (público no feed)
User marca como encontrado → "found" (público no feed)
Dono marca seu próprio como encontrado → "normal" (privado)
```

### Permissões HTML5

**Geolocation API**:
```javascript
navigator.geolocation.getCurrentPosition(success, error, options)
// Pede permissão automaticamente na primeira chamada
```

**MediaDevices API (Câmera)**:
```javascript
navigator.mediaDevices.getUserMedia({ video: true })
// Pede permissão automaticamente
```

**File Input (Fotos)**:
```html
<input type="file" accept="image/*" capture="environment">
<!-- Mobile: abre câmera diretamente -->
<input type="file" accept="image/*">
<!-- Mobile: escolhe câmera ou galeria -->
```

---

## 🚀 Depois de Implementar

- [ ] Testar em Android (Chrome)
- [ ] Testar em iOS (Safari)
- [ ] Testar em Desktop (Chrome, Firefox, Safari)
- [ ] Documentar no CHANGELOG
- [ ] Atualizar versão para 0.2.2 ou 0.3.0

