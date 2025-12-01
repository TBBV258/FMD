<template>
  <nav class="bottom-nav">
    <div class="flex items-center justify-around h-16">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.to"
        class="bottom-nav-item"
        :class="{ 'active': isActive(item.to) }"
      >
        <div class="relative">
          <i :class="item.icon" class="text-xl"></i>
          <span
            v-if="item.badge && item.badge > 0"
            class="absolute -top-2 -right-2 bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
          {{ item.badge > 99 ? '99+' : item.badge }}
        </span>
        </div>
        <span class="mt-1">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface NavItem {
  name: string
  label: string
  icon: string
  to: string
  badge?: number
}

interface Props {
  notificationCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  notificationCount: 0
})

const route = useRoute()

const navItems = computed<NavItem[]>(() => [
  {
    name: 'feed',
    label: 'Início',
    icon: 'fas fa-home',
    to: '/'
  },
  {
    name: 'map',
    label: 'Mapa',
    icon: 'fas fa-map',
    to: '/map'
  },
  {
    name: 'report-found',
    label: 'Reportar',
    icon: 'fas fa-plus-circle',
    to: '/report-found'
  },
  {
    name: 'notifications',
    label: 'Notificações',
    icon: 'fas fa-bell',
    to: '/notifications',
    badge: props.notificationCount
  },
  {
    name: 'profile',
    label: 'Perfil',
    icon: 'fas fa-user',
    to: '/profile'
  }
])

const isActive = (path: string) => {
  return route.path === path
}
</script>
