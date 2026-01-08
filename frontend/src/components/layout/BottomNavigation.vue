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
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

interface NavItem {
  name: string
  label: string
  icon: string
  to: string
  badge?: number
}

interface Props {
  chatUnreadCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  chatUnreadCount: 0
})

const route = useRoute()
const { t } = useI18n()

const navItems = computed<NavItem[]>(() => [
  {
    name: 'feed',
    label: t('nav.home'),
    icon: 'fas fa-home',
    to: '/'
  },
  {
    name: 'map',
    label: t('nav.map'),
    icon: 'fas fa-map',
    to: '/map'
  },
  {
    name: 'report-found',
    label: t('nav.report'),
    icon: 'fas fa-plus-circle',
    to: '/report-found'
  },
  {
    name: 'chats',
    label: t('nav.chats'),
    icon: 'fas fa-comments',
    to: '/chats',
    badge: props.chatUnreadCount
  },
  {
    name: 'profile',
    label: t('nav.profile'),
    icon: 'fas fa-user',
    to: '/profile'
  }
])

const isActive = (path: string) => {
  return route.path === path
}
</script>
