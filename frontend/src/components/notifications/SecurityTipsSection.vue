<template>
  <div class="space-y-4">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-dark-text">Dicas de Segurança</h2>
    
    <div class="space-y-3">
      <div
        v-for="(tip, index) in securityTips"
        :key="index"
        class="flex items-start space-x-3 p-3 bg-info/10 border border-info/20 rounded-lg"
      >
        <i class="fas fa-shield-alt text-info-dark mt-1"></i>
        <div class="flex-1">
          <p class="text-sm font-medium text-info-dark mb-1">{{ tip.title }}</p>
          <p class="text-xs text-gray-700 dark:text-gray-300">{{ tip.description }}</p>
        </div>
      </div>
    </div>

    <div class="bg-warning/10 border border-warning/20 rounded-lg p-3">
      <p class="text-sm text-warning-dark">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        <strong>Importante:</strong> Sempre encontre-se em locais públicos e movimentados. Nunca vá sozinho para locais isolados.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const securityTips = [
  {
    title: 'Locais Públicos',
    description: 'Sempre combine encontros em locais públicos e movimentados, como estações de polícia, centros comerciais ou durante o dia.'
  },
  {
    title: 'Informe Alguém',
    description: 'Sempre informe um amigo ou familiar sobre o encontro, incluindo local, hora e informações de contacto da outra pessoa.'
  },
  {
    title: 'Verifique Antes',
    description: 'Use o chat da plataforma para verificar detalhes do documento antes de se encontrar. Confirme que é realmente o seu documento.'
  },
  {
    title: 'Dados Sensíveis',
    description: 'Nunca compartilhe informações pessoais adicionais além do necessário. A plataforma já protege seus dados.'
  },
  {
    title: 'Horário Seguro',
    description: 'Prefira encontros durante o dia, em horários de maior movimento. Evite encontros noturnos ou em locais isolados.'
  }
]
</script>

