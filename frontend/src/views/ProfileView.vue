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
          {{ profile?.full_name || $t('profile.user') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ user?.email }}
        </p>

      <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-dark-border">
          <div>
            <p class="text-2xl font-bold text-primary">{{ profile?.document_count || 0 }}</p>
            <p class="text-xs text-gray-500">{{ $t('profile.documents') }}</p>
          </div>
          <div 
            class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors"
            @click="toggleRankings"
          >
            <p class="text-2xl font-bold text-success">{{ profile?.points || 0 }}</p>
            <p class="text-xs text-gray-500">
              {{ $t('profile.points') }}
              <i class="fas fa-chevron-down ml-1 text-xs" :class="{ 'rotate-180': showRankings }"></i>
            </p>
          </div>
          <div>
            <p class="text-2xl font-bold text-warning-dark">
              <i class="fas fa-crown"></i>
            </p>
            <p class="text-xs text-gray-500 capitalize">{{ profile?.plan || $t('profile.plans.free') }}</p>
          </div>
        </div>
      </div>
      
      <!-- Rankings Section (Collapsible) -->
      <transition name="slide-fade">
        <div v-if="showRankings" class="mt-6">
          <RankingsSection
            :user-points="profile?.points || 0"
            :current-user-id="user?.id || ''"
          />
        </div>
      </transition>

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
        {{ $t('profile.menu.logout') }}
      </BaseButton>
      
      <!-- Version -->
      <p class="text-center text-sm text-gray-500">
        {{ $t('profile.version') }} 2.0.0
      </p>
    </div>

    <!-- Subscription Plans Modal -->
    <SubscriptionPlansModal v-model="showPlansModal" />
    
    <!-- Profile Edit Modal -->
    <ProfileEditModal v-model="showEditModal" />

    <!-- Meus documentos (lista compacta) -->
    <div class="card mt-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-dark-text">{{ $t('profile.myDocs') }}</h3>
        <div class="flex items-center space-x-2">
          <button 
            class="text-primary text-sm flex items-center space-x-1 hover:underline"
            @click="router.push('/save-document')"
          >
            <i class="fas fa-plus text-xs"></i>
            <span>Guardar</span>
          </button>
          <button class="text-primary text-sm hover:underline" @click="router.push('/documents')">
            {{ $t('profile.viewAll') }}
          </button>
        </div>
      </div>

      <div v-if="docsLoading" class="text-gray-500">{{ $t('profile.loading') }}</div>
      <div v-else-if="docsError" class="text-red-500">{{ docsError }}</div>
      <div v-else-if="myDocuments.length === 0" class="text-gray-500">
        {{ $t('profile.noDocs') }}
      </div>

      <ul v-else class="space-y-3">
        <li
          v-for="doc in myDocuments.slice(0, 3)"
          :key="doc.id"
          class="flex items-center justify-between border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2"
        >
          <div class="min-w-0">
            <p class="font-medium text-gray-900 dark:text-dark-text truncate">{{ doc.title }}</p>
            <p class="text-xs text-gray-500 capitalize">{{ doc.status }}</p>
          </div>
          <span class="text-xs text-gray-400">
            {{ new Date(doc.created_at).toLocaleDateString('pt-BR') }}
          </span>
        </li>
      </ul>
    </div>

    <ToastContainer />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useDocuments } from '@/composables/useDocuments'
import { useBackup } from '@/composables/useBackup'
import MainLayout from '@/components/layout/MainLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import ProfilePhotoUpload from '@/components/profile/ProfilePhotoUpload.vue'
import SubscriptionPlansModal from '@/components/profile/SubscriptionPlansModal.vue'
import RankingsSection from '@/components/profile/RankingsSection.vue'
import ProfileEditModal from '@/components/profile/ProfileEditModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()
const { success, error: showError } = useToast()
const { items: myDocuments, loading: docsLoading, error: docsError, fetchMyDocuments } = useDocuments()
const { isBackingUp, backupAllDocuments } = useBackup()

const isLoggingOut = ref(false)
const showPlansModal = ref(false)
const showRankings = ref(false)
const showEditModal = ref(false)

const user = computed(() => authStore.user)
const profile = computed(() => authStore.profile)

const toggleRankings = () => {
  showRankings.value = !showRankings.value
}

const handleBackup = async () => {
  if (!authStore.userId) return
  
  const result = await backupAllDocuments(authStore.userId)
  if (result.success) {
    success(result.message || 'Backup concluído com sucesso!')
  } else {
    showError(result.error || 'Erro ao fazer backup')
  }
}

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
    action: () => showEditModal.value = true
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
    icon: 'fas fa-download',
    label: 'Backup de Documentos',
    action: handleBackup
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

onMounted(async () => {
  if (authStore.user?.id) {
    await fetchMyDocuments(authStore.user.id)
  }
})
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}
</style>
