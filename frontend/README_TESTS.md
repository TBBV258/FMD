# Guia de Testes - FindMyDocs Frontend

## 🧪 Configuração de Testes

O projeto usa **Vitest** para testes unitários e de integração.

## 📦 Dependências de Teste

- **Vitest**: Framework de testes rápido
- **@vue/test-utils**: Utilitários para testar componentes Vue
- **happy-dom**: Ambiente DOM para testes
- **@vitest/ui**: Interface gráfica para visualizar testes

## 🚀 Comandos de Teste

```bash
# Executar testes em modo watch
npm run test

# Executar testes uma vez
npm run test:run

# Executar testes com interface UI
npm run test:ui

# Executar testes com cobertura
npm run test:coverage
```

## 📁 Estrutura de Testes

```
src/tests/
├── setup.ts                    # Configuração global dos testes
├── components/                 # Testes de componentes
│   └── BaseButton.spec.ts
├── utils/                      # Testes de utilitários
│   ├── formatters.spec.ts
│   └── validators.spec.ts
├── stores/                     # Testes de stores Pinia
├── composables/                # Testes de composables
└── views/                      # Testes de views
```

## ✍️ Escrevendo Testes

### Teste de Componente

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: {
        title: 'Test'
      }
    })
    
    expect(wrapper.text()).toContain('Test')
  })

  it('emits event on click', async () => {
    const wrapper = mount(MyComponent)
    
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.emitted()).toHaveProperty('click')
  })
})
```

### Teste de Utilitário

```typescript
import { describe, it, expect } from 'vitest'
import { formatDate } from '@/utils/formatters'

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-01')
    expect(formatDate(date)).toBe('01 jan 2024')
  })
})
```

### Teste de Store (Pinia)

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default values', () => {
    const store = useAuthStore()
    
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
})
```

### Teste de Composable

```typescript
import { describe, it, expect } from 'vitest'
import { useToast } from '@/composables/useToast'

describe('useToast', () => {
  it('shows success toast', () => {
    const { toasts, success } = useToast()
    
    success('Test message')
    
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Test message')
    expect(toasts.value[0].type).toBe('success')
  })
})
```

## 🎯 Boas Práticas

### 1. Organize seus testes
- Um arquivo de teste por componente/utilitário
- Agrupe testes relacionados com `describe`
- Use nomes descritivos para os testes

### 2. Teste comportamento, não implementação
```typescript
// ❌ Ruim - testa implementação
expect(wrapper.vm.internalState).toBe(true)

// ✅ Bom - testa comportamento
expect(wrapper.find('.success-message').exists()).toBe(true)
```

### 3. Use beforeEach para setup
```typescript
describe('MyComponent', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(MyComponent)
  })

  it('test 1', () => {
    // usa wrapper
  })

  it('test 2', () => {
    // usa wrapper
  })
})
```

### 4. Limpe após os testes
```typescript
afterEach(() => {
  wrapper.unmount()
})
```

### 5. Mock dependências externas
```typescript
import { vi } from 'vitest'

// Mock de módulo
vi.mock('@/utils/api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: [] }))
}))

// Mock de função
const mockFn = vi.fn()
```

## 📊 Cobertura de Código

O projeto está configurado para gerar relatórios de cobertura:

```bash
npm run test:coverage
```

Isso gera:
- Relatório em texto no terminal
- Relatório HTML em `coverage/index.html`
- Relatório JSON em `coverage/coverage-final.json`

### Meta de Cobertura

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## 🔍 Debug de Testes

### 1. Usar console.log
```typescript
it('debugs component', () => {
  const wrapper = mount(MyComponent)
  console.log(wrapper.html())  // Ver HTML renderizado
  console.log(wrapper.vm)      // Ver instância Vue
})
```

### 2. Usar Vitest UI
```bash
npm run test:ui
```

Abre interface gráfica no navegador para:
- Ver testes rodando
- Inspecionar falhas
- Ver cobertura visual

### 3. Filtrar testes
```bash
# Rodar apenas testes que contenham "Button"
npm run test Button

# Rodar apenas um arquivo
npm run test src/tests/components/BaseButton.spec.ts
```

## 🚨 Testes Atuais

### Componentes Testados
- ✅ BaseButton - Testes completos

### Utilitários Testados
- ✅ formatters - Testes completos
- ✅ validators - Testes completos

### Pendente
- ⏳ FeedCard
- ⏳ Auth Store
- ⏳ Documents Store
- ⏳ useInfiniteScroll
- ⏳ Views (LoginView, FeedView, etc.)

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Library](https://testing-library.com/docs/vue-testing-library/intro/)

## 🎓 Exemplos Avançados

### Testar Roteamento
```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: Home }]
})

const wrapper = mount(MyComponent, {
  global: {
    plugins: [router]
  }
})
```

### Testar Pinia Stores
```typescript
const wrapper = mount(MyComponent, {
  global: {
    plugins: [createPinia()]
  }
})
```

### Testar Slots
```typescript
const wrapper = mount(MyComponent, {
  slots: {
    default: 'Slot content',
    header: '<h1>Header</h1>'
  }
})
```

### Testar Eventos Assíncronos
```typescript
it('handles async operation', async () => {
  const wrapper = mount(MyComponent)
  
  await wrapper.find('button').trigger('click')
  await wrapper.vm.$nextTick()
  
  expect(wrapper.find('.result').text()).toBe('Success')
})
```

---

**Nota**: Mantenha os testes sempre atualizados conforme o código evolui!

