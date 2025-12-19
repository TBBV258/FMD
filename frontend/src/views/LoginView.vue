<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-400 via-orange-300 to-orange-200 flex items-center justify-center px-4 relative overflow-hidden">
    <!-- Decorative circles -->
    <div class="absolute top-10 right-20 w-2 h-2 bg-white/30 rounded-full"></div>
    <div class="absolute top-16 right-32 w-2 h-2 bg-white/30 rounded-full"></div>
    <div class="absolute top-12 right-24 w-2 h-2 bg-white/30 rounded-full"></div>
    <div class="absolute top-20 right-16 w-2 h-2 bg-white/40 rounded-full"></div>
    <div class="absolute bottom-32 left-16 w-2 h-2 bg-white/30 rounded-full"></div>
    <div class="absolute bottom-40 left-20 w-2 h-2 bg-white/30 rounded-full"></div>
    <div class="absolute bottom-36 left-12 w-2 h-2 bg-white/40 rounded-full"></div>
    
    <div class="w-full max-w-md">
      <!-- Welcome card -->
      <div v-if="!showAuthForm" class="bg-white dark:bg-dark-card rounded-3xl shadow-2xl p-8 text-center animate-fade-in">
        <!-- Logo/Icon -->
        <div class="mb-8">
          <img src="/logofmd.jpg" alt="FindMyDocs Logo" class="h-32 w-32 mx-auto rounded-2xl shadow-lg mb-4" />
        </div>
        
        <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">Welcome!</h1>
        <p class="text-gray-600 dark:text-gray-400 mb-8 text-sm">
          Sign in to access your documents
        </p>
        
        <button
          @click="showLogin"
          class="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 mb-4"
        >
          Go to Sign in
        </button>
        
        <p class="text-sm text-gray-600 dark:text-gray-400">
          No account yet? <button @click="showRegister" class="text-orange-500 font-semibold hover:underline">Sign up</button>
        </p>
      </div>

      <!-- Auth Form (Login/Register) -->
      <div v-if="showAuthForm" class="bg-white dark:bg-dark-card rounded-3xl shadow-2xl p-8 animate-slide-in">
        <!-- Back button -->
        <button @click="showAuthForm = false" class="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center">
          <i class="fas fa-arrow-left mr-2"></i>
        </button>
        
        <!-- Title -->
        <h2 class="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">
          {{ currentTab === 'login' ? 'Welcome back!' : 'Create new account' }}
        </h2>
        <div class="w-12 h-1 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full mb-6"></div>

        <!-- Login Form -->
        <form v-if="currentTab === 'login'" @submit.prevent="handleLogin" class="space-y-5">
          <BaseInput
            v-model="loginForm.email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            icon="fas fa-envelope"
            :error="errors.email"
            required
          />

          <BaseInput
            v-model="loginForm.password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            icon="fas fa-lock"
            :error="errors.password"
            required
          />
          
          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" class="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" />
              <span class="ml-2 text-gray-600 dark:text-gray-400">Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Signing in...' : 'Sign in!' }}
          </button>
          
          <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            Don't have an account? <button type="button" @click="currentTab = 'register'" class="text-orange-500 font-semibold hover:underline">Sign up</button>
          </p>
        </form>
        
        <!-- Register Form -->
        <form v-else @submit.prevent="handleRegister" class="space-y-5">
          <BaseInput
            v-model="registerForm.fullName"
            label="Full name"
            placeholder="John Doe"
            icon="fas fa-user"
            :error="errors.fullName"
            required
          />
          
          <BaseInput
            v-model="registerForm.email"
            label="Email address"
            type="email"
            placeholder="Enter your email"
            icon="fas fa-envelope"
            :error="errors.email"
            required
          />
          
          <BaseInput
            v-model="registerForm.password"
            label="Create password"
            type="password"
            placeholder="Min 6 characters"
            icon="fas fa-lock"
            :error="errors.password"
            required
          />
          
          <BaseInput
            v-model="registerForm.confirmPassword"
            label="Confirm password"
            type="password"
            placeholder="Confirm your password"
            icon="fas fa-lock"
            :error="errors.confirmPassword"
            required
          />
          
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Creating account...' : 'Sign Up!' }}
          </button>
          
          <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            Already have an account? <button type="button" @click="currentTab = 'login'" class="text-orange-500 font-semibold hover:underline">Sign in</button>
          </p>
        </form>
      </div>
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
import ToastContainer from '@/components/common/ToastContainer.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

const currentTab = ref<'login' | 'register'>('login')
const showAuthForm = ref(false)
const isLoading = ref(false)

const showLogin = () => {
  currentTab.value = 'login'
  showAuthForm.value = true
}

const showRegister = () => {
  currentTab.value = 'register'
  showAuthForm.value = true
}

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

const handleRegister = async (e?: Event) => {
  if (e) {
    e.preventDefault()
    e.stopPropagation()
  }
  
  clearErrors()
  
  console.log('handleRegister called', { 
    fullName: registerForm.fullName,
    email: registerForm.email,
    passwordLength: registerForm.password.length,
    confirmPasswordLength: registerForm.confirmPassword.length
  })
  
  // Validation
  if (!registerForm.fullName.trim()) {
    errors.fullName = 'Nome é obrigatório'
    console.log('Validation failed: fullName is empty')
    showError('Nome é obrigatório')
    return false
  }
  
  if (!validateEmail(registerForm.email)) {
    errors.email = 'Email inválido'
    console.log('Validation failed: invalid email')
    showError('Email inválido')
    return false
  }
  
  if (registerForm.password.length < 6) {
    errors.password = 'Senha deve ter no mínimo 6 caracteres'
    console.log('Validation failed: password too short')
    showError('Senha deve ter no mínimo 6 caracteres')
    return false
  }
  
  if (registerForm.password !== registerForm.confirmPassword) {
    errors.confirmPassword = 'Senhas não conferem'
    console.log('Validation failed: passwords do not match')
    showError('Senhas não conferem')
    return false
  }
  
  console.log('Validation passed, calling signUp...')
  isLoading.value = true
  
  try {
    const result = await authStore.signUp(
      registerForm.email,
      registerForm.password,
      {
        fullName: registerForm.fullName,
        phoneNumber: registerForm.phoneNumber,
        country: registerForm.country
      }
    )
    
    console.log('signUp result:', result)
    
    if (result.success) {
      success('Conta criada com sucesso! Verifique seu email.')
      currentTab.value = 'login'
      loginForm.email = registerForm.email
      // Clear register form
      registerForm.fullName = ''
      registerForm.email = ''
      registerForm.password = ''
      registerForm.confirmPassword = ''
      registerForm.phoneNumber = ''
    } else {
      showError(result.error || 'Erro ao criar conta')
      console.error('SignUp error:', result.error)
    }
  } catch (error) {
    console.error('Unexpected error in handleRegister:', error)
    showError('Erro inesperado ao criar conta. Tente novamente.')
  } finally {
    isLoading.value = false
  }
  
  return false
}
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}

.animate-slide-in {
  animation: slide-in 0.4s ease-out;
}
</style>
