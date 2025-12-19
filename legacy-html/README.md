# Arquivos HTML Legados

Esta pasta contém os arquivos HTML antigos que foram substituídos pelo frontend Vue.js.

## Arquivos

- `index.html.old` - Página principal antiga (substituída por `frontend/src/views/`)
- `login.html.old` - Página de login antiga (substituída por `frontend/src/views/LoginView.vue`)

## Migração

A aplicação agora utiliza o frontend Vue.js localizado em `frontend/` como a UI principal.

### Estrutura Nova

- **Frontend Vue**: `frontend/src/`
  - Views: `frontend/src/views/`
  - Componentes: `frontend/src/components/`
  - Router: `frontend/src/router/index.ts`

### Como Funciona Agora

1. **Desenvolvimento**: 
   - Frontend Vue roda em `http://localhost:5173`
   - Backend API roda em `http://localhost:3000`

2. **Produção**:
   - O servidor Node.js serve o frontend Vue buildado de `frontend/dist/`
   - Todas as rotas não-API servem o `index.html` do Vue
   - O Vue Router gerencia o roteamento no cliente

3. **Deploy**:
   - GitHub Actions faz build do frontend e deploy para GitHub Pages
   - Ou o servidor Node.js serve o frontend buildado

## Notas

Estes arquivos são mantidos apenas para referência histórica. Não devem ser usados em produção.

