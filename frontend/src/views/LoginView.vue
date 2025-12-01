<template>
  <div class="min-h-screen bg-gradient-to-br from-primary to-success flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <img src="/logofmd.jpg" alt="FindMyDocs Logo" class="h-20 w-20 mx-auto rounded-2xl shadow-lg mb-4" />
      <h1 class="text-3xl font-bold text-white mb-2">FindMyDocs</h1>
        <p class="text-white/80">Gestão de Documentos Perdidos</p>
      </div>

      <!-- Auth Card -->
      <div class="card">
        <!-- Tabs -->
        <div class="flex border-b border-gray-200 dark:border-dark-border mb-6">
            <button
            :class="tabClass('login')"
            @click="currentTab = 'login'"
            >
            Login
            </button>
            <button
            :class="tabClass('register')"
            @click="currentTab = 'register'"
            >
              Registar
            </button>
          </div>

          <!-- Login Form -->
        <form v-if="currentTab === 'login'" @submit.prevent="handleLogin" class="space-y-4">
          <BaseInput
                v-model="loginForm.email"
            label="Email"
                type="email"
            placeholder="seu@email.com"
            icon="fas fa-envelope"
            :error="errors.email"
                required
              />

          <BaseInput
                v-model="loginForm.password"
            label="Senha"
                type="password"
                placeholder="••••••••"
            icon="fas fa-lock"
            :error="errors.password"
                required
          />
          
          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center">
              <input type="checkbox" class="mr-2" />
              <span class="text-gray-600 dark:text-gray-400">Lembrar-me</span>
            </label>
            <a href="#" class="text-primary hover:underline">Esqueceu a senha?</a>
            </div>

          <BaseButton
              type="submit"
            variant="primary"
            size="lg"
            full-width
            :loading="isLoading"
            loading-text="Entrando..."
          >
            Entrar
          </BaseButton>
          
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-dark-border"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-dark-card text-gray-500">Ou continue com</span>
            </div>
          </div>

          <BaseButton
            variant="outline"
            size="lg"
            full-width
            @click="handleGoogleLogin"
          >
            <i class="fab fa-google mr-2 text-red-500"></i>
            Google
          </BaseButton>
        </form>
        
        <!-- Register Form -->
        <form v-else @submit.prevent="handleRegister" class="space-y-4">
          <BaseInput
            v-model="registerForm.fullName"
            label="Nome Completo"
            placeholder="João Silva"
            icon="fas fa-user"
            :error="errors.fullName"
            required
          />
          
          <BaseInput
            v-model="registerForm.email"
            label="Email"
            type="email"
            placeholder="seu@email.com"
            icon="fas fa-envelope"
            :error="errors.email"
            required
          />
          
          <BaseInput
            v-model="registerForm.phoneNumber"
            label="Telefone (opcional)"
            type="tel"
            placeholder="+258 XX XXX XXXX"
            icon="fas fa-phone"
          />
          
          <BaseInput
            v-model="registerForm.password"
            label="Senha"
            type="password"
            placeholder="••••••••"
            icon="fas fa-lock"
            :error="errors.password"
            hint="Mínimo 6 caracteres"
            required
          />
          
          <BaseInput
            v-model="registerForm.confirmPassword"
            label="Confirmar Senha"
            type="password"
            placeholder="••••••••"
            icon="fas fa-lock"
            :error="errors.confirmPassword"
            required
          />
          
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            full-width
            :loading="isLoading"
            loading-text="Criando conta..."
          >
            Criar Conta
          </BaseButton>
        </form>
    </div>

    <!-- Footer -->
      <p class="text-center text-white/80 text-sm mt-6">
        © 2024 FindMyDocs. Todos os direitos reservados.
      </p>
    </div>
    
    <!-- Toast Container -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

const currentTab = ref<'login' | 'register'>('login')
const isLoading = ref(false)

const loginForm = reactive({
  email: '',
  password: ''
})

const registerForm = reactive({
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  country: 'MZ'
})

const errors = reactive({
  email: '',
  password: '',
  fullName: '',
  confirmPassword: ''
})

const tabClass = (tab: string) => {
  const base = 'flex-1 py-3 font-medium transition-all border-b-2'
  if (tab === currentTab.value) {
    return `${base} border-primary text-primary`
  }
  return `${base} border-transparent text-gray-500 hover:text-gray-700`
}

const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

const clearErrors = () => {
  errors.email = ''
  errors.password = ''
  errors.fullName = ''
  errors.confirmPassword = ''
}

const handleLogin = async () => {
  clearErrors()
  
  // Validation
  if (!validateEmail(loginForm.email)) {
    errors.email = 'Email inválido'
    return
  }
  
  if (loginForm.password.length < 6) {
    errors.password = 'Senha deve ter no mínimo 6 caracteres'
    return
  }
  
  isLoading.value = true
  
  const result = await authStore.signIn(loginForm.email, loginForm.password)
    
  isLoading.value = false
  
  if (result.success) {
    success('Login realizado com sucesso!')
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } else {
    showError(result.error || 'Erro ao fazer login')
    errors.email = result.error || ''
  }
}

const handleRegister = async () => {
  clearErrors()
  
  // Validation
  if (!registerForm.fullName.trim()) {
    errors.fullName = 'Nome é obrigatório'
    return
  }
  
  if (!validateEmail(registerForm.email)) {
    errors.email = 'Email inválido'
    return
  }
  
  if (registerForm.password.length < 6) {
    errors.password = 'Senha deve ter no mínimo 6 caracteres'
    return
  }
  
  if (registerForm.password !== registerForm.confirmPassword) {
    errors.confirmPassword = 'Senhas não conferem'
    return
  }
  
  isLoading.value = true
  
  const result = await authStore.signUp(
    registerForm.email,
    registerForm.password,
      {
      fullName: registerForm.fullName,
      phoneNumber: registerForm.phoneNumber,
      country: registerForm.country
      }
    )
    
  isLoading.value = false
  
  if (result.success) {
    success('Conta criada com sucesso! Verifique seu email.')
    currentTab.value = 'login'
    loginForm.email = registerForm.email
  } else {
    showError(result.error || 'Erro ao criar conta')
  }
}

const handleGoogleLogin = async () => {
  // TODO: Implement Google OAuth
  showError('Login com Google em breve!')
}
</script>
