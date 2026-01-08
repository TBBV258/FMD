import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/api/supabase'
import { useAuthStore } from '@/stores/auth'
import { useGeolocation } from './useGeolocation'
import { notificationsApi } from '@/api/notifications'

interface ProximityAlert {
  documentId: string
  documentTitle: string
  distance: number
  location: {
    lat: number
    lng: number
  }
}

export function useProximityAlerts() {
  const isEnabled = ref(false)
  const alertRadius = ref(5000) // meters, default 5km
  const currentAlerts = ref<ProximityAlert[]>([])
  const isMonitoring = ref(false)
  
  const authStore = useAuthStore()
  const { location, isSupported, getCurrentPosition } = useGeolocation()
  let watchId: number | null = null
  let checkInterval: NodeJS.Timeout | null = null

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  const checkNearbyDocuments = async (userLat: number, userLng: number) => {
    if (!authStore.userId) return

    try {
      // Get all found documents with location
      const { data: documents, error } = await supabase
        .from('documents')
        .select('id, title, location_metadata, user_id')
        .eq('status', 'found')
        .not('location_metadata', 'is', null)

      if (error) throw error

      const alerts: ProximityAlert[] = []

      for (const doc of documents || []) {
        if (doc.user_id === authStore.userId) continue // Skip own documents

        const locationMeta = doc.location_metadata as any
        if (!locationMeta?.lat || !locationMeta?.lng) continue

        const distance = calculateDistance(
          userLat,
          userLng,
          locationMeta.lat,
          locationMeta.lng
        )

        if (distance <= alertRadius.value) {
          alerts.push({
            documentId: doc.id,
            documentTitle: doc.title,
            distance: Math.round(distance),
            location: {
              lat: locationMeta.lat,
              lng: locationMeta.lng
            }
          })
        }
      }

      // Check for new alerts (not already notified)
      const newAlerts = alerts.filter(alert => {
        const existing = currentAlerts.value.find(a => a.documentId === alert.documentId)
        return !existing
      })

      // Create notifications for new alerts
      for (const alert of newAlerts) {
        await notificationsApi.create({
          user_id: authStore.userId,
          type: 'document_found',
          title: 'Documento encontrado próximo de você!',
          message: `${alert.documentTitle} foi encontrado a ${(alert.distance / 1000).toFixed(1)}km de distância`,
          data: {
            documentId: alert.documentId,
            distance: alert.distance,
            location: alert.location
          }
        })
      }

      currentAlerts.value = alerts
    } catch (error) {
      console.error('Error checking nearby documents:', error)
    }
  }

  const startMonitoring = async () => {
    if (!isSupported.value || isMonitoring.value) return

    try {
      const position = await getCurrentPosition()
      if (!position) return

      isMonitoring.value = true

      // Check immediately
      await checkNearbyDocuments(position.coords.latitude, position.coords.longitude)

      // Check every 5 minutes
      checkInterval = setInterval(async () => {
        const pos = await getCurrentPosition()
        if (pos) {
          await checkNearbyDocuments(pos.coords.latitude, pos.coords.longitude)
        }
      }, 5 * 60 * 1000) // 5 minutes

      // Watch position changes
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            await checkNearbyDocuments(
              position.coords.latitude,
              position.coords.longitude
            )
          },
          (error) => {
            console.error('Geolocation error:', error)
          },
          {
            enableHighAccuracy: true,
            maximumAge: 60000, // 1 minute
            timeout: 10000
          }
        )
      }
    } catch (error) {
      console.error('Error starting proximity monitoring:', error)
      isMonitoring.value = false
    }
  }

  const stopMonitoring = () => {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }

    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }

    isMonitoring.value = false
    currentAlerts.value = []
  }

  const enable = async () => {
    isEnabled.value = true
    await startMonitoring()
  }

  const disable = () => {
    isEnabled.value = false
    stopMonitoring()
  }

  onMounted(() => {
    // Load saved preference from settings
    // For now, default to disabled
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    isEnabled,
    alertRadius,
    currentAlerts,
    isMonitoring,
    isSupported,
    enable,
    disable,
    startMonitoring,
    stopMonitoring
  }
}

