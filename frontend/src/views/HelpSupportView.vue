<template>
  <MainLayout>
    <div class="px-4 py-6 space-y-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">Ajuda e Suporte</h1>

      <!-- FAQ Section -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Perguntas Frequentes</h2>
        <FAQSection />
      </div>

      <!-- Support Chat -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Contactar Suporte</h2>
        <SupportChat />
      </div>

      <!-- Tutorial -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Tutorial</h2>
        <TutorialGuide />
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/components/layout/MainLayout.vue'
import FAQSection from '@/components/support/FAQSection.vue'
import SupportChat from '@/components/support/SupportChat.vue'
import TutorialGuide from '@/components/support/TutorialGuide.vue'
</script>

