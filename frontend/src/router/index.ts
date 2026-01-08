import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
    {
      path: '/login',
    name: 'Login',
      component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
    },
    {
      path: '/',
    name: 'Feed',
      component: () => import('@/views/FeedView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/document/:id',
    name: 'DocumentDetail',
      component: () => import('@/views/DocumentDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/report-lost',
    name: 'ReportLost',
      component: () => import('@/views/ReportLostView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/report-found',
    name: 'ReportFound',
      component: () => import('@/views/ReportFoundView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
    name: 'Profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/edit-profile',
      name: 'EditProfile',
      component: () => import('@/views/EditProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notifications',
    name: 'Notifications',
      component: () => import('@/views/NotificationsView.vue'),
      meta: { requiresAuth: true }
    },
  {
    path: '/chats',
    name: 'ChatList',
    component: () => import('@/views/ChatListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat/:documentId',
    name: 'Chat',
    component: () => import('@/views/ChatView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('@/views/MapView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/documents',
    name: 'Documents',
    component: () => import('@/views/DocumentsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/subscription-plans',
    name: 'SubscriptionPlans',
    component: () => import('@/views/SubscriptionPlansView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/privacy-security',
    name: 'PrivacySecurity',
    component: () => import('@/views/PrivacySecurityView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/help-support',
    name: 'HelpSupport',
    component: () => import('@/views/HelpSupportView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  try {
    // Check session on first load
    if (!authStore.user && !authStore.isLoading) {
      await authStore.checkSession()
    }
  } catch (error) {
    // If checkSession fails due to invalid refresh token, it's already handled
    // Continue with navigation - user will be redirected to login if needed
    console.error('Error checking session in router:', error)
  }

  const requiresAuth = to.meta.requiresAuth !== false
  const isAuthenticated = authStore.isAuthenticated

  if (requiresAuth && !isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && isAuthenticated) {
    next({ name: 'Feed' })
  } else {
    next()
  }
})

export default router
