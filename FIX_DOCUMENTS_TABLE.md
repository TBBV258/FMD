# 🔧 Fix Completo - Tabela documents

## ✅ Problema Identificado

O erro `23514` (constraint check violation) acontece porque:

1. **Campo `type`**: Frontend envia `'bi'`, `'passport'`, etc., mas banco espera `'ID card'`, `'Passport'`, etc.
2. **Campo `status`**: Frontend pode enviar `'matched'`, `'returned'`, mas banco só aceita `'normal'`, `'lost'`, `'found'`
3. **Campo `location`**: Frontend envia string, banco espera JSONB

---

## 🎯 Solução: Executar SQL

Execute o arquivo **`fix_documents_table_complete.sql`** no SQL Editor do Supabase.

Este SQL vai:
1. ✅ Ajustar constraint de `type` para aceitar valores do frontend
2. ✅ Ajustar constraint de `status` para aceitar `'matched'` e `'returned'`
3. ✅ Converter campo `location` de JSONB para TEXT (mais simples)

---

## 📋 Valores Aceitos Após o Fix

### Campo `type`:
- `'bi'`, `'passport'`, `'dire'`, `'driver_license'`, `'nuit'`, `'work_card'`, `'student_card'`, `'voter_card'`, `'birth_certificate'`, `'title_deed'`, `'other'`
- Também aceita valores antigos: `'ID card'`, `'DIRE'`, `'Passport'`, `'Bank Doc'`

### Campo `status`:
- `'normal'`, `'lost'`, `'found'`, `'matched'`, `'returned'`

### Campo `location`:
- Agora aceita TEXT (string simples) em vez de JSONB

---

## 🧪 Teste

Após executar o SQL:
1. Tente criar um documento novamente no app
2. Deve funcionar agora! ✅

---

## ⚠️ Nota sobre Location

Se você quiser manter `location` como JSONB (para queries mais complexas), você precisa ajustar o frontend para enviar um objeto JSON em vez de string:

```typescript
// Em vez de:
location: formData.location || ''

// Use:
location: formData.location ? { address: formData.location } : null
```

Mas por enquanto, converter para TEXT é mais simples e funciona imediatamente.

