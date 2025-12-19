<template>
  <div class="relative w-full h-full">
    <!-- Map container -->
    <div ref="mapContainer" class="w-full h-full rounded-lg overflow-hidden"></div>
    
    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-white/80 dark:bg-dark-bg/80 flex items-center justify-center"
    >
      <div class="text-center">
        <div class="spinner mb-2"></div>
        <p class="text-sm text-gray-600 dark:text-gray-400">Carregando mapa...</p>
      </div>
    </div>
    
    <!-- Map controls -->
    <div class="absolute top-4 right-4 space-y-2">
      <button
        class="btn-icon bg-white dark:bg-dark-card shadow-lg"
        @click="centerOnUserLocation"
        :disabled="!userLocation"
      >
        <i class="fas fa-crosshairs"></i>
      </button>
      <button
        class="btn-icon bg-white dark:bg-dark-card shadow-lg"
        @click="toggleMapType"
      >
        <i class="fas fa-layer-group"></i>
      </button>
    </div>
    
    <!-- Legend -->
    <div class="absolute bottom-4 left-4 bg-white dark:bg-dark-card rounded-lg shadow-lg p-3">
      <div class="space-y-2 text-sm">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full" style="background-color: #DC3545;"></div>
          <span>Perdidos</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full" style="background-color: #28A745;"></div>
          <span>Encontrados</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Document } from '@/types'
import { useGeolocation } from '@/composables/useGeolocation'

interface Props {
  documents?: Document[]
  center?: [number, number]
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  documents: () => [],
  center: () => [-25.9655, 32.5832], // Maputo coordinates
  zoom: 12
})

const emit = defineEmits<{
  markerClick: [document: Document]
}>()

const mapContainer = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const map = ref<any>(null)
const markers = ref<any[]>([])
const userMarker = ref<any>(null)

const { coordinates: userLocation, getCurrentPosition } = useGeolocation()

let L: any = null

onMounted(async () => {
  await loadLeaflet()
  initializeMap()
  await getUserLocation()
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
  }
})

watch(() => props.documents, () => {
  updateMarkers()
}, { deep: true })

const loadLeaflet = async () => {
  if (typeof window === 'undefined') return
  
  // Check if Leaflet is already loaded
  if ((window as any).L) {
    L = (window as any).L
    return
  }
  
  // Load Leaflet CSS
  if (!document.querySelector('link[href*="leaflet.css"]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }
  
  // Load Leaflet JS
  return new Promise((resolve, reject) => {
    if ((window as any).L) {
      L = (window as any).L
      resolve(true)
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      L = (window as any).L
      resolve(true)
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

const initializeMap = () => {
  if (!L || !mapContainer.value) return
  
  // Create map
  map.value = L.map(mapContainer.value, {
    zoomControl: false
  }).setView(props.center, props.zoom)
  
  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map.value)
  
  // Add zoom control in bottom right
  L.control.zoom({ position: 'bottomright' }).addTo(map.value)
  
  isLoading.value = false
  
  // Add markers
  updateMarkers()
}

const updateMarkers = () => {
  if (!L || !map.value) return
  
  // Remove existing markers
  markers.value.forEach(marker => marker.remove())
  markers.value = []
  
  // Add new markers
  props.documents.forEach(doc => {
    if (!doc.location_metadata?.lat || !doc.location_metadata?.lng) return
    
    const { lat, lng } = doc.location_metadata
    
    // Create custom icon based on status
    const iconColor = doc.status === 'lost' ? '#DC3545' : '#28A745'
    const iconHtml = `
      <div style="
        background-color: ${iconColor};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-center;
        color: white;
        font-size: 14px;
      ">
        <i class="fas ${doc.status === 'lost' ? 'fa-search' : 'fa-check'}"></i>
      </div>
    `
    
    const icon = L.divIcon({
      html: iconHtml,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
    
    const marker = L.marker([lat, lng], { icon })
      .addTo(map.value)
      .bindPopup(`
        <div class="p-2">
          <h4 class="font-semibold mb-1">${doc.title}</h4>
          <p class="text-sm text-gray-600">${doc.description || 'Sem descrição'}</p>
          <p class="text-xs text-gray-500 mt-1">${doc.location || 'Localização não especificada'}</p>
        </div>
      `)
      .on('click', () => emit('markerClick', doc))
    
    markers.value.push(marker)
  })
  
  // Fit bounds if there are markers
  if (markers.value.length > 0) {
    const group = L.featureGroup(markers.value)
    map.value.fitBounds(group.getBounds().pad(0.1))
  }
}

const getUserLocation = async () => {
  const location = await getCurrentPosition()
  
  if (location && L && map.value) {
    // Add user location marker
    const userIconHtml = `
      <div style="
        background-color: #007BFF;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `
    
    const userIcon = L.divIcon({
      html: userIconHtml,
      className: 'user-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })
    
    if (userMarker.value) {
      userMarker.value.remove()
    }
    
    userMarker.value = L.marker([location.latitude, location.longitude], { icon: userIcon })
      .addTo(map.value)
      .bindPopup('Você está aqui')
  }
}

const centerOnUserLocation = () => {
  if (userLocation.value && map.value) {
    map.value.setView([userLocation.value.latitude, userLocation.value.longitude], 15)
  }
}

const toggleMapType = () => {
  // Toggle between different map types (future enhancement)
  console.log('Toggle map type')
}
</script>

<style>
.custom-marker,
.user-marker {
  background: transparent;
  border: none;
}

.leaflet-popup-content-wrapper {
  border-radius: 8px;
}

.leaflet-popup-content {
  margin: 0;
}
</style>

