<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <p class="font-medium text-gray-900 dark:text-dark-text">Ativar Alertas de Proximidade</p>
        <p class="text-sm text-gray-500">Receber notificações quando documentos são encontrados perto de você</p>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          v-model="isEnabled"
          type="checkbox"
          class="sr-only peer"
          @change="toggleAlerts"
        />
        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
      </label>
    </div>

    <div v-if="isEnabled" class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Raio de Alerta (metros)
        </label>
        <input
          v-model.number="radius"
          type="range"
          min="1000"
          max="10000"
          step="500"
          class="w-full"
          @change="updateRadius"
        />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 km</span>
          <span>{{ (radius / 1000).toFixed(1) }} km</span>
          <span>10 km</span>
        </div>
      </div>

      <div v-if="currentAlerts.length > 0" class="bg-primary/10 border border-primary/20 rounded-lg p-3">
        <p class="text-sm font-semibold text-primary-dark mb-2">
          Documentos próximos encontrados:
        </p>
        <div class="space-y-2">
          <div
            v-for="alert in currentAlerts"
            :key="alert.documentId"
            class="text-sm text-gray-700 dark:text-gray-300"
          >
            • {{ alert.documentTitle }} - {{ (alert.distance / 1000).toFixed(1) }}km
          </div>
        </div>
      </div>
    </div>

    <div v-if="!isSupported" class="bg-warning/10 border border-warning/20 rounded-lg p-3">
      <p class="text-sm text-warning-dark">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        Geolocalização não está disponível no seu dispositivo
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useProximityAlerts } from '@/composables/useProximityAlerts'

const { isEnabled, alertRadius, currentAlerts, isSupported, enable, disable } = useProximityAlerts()

const radius = ref(alertRadius.value)

const toggleAlerts = () => {
  if (isEnabled.value) {
    enable()
  } else {
    disable()
  }
}

const updateRadius = () => {
  alertRadius.value = radius.value
}

onMounted(() => {
  // Load saved preference
})

onUnmounted(() => {
  disable()
})
</script>

