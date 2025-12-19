<template>
  <div class="relative w-full h-full">
    <!-- Map container -->
    <div ref="mapContainer" class="w-full h-full rounded-lg overflow-hidden"></div>
    
    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-white/80 dark:bg-dark-bg/80 flex items-center justify-center z-10"
    >
      <div class="text-center">
        <div class="spinner mb-2"></div>
        <p class="text-sm text-gray-600 dark:text-gray-400">Carregando mapa...</p>
      </div>
    </div>
    
    <!-- Map controls -->
    <div class="absolute top-4 right-4 space-y-2 z-10">
      <button
        class="btn-icon bg-white dark:bg-dark-card shadow-lg"
        @click="centerOnUserLocation"
        :disabled="!userLocation"
        title="Centralizar na minha localização"
      >
        <i class="fas fa-crosshairs"></i>
      </button>
      <button
        v-if="enableMarking"
        class="btn-icon bg-white dark:bg-dark-card shadow-lg"
        :class="{ 'bg-primary text-white': isMarkingMode }"
        @click="toggleMarkingMode"
        title="Marcar localização"
      >
        <i class="fas fa-map-pin"></i>
      </button>
    </div>
    
    <!-- Legend -->
    <div class="absolute bottom-4 left-4 bg-white dark:bg-dark-card rounded-lg shadow-lg p-3 z-10">
      <div class="space-y-2 text-sm">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full" style="background-color: #DC3545;"></div>
          <span>Perdidos</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full" style="background-color: #28A745;"></div>
          <span>Recuperados</span>
        </div>
        <div v-if="userLocation" class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full" style="background-color: #007BFF;"></div>
          <span>Você</span>
        </div>
      </div>
    </div>
    
    <!-- Marking mode indicator -->
    <div v-if="isMarkingMode" class="absolute top-4 left-4 bg-primary text-white px-4 py-2 rounded-lg shadow-lg z-10">
      <i class="fas fa-info-circle mr-2"></i>
      Clique no mapa para marcar a localização
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import type { Document } from '@/types'
import { useGeolocation } from '@/composables/useGeolocation'

interface Props {
  documents?: Document[]
  center?: [number, number]
  zoom?: number
  enableMarking?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  documents: () => [],
  center: () => [-25.9655, 32.5832], // Maputo coordinates
  zoom: 12,
  enableMarking: false
})

const emit = defineEmits<{
  markerClick: [document: Document]
  locationMarked: [location: { lat: number; lng: number }]
  navigate: [location: { lat: number; lng: number }]
}>()

const mapContainer = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const map = ref<maplibregl.Map | null>(null)
const markers = ref<maplibregl.Marker[]>([])
const userMarker = ref<maplibregl.Marker | null>(null)
const markingMarker = ref<maplibregl.Marker | null>(null)
const isMarkingMode = ref(false)

const { coordinates: userLocation, getCurrentPosition } = useGeolocation()

onMounted(async () => {
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

const initializeMap = () => {
  if (!mapContainer.value) return
  
  // Create map with MapLibre
  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    },
    center: [props.center[1], props.center[0]], // [lng, lat]
    zoom: props.zoom
  })
  
  // Add navigation controls
  map.value.addControl(new maplibregl.NavigationControl(), 'bottom-right')
  
  // Handle map click for marking mode
  map.value.on('click', (e) => {
    if (isMarkingMode.value) {
      handleMapClick(e.lngLat.lat, e.lngLat.lng)
    }
  })
  
  map.value.on('load', () => {
    isLoading.value = false
    updateMarkers()
  })
}

const updateMarkers = () => {
  if (!map.value) return
  
  // Remove existing markers
  markers.value.forEach(marker => marker.remove())
  markers.value = []
  
  // Add new markers
  props.documents.forEach(doc => {
    if (!doc.location_metadata?.lat || !doc.location_metadata?.lng) return
    
    const { lat, lng } = doc.location_metadata
    
    // Create custom marker element
    const el = document.createElement('div')
    el.className = 'custom-marker'
    const iconColor = doc.status === 'lost' ? '#DC3545' : '#28A745'
    const icon = doc.status === 'lost' ? 'fa-search' : 'fa-check'
    
    el.innerHTML = `
      <div style="
        background-color: ${iconColor};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        cursor: pointer;
      ">
        <i class="fas ${icon}"></i>
      </div>
    `
    
    // Create popup
    const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
      <div class="p-2">
        <h4 class="font-semibold mb-1">${doc.title}</h4>
        <p class="text-sm text-gray-600 mb-2">${doc.description || 'Sem descrição'}</p>
        <p class="text-xs text-gray-500 mb-2">${doc.location || 'Localização não especificada'}</p>
        <button 
          onclick="window.navigateToDocument('${doc.id}')" 
          class="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark"
        >
          Ver detalhes
        </button>
        <button 
          onclick="window.navigateToLocation(${lat}, ${lng})" 
          class="text-xs bg-success text-white px-3 py-1 rounded hover:bg-success-dark ml-1"
        >
          <i class="fas fa-directions"></i> Navegar
        </button>
      </div>
    `)
    
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map.value!)
    
    el.addEventListener('click', () => emit('markerClick', doc))
    
    markers.value.push(marker)
  })
  
  // Fit bounds if there are markers
  if (markers.value.length > 0) {
    const bounds = new maplibregl.LngLatBounds()
    props.documents.forEach(doc => {
      if (doc.location_metadata?.lat && doc.location_metadata?.lng) {
        bounds.extend([doc.location_metadata.lng, doc.location_metadata.lat])
      }
    })
    map.value!.fitBounds(bounds, { padding: 50 })
  }
}

const getUserLocation = async () => {
  const location = await getCurrentPosition()
  
  if (location && map.value) {
    // Create user location marker
    const el = document.createElement('div')
    el.innerHTML = `
      <div style="
        background-color: #007BFF;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `
    
    if (userMarker.value) {
      userMarker.value.remove()
    }
    
    userMarker.value = new maplibregl.Marker({ element: el })
      .setLngLat([location.longitude, location.latitude])
      .setPopup(new maplibregl.Popup().setHTML('<p>Você está aqui</p>'))
      .addTo(map.value)
  }
}

const centerOnUserLocation = () => {
  if (userLocation.value && map.value) {
    map.value.flyTo({
      center: [userLocation.value.longitude, userLocation.value.latitude],
      zoom: 15
    })
  }
}

const toggleMarkingMode = () => {
  isMarkingMode.value = !isMarkingMode.value
  if (!isMarkingMode.value && markingMarker.value) {
    markingMarker.value.remove()
    markingMarker.value = null
  }
}

const handleMapClick = (lat: number, lng: number) => {
  if (!map.value) return
  
  // Remove previous marking marker
  if (markingMarker.value) {
    markingMarker.value.remove()
  }
  
  // Create new marking marker
  const el = document.createElement('div')
  el.innerHTML = `
    <div style="
      background-color: #FFC107;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      animation: pulse 2s infinite;
    ">
      <i class="fas fa-map-marker-alt"></i>
    </div>
  `
  
  markingMarker.value = new maplibregl.Marker({ element: el })
    .setLngLat([lng, lat])
    .addTo(map.value)
  
  // Emit location
  emit('locationMarked', { lat, lng })
  
  // Exit marking mode after selection
  isMarkingMode.value = false
}

// Global functions for popup buttons
if (typeof window !== 'undefined') {
  (window as any).navigateToDocument = (id: string) => {
    window.location.href = `/document/${id}`
  }
  
  (window as any).navigateToLocation = (lat: number, lng: number) => {
    emit('navigate', { lat, lng })
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    window.open(url, '_blank')
  }
}
</script>

<style>
@import 'maplibre-gl/dist/maplibre-gl.css';

.custom-marker {
  cursor: pointer;
}

.maplibregl-popup-content {
  border-radius: 8px;
  padding: 0;
}

.maplibregl-popup-close-button {
  font-size: 20px;
  padding: 4px 8px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}
</style>
