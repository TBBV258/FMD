<template>
  <BaseModal v-model="isOpen" title="Planos de Subscrição" maxWidth="lg">
    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Escolha o plano que melhor se adapta às suas necessidades
      </p>
      
      <div class="grid md:grid-cols-2 gap-4">
        <!-- Free Plan -->
        <div 
          class="border-2 rounded-xl p-6 transition-all"
          :class="currentPlan === 'free' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'"
        >
          <div class="text-center mb-4">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-dark-text">Grátis</h3>
            <p class="text-4xl font-bold text-gray-900 dark:text-dark-text mt-2">0 MT</p>
            <p class="text-sm text-gray-500">para sempre</p>
          </div>
          
          <ul class="space-y-3 mb-6">
            <li class="flex items-start space-x-2 text-sm">
              <i class="fas fa-check text-success mt-1"></i>
              <span>10 uploads por mês</span>
            </li>
            <li class="flex items-start space-x-2 text-sm">
              <i class="fas fa-check text-success mt-1"></i>
              <span>Busca básica</span>
            </li>
            <li class="flex items-start space-x-2 text-sm">
              <i class="fas fa-check text-success mt-1"></i>
              <span>Notificações por email</span>
            </li>
            <li class="flex items-start space-x-2 text-sm">
              <i class="fas fa-check text-success mt-1"></i>
              <span>Suporte padrão</span>
            </li>
            <li class="flex items-start space-x-2 text-sm text-gray-400">
              <i class="fas fa-times mt-1"></i>
              <span>Com anúncios</span>
            </li>
          </ul>
          
          <BaseButton 
            v-if="currentPlan === 'free'"
            variant="outline"
            full-width
            disabled
          >
            Plano Atual
          </BaseButton>
        </div>
        
        <!-- Premium Plan -->
        <div 
          class="border-2 rounded-xl p-6 relative transition-all"
          :class="currentPlan === 'premium' ? 'border-primary bg-primary/5' : 'border-primary'"
        >
          <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span class="bg-primary text-white px-4 py-1 rounded-full text-xs font-bold">
              POPULAR
            </span>
          </div>
          
          <div class="text-center mb-4">
            <h3 class="text-2xl font-bold text-primary">Premium</h3>
            <p class="text-4xl font-bold text-gray-900 dark:text-dark-text mt-2">5.000 MT</p>
            <p class="text-sm text-gray-500">por mês</p>
          </div>
          
          <ul class="space-y-3 mb-6">
            <li class="flex items-start space-x-2 text-sm">
              <i class="fas fa-check text-primary mt-1"></i>
              <span class="font-medium">Uploads ilimitados</span>
            </li>
            <li class="flex items-start space-x-2 text-sm">
              <i class="fas fa-check text-primary mt-1"></i>
              <span class="font-medium">Sem anúncios</span>
            </li>
            <li class="flex items-start space-x-2 text-sm">
              <i class="fas fa-check text-primary mt-1"></i>
              <span class="font-medium">Busca avançada</span>
            </li>
            <li class="flex items-start space-x-2 text-sm">
              <i class="fas fa-check text-primary mt-1"></i>
              <span class="font-medium">Notificações push</span>
            </li>
            <li class="flex items-start space-x-2 text-sm">
              <i class="fas fa-check text-primary mt-1"></i>
              <span class="font-medium">Suporte prioritário</span>
            </li>
            <li class="flex items-start space-x-2 text-sm">
              <i class="fas fa-check text-primary mt-1"></i>
              <span class="font-medium">Backup automático</span>
            </li>
            <li class="flex items-start space-x-2 text-sm">
              <i class="fas fa-check text-primary mt-1"></i>
              <span class="font-medium">Badge Premium</span>
            </li>
          </ul>
          
          <BaseButton 
            variant="primary"
            full-width
            @click="handleUpgrade"
            :disabled="currentPlan === 'premium'"
          >
            {{ currentPlan === 'premium' ? 'Plano Atual' : 'Fazer Upgrade' }}
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

const handleUpgrade = () => {
  // TODO: Implementar integração de pagamento
  success('Funcionalidade de pagamento em breve!')
  isOpen.value = false
}
</script>

