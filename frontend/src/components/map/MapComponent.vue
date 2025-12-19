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
      <!-- User location -->
      <button
        class="btn-icon bg-white dark:bg-dark-card shadow-lg"
        @click="centerOnUserLocation"
        :disabled="!userLocation"
        title="Centralizar na minha localização"
      >
        <i class="fas fa-crosshairs"></i>
      </button>

      <!-- Toggle clustering -->
      <button
        class="btn-icon bg-white dark:bg-dark-card shadow-lg"
        :class="{ 'bg-primary text-white': clusteringEnabled }"
        @click="toggleClustering"
        title="Agrupar marcadores próximos"
      >
        <i class="fas fa-layer-group"></i>
      </button>

      <!-- Toggle heatmap -->
      <button
        class="btn-icon bg-white dark:bg-dark-card shadow-lg"
        :class="{ 'bg-danger text-white': heatmapEnabled }"
        @click="toggleHeatmap"
        title="Mapa de calor"
      >
        <i class="fas fa-fire"></i>
      </button>

      <!-- Fit bounds -->
      <button
        v-if="props.documents.length > 0"
        class="btn-icon bg-white dark:bg-dark-card shadow-lg"
        @click="fitAllMarkers"
        title="Ver todos os documentos"
      >
        <i class="fas fa-expand"></i>
      </button>

      <!-- Marking mode -->
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
    
    <!-- Stats badge -->
    <div class="absolute top-4 left-4 bg-white dark:bg-dark-card rounded-lg shadow-lg px-3 py-2 z-10">
      <div class="flex items-center space-x-4 text-sm">
        <div class="flex items-center space-x-1">
          <i class="fas fa-exclamation-circle text-danger"></i>
          <span class="font-semibold">{{ lostCount }}</span>
          <span class="text-gray-500 text-xs">perdidos</span>
        </div>
        <div class="flex items-center space-x-1">
          <i class="fas fa-check-circle text-success"></i>
          <span class="font-semibold">{{ foundCount }}</span>
          <span class="text-gray-500 text-xs">encontrados</span>
        </div>
      </div>
    </div>
    
    <!-- Legend -->
    <div class="absolute bottom-4 left-4 bg-white dark:bg-dark-card rounded-lg shadow-lg p-3 z-10">
      <div class="space-y-2 text-sm">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full bg-danger"></div>
          <span>Perdidos</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full bg-success"></div>
          <span>Recuperados</span>
        </div>
        <div v-if="userLocation" class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full bg-primary"></div>
          <span>Você</span>
        </div>
        <div v-if="clusteringEnabled" class="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-dark-border">
          <div class="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">5+</div>
          <span class="text-xs">Grupo</span>
        </div>
      </div>
    </div>
    
    <!-- Marking mode indicator -->
    <div v-if="isMarkingMode" class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-lg shadow-lg z-10 animate-pulse">
      <i class="fas fa-info-circle mr-2"></i>
      Clique no mapa para marcar a localização
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
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
const clusteringEnabled = ref(true) // Enabled by default for performance
const heatmapEnabled = ref(false)

const { coordinates: userLocation, getCurrentPosition } = useGeolocation()

// Computed stats
const lostCount = computed(() => props.documents.filter(d => d.status === 'lost').length)
const foundCount = computed(() => props.documents.filter(d => d.status === 'found').length)

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

watch(clusteringEnabled, () => {
  updateMarkers()
})

watch(heatmapEnabled, () => {
  toggleHeatmapLayer()
})

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
          maxzoom: 19,
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
    zoom: props.zoom,
    // Optimizations for low-end devices and slow connections
    maxTileCacheSize: 50, // Smaller cache for mobile
    refreshExpiredTiles: false, // Don't auto-refresh to save data
    renderWorldCopies: false // Performance optimization
  })
  
  // Add navigation controls
  map.value.addControl(new maplibregl.NavigationControl(), 'bottom-right')
  
  // Add scale control
  map.value.addControl(new maplibregl.ScaleControl({
    maxWidth: 100,
    unit: 'metric'
  }), 'bottom-left')
  
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
  if (!map.value || !map.value.isStyleLoaded()) return
  
  if (clusteringEnabled.value) {
    updateClusteredMarkers()
  } else {
    updateIndividualMarkers()
  }
}

const updateClusteredMarkers = () => {
  if (!map.value) return
  
  // Remove existing layers and sources
  if (map.value.getLayer('clusters')) map.value.removeLayer('clusters')
  if (map.value.getLayer('cluster-count')) map.value.removeLayer('cluster-count')
  if (map.value.getLayer('unclustered-point')) map.value.removeLayer('unclustered-point')
  if (map.value.getSource('documents')) map.value.removeSource('documents')
  
  // Remove individual markers
  markers.value.forEach(marker => marker.remove())
  markers.value = []
  
  // Create GeoJSON from documents
  const geojson: any = {
    type: 'FeatureCollection',
    features: props.documents
      .filter(doc => doc.location_metadata?.lat && doc.location_metadata?.lng)
      .map(doc => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [doc.location_metadata!.lng, doc.location_metadata!.lat]
        },
        properties: {
          id: doc.id,
          title: doc.title,
          description: doc.description || 'Sem descrição',
          location: doc.location || 'Localização não especificada',
          status: doc.status,
          type: doc.type
        }
      }))
  }
  
  // Add clustered source
  map.value.addSource('documents', {
    type: 'geojson',
    data: geojson,
    cluster: true,
    clusterMaxZoom: 16, // Max zoom to cluster points on
    clusterRadius: 60 // Radius of each cluster when clustering points
  })
  
  // Add cluster circles
  map.value.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'documents',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#3B82F6', // Blue for small clusters (< 10)
        10,
        '#F59E0B', // Orange for medium clusters (10-30)
        30,
        '#EF4444'  // Red for large clusters (30+)
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20, // Small clusters
        10,
        30, // Medium clusters
        30,
        40  // Large clusters
      ],
      'circle-opacity': 0.8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff'
    }
  })
  
  // Add cluster count labels
  map.value.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'documents',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 14
    },
    paint: {
      'text-color': '#ffffff'
    }
  })
  
  // Add unclustered points
  map.value.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'documents',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'match',
        ['get', 'status'],
        'lost', '#DC3545',
        'found', '#28A745',
        '#6C757D'
      ],
      'circle-radius': 10,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
      'circle-opacity': 0.9
    }
  })
  
  // Click handler for clusters
  map.value.on('click', 'clusters', (e) => {
    const features = map.value!.queryRenderedFeatures(e.point, {
      layers: ['clusters']
    })
    const clusterId = features[0].properties.cluster_id
    const source: any = map.value!.getSource('documents')
    
    source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
      if (err) return
      
      map.value!.easeTo({
        center: (features[0].geometry as any).coordinates,
        zoom: zoom
      })
    })
  })
  
  // Click handler for individual points
  map.value.on('click', 'unclustered-point', (e) => {
    if (!e.features || e.features.length === 0) return
    
    const properties = e.features[0].properties
    const coordinates = (e.features[0].geometry as any).coordinates.slice()
    
    // Find the document
    const doc = props.documents.find(d => d.id === properties.id)
    if (doc) {
      emit('markerClick', doc)
    }
    
    // Create popup
    new maplibregl.Popup()
      .setLngLat(coordinates)
      .setHTML(`
        <div class="p-2">
          <h4 class="font-semibold mb-1">${properties.title}</h4>
          <p class="text-sm text-gray-600 mb-2">${properties.description}</p>
          <p class="text-xs text-gray-500 mb-2">${properties.location}</p>
          <button 
            onclick="window.navigateToDocument('${properties.id}')" 
            class="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark"
          >
            Ver detalhes
          </button>
          <button 
            onclick="window.navigateToLocation(${coordinates[1]}, ${coordinates[0]})" 
            class="text-xs bg-success text-white px-3 py-1 rounded hover:bg-success-dark ml-1"
          >
            <i class="fas fa-directions"></i> Navegar
          </button>
        </div>
      `)
      .addTo(map.value!)
  })
  
  // Change cursor on hover
  map.value.on('mouseenter', 'clusters', () => {
    map.value!.getCanvas().style.cursor = 'pointer'
  })
  map.value.on('mouseleave', 'clusters', () => {
    map.value!.getCanvas().style.cursor = ''
  })
  map.value.on('mouseenter', 'unclustered-point', () => {
    map.value!.getCanvas().style.cursor = 'pointer'
  })
  map.value.on('mouseleave', 'unclustered-point', () => {
    map.value!.getCanvas().style.cursor = ''
  })
}

const updateIndividualMarkers = () => {
  if (!map.value) return
  
  // Remove clustered layers if they exist
  if (map.value.getLayer('clusters')) map.value.removeLayer('clusters')
  if (map.value.getLayer('cluster-count')) map.value.removeLayer('cluster-count')
  if (map.value.getLayer('unclustered-point')) map.value.removeLayer('unclustered-point')
  if (map.value.getLayer('heatmap-layer')) map.value.removeLayer('heatmap-layer')
  if (map.value.getSource('documents')) map.value.removeSource('documents')
  
  // Remove existing markers
  markers.value.forEach(marker => marker.remove())
  markers.value = []
  
  // Add new markers
  props.documents.forEach(doc => {
    if (!doc.location_metadata?.lat || !doc.location_metadata?.lng) return
    
    const { lat, lng } = doc.location_metadata
    
    // Create custom marker element with animation
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
        transition: transform 0.2s;
      ">
        <i class="fas ${icon}"></i>
      </div>
    `
    
    // Hover effect
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.2)'
    })
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)'
    })
    
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
}

const toggleHeatmapLayer = () => {
  if (!map.value || !map.value.isStyleLoaded()) return
  
  if (heatmapEnabled.value) {
    // Create GeoJSON from documents
    const geojson: any = {
      type: 'FeatureCollection',
      features: props.documents
        .filter(doc => doc.location_metadata?.lat && doc.location_metadata?.lng)
        .map(doc => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [doc.location_metadata!.lng, doc.location_metadata!.lat]
          },
          properties: {
            status: doc.status
          }
        }))
    }
    
    // Add or update heatmap source
    if (!map.value.getSource('documents-heatmap')) {
      map.value.addSource('documents-heatmap', {
        type: 'geojson',
        data: geojson
      })
    }
    
    // Add heatmap layer
    if (!map.value.getLayer('heatmap-layer')) {
      map.value.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'documents-heatmap',
        maxzoom: 16,
        paint: {
          // Increase weight as diameter increases
          'heatmap-weight': 1,
          // Increase intensity as zoom level increases
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            16, 3
          ],
          // Color ramp for heatmap
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          // Increase radius as zoom increases
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            16, 40
          ],
          // Decrease opacity as zoom increases
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 0.8,
            16, 0.3
          ]
        }
      }, 'clusters' || 'unclustered-point')
    }
  } else {
    // Remove heatmap layer
    if (map.value.getLayer('heatmap-layer')) {
      map.value.removeLayer('heatmap-layer')
    }
    if (map.value.getSource('documents-heatmap')) {
      map.value.removeSource('documents-heatmap')
    }
  }
}

const getUserLocation = async () => {
  const location = await getCurrentPosition()
  
  if (location && map.value) {
    // Create user location marker with pulse animation
    const el = document.createElement('div')
    el.innerHTML = `
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
      ">
        <div style="
          position: absolute;
          background-color: #007BFF;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          background-color: rgba(0,123,255,0.3);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          animation: pulse-ring 2s ease-out infinite;
        "></div>
      </div>
    `
    
    if (userMarker.value) {
      userMarker.value.remove()
    }
    
    userMarker.value = new maplibregl.Marker({ element: el })
      .setLngLat([location.longitude, location.latitude])
      .setPopup(new maplibregl.Popup().setHTML('<p class="p-2 font-semibold">Você está aqui</p>'))
      .addTo(map.value)
  }
}

const centerOnUserLocation = () => {
  if (userLocation.value && map.value) {
    map.value.flyTo({
      center: [userLocation.value.longitude, userLocation.value.latitude],
      zoom: 15,
      duration: 1500
    })
  }
}

const fitAllMarkers = () => {
  if (!map.value || props.documents.length === 0) return
  
  const bounds = new maplibregl.LngLatBounds()
  props.documents.forEach(doc => {
    if (doc.location_metadata?.lat && doc.location_metadata?.lng) {
      bounds.extend([doc.location_metadata.lng, doc.location_metadata.lat])
    }
  })
  
  map.value.fitBounds(bounds, { 
    padding: 80,
    duration: 1500
  })
}

const toggleClustering = () => {
  clusteringEnabled.value = !clusteringEnabled.value
}

const toggleHeatmap = () => {
  heatmapEnabled.value = !heatmapEnabled.value
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

<style scoped>
@import 'maplibre-gl/dist/maplibre-gl.css';

.custom-marker {
  cursor: pointer;
}

:deep(.maplibregl-popup-content) {
  border-radius: 8px;
  padding: 0;
}

:deep(.maplibregl-popup-close-button) {
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

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
}
</style>
