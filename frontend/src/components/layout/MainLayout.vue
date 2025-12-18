<template>
  <div class="min-h-screen bg-gray-50 dark:bg-dark-bg pb-16">
    <!-- Top Bar -->
    <TopBar v-if="showTopBar" :title="pageTitle" />
    
    <!-- Main Content -->
    <main class="container mx-auto px-0 sm:px-4 max-w-2xl">
      <slot></slot>
    </main>
    
    <!-- Bottom Navigation -->
    <BottomNavigation 
      v-if="showBottomNav"
      :notification-count="notificationCount"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TopBar from './TopBar.vue'
import BottomNavigation from './BottomNavigation.vue'

interface Props {
  showTopBar?: boolean
  showBottomNav?: boolean
  notificationCount?: number
}

withDefaults(defineProps<Props>(), {
  showTopBar: true,
  showBottomNav: true,
  notificationCount: 0
})

const route = useRoute()

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'FindMyDocs',
    '/report-lost': 'Relatar Perda',
    '/report-found': 'Relatar Encontrado',
    '/notifications': 'Notificações',
    '/profile': 'Perfil'
  }
  
  return titles[route.path] || 'FindMyDocs'
})
</script>

