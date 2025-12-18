import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  const show = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = nextId++
    const toast: Toast = { id, message, type, duration }
    
    toasts.value.push(toast)
    
    setTimeout(() => {
      remove(id)
    }, duration)
    
    return id
  }
  
  const success = (message: string, duration?: number) => {
    return show(message, 'success', duration)
  }
  
  const error = (message: string, duration?: number) => {
    return show(message, 'error', duration)
  }
  
  const info = (message: string, duration?: number) => {
    return show(message, 'info', duration)
  }
  
  const warning = (message: string, duration?: number) => {
    return show(message, 'warning', duration)
  }
  
  const remove = (id: number) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  return {
    toasts,
    show,
    success,
    error,
    info,
    warning,
    remove
  }
}

