<template>
  <div :class="cardClasses" @click="handleClick">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hover: false,
  padding: 'md',
  clickable: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const cardClasses = computed(() => {
  const base = 'card'
  const hoverClass = props.hover || props.clickable ? 'card-hover cursor-pointer' : ''
  
  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
  
  return `${base} ${hoverClass} ${paddings[props.padding]}`
})

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

