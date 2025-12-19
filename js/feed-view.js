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
        this.filterContainer = document.getElementById('feed-filters');
        
        // Create search and filter container if it doesn't exist
        if (!document.getElementById('search-filter-container')) {
            const container = document.createElement('div');
            container.id = 'search-filter-container';
            container.className = 'search-filter-container';
            
            // Create search button
            this.searchBtn = document.createElement('button');
            this.searchBtn.id = 'search-btn';
            this.searchBtn.className = 'search-btn';
            this.searchBtn.innerHTML = '<i class="fas fa-search"></i> Pesquisar';
            
            // Create filter panel
            this.filterPanel = document.createElement('div');
            this.filterPanel.id = 'filter-panel';
            this.filterPanel.className = 'filter-panel';
            
            // Move existing filters to the new panel
            if (this.filterContainer) {
                this.filterPanel.appendChild(this.filterContainer);
            }
            
            container.appendChild(this.searchBtn);
            container.appendChild(this.filterPanel);
            
            // Insert the new container in the appropriate location
            const mainContent = document.querySelector('.container');
            if (mainContent) {
                mainContent.insertBefore(container, mainContent.firstChild);
            }
        }
        
        // Get references to new elements
        this.searchBtn = document.getElementById('search-btn');
        this.filterPanel = document.getElementById('filter-panel');
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

        // Toggle search panel
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.toggleSearchPanel());
        }

        // Close search panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.filterPanel && 
                !this.filterPanel.contains(e.target) && 
                !this.searchBtn.contains(e.target) &&
                this.filterPanel.classList.contains('show')) {
                this.hideSearchPanel();
            }
        });
    }

    toggleSearchPanel() {
        if (this.filterPanel) {
            const isVisible = this.filterPanel.classList.contains('show');
            if (isVisible) {
                this.hideSearchPanel();
            } else {
                this.showSearchPanel();
            }
        }
    }

    showSearchPanel() {
        this.filterPanel.classList.add('show');
        this.searchBtn.classList.add('active');
        // Animate the panel
        this.filterPanel.style.opacity = '0';
        this.filterPanel.style.display = 'block';
        setTimeout(() => {
            this.filterPanel.style.opacity = '1';
        }, 10);
    }

    hideSearchPanel() {
        this.filterPanel.classList.remove('show');
        this.searchBtn.classList.remove('active');
        this.filterPanel.style.opacity = '0';
        setTimeout(() => {
            this.filterPanel.style.display = 'none';
        }, 300);
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
