# 🚀 Como Rodar o Frontend Vue.js

## ⚠️ IMPORTANTE: Não use Live Server diretamente!

O projeto Vue.js usa **Vite** como build tool, que precisa compilar TypeScript e processar os módulos ES6. Abrir o `index.html` diretamente com Live Server **NÃO vai funcionar**.

## ✅ Forma Correta de Rodar

### 1. Instalar Dependências (se ainda não instalou)
```bash
cd frontend
npm install
```

### 2. Configurar Variáveis de Ambiente (opcional)
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com suas credenciais (se necessário)
# As credenciais já estão hardcoded como fallback, então isso é opcional
```

### 3. Rodar o Servidor de Desenvolvimento
```bash
npm run dev
```

O Vite vai iniciar um servidor de desenvolvimento em:
- **URL**: http://localhost:5173
- **Hot Reload**: Mudanças no código são refletidas automaticamente
- **TypeScript**: Compilado automaticamente
- **CSS**: Processado automaticamente (Tailwind, PostCSS)

### 4. Abrir no Navegador
Abra automaticamente ou acesse manualmente: **http://localhost:5173**

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento (recomendado)
npm run dev

# Build para produção
npm run build

# Preview do build de produção
npm run preview

# Testes
npm run test

# Lint
npm run lint
```

## 🔧 Por que não funciona com Live Server?

1. **TypeScript**: O código está em `.ts` e precisa ser compilado
2. **Módulos ES6**: Usa `import/export` que precisa de um servidor adequado
3. **Vite HMR**: Hot Module Replacement para desenvolvimento rápido
4. **Aliases**: Usa `@/` que precisa ser resolvido pelo Vite
5. **PostCSS/Tailwind**: CSS precisa ser processado

## 🎯 Resumo

✅ **Use**: `npm run dev` (dentro da pasta `frontend/`)  
❌ **Não use**: Live Server diretamente no `index.html`

O Vite vai abrir automaticamente no navegador em `http://localhost:5173`!

