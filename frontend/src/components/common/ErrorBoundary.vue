<template>
  <div v-if="error" class="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-dark-bg">
    <div class="max-w-md w-full text-center">
      <!-- Error icon -->
      <div class="mb-6">
        <div class="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto">
          <i class="fas fa-exclamation-triangle text-danger text-3xl"></i>
        </div>
      </div>
      
      <!-- Error message -->
      <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">
        Oops! Algo deu errado
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        {{ errorMessage }}
      </p>
      
      <!-- Error details (dev mode) -->
      <details v-if="isDev && errorStack" class="text-left mb-6">
        <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
          Detalhes técnicos
        </summary>
        <pre class="bg-gray-100 dark:bg-dark-card p-4 rounded-lg text-xs overflow-auto max-h-60">{{ errorStack }}</pre>
      </details>
      
      <!-- Actions -->
      <div class="space-y-3">
        <BaseButton
          variant="primary"
          size="lg"
          full-width
          @click="handleReload"
        >
          <i class="fas fa-redo mr-2"></i>
          Tentar Novamente
        </BaseButton>
        
        <BaseButton
          variant="outline"
          size="lg"
          full-width
          @click="handleGoHome"
        >
          <i class="fas fa-home mr-2"></i>
          Voltar ao Início
        </BaseButton>
      </div>
      
      <!-- Support -->
      <p class="text-sm text-gray-500 mt-8">
        Se o problema persistir, entre em contato com o suporte:
        <a href="mailto:support@findmydoc.co.mz" class="text-primary hover:underline">
          support@findmydoc.co.mz
        </a>
      </p>
    </div>
  </div>
  
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from './BaseButton.vue'

const router = useRouter()

const error = ref(false)
const errorMessage = ref('Encontramos um problema inesperado. Por favor, tente novamente.')
const errorStack = ref('')
const isDev = import.meta.env.DEV

onErrorCaptured((err: Error) => {
  error.value = true
  errorMessage.value = err.message || errorMessage.value
  errorStack.value = err.stack || ''
  
  // Log to console in dev mode
  if (isDev) {
    console.error('ErrorBoundary caught:', err)
  }
  
  // Send to error tracking service in production
  if (!isDev) {
    // TODO: Send to Sentry, LogRocket, etc.
    console.error('Production error:', err)
  }
  
  // Prevent error from propagating
  return false
})

const handleReload = () => {
  error.value = false
  errorMessage.value = ''
  errorStack.value = ''
  window.location.reload()
}

const handleGoHome = () => {
  error.value = false
  errorMessage.value = ''
  errorStack.value = ''
  router.push('/')
}
</script>

