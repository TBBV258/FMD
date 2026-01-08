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
    <div class="absolute bottom-4 left-4 bg-white dark:bg-dark-card rounded-lg shadow-lg p-3 z-10">
      <div class="space-y-2 text-sm">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full" style="background-color: #DC3545;"></div>
          <span>Perdidos</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full" style="background-color: #FF8C00;"></div>
          <span>Submetido por Utilizador</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
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
const map = ref<maplibregl.Map | null>(null)
const markers = ref<maplibregl.Marker[]>([])
const userMarker = ref<maplibregl.Marker | null>(null)

const { coordinates: userLocation, getCurrentPosition } = useGeolocation()

onMounted(() => {
  initializeMap()
  getUserLocation()
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
  }
  markers.value.forEach(marker => marker.remove())
  if (userMarker.value) {
    userMarker.value.remove()
  }
})

watch(() => props.documents, () => {
  updateMarkers()
}, { deep: true })

const initializeMap = () => {
  if (!mapContainer.value) return
  
  // Create map
  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-tiles-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    },
    center: props.center,
    zoom: props.zoom
  })

  // Add navigation controls
  map.value.addControl(new maplibregl.NavigationControl(), 'bottom-right')

  map.value.on('load', () => {
    isLoading.value = false
    updateMarkers()
  })
}

const createMarkerElement = (color: string, icon: string) => {
  const el = document.createElement('div')
  el.className = 'custom-marker'
  el.style.cssText = `
    background-color: ${color};
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
  `
  el.innerHTML = `<i class="fas ${icon}"></i>`
  return el
}

const updateMarkers = () => {
  if (!map.value || !map.value.loaded()) return
  
  // Remove existing markers
  markers.value.forEach(marker => marker.remove())
  markers.value = []
  
  const bounds = new maplibregl.LngLatBounds()
  let hasBounds = false
  
  // Add new markers
  props.documents.forEach(doc => {
    if (!doc.location_metadata?.lat || !doc.location_metadata?.lng) return
    
    const { lat, lng } = doc.location_metadata
    const coordinates: [number, number] = [lng, lat]
    
    // Create custom marker based on status
    const iconColor = doc.status === 'lost' ? '#DC3545' : '#FF8C00'
    const iconName = doc.status === 'lost' ? 'fa-search' : 'fa-check'
    const markerElement = createMarkerElement(iconColor, iconName)
    
    const marker = new maplibregl.Marker({
      element: markerElement,
      anchor: 'center'
    })
      .setLngLat(coordinates)
      .addTo(map.value!)
    
    // Create popup
    const popup = new maplibregl.Popup({ offset: 25 })
      .setHTML(`
        <div class="p-2">
          <h4 class="font-semibold mb-1">${doc.title}</h4>
          <p class="text-sm text-gray-600">${doc.description || 'Sem descrição'}</p>
          <p class="text-xs text-gray-500 mt-1">${doc.location || 'Localização não especificada'}</p>
        </div>
      `)
    
    marker.setPopup(popup)
    
    // Add click handler
    markerElement.addEventListener('click', () => {
      emit('markerClick', doc)
    })
    
    markers.value.push(marker)
    bounds.extend(coordinates)
    hasBounds = true
  })
  
  // Fit bounds if there are markers
  if (hasBounds && markers.value.length > 0) {
    map.value.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15
    })
  }
}

const getUserLocation = async () => {
  const location = await getCurrentPosition()
  
  if (location && map.value && map.value.loaded()) {
    const coordinates: [number, number] = [location.longitude, location.latitude]
    
    // Remove existing user marker
    if (userMarker.value) {
      userMarker.value.remove()
    }
    
    // Create user location marker
    const userEl = document.createElement('div')
    userEl.className = 'user-marker'
    userEl.style.cssText = `
      background-color: #007BFF;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `
    
    userMarker.value = new maplibregl.Marker({
      element: userEl,
      anchor: 'center'
    })
      .setLngLat(coordinates)
      .setPopup(new maplibregl.Popup().setHTML('Você está aqui'))
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

.maplibregl-popup-content {
  border-radius: 8px;
  padding: 0;
}

.maplibregl-popup-content-wrapper {
  padding: 0;
}
</style>
