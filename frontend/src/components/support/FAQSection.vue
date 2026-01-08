<template>
  <div class="space-y-3">
    <div
      v-for="(faq, index) in faqs"
      :key="index"
      class="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden"
    >
      <button
        class="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        @click="toggleFAQ(index)"
      >
        <span class="font-medium text-gray-900 dark:text-dark-text">{{ faq.question }}</span>
        <i
          :class="openFAQs.includes(index) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
          class="text-gray-400"
        ></i>
      </button>
      <div
        v-if="openFAQs.includes(index)"
        class="px-4 pb-3 text-sm text-gray-600 dark:text-gray-400"
      >
        <p>{{ faq.answer }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const openFAQs = ref<number[]>([])

const faqs = [
  {
    question: 'O que fazer se encontrar um BI ou documento de identidade?',
    answer: 'Se encontrar um documento de identidade, reporte-o na plataforma usando o botão "Reportar Documento Encontrado". Forneça uma foto (com dados sensíveis ocultados), localização e descrição. O proprietário será notificado e poderá entrar em contacto consigo de forma segura.'
  },
  {
    question: 'Como recuperar os meus pontos?',
    answer: 'Os pontos são atribuídos automaticamente quando você realiza ações como reportar documentos, ajudar outros usuários, fazer login diário, ou completar seu perfil. Você pode ver seu histórico de pontos na seção de perfil. Se acredita que pontos não foram atribuídos corretamente, contacte o suporte.'
  },
  {
    question: 'Como funciona o sistema de matches?',
    answer: 'Quando você reporta um documento perdido e outro usuário reporta um documento encontrado com características similares, nosso sistema cria um match. Você receberá uma notificação e poderá iniciar uma conversa para verificar se é o seu documento.'
  },
  {
    question: 'Como ocultar informações sensíveis nas fotos?',
    answer: 'Ao fazer upload de uma foto, nosso sistema automaticamente detecta e oculta informações sensíveis como números de BI, telefones e emails usando tecnologia de IA. Você também pode indicar manualmente áreas a ocultar antes de fazer upload.'
  },
  {
    question: 'Como fazer entregas de documentos em locais seguros?',
    answer: 'Recomendamos fazer entregas em locais públicos e movimentados, como estações de polícia, centros comerciais ou durante o dia. Nunca encontre alguém sozinho em locais isolados. Use o chat da plataforma para combinar detalhes e sempre informe alguém sobre o encontro.'
  },
  {
    question: 'Posso usar pontos para destacar meu documento perdido?',
    answer: 'Sim! Usuários com planos premium podem usar pontos para destacar documentos no topo do feed, aumentando a visibilidade. Vá em "Planos de Subscrição" para ver as opções disponíveis.'
  }
]

const toggleFAQ = (index: number) => {
  const idx = openFAQs.value.indexOf(index)
  if (idx > -1) {
    openFAQs.value.splice(idx, 1)
  } else {
    openFAQs.value.push(index)
  }
}
</script>

