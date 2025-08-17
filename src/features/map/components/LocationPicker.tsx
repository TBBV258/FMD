import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTranslation } from '@/i18n';

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  onClose: () => void;
  initialLocation?: { lat: number; lng: number; address?: string };
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  onClose,
  initialLocation,
}) => {
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(initialLocation || null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  console.log('📍 LocationPicker: Component rendered');

  // Get user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          console.log('📍 LocationPicker: User location obtained:', { lat: latitude, lng: longitude });
        },
        (error) => {
          console.warn('⚠️ LocationPicker: Could not get user location:', error);
        }
      );
    }
  }, []);

  // Initialize map when component mounts
  useEffect(() => {
    if (mapContainerRef.current) {
      initializeMap();
    }
  }, []);

  const initializeMap = () => {
    console.log('🗺️ LocationPicker: Initializing map');
    
    // For now, we'll create a placeholder map
    // In a real implementation, you'd use Leaflet or Google Maps
    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = `
        <div class="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div class="text-center">
            <MapPin class="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              ${t('location.click_map') || 'Clique no mapa para selecionar uma localização'}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              ${t('location.map_instructions') || 'Clique em qualquer lugar do mapa para definir a localização'}
            </p>
          </div>
        </div>
      `;

      // Add click handler to the map
      mapContainerRef.current.addEventListener('click', handleMapClick);
    }
  };

  const handleMapClick = (event: MouseEvent) => {
    // In a real implementation, you'd convert screen coordinates to map coordinates
    // For now, we'll use placeholder coordinates
    const mockLocation = {
      lat: -8.8383 + (Math.random() - 0.5) * 0.1, // Random location around Luanda
      lng: 13.2344 + (Math.random() - 0.5) * 0.1,
      address: `Localização ${Math.floor(Math.random() * 1000)}`,
    };
    
    setSelectedLocation(mockLocation);
    console.log('📍 LocationPicker: Location selected from map:', mockLocation);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    console.log('🔍 LocationPicker: Searching for location:', searchQuery);
    
    try {
      // In a real implementation, you'd use a geocoding service
      // For now, we'll simulate a search result
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockLocation = {
        lat: -8.8383 + (Math.random() - 0.5) * 0.1,
        lng: 13.2344 + (Math.random() - 0.5) * 0.1,
        address: searchQuery,
      };
      
      setSelectedLocation(mockLocation);
      console.log('📍 LocationPicker: Search result:', mockLocation);
    } catch (error) {
      console.error('❌ LocationPicker: Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (userLocation) {
      const location = {
        ...userLocation,
        address: t('location.current_location') || 'Localização Atual',
      };
      setSelectedLocation(location);
      console.log('📍 LocationPicker: Using current location:', location);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      console.log('✅ LocationPicker: Confirming location:', selectedLocation);
      onLocationSelect(selectedLocation);
      onClose();
    }
  };

  const handleClearLocation = () => {
    setSelectedLocation(null);
    console.log('🗑️ LocationPicker: Location cleared');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              {t('location.title') || 'Selecionar Localização'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Search Bar */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('location.search_placeholder') || 'Pesquisar endereço...'}
                fullWidth
              />
            </div>
            <Button
              onClick={handleSearch}
              isLoading={isLoading}
              disabled={!searchQuery.trim()}
            >
              {t('location.search') || 'Pesquisar'}
            </Button>
            <Button
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={!userLocation}
            >
              <Navigation className="w-4 h-4 mr-2" />
              {t('location.use_current') || 'Atual'}
            </Button>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            <div
              ref={mapContainerRef}
              className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg cursor-crosshair"
            />
            
            {/* Selected Location Overlay */}
            {selectedLocation && (
              <div className="absolute top-4 right-4">
                <Card className="shadow-lg">
                  <CardContent className="p-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {t('location.selected') || 'Localização Selecionada'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {selectedLocation.address}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleClearLocation}
              disabled={!selectedLocation}
            >
              <X className="w-4 h-4 mr-2" />
              {t('location.clear') || 'Limpar'}
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={onClose}
              >
                {t('location.cancel') || 'Cancelar'}
              </Button>
              
              <Button
                onClick={handleConfirmLocation}
                disabled={!selectedLocation}
              >
                <Check className="w-4 h-4 mr-2" />
                {t('location.confirm') || 'Confirmar Localização'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
