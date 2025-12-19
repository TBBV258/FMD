<template>
  <div class="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="toastClasses(toast.type)"
        class="toast shadow-lg flex items-center space-x-3 px-4 py-3 rounded-lg"
      >
        <i :class="toastIcon(toast.type)" class="text-lg"></i>
        <span class="flex-1">{{ toast.message }}</span>
        <button
          class="text-current opacity-70 hover:opacity-100"
          @click="remove(toast.id)"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const toastClasses = (type: string) => {
  const classes = {
    success: 'toast-success',
    error: 'toast-error',
    info: 'toast-info',
    warning: 'bg-warning text-white'
  }
  return classes[type as keyof typeof classes] || classes.info
}

const toastIcon = (type: string) => {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle',
    warning: 'fas fa-exclamation-triangle'
  }
  return icons[type as keyof typeof icons] || icons.info
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>

