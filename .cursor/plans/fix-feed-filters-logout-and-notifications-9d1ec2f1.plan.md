<!-- 9d1ec2f1-61f5-4e25-9f0c-fc3cd3cbfc4b 23d85e97-45fc-4699-b434-b61376e4ad84 -->
# Correção de Erros de Schema do Banco de Dados

## Problemas Identificados

1. **Erro 404 - Tabela 'profiles' não existe**: O código está tentando acessar `profiles` mas a tabela correta é `user_profiles`
2. **Erro 400 - Coluna 'returned_to_owner' não existe**: A função `getHelpedCount()` está tentando selecionar uma coluna que não existe na tabela `documents`

## Correções Necessárias

### 1. Corrigir query de profiles em script.js (linha ~1038)

- Substituir `.from('profiles')` por `.from('user_profiles')`
- Verificar se há outras referências diretas à tabela 'profiles' que precisam ser corrigidas

### 2. Corrigir função getHelpedCount() em script.js (linha ~1098)

- Remover `returned_to_owner` da query `.select()`
- Remover verificação de `doc.returned_to_owner` na lógica de contagem
- Usar apenas `status === 'returned'` para contar documentos devolvidos, ou remover essa verificação se a coluna não existir

### 3. Verificar outras referências

- Verificar `chat.js` e `js/chat-box.js` para outras referências à tabela 'profiles'
- Garantir que todas usem `user_profiles` ou `profilesApi.getProfilesByIds()`

### To-dos

- [ ] Corrigir query direta de 'profiles' para 'user_profiles' em script.js linha ~1038
- [ ] Remover coluna 'returned_to_owner' da query em getHelpedCount() em script.js linha ~1098
- [ ] Remover verificação de 'returned_to_owner' na lógica de contagem em getHelpedCount()
- [ ] Verificar e corrigir outras referências à tabela 'profiles' em chat.js e js/chat-box.js