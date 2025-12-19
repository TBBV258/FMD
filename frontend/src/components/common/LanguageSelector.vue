<template>
  <div class="relative">
    <button
      class="btn-icon flex items-center space-x-1"
      @click="showMenu = !showMenu"
      aria-label="Selecionar idioma"
    >
      <span class="text-lg">{{ currentLanguage.flag }}</span>
    </button>
    
    <!-- Dropdown menu -->
    <Transition name="fade">
      <div
        v-if="showMenu"
        class="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border z-50"
      >
        <div class="py-2">
          <button
            v-for="locale in availableLocales"
            :key="locale.code"
            class="w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="{ 'bg-gray-50 dark:bg-gray-800': locale.code === currentLocale }"
            @click="changeLanguage(locale.code)"
          >
            <span class="text-xl">{{ locale.flag }}</span>
            <span class="flex-1 text-left">{{ locale.name }}</span>
            <i v-if="locale.code === currentLocale" class="fas fa-check text-primary text-xs"></i>
          </button>
        </div>
      </div>
    </Transition>
    
    <!-- Backdrop -->
    <div
      v-if="showMenu"
      class="fixed inset-0 z-40"
      @click="showMenu = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { availableLocales } from '@/i18n'

const { locale } = useI18n()
const showMenu = ref(false)

const currentLocale = computed(() => locale.value)

const currentLanguage = computed(() => {
  return availableLocales.find(l => l.code === currentLocale.value) || availableLocales[0]
})

const changeLanguage = (code: string) => {
  locale.value = code
  localStorage.setItem('fmd_language', code)
  showMenu.value = false
}

// Close menu on escape key
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

