<template>
  <div class="space-y-4">
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Precisa de ajuda? Entre em contacto connosco através dos seguintes canais:
    </p>

    <div class="space-y-3">
      <a
        :href="whatsappUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center space-x-3 p-4 border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <i class="fab fa-whatsapp text-green-500 text-2xl"></i>
        <div class="flex-1">
          <p class="font-medium text-gray-900 dark:text-dark-text">WhatsApp</p>
          <p class="text-sm text-gray-500">Fale connosco diretamente</p>
        </div>
        <i class="fas fa-external-link-alt text-gray-400"></i>
      </a>

      <a
        href="mailto:support@findmydocs.com"
        class="flex items-center space-x-3 p-4 border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <i class="fas fa-envelope text-primary text-2xl"></i>
        <div class="flex-1">
          <p class="font-medium text-gray-900 dark:text-dark-text">Email</p>
          <p class="text-sm text-gray-500">support@findmydocs.com</p>
        </div>
        <i class="fas fa-external-link-alt text-gray-400"></i>
      </a>
    </div>

    <div class="bg-info/10 border border-info/20 rounded-lg p-3">
      <p class="text-sm text-info-dark">
        <i class="fas fa-clock mr-2"></i>
        Horário de atendimento: Segunda a Sexta, 9h às 18h (GMT+2)
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const whatsappUrl = computed(() => {
  const phoneNumber = '258841234567' // Replace with actual support number
  const message = encodeURIComponent('Olá! Preciso de ajuda com o FindMyDocs.')
  return `https://wa.me/${phoneNumber}?text=${message}`
})
</script>

