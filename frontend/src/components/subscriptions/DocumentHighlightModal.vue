<template>
  <BaseModal v-model="isOpen" title="Destacar Documento" maxWidth="md">
    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Escolha um documento para destacar no feed. O documento aparecerá no topo por um período determinado.
      </p>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Selecione o Documento
        </label>
        <select
          v-model="selectedDocumentId"
          class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
        >
          <option value="">-- Selecione --</option>
          <option
            v-for="doc in availableDocuments"
            :key="doc.id"
            :value="doc.id"
          >
            {{ doc.title }} ({{ doc.status === 'lost' ? 'Perdido' : 'Encontrado' }})
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tipo de Destaque
        </label>
        <select
          v-model="highlightType"
          class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
        >
          <option value="feed_top">Topo do Feed (50 pontos/dia)</option>
          <option value="featured">Destaque Especial (100 pontos/dia)</option>
          <option value="urgent">Urgente (150 pontos/dia)</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Duração (dias)
        </label>
        <input
          v-model.number="durationDays"
          type="number"
          min="1"
          max="30"
          class="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text"
        />
      </div>

      <div class="bg-warning/10 border border-warning/20 rounded-lg p-3">
        <div class="flex items-start space-x-2">
          <i class="fas fa-info-circle text-warning-dark mt-1"></i>
          <div class="text-sm">
            <p class="font-semibold text-warning-dark">Custo Total:</p>
            <p class="text-warning-dark">{{ totalCost }} pontos</p>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Seus pontos disponíveis: {{ userPoints }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="totalCost > userPoints" class="bg-danger/10 border border-danger/20 rounded-lg p-3">
        <p class="text-sm text-danger">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          Você não tem pontos suficientes. Ganhe mais pontos reportando documentos e ajudando outros usuários.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <BaseButton variant="outline" @click="isOpen = false">
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          @click="handleHighlight"
          :disabled="!selectedDocumentId || totalCost > userPoints || durationDays < 1"
          :loading="isHighlighting"
        >
          Destacar
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDocuments } from '@/composables/useDocuments'
import { subscriptionsApi } from '@/api/subscriptions'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'

interface Props {
  userPoints: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  highlighted: []
}>()

const isOpen = defineModel<boolean>()
const authStore = useAuthStore()
const { success, error: showError } = useToast()
const { items: documents } = useDocuments()

const selectedDocumentId = ref('')
const highlightType = ref<'feed_top' | 'featured' | 'urgent'>('feed_top')
const durationDays = ref(1)
const isHighlighting = ref(false)

const availableDocuments = computed(() => {
  return documents.value.filter(doc => doc.status === 'lost')
})

const costPerDay = computed(() => {
  const costs = {
    feed_top: 50,
    featured: 100,
    urgent: 150
  }
  return costs[highlightType.value] || 50
})

const totalCost = computed(() => {
  return costPerDay.value * durationDays.value
})

const handleHighlight = async () => {
  if (!selectedDocumentId.value || !authStore.userId) return

  isHighlighting.value = true

  try {
    await subscriptionsApi.highlightDocument(
      selectedDocumentId.value,
      authStore.userId,
      highlightType.value,
      totalCost.value,
      durationDays.value
    )

    // Deduct points (this would typically be done server-side)
    success('Documento destacado com sucesso!')
    emit('highlighted')
    isOpen.value = false
  } catch (err: any) {
    showError(err.message || 'Erro ao destacar documento')
  } finally {
    isHighlighting.value = false
  }
}
</script>

