/**
 * Map functionality using Leaflet.js
 */

let map;
let markers = [];

// Initialize the map
function initMap() {
    // Default to Maputo, Mozambique coordinates
    const defaultLat = -25.9653;
    const defaultLng = 32.5892;
    const defaultZoom = 13;
    
    // Create map instance
    map = L.map('map').setView([defaultLat, defaultLng], defaultZoom);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add click event to add markers
    map.on('click', onMapClick);
    
    // Add geolocation control
    L.control.locate({
        position: 'topleft',
        drawCircle: true,
        follow: true,
        setView: true,
        keepCurrentZoomLevel: true,
        markerStyle: {
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.8
        },
        circleStyle: {
            weight: 1,
            clickable: false
        },
        icon: 'fa-location-arrow',
        metric: true,
        strings: {
            title: 'Mostrar a minha localização',
            popup: 'Você está dentro de {distance} {unit} deste ponto',
            outsideMapBoundsMsg: 'Parece que você está fora dos limites do mapa'
        },
        locateOptions: {
            maxZoom: 16,
            watch: true,
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 10000
        }
    }).addTo(map);
    
    // Load initial markers
    loadDocumentMarkers();
}

// Handle map click to add a new marker
function onMapClick(e) {
    // If we're in document submission mode, add a marker
    if (window.addingDocumentLocation) {
        // Clear existing markers if any
        clearMarkers();
        
        // Add new marker
        const marker = L.marker(e.latlng, {
            draggable: true,
            autoPan: true
        }).addTo(map);
        
        // Add to markers array
        markers.push(marker);
        
        // Update form fields if they exist
        const latInput = document.getElementById('document-lat');
        const lngInput = document.getElementById('document-lng');
        
        if (latInput && lngInput) {
            latInput.value = e.latlng.lat.toFixed(6);
            lngInput.value = e.latlng.lng.toFixed(6);
        }
        
        // Add popup
        marker.bindPopup('Localização do documento').openPopup();
        
        // Pan to marker
        map.panTo(e.latlng);
    }
}

// Load document markers on the map
async function loadDocumentMarkers() {
    try {
        // Clear existing markers
        clearMarkers();
        
        // Get documents with location data
        const documents = await window.documentsApi.getAllWithLocation();
        
        if (!documents || documents.length === 0) return;
        
        // Add markers for each document
        documents.forEach(doc => {
            if (doc.latitude && doc.longitude) {
                const marker = L.marker([doc.latitude, doc.longitude], {
                    title: doc.type || 'Documento'
                });
                
                // Add popup with document info
                const popupContent = `
                    <div class="map-popup">
                        <strong>${doc.type || 'Documento'}</strong><br>
                        ${doc.status === 'lost' ? 'Perdido' : 'Encontrado'}<br>
                        ${doc.description || ''}
                        ${doc.found_date ? `<br>Data: ${new Date(doc.found_date).toLocaleDateString()}` : ''}
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                marker.addTo(map);
                markers.push(marker);
            }
        });
        
        // Fit map to bounds of all markers if we have any
        if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    } catch (error) {
        console.error('Error loading document markers:', error);
    }
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('map')) {
        initMap();
    }
});

// Export functions for use in other files
window.MapModule = {
    initMap,
    loadDocumentMarkers,
    clearMarkers
};
