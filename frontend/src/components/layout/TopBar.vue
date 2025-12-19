<template>
  <header class="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border pt-safe">
    <div class="flex items-center justify-between px-4 h-14">
      <!-- Logo/Title -->
      <div class="flex items-center space-x-2">
        <img v-if="logo" :src="logo" alt="Logo" class="h-8 w-8 object-contain rounded-md" />
        <h1 class="text-lg font-bold text-gray-900 dark:text-dark-text">{{ title }}</h1>
      </div>

      <!-- Actions -->
      <div class="flex items-center space-x-2">
        <slot name="actions">
          <!-- Language selector -->
          <LanguageSelector />
          
          <!-- Theme toggle -->
          <button
            class="btn-icon"
            @click="toggleDarkMode"
            aria-label="Alternar tema"
          >
            <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
          </button>
        </slot>
      </div>
    </div>
  </header>
  
  <!-- Spacer to prevent content from going under fixed header -->
  <div class="h-14 pt-safe"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LanguageSelector from '@/components/common/LanguageSelector.vue'
import logoImg from '/logofmd.jpg'

interface Props {
  title?: string
  logo?: string
}

withDefaults(defineProps<Props>(), {
  title: 'FindMyDocs',
  logo: logoImg
})

const isDark = ref(false)

onMounted(() => {
  // Check if dark mode is enabled
  isDark.value = document.documentElement.classList.contains('dark')
})

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('fmd_dark_mode', 'true')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('fmd_dark_mode', 'false')
  }
}
</script>
