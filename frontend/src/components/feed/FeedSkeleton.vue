<template>
  <div class="space-y-4">
    <div v-for="i in count" :key="i" class="card p-0">
    <!-- Image skeleton -->
      <div class="skeleton-image"></div>
    
    <!-- Content skeleton -->
    <div class="p-4 space-y-3">
        <div class="skeleton-text w-3/4"></div>
        <div class="skeleton-text w-full"></div>
        <div class="skeleton-text w-1/2"></div>

        <div class="flex items-center justify-between pt-2">
          <div class="skeleton h-8 w-24 rounded"></div>
          <div class="skeleton h-8 w-8 rounded"></div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 3
})
</script>
