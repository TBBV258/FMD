<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div 
          class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          @click="handleBackdropClick"
        ></div>
        
        <!-- Modal content -->
        <div class="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            :class="modalClasses"
            @click.stop
          >
            <!-- Header -->
            <div v-if="title || $slots.header" class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
              <slot name="header">
                <h3 class="text-lg font-semibold">{{ title }}</h3>
              </slot>
              <button
                v-if="showClose"
                class="btn-icon"
                @click="close"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <!-- Body -->
            <div class="p-4">
              <slot></slot>
            </div>
            
            <!-- Footer -->
            <div v-if="$slots.footer" class="p-4 border-t border-gray-200 dark:border-dark-border">
              <slot name="footer"></slot>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  showClose?: boolean
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showClose: true,
  closeOnBackdrop: true
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const modalClasses = computed(() => {
  const base = 'bg-white dark:bg-dark-card rounded-t-2xl sm:rounded-2xl shadow-xl transform transition-all w-full animate-slide-up sm:animate-fade-in'
  
  const sizes = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    full: 'sm:max-w-full sm:h-full sm:m-4'
  }
  
  return `${base} ${sizes[props.size]}`
})

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close()
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

