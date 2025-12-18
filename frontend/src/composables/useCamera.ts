import { ref } from 'vue'

export interface CameraPermissionState {
  granted: boolean
  denied: boolean
  prompt: boolean
}

export function useCamera() {
  const permissionState = ref<CameraPermissionState>({
    granted: false,
    denied: false,
    prompt: true
  })
  const isCapturing = ref(false)
  const error = ref<string | null>(null)

  /**
   * Check camera permission status
   */
  async function checkPermission(): Promise<CameraPermissionState> {
    try {
      if (!navigator.permissions) {
        // Fallback for browsers that don't support Permissions API
        return permissionState.value
      }

      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      
      permissionState.value = {
        granted: result.state === 'granted',
        denied: result.state === 'denied',
        prompt: result.state === 'prompt'
      }

      // Listen for permission changes
      result.onchange = () => {
        permissionState.value = {
          granted: result.state === 'granted',
          denied: result.state === 'denied',
          prompt: result.state === 'prompt'
        }
      }

      return permissionState.value
    } catch (err) {
      console.error('Error checking camera permission:', err)
      return permissionState.value
    }
  }

  /**
   * Request camera permission and capture photo
   */
  async function capturePhoto(): Promise<File | null> {
    try {
      isCapturing.value = true
      error.value = null

      // Check if we're on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

      if (isMobile && 'mediaDevices' in navigator) {
        // Use camera on mobile devices
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, // Use back camera
          audio: false 
        })

        permissionState.value.granted = true
        permissionState.value.denied = false
        permissionState.value.prompt = false

        // Create video element to capture frame
        const video = document.createElement('video')
        video.srcObject = stream
        video.play()

        // Wait for video to be ready
        await new Promise(resolve => {
          video.onloadedmetadata = resolve
        })

        // Capture frame from video
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(video, 0, 0)

        // Stop camera
        stream.getTracks().forEach(track => track.stop())

        // Convert canvas to blob/file
        return new Promise<File>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
              resolve(file)
            }
          }, 'image/jpeg', 0.9)
        })
      } else {
        // Fallback to file input
        return await selectFromGallery()
      }
    } catch (err: any) {
      console.error('Camera capture error:', err)
      
      if (err.name === 'NotAllowedError') {
        error.value = 'Permissão da câmera negada'
        permissionState.value.denied = true
        permissionState.value.granted = false
      } else if (err.name === 'NotFoundError') {
        error.value = 'Câmera não encontrada'
      } else {
        error.value = 'Erro ao acessar a câmera'
      }
      
      return null
    } finally {
      isCapturing.value = false
    }
  }

  /**
   * Open file picker to select from gallery
   */
  async function selectFromGallery(): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        resolve(file || null)
      }
      
      input.oncancel = () => {
        resolve(null)
      }
      
      input.click()
    })
  }

  /**
   * Show permission explanation modal
   */
  function showPermissionHelp(): string {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('chrome')) {
      return 'Chrome: Clique no ícone de câmera na barra de endereço e permita o acesso.'
    } else if (userAgent.includes('firefox')) {
      return 'Firefox: Clique no ícone de permissões ao lado do endereço e permita a câmera.'
    } else if (userAgent.includes('safari')) {
      return 'Safari: Vá em Configurações > Safari > Câmera e permita para este site.'
    } else {
      return 'Permita o acesso à câmera nas configurações do seu navegador.'
    }
  }

  return {
    permissionState,
    isCapturing,
    error,
    checkPermission,
    capturePhoto,
    selectFromGallery,
    showPermissionHelp
  }
}

