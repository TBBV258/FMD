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
            <div class="flex items-center justify-center space-x-1">
              <p class="text-2xl font-bold text-success">{{ profile?.points || 0 }}</p>
              <button
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                @click.stop="showPointsInfo = true"
                title="Como ganhar pontos?"
              >
                <i class="fas fa-info-circle text-xs"></i>
              </button>
            </div>
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

    <!-- Points Info Modal -->
    <BaseModal v-model="showPointsInfo" title="Como ganhar pontos?">
      <div class="space-y-3">
        <div class="flex items-start space-x-3">
          <i class="fas fa-check-double text-success mt-1"></i>
          <div>
            <p class="font-semibold">Match de documento</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">+50 pontos</p>
          </div>
        </div>
        <div class="flex items-start space-x-3">
          <i class="fas fa-file-alt text-primary mt-1"></i>
          <div>
            <p class="font-semibold">Reportar documento</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">+10 pontos</p>
          </div>
        </div>
        <div class="flex items-start space-x-3">
          <i class="fas fa-shield-alt text-warning-dark mt-1"></i>
          <div>
            <p class="font-semibold">Documento verificado</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">+20 pontos</p>
          </div>
        </div>
        <div class="flex items-start space-x-3">
          <i class="fas fa-calendar-day text-info mt-1"></i>
          <div>
            <p class="font-semibold">Login diário</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">+5 pontos</p>
          </div>
        </div>
        <div class="flex items-start space-x-3">
          <i class="fas fa-hands-helping text-success mt-1"></i>
          <div>
            <p class="font-semibold">Ajudar outros</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">+15 pontos</p>
          </div>
        </div>
        <div class="flex items-start space-x-3">
          <i class="fas fa-user-check text-primary mt-1"></i>
          <div>
            <p class="font-semibold">Completar perfil</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">+25 pontos</p>
          </div>
        </div>
      </div>
    </BaseModal>

    <!-- Points Ranking Section -->
    <PointsRankingSection />

    <!-- Meus documentos (lista compacta) -->
    <div class="card mt-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-dark-text">Meus documentos</h3>
        <button class="text-primary text-sm" @click="router.push('/documents')">
          Ver todos
        </button>
      </div>

      <div v-if="docsLoading" class="text-gray-500">Carregando documentos...</div>
      <div v-else-if="docsError" class="text-red-500">{{ docsError }}</div>
      <div v-else-if="myDocuments.length === 0" class="text-gray-500">
        Nenhum documento cadastrado.
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
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useDocuments } from '@/composables/useDocuments'
import MainLayout from '@/components/layout/MainLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import ProfilePhotoUpload from '@/components/profile/ProfilePhotoUpload.vue'
import SubscriptionPlansModal from '@/components/profile/SubscriptionPlansModal.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import PointsRankingSection from '@/components/profile/PointsRankingSection.vue'

const router = useRouter()
const authStore = useAuthStore()
const { success } = useToast()
const { items: myDocuments, loading: docsLoading, error: docsError, fetchMyDocuments } = useDocuments()

const isLoggingOut = ref(false)
const showPlansModal = ref(false)
const showPointsInfo = ref(false)

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
    action: () => router.push('/edit-profile')
  },
  {
    icon: 'fas fa-file-alt',
    label: 'Meus Documentos',
    action: () => router.push('/documents')
  },
  {
    icon: 'fas fa-crown',
    label: 'Planos de Subscrição',
    action: () => router.push('/subscription-plans')
  },
  {
    icon: 'fas fa-bell',
    label: 'Notificações',
    action: () => router.push('/notifications')
  },
  {
    icon: 'fas fa-lock',
    label: 'Privacidade e Segurança',
    action: () => router.push('/privacy-security')
  },
  {
    icon: 'fas fa-question-circle',
    label: 'Ajuda e Suporte',
    action: () => router.push('/help-support')
  },
  {
    icon: 'fas fa-cog',
    label: 'Configurações',
    action: () => router.push('/settings')
  },
]

onMounted(async () => {
  if (authStore.user?.id) {
    await fetchMyDocuments(authStore.user.id)
  }
})
</script>
