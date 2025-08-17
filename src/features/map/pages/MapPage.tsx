import React, { useState, useEffect, useRef } from 'react';
import { Search, Layers, Navigation, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { databaseAPI } from '@/lib/api/database';
import type { DocumentType } from '@/lib/types';

type MapFilter = 'all' | 'lost' | 'found';
type MapView = 'documents' | 'heatmap' | 'clusters';

export const MapPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<MapFilter>('all');
  const [selectedType, setSelectedType] = useState<DocumentType | 'all'>('all');
  const [mapView, setMapView] = useState<MapView>('documents');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  console.log('🗺️ MapPage: Component rendered for user:', user?.email);

  // Fetch documents for map display
  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['map-documents', selectedFilter, selectedType],
    queryFn: async () => {
      if (selectedFilter === 'lost') {
        return databaseAPI.getLostDocuments({ type: selectedType === 'all' ? undefined : selectedType });
      } else if (selectedFilter === 'found') {
        return databaseAPI.getFoundDocuments({ type: selectedType === 'all' ? undefined : selectedType });
      } else {
        // Get both lost and found documents
        const [lost, found] = await Promise.all([
          databaseAPI.getLostDocuments({ type: selectedType === 'all' ? undefined : selectedType }),
          databaseAPI.getFoundDocuments({ type: selectedType === 'all' ? undefined : selectedType }),
        ]);
        return [...lost, ...found];
      }
    },
    enabled: !!user?.id,
  });

  // Filter documents based on search query
  const filteredDocuments = documents?.filter(doc => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(query) ||
      doc.description?.toLowerCase().includes(query) ||
      doc.location?.toLowerCase().includes(query)
    );
  }) || [];

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          console.log('📍 MapPage: User location obtained:', { lat: latitude, lng: longitude });
        },
        (error) => {
          console.warn('⚠️ MapPage: Could not get user location:', error);
        }
      );
    }
  }, []);

  // Initialize map when component mounts
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      initializeMap();
    }
  }, []);

  // Update map when documents change
  useEffect(() => {
    if (mapRef.current && documents) {
      updateMapMarkers();
    }
  }, [documents, mapView]);

  const initializeMap = () => {
    console.log('🗺️ MapPage: Initializing map');
    
    // For now, we'll create a placeholder map
    // In a real implementation, you'd use Leaflet or Google Maps
    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = `
        <div class="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div class="text-center">
            <MapPin class="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              ${t('map.loading') || 'Carregando mapa...'}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              ${t('map.initializing') || 'Inicializando visualização do mapa'}
            </p>
          </div>
        </div>
      `;
    }
  };

  const updateMapMarkers = () => {
    console.log('🗺️ MapPage: Updating map markers for', filteredDocuments.length, 'documents');
    
    // This would update the map with new markers
    // For now, we'll just log the action
  };

  const handleSearch = () => {
    console.log('🔍 MapPage: Searching for:', searchQuery);
    // Search functionality would be implemented here
  };

  const handleFilterChange = (filter: MapFilter) => {
    console.log('🔧 MapPage: Filter changed to:', filter);
    setSelectedFilter(filter);
  };

  const handleTypeChange = (type: DocumentType | 'all') => {
    console.log('🔧 MapPage: Type changed to:', type);
    setSelectedType(type);
  };

  const handleViewChange = (view: MapView) => {
    console.log('🔧 MapPage: View changed to:', view);
    setMapView(view);
  };

  const handleGoToUserLocation = () => {
    if (userLocation && mapRef.current) {
      // In a real implementation, you'd pan the map to user location
      console.log('📍 MapPage: Going to user location:', userLocation);
    } else {
      console.log('⚠️ MapPage: User location not available');
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'lost' ? '🚨' : '💚';
  };

  if (isLoadingDocuments) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {t('map.title') || 'Mapa de Documentos'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('map.subtitle') || 'Visualize documentos perdidos e encontrados no mapa'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToUserLocation}
              disabled={!userLocation}
            >
              <Navigation className="w-4 h-4 mr-2" />
              {t('map.my_location') || 'Minha Localização'}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('map.search_placeholder') || 'Pesquisar por localização...'}
                className="pl-10"
                fullWidth
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedFilter}
              onChange={(e) => handleFilterChange(e.target.value as MapFilter)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">{t('map.all_status') || 'Todos'}</option>
              <option value="lost">{t('map.lost_only') || 'Apenas Perdidos'}</option>
              <option value="found">{t('map.found_only') || 'Apenas Encontrados'}</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value as DocumentType | 'all')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">{t('map.all_types') || 'Todos os Tipos'}</option>
              <option value="bi">{t('type.bi')}</option>
              <option value="passaporte">{t('type.passaporte')}</option>
              <option value="carta">{t('type.carta')}</option>
              <option value="outros">{t('type.outros')}</option>
            </select>
          </div>
        </div>

        {/* Map View Controls */}
        <div className="flex items-center space-x-2 mt-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('map.view') || 'Visualização'}:
          </span>
          <div className="flex space-x-1">
            {(['documents', 'heatmap', 'clusters'] as MapView[]).map((view) => (
              <Button
                key={view}
                variant={mapView === view ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleViewChange(view)}
              >
                <Layers className="w-4 h-4 mr-1" />
                {t(`map.view_${view}`) || view}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div
          ref={mapContainerRef}
          className="w-full h-full bg-gray-100 dark:bg-gray-800"
        />
        
        {/* Results Count Overlay */}
        <div className="absolute top-4 right-4">
          <Card className="shadow-lg">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {filteredDocuments.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {t('map.documents_shown') || 'documentos'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4">
          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('map.legend') || 'Legenda'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🚨</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {t('status.lost') || 'Perdido'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💚</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {t('status.found') || 'Encontrado'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document List Sidebar (Mobile) */}
      <div className="md:hidden">
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="text-sm">
              {t('map.nearby_documents') || 'Documentos Próximos'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {filteredDocuments.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <span className="text-lg">{getStatusIcon(doc.status)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {doc.location}
                    </p>
                  </div>
                </div>
              ))}
              {filteredDocuments.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  <Info className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">
                    {t('map.no_documents_found') || 'Nenhum documento encontrado'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
