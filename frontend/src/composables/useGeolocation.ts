import { ref } from 'vue'

interface GeolocationCoordinates {
  latitude: number
  longitude: number
  accuracy: number
}

interface GeolocationError {
  code: number
  message: string
}

export function useGeolocation() {
  const coordinates = ref<GeolocationCoordinates | null>(null)
  const error = ref<GeolocationError | null>(null)
  const isLoading = ref(false)
  const isSupported = 'geolocation' in navigator

  const getCurrentPosition = async (): Promise<GeolocationCoordinates | null> => {
    if (!isSupported) {
      error.value = {
        code: 0,
        message: 'Geolocalização não suportada neste navegador'
      }
      return null
    }

    isLoading.value = true
    error.value = null

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GeolocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
          coordinates.value = coords
          isLoading.value = false
          resolve(coords)
        },
        (err) => {
          error.value = {
            code: err.code,
            message: getErrorMessage(err.code)
          }
          isLoading.value = false
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  const watchPosition = (callback: (coords: GeolocationCoordinates) => void) => {
    if (!isSupported) {
      error.value = {
        code: 0,
        message: 'Geolocalização não suportada neste navegador'
      }
      return null
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: GeolocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
        coordinates.value = coords
        callback(coords)
      },
      (err) => {
        error.value = {
          code: err.code,
          message: getErrorMessage(err.code)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )

    return watchId
  }

  const clearWatch = (watchId: number) => {
    if (isSupported && watchId) {
      navigator.geolocation.clearWatch(watchId)
    }
  }

  const getErrorMessage = (code: number): string => {
    switch (code) {
      case 1:
        return 'Permissão de localização negada'
      case 2:
        return 'Localização indisponível'
      case 3:
        return 'Tempo limite excedido'
      default:
        return 'Erro ao obter localização'
    }
  }

  return {
    coordinates,
    error,
    isLoading,
    isSupported,
    getCurrentPosition,
    watchPosition,
    clearWatch
  }
}

