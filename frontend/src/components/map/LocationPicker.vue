<template>
  <BaseModal v-model="isOpen" title="Selecionar Localização" maxWidth="4xl">
    <div class="space-y-4">
      <!-- Instructions -->
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-start space-x-3">
        <i class="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
        <div class="flex-1">
          <p class="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-1">
            {{ title }}
          </p>
          <p class="text-xs text-blue-700 dark:text-blue-300">
            {{ message }}
          </p>
        </div>
      </div>

      <!-- Current selection info -->
      <div v-if="selectedLocation" class="bg-success/10 rounded-lg p-3">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-semibold text-success-dark dark:text-success mb-1">
              <i class="fas fa-check-circle mr-1"></i>
              Localização Selecionada
            </p>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              Lat: {{ selectedLocation.lat.toFixed(6) }}, Lng: {{ selectedLocation.lng.toFixed(6) }}
            </p>
            <p v-if="selectedLocation.address" class="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {{ selectedLocation.address }}
            </p>
          </div>
          <button
            @click="clearSelection"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Limpar seleção"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Map -->
      <div class="relative rounded-lg overflow-hidden" style="height: 400px;">
        <div ref="mapContainer" class="w-full h-full"></div>
        
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

        <!-- Click instruction -->
        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-lg shadow-lg text-sm z-10">
          <i class="fas fa-hand-pointer mr-2"></i>
          Clique no mapa para selecionar
        </div>
      </div>

      <!-- Search location (optional for future) -->
      <div class="flex items-center space-x-2">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar local (opcional)..."
            class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-input text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            @keyup.enter="searchLocation"
          />
        </div>
        <button
          @click="searchLocation"
          class="btn-icon bg-primary text-white"
          :disabled="!searchQuery.trim()"
          title="Buscar"
        >
          <i class="fas fa-search"></i>
        </button>
      </div>
    </div>

    <template #footer>
      <div class="flex space-x-3">
        <BaseButton
          variant="secondary"
          full-width
          @click="handleCancel"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          full-width
          :disabled="!selectedLocation"
          @click="handleConfirm"
        >
          <i class="fas fa-check mr-2"></i>
          Confirmar Localização
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import maplibregl from 'maplibre-gl'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useGeolocation } from '@/composables/useGeolocation'

interface Props {
  title?: string
  message?: string
  initialLocation?: { lat: number; lng: number }
}

interface Location {
  lat: number
  lng: number
  address?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Selecionar Localização no Mapa',
  message: 'Clique no mapa para marcar a localização desejada. Você pode arrastar o marcador para ajustar.'
})

const isOpen = defineModel<boolean>()
const emit = defineEmits<{
  (e: 'location-selected', location: Location): void
}>()

const mapContainer = ref<HTMLElement | null>(null)
const map = ref<maplibregl.Map | null>(null)
const marker = ref<maplibregl.Marker | null>(null)
const isLoading = ref(true)
const selectedLocation = ref<Location | null>(null)
const searchQuery = ref('')

const { getCurrentPosition } = useGeolocation()

watch(isOpen, (newValue) => {
  if (newValue && !map.value) {
    setTimeout(() => {
      initializeMap()
    }, 100)
  }
})

const initializeMap = async () => {
  if (!mapContainer.value) return
  
  isLoading.value = true
  
  // Get initial center
  let center: [number, number] = [32.5832, -25.9655] // Maputo [lng, lat]
  
  if (props.initialLocation) {
    center = [props.initialLocation.lng, props.initialLocation.lat]
  } else {
    // Try to get user location
    const userLocation = await getCurrentPosition()
    if (userLocation) {
      center = [userLocation.longitude, userLocation.latitude]
    }
  }
  
  // Create map
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
    center: center,
    zoom: 13
  })
  
  // Add navigation controls
  map.value.addControl(new maplibregl.NavigationControl(), 'top-right')
  
  // Handle map click
  map.value.on('click', (e) => {
    handleMapClick(e.lngLat.lat, e.lngLat.lng)
  })
  
  map.value.on('load', () => {
    isLoading.value = false
    
    // If initial location, add marker
    if (props.initialLocation) {
      handleMapClick(props.initialLocation.lat, props.initialLocation.lng)
    }
  })
}

const handleMapClick = (lat: number, lng: number) => {
  if (!map.value) return
  
  // Remove previous marker
  if (marker.value) {
    marker.value.remove()
  }
  
  // Create draggable marker
  const el = document.createElement('div')
  el.innerHTML = `
    <div style="
      background-color: #DC2626;
      width: 40px;
      height: 40px;
      border-radius: 50% 50% 50% 0;
      border: 3px solid white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      transform: rotate(-45deg);
      cursor: move;
    ">
      <i class="fas fa-map-marker-alt" style="transform: rotate(45deg);"></i>
    </div>
  `
  
  marker.value = new maplibregl.Marker({
    element: el,
    draggable: true
  })
    .setLngLat([lng, lat])
    .addTo(map.value)
  
  // Update location on drag
  marker.value.on('dragend', () => {
    const lngLat = marker.value!.getLngLat()
    updateSelectedLocation(lngLat.lat, lngLat.lng)
  })
  
  updateSelectedLocation(lat, lng)
}

const updateSelectedLocation = (lat: number, lng: number) => {
  selectedLocation.value = {
    lat,
    lng
  }
  
  // Try to get address (reverse geocoding - simplified for now)
  // In production, use a proper geocoding service
  selectedLocation.value.address = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
}

const clearSelection = () => {
  selectedLocation.value = null
  if (marker.value) {
    marker.value.remove()
    marker.value = null
  }
}

const searchLocation = () => {
  // TODO: Implement location search with geocoding API
  // For now, just show a message
  alert('Busca de localização será implementada em breve. Por favor, clique no mapa para selecionar.')
}

const handleConfirm = () => {
  if (selectedLocation.value) {
    emit('location-selected', selectedLocation.value)
    isOpen.value = false
  }
}

const handleCancel = () => {
  clearSelection()
  isOpen.value = false
}

onMounted(() => {
  if (isOpen.value && mapContainer.value) {
    initializeMap()
  }
})
</script>

<style scoped>
@import 'maplibre-gl/dist/maplibre-gl.css';
</style>

