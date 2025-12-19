<template>
  <ErrorBoundary>
    <div id="app" class="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <!-- Offline Indicator -->
      <OfflineIndicator />
      
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
      
      <!-- Global Toast Container -->
      <ToastContainer />
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import OfflineIndicator from '@/components/common/OfflineIndicator.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'

const authStore = useAuthStore()

onMounted(async () => {
  try {
    // Check for existing session on app mount
    await authStore.checkSession()
  } catch (error) {
    // If checkSession fails due to invalid refresh token, it's already handled
    // Just log for debugging
    console.error('Error during session check on mount:', error)
  }
  
  // Apply dark mode if previously set
  const darkMode = localStorage.getItem('fmd_dark_mode')
  if (darkMode === 'true') {
    document.documentElement.classList.add('dark')
  }
  
  // Register service worker
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      console.log('Service Worker registration failed')
    })
  }
})
</script>

<style>
/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Safe area support */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

/* Hide scrollbar for mobile feel */
::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

/* Touch-friendly tap highlights */
* {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
}

/* Prevent text selection on buttons and interactive elements */
button, a {
  -webkit-user-select: none;
  user-select: none;
}
</style>
