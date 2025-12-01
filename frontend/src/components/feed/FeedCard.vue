<template>
  <SwipeGestures
    @swipe-left="handleSwipeLeft"
    @swipe-right="handleSwipeRight"
    :show-indicators="true"
  >
    <BaseCard padding="none" hover clickable @click="handleClick">
      <!-- Image -->
      <div class="relative aspect-square bg-gray-200 dark:bg-dark-card">
        <img
        v-if="document.thumbnail_url || document.file_url"
          :src="document.thumbnail_url || document.file_url"
          :alt="document.title"
          class="w-full h-full object-cover"
          loading="lazy"
          @error="handleImageError"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <i class="fas fa-file text-gray-400 text-6xl"></i>
        </div>
        
        <!-- Status badge -->
        <div class="absolute top-3 right-3">
          <span :class="statusBadgeClass">
            {{ statusLabel }}
          </span>
        </div>

        <!-- Type badge -->
        <div class="absolute top-3 left-3">
          <span class="badge bg-black/50 text-white">
            <i :class="typeIcon" class="mr-1"></i>
            {{ typeLabel }}
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-2">
        <!-- Title -->
        <h3 class="font-semibold text-lg text-gray-900 dark:text-dark-text truncate">
              {{ document.title }}
            </h3>

        <!-- Description -->
        <p v-if="document.description" class="text-sm text-gray-600 dark:text-gray-400 truncate-2">
          {{ document.description }}
        </p>

        <!-- Meta info -->
        <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div class="flex items-center space-x-1">
            <i class="fas fa-map-marker-alt"></i>
            <span>{{ document.location || 'Não especificado' }}</span>
          </div>
          <div class="flex items-center space-x-1">
            <i class="fas fa-clock"></i>
            <span>{{ timeAgo }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center space-x-2 pt-2">
          <BaseButton
            variant="primary"
            size="sm"
            class="flex-1"
            @click.stop="handleInterested"
          >
            <i class="fas fa-hand-paper mr-2"></i>
            Interessado
          </BaseButton>
          <BaseButton
            variant="outline"
            size="sm"
            @click.stop="handleShare"
          >
            <i class="fas fa-share-alt"></i>
          </BaseButton>
        </div>
      </div>
    </BaseCard>
  </SwipeGestures>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Document } from '@/types'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import SwipeGestures from '@/components/common/SwipeGestures.vue'

interface Props {
  document: Document
}

const props = defineProps<Props>()

const emit = defineEmits<{
  interested: [documentId: string]
  dismiss: [documentId: string]
  share: [documentId: string]
}>()

const router = useRouter()

const statusBadgeClass = computed(() => {
  const classes = {
    lost: 'badge badge-danger',
    found: 'badge badge-success',
    matched: 'badge bg-purple-500/10 text-purple-500',
    returned: 'badge badge-success'
  }
  return classes[props.document.status] || 'badge badge-primary'
})

const statusLabel = computed(() => {
  const labels = {
    lost: 'Perdido',
    found: 'Encontrado',
    matched: 'Match',
    returned: 'Devolvido',
    normal: 'Normal'
  }
  return labels[props.document.status] || props.document.status
})

const typeIcon = computed(() => {
  const icons = {
    passport: 'fas fa-passport',
    id_card: 'fas fa-id-card',
    driver_license: 'fas fa-id-card-alt',
    birth_certificate: 'fas fa-file-alt',
    other: 'fas fa-file'
  }
  return icons[props.document.type] || 'fas fa-file'
})

const typeLabel = computed(() => {
  const labels = {
    passport: 'Passaporte',
    id_card: 'BI',
    driver_license: 'Carta',
    birth_certificate: 'Certidão',
    other: 'Outro'
  }
  return labels[props.document.type] || 'Documento'
})

const timeAgo = computed(() => {
  const now = new Date()
  const created = new Date(props.document.created_at)
  const diffMs = now.getTime() - created.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  
  return created.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
})

const handleClick = () => {
  router.push(`/document/${props.document.id}`)
}

const handleInterested = () => {
  emit('interested', props.document.id)
}

const handleSwipeLeft = () => {
  emit('dismiss', props.document.id)
}

const handleSwipeRight = () => {
  emit('interested', props.document.id)
}

const handleShare = () => {
  emit('share', props.document.id)
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}
</script>
