<template>
  <MainLayout>
    <div class="px-4 py-6 space-y-6">
      <!-- Profile Header -->
      <div class="card text-center">
        <!-- Avatar -->
        <div class="flex justify-center mb-4">
          <ProfilePhotoUpload />
        </div>

        <!-- Name and Email -->
        <h2 class="text-xl font-bold text-gray-900 dark:text-dark-text mb-1">
          {{ profile?.full_name || 'Usuário' }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ user?.email }}
        </p>

      <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-dark-border">
          <div>
            <p class="text-2xl font-bold text-primary">{{ profile?.document_count || 0 }}</p>
            <p class="text-xs text-gray-500">Documentos</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-success">{{ profile?.points || 0 }}</p>
            <p class="text-xs text-gray-500">Pontos</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-warning-dark">
              <i class="fas fa-crown"></i>
            </p>
            <p class="text-xs text-gray-500 capitalize">{{ profile?.plan || 'Free' }}</p>
          </div>
        </div>
          </div>

      <!-- Menu Items -->
      <div class="card divide-y divide-gray-200 dark:divide-dark-border">
        <button
          v-for="item in menuItems"
          :key="item.label"
          class="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left"
          @click="item.action"
        >
          <div class="flex items-center space-x-3">
            <i :class="item.icon" class="text-gray-600 dark:text-gray-400 w-5"></i>
            <span class="text-gray-900 dark:text-dark-text">{{ item.label }}</span>
          </div>
          <i class="fas fa-chevron-right text-gray-400 text-sm"></i>
        </button>
      </div>
      
      <!-- Logout Button -->
      <BaseButton
        variant="danger"
        size="lg"
        full-width
        @click="handleLogout"
        :loading="isLoggingOut"
      >
        <i class="fas fa-sign-out-alt mr-2"></i>
        Sair
      </BaseButton>
      
      <!-- Version -->
      <p class="text-center text-sm text-gray-500">
        Versão 2.0.0
      </p>
    </div>

    <!-- Subscription Plans Modal -->
    <SubscriptionPlansModal v-model="showPlansModal" />

    <ToastContainer />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import MainLayout from '@/components/layout/MainLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import ProfilePhotoUpload from '@/components/profile/ProfilePhotoUpload.vue'
import SubscriptionPlansModal from '@/components/profile/SubscriptionPlansModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const { success } = useToast()

const isLoggingOut = ref(false)
const showPlansModal = ref(false)

const user = computed(() => authStore.user)
const profile = computed(() => authStore.profile)

// Define handleLogout BEFORE menuItems
const handleLogout = async () => {
  isLoggingOut.value = true
  
  const result = await authStore.signOut()
  
  isLoggingOut.value = false
  
  if (result.success) {
    success('Logout realizado com sucesso!')
    router.push('/login')
  }
}

const menuItems = [
  {
    icon: 'fas fa-user-edit',
    label: 'Editar Perfil',
    action: () => {
      // TODO: Implementar edição de perfil
      success('Funcionalidade em breve!')
    }
  },
  {
    icon: 'fas fa-file-alt',
    label: 'Meus Documentos',
    action: () => router.push('/documents')
  },
  {
    icon: 'fas fa-crown',
    label: 'Planos de Subscrição',
    action: () => showPlansModal.value = true
  },
  {
    icon: 'fas fa-bell',
    label: 'Notificações',
    action: () => router.push('/notifications')
  },
  {
    icon: 'fas fa-lock',
    label: 'Privacidade e Segurança',
    action: () => {
      // TODO: Criar view de privacidade
      success('Funcionalidade em breve!')
    }
  },
  {
    icon: 'fas fa-question-circle',
    label: 'Ajuda e Suporte',
    action: () => {
      // TODO: Criar view de ajuda
      success('Funcionalidade em breve!')
    }
  },
  {
    icon: 'fas fa-cog',
    label: 'Configurações',
    action: () => {
      // TODO: Criar view de configurações
      success('Funcionalidade em breve!')
    }
  },
  {
    icon: 'fas fa-sign-out-alt',
    label: 'Sair',
    action: handleLogout
  }
]
</script>
