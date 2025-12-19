<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[100] bg-black bg-opacity-90 flex items-center justify-center"
        @click="close"
      >
        <!-- Close button -->
        <button
          class="absolute top-4 right-4 p-2 rounded-full bg-neutral-800 bg-opacity-50 text-white hover:bg-opacity-75 transition-all z-10"
          @click.stop="close"
          aria-label="Fechar"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>

        <!-- Image container -->
        <div
          class="relative w-full h-full flex items-center justify-center p-4"
          @click.stop
        >
          <img
            :src="imageUrl"
            :alt="alt"
            class="max-w-full max-h-full object-contain"
            @load="onImageLoad"
          />

          <!-- Loading spinner -->
          <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
            <div class="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>

          <!-- Navigation buttons for multiple images -->
          <button
            v-if="hasPrevious"
            class="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-800 bg-opacity-50 text-white hover:bg-opacity-75 transition-all"
            @click.stop="$emit('previous')"
            aria-label="Imagem anterior"
          >
            <ChevronLeftIcon class="w-6 h-6" />
          </button>

          <button
            v-if="hasNext"
            class="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-800 bg-opacity-50 text-white hover:bg-opacity-75 transition-all"
            @click.stop="$emit('next')"
            aria-label="Próxima imagem"
          >
            <ChevronRightIcon class="w-6 h-6" />
          </button>
        </div>

        <!-- Image info -->
        <div v-if="showInfo" class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
          <p class="text-white text-sm text-center">{{ alt }}</p>
          <p v-if="currentIndex !== undefined && totalImages" class="text-white text-xs text-center mt-1">
            {{ currentIndex + 1 }} / {{ totalImages }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  modelValue: boolean
  imageUrl: string
  alt?: string
  hasPrevious?: boolean
  hasNext?: boolean
  showInfo?: boolean
  currentIndex?: number
  totalImages?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'previous'): void
  (e: 'next'): void
}>()

const loading = ref(true)

function close() {
  emit('update:modelValue', false)
}

function onImageLoad() {
  loading.value = false
}

watch(() => props.imageUrl, () => {
  loading.value = true
})

// Keyboard navigation
function handleKeydown(e: KeyboardEvent) {
  if (!props.modelValue) return

  if (e.key === 'Escape') {
    close()
  } else if (e.key === 'ArrowLeft' && props.hasPrevious) {
    emit('previous')
  } else if (e.key === 'ArrowRight' && props.hasNext) {
    emit('next')
  }
}

// Add keyboard listener
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

