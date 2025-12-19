/**
 * Composable para gerenciar permissões do navegador
 * Localização, Câmera, Notificações, etc.
 */

import { ref } from 'vue'

export interface PermissionState {
  granted: boolean
  denied: boolean
  prompt: boolean
  checking: boolean
}

export function usePermissions() {
  const locationPermission = ref<PermissionState>({
    granted: false,
    denied: false,
    prompt: true,
    checking: false
  })

  const cameraPermission = ref<PermissionState>({
    granted: false,
    denied: false,
    prompt: true,
    checking: false
  })

  const notificationPermission = ref<PermissionState>({
    granted: false,
    denied: false,
    prompt: true,
    checking: false
  })

  /**
   * Verifica permissão de localização
   */
  const checkLocationPermission = async () => {
    if (!('geolocation' in navigator)) {
      locationPermission.value.denied = true
      return false
    }

    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        
        locationPermission.value.granted = result.state === 'granted'
        locationPermission.value.denied = result.state === 'denied'
        locationPermission.value.prompt = result.state === 'prompt'
        
        return result.state === 'granted'
      }
    } catch (err) {
      console.warn('Permissions API not supported')
    }

    return false
  }

  /**
   * Solicita permissão de localização
   */
  const requestLocationPermission = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      locationPermission.value.checking = true

      navigator.geolocation.getCurrentPosition(
        (position) => {
          locationPermission.value.granted = true
          locationPermission.value.denied = false
          locationPermission.value.prompt = false
          locationPermission.value.checking = false
          resolve(position)
        },
        (error) => {
          locationPermission.value.checking = false
          
          if (error.code === error.PERMISSION_DENIED) {
            locationPermission.value.denied = true
            locationPermission.value.granted = false
            locationPermission.value.prompt = false
          }
          
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  /**
   * Verifica permissão de câmera
   */
  const checkCameraPermission = async () => {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
        
        cameraPermission.value.granted = result.state === 'granted'
        cameraPermission.value.denied = result.state === 'denied'
        cameraPermission.value.prompt = result.state === 'prompt'
        
        return result.state === 'granted'
      }
    } catch (err) {
      console.warn('Camera permission check not supported')
    }

    return false
  }

  /**
   * Solicita permissão de câmera
   */
  const requestCameraPermission = async (): Promise<MediaStream> => {
    cameraPermission.value.checking = true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      cameraPermission.value.granted = true
      cameraPermission.value.denied = false
      cameraPermission.value.prompt = false
      cameraPermission.value.checking = false
      
      return stream
    } catch (err: any) {
      cameraPermission.value.checking = false
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        cameraPermission.value.denied = true
        cameraPermission.value.granted = false
        cameraPermission.value.prompt = false
      }
      
      throw err
    }
  }

  /**
   * Verifica permissão de notificações
   */
  const checkNotificationPermission = () => {
    if (!('Notification' in window)) {
      notificationPermission.value.denied = true
      return false
    }

    notificationPermission.value.granted = Notification.permission === 'granted'
    notificationPermission.value.denied = Notification.permission === 'denied'
    notificationPermission.value.prompt = Notification.permission === 'default'

    return Notification.permission === 'granted'
  }

  /**
   * Solicita permissão de notificações
   */
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      throw new Error('Notificações não são suportadas neste navegador')
    }

    notificationPermission.value.checking = true

    try {
      const permission = await Notification.requestPermission()
      
      notificationPermission.value.granted = permission === 'granted'
      notificationPermission.value.denied = permission === 'denied'
      notificationPermission.value.prompt = permission === 'default'
      notificationPermission.value.checking = false
      
      return permission === 'granted'
    } catch (err) {
      notificationPermission.value.checking = false
      throw err
    }
  }

  /**
   * Detecta tipo de dispositivo
   */
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const isAndroid = () => {
    return /Android/i.test(navigator.userAgent)
  }

  const isIOS = () => {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent)
  }

  return {
    // States
    locationPermission,
    cameraPermission,
    notificationPermission,

    // Location
    checkLocationPermission,
    requestLocationPermission,

    // Camera
    checkCameraPermission,
    requestCameraPermission,

    // Notifications
    checkNotificationPermission,
    requestNotificationPermission,

    // Device Detection
    isMobile,
    isAndroid,
    isIOS
  }
}

