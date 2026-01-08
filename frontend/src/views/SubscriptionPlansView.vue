<template>
  <MainLayout>
    <div class="px-4 py-6 space-y-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">Planos de Subscrição</h1>

      <!-- Current Plan Status -->
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-dark-text">Plano Atual</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ currentPlanLabel }}
            </p>
            <p v-if="activeSubscription" class="text-xs text-gray-500 mt-2">
              Expira em: {{ formatDate(activeSubscription.expires_at) }}
            </p>
          </div>
          <div class="text-right">
            <span :class="planBadgeClass">
              {{ profile?.plan?.toUpperCase() || 'FREE' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Subscription Plans -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Escolha um Plano</h2>
        <div class="grid md:grid-cols-3 gap-4">
          <!-- Monthly Plan -->
          <div 
            class="border-2 rounded-xl p-6 transition-all hover:shadow-lg"
            :class="currentPlan === 'monthly' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'"
          >
            <div class="text-center mb-4">
              <h3 class="text-xl font-bold text-gray-900 dark:text-dark-text">Mensal</h3>
              <p class="text-3xl font-bold text-gray-900 dark:text-dark-text mt-2">500 MT</p>
              <p class="text-sm text-gray-500">por mês</p>
            </div>
            
            <ul class="space-y-3 mb-6 text-sm">
              <li class="flex items-start space-x-2">
                <i class="fas fa-check text-success mt-1"></i>
                <span>Uploads ilimitados</span>
              </li>
              <li class="flex items-start space-x-2">
                <i class="fas fa-check text-success mt-1"></i>
                <span>Sem anúncios</span>
              </li>
              <li class="flex items-start space-x-2">
                <i class="fas fa-check text-success mt-1"></i>
                <span>Notificações prioritárias</span>
              </li>
              <li class="flex items-start space-x-2">
                <i class="fas fa-check text-success mt-1"></i>
                <span>Suporte prioritário</span>
              </li>
            </ul>
            
            <BaseButton 
              variant="primary"
              full-width
              @click="handleUpgrade('monthly')"
              :disabled="currentPlan === 'monthly'"
            >
              {{ currentPlan === 'monthly' ? 'Plano Atual' : 'Selecionar' }}
            </BaseButton>
          </div>
          
          <!-- Quarterly Plan -->
          <div 
            class="border-2 rounded-xl p-6 relative transition-all hover:shadow-lg"
            :class="currentPlan === 'quarterly' ? 'border-primary bg-primary/5' : 'border-primary'"
          >
            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span class="bg-primary text-white px-4 py-1 rounded-full text-xs font-bold">
                POPULAR
              </span>
            </div>
            
            <div class="text-center mb-4">
              <h3 class="text-xl font-bold text-primary">Trimestral</h3>
              <p class="text-3xl font-bold text-gray-900 dark:text-dark-text mt-2">1.350 MT</p>
              <p class="text-sm text-gray-500">a cada 3 meses</p>
              <p class="text-xs text-success font-semibold mt-1">Economize 10%</p>
            </div>
            
            <ul class="space-y-3 mb-6 text-sm">
              <li class="flex items-start space-x-2">
                <i class="fas fa-check text-primary mt-1"></i>
                <span class="font-medium">Tudo do plano mensal</span>
              </li>
              <li class="flex items-start space-x-2">
                <i class="fas fa-check text-primary mt-1"></i>
                <span class="font-medium">Destaque de documentos</span>
              </li>
              <li class="flex items-start space-x-2">
                <i class="fas fa-check text-primary mt-1"></i>
                <span class="font-medium">Estatísticas avançadas</span>
              </li>
            </ul>
            
            <BaseButton 
              variant="primary"
              full-width
              @click="handleUpgrade('quarterly')"
              :disabled="currentPlan === 'quarterly'"
            >
              {{ currentPlan === 'quarterly' ? 'Plano Atual' : 'Selecionar' }}
            </BaseButton>
          </div>

          <!-- Annual Plan -->
          <div 
            class="border-2 rounded-xl p-6 transition-all hover:shadow-lg"
            :class="currentPlan === 'annual' ? 'border-success bg-success/5' : 'border-success'"
          >
            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span class="bg-success text-white px-4 py-1 rounded-full text-xs font-bold">
                MELHOR VALOR
              </span>
            </div>
            
            <div class="text-center mb-4 mt-2">
              <h3 class="text-xl font-bold text-success">Anual</h3>
              <p class="text-3xl font-bold text-gray-900 dark:text-dark-text mt-2">4.800 MT</p>
              <p class="text-sm text-gray-500">por ano</p>
              <p class="text-xs text-success font-semibold mt-1">Economize 20%</p>
            </div>
            
            <ul class="space-y-3 mb-6 text-sm">
              <li class="flex items-start space-x-2">
                <i class="fas fa-check text-success mt-1"></i>
                <span class="font-medium">Tudo do plano trimestral</span>
              </li>
              <li class="flex items-start space-x-2">
                <i class="fas fa-check text-success mt-1"></i>
                <span class="font-medium">2 meses grátis</span>
              </li>
              <li class="flex items-start space-x-2">
                <i class="fas fa-check text-success mt-1"></i>
                <span class="font-medium">API access</span>
              </li>
            </ul>
            
            <BaseButton 
              variant="success"
              full-width
              @click="handleUpgrade('annual')"
              :disabled="currentPlan === 'annual'"
            >
              {{ currentPlan === 'annual' ? 'Plano Atual' : 'Selecionar' }}
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Document Highlight Feature -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Destaque de Documentos</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Use seus pontos para destacar um documento perdido no topo do feed e aumentar as chances de encontrá-lo.
        </p>
        <BaseButton
          variant="outline"
          @click="showHighlightModal = true"
          :disabled="!hasDocuments"
        >
          <i class="fas fa-star mr-2"></i>
          Destacar Documento
        </BaseButton>
      </div>

      <!-- Invoice History -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Histórico de Faturas</h2>
        <InvoiceHistory />
      </div>

      <!-- Document Highlight Modal -->
      <DocumentHighlightModal
        v-model="showHighlightModal"
        :user-points="profile?.points || 0"
        @highlighted="handleDocumentHighlighted"
      />

      <ToastContainer />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { subscriptionsApi } from '@/api/subscriptions'
import { useDocuments } from '@/composables/useDocuments'
import MainLayout from '@/components/layout/MainLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import InvoiceHistory from '@/components/subscriptions/InvoiceHistory.vue'
import DocumentHighlightModal from '@/components/subscriptions/DocumentHighlightModal.vue'

const authStore = useAuthStore()
const { success, error: showError } = useToast()
const { items: documents } = useDocuments()

const activeSubscription = ref<any>(null)
const showHighlightModal = ref(false)

const profile = computed(() => authStore.profile)
const currentPlan = computed(() => {
  if (!activeSubscription.value) return 'free'
  return activeSubscription.value.billing_period || 'free'
})

const currentPlanLabel = computed(() => {
  if (!activeSubscription.value) return 'Plano Gratuito'
  const period = activeSubscription.value.billing_period
  const labels = {
    monthly: 'Plano Mensal',
    quarterly: 'Plano Trimestral',
    annual: 'Plano Anual'
  }
  return labels[period as keyof typeof labels] || 'Plano Ativo'
})

const planBadgeClass = computed(() => {
  const plan = profile.value?.plan || 'free'
  if (plan === 'premium') return 'badge badge-primary'
  if (plan === 'enterprise') return 'badge badge-success'
  return 'badge bg-gray-500/10 text-gray-600'
})

const hasDocuments = computed(() => documents.value.length > 0)

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const handleUpgrade = async (plan: string) => {
  try {
    // TODO: Implement payment integration
    success(`Funcionalidade de pagamento em breve para o plano ${plan}!`)
  } catch (err: any) {
    showError(err.message || 'Erro ao fazer upgrade')
  }
}

const handleDocumentHighlighted = () => {
  showHighlightModal.value = false
  success('Documento destacado com sucesso!')
}

const loadSubscription = async () => {
  if (!authStore.userId) return

  try {
    activeSubscription.value = await subscriptionsApi.getActiveSubscription(authStore.userId)
  } catch (err: any) {
    console.error('Error loading subscription:', err)
  }
}

onMounted(() => {
  loadSubscription()
})
</script>

