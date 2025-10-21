/**
 * Feed View Controller - Handles switching between list and map views
 */

class FeedViewController {
    constructor() {
        this.isMapView = false;
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // Main containers
        this.mapContainer = document.getElementById('map-container');
        this.listView = document.getElementById('list-view');
        this.toggleViewBtn = document.getElementById('toggle-view-btn');
        this.toggleViewIcon = this.toggleViewBtn?.querySelector('i');
        this.toggleViewText = this.toggleViewBtn?.querySelector('span');
        
        // Filter elements
        this.typeFilter = document.getElementById('feed-filter-type');
        this.statusFilter = document.getElementById('feed-filter-status');
    }

    setupEventListeners() {
        // Toggle between map and list view
        if (this.toggleViewBtn) {
            this.toggleViewBtn.addEventListener('click', () => this.toggleView());
        }

        // Update map when filters change
        if (this.typeFilter) {
            this.typeFilter.addEventListener('change', () => this.onFiltersChanged());
        }
        if (this.statusFilter) {
            this.statusFilter.addEventListener('change', () => this.onFiltersChanged());
        }
    }

    toggleView() {
        this.isMapView = !this.isMapView;
        this.updateView();
    }

    updateView() {
        if (this.isMapView) {
            // Show map, hide list
            if (this.mapContainer) this.mapContainer.style.display = 'block';
            if (this.listView) this.listView.style.display = 'none';
            
            // Update button
            if (this.toggleViewIcon) this.toggleViewIcon.className = 'fas fa-list';
            if (this.toggleViewText) this.toggleViewText.textContent = 'Ver Lista';
            
            // Initialize or refresh map
            this.initializeMap();
        } else {
            // Show list, hide map
            if (this.mapContainer) this.mapContainer.style.display = 'none';
            if (this.listView) this.listView.style.display = 'block';
            
            // Update button
            if (this.toggleViewIcon) this.toggleViewIcon.className = 'fas fa-map-marked-alt';
            if (this.toggleViewText) this.toggleViewText.textContent = 'Ver Mapa';
        }
    }

    async initializeMap() {
        // Check if map is already initialized
        if (!window.mapInstance) {
            // Import the map module
            const { initMap } = await import('./map.js');
            window.mapInstance = true;
            initMap();
        } else if (window.MapModule) {
            // Refresh map with current filters
            window.MapModule.loadDocumentMarkers();
        }
    }

    onFiltersChanged() {
        // If in map view, refresh the map with new filters
        if (this.isMapView && window.MapModule) {
            window.MapModule.loadDocumentMarkers();
        }
        // The list view will be updated by its own event listeners
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('feed')) {
        window.feedViewController = new FeedViewController();
    }
});

export { FeedViewController };
