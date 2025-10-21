/**
 * Feed Controller - Gerencia a visualização do feed de documentos
 */

class FeedController {
    constructor() {
        this.isMapView = false;
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // Containers principais
        this.mapContainer = document.getElementById('map-container');
        this.listView = document.getElementById('list-view');
        this.toggleViewBtn = document.getElementById('toggle-view-btn');
        this.toggleViewIcon = this.toggleViewBtn?.querySelector('i');
        this.toggleViewText = this.toggleViewBtn?.querySelector('span');
        
        // Filtros
        this.typeFilter = document.getElementById('feed-filter-type');
        this.statusFilter = document.getElementById('feed-filter-status');
    }

    setupEventListeners() {
        // Alternar entre visualização de lista e mapa
        if (this.toggleViewBtn) {
            this.toggleViewBtn.addEventListener('click', () => this.toggleView());
        }

        // Atualizar mapa quando os filtros mudarem
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
            // Mostrar mapa, esconder lista
            if (this.mapContainer) this.mapContainer.style.display = 'block';
            if (this.listView) this.listView.style.display = 'none';
            
            // Atualizar botão
            if (this.toggleViewIcon) this.toggleViewIcon.className = 'fas fa-list';
            if (this.toggleViewText) this.toggleViewText.textContent = 'Ver Lista';
            
            // Inicializar ou atualizar o mapa
            this.initializeMap();
        } else {
            // Mostrar lista, esconder mapa
            if (this.mapContainer) this.mapContainer.style.display = 'none';
            if (this.listView) this.listView.style.display = 'block';
            
            // Atualizar botão
            if (this.toggleViewIcon) this.toggleViewIcon.className = 'fas fa-map-marked-alt';
            if (this.toggleViewText) this.toggleViewText.textContent = 'Ver Mapa';
        }
    }

    async initializeMap() {
        // Verificar se o mapa já foi inicializado
        if (!window.mapInstance) {
            // Carregar o módulo do mapa
            const { initMap } = await import('./map.js');
            window.mapInstance = true;
            initMap();
        } else if (window.MapModule) {
            // Atualizar marcadores com os filtros atuais
            window.MapModule.loadDocumentMarkers();
        }
    }

    onFiltersChanged() {
        // Se estiver na visualização de mapa, atualizar os marcadores
        if (this.isMapView && window.MapModule) {
            window.MapModule.loadDocumentMarkers();
        }
        // A visualização de lista será atualizada pelos próprios listeners
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('feed')) {
        window.feedController = new FeedController();
    }
});

export { FeedController };
