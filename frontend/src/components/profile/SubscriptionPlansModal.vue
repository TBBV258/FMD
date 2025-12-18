<template>
  <BaseModal v-model="isOpen" title="Planos de Subscrição" maxWidth="lg">
    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Escolha o plano que melhor se adapta às suas necessidades. Economize mais com planos de longo prazo!
      </p>
      
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
              <span>Busca avançada</span>
            </li>
            <li class="flex items-start space-x-2">
              <i class="fas fa-check text-success mt-1"></i>
              <span>Notificações push</span>
            </li>
            <li class="flex items-start space-x-2">
              <i class="fas fa-check text-success mt-1"></i>
              <span>Suporte prioritário</span>
            </li>
            <li class="flex items-start space-x-2">
              <i class="fas fa-check text-success mt-1"></i>
              <span>Backup automático</span>
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
              <span class="font-medium">Uploads ilimitados</span>
            </li>
            <li class="flex items-start space-x-2">
              <i class="fas fa-check text-primary mt-1"></i>
              <span class="font-medium">Sem anúncios</span>
            </li>
            <li class="flex items-start space-x-2">
              <i class="fas fa-check text-primary mt-1"></i>
              <span class="font-medium">Busca avançada</span>
            </li>
            <li class="flex items-start space-x-2">
              <i class="fas fa-check text-primary mt-1"></i>
              <span class="font-medium">Notificações push</span>
            </li>
            <li class="flex items-start space-x-2">
              <i class="fas fa-check text-primary mt-1"></i>
              <span class="font-medium">Suporte prioritário</span>
            </li>
            <li class="flex items-start space-x-2">
              <i class="fas fa-check text-primary mt-1"></i>
              <span class="font-medium">Backup automático</span>
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
              <span class="font-medium">Uploads ilimitados</span>
            </li>
            <li class="flex items-start space-x-2">
              <i class="fas fa-check text-success mt-1"></i>
              <span class="font-medium">Sem anúncios</span>
            </li>
            <li class="flex items-start space-x-2">
              <i class="fas fa-check text-success mt-1"></i>
              <span class="font-medium">Busca avançada</span>
            </li>
            <li class="flex items-start space-x-2">
              <i class="fas fa-check text-success mt-1"></i>
              <span class="font-medium">Notificações push</span>
            </li>
            <li class="flex items-start space-x-2">
              <i class="fas fa-check text-success mt-1"></i>
              <span class="font-medium">Suporte prioritário</span>
            </li>
            <li class="flex items-start space-x-2">
              <i class="fas fa-check text-success mt-1"></i>
              <span class="font-medium">Backup automático</span>
            </li>
            <li class="flex items-start space-x-2">
              <i class="fas fa-star text-warning-dark mt-1"></i>
              <span class="font-medium text-warning-dark">2 meses grátis</span>
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
      
      <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          💳 Aceitamos M-Pesa, Cartão de Crédito e Transferência Bancária
        </p>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const isOpen = defineModel<boolean>()
const authStore = useAuthStore()
const { success } = useToast()

const currentPlan = computed(() => authStore.profile?.plan || 'free')

const handleUpgrade = (plan: string) => {
  // TODO: Implementar integração de pagamento
  success(`Funcionalidade de pagamento em breve para o plano ${plan}!`)
  isOpen.value = false
}
</script>

