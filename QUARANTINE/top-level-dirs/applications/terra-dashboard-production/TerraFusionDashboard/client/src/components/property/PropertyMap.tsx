import { useEffect, useRef, useState } from 'react';
import { Map, MapPin, Layers, Maximize2  } from '@mui/icons-material';

export function PropertyMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeLayer, setActiveLayer] = useState('satellite');

  useEffect(() => {
    // Initialize map here
    // For demo, we'll simulate map loading
    const timer = setTimeout(() => setMapLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const layers = [
    { id: 'satellite', name: 'Satellite', icon: '🛰️' },
    { id: 'parcels', name: 'Parcels', icon: '🏘️' },
    { id: 'zoning', name: 'Zoning', icon: '📋' },
    { id: 'flood', name: 'Flood Zones', icon: '🌊' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[600px] relative">
      {/* Map Header */}
      <div className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b z-10">
        <div className="flex justify-between items-center p-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
<>
            <Map className="w-5 h-5 text-blue-600" />
            Property Map
          </h3>
          <div
</> className="flex items-center gap-2">
            <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Layer Controls */}
      <div className="absolute top-20 left-4 z-10 bg-white rounded-lg shadow-lg p-2">
<>
        <div className="text-xs font-medium text-gray-600 mb-2 px-2">Layers</div>
        <div
</> className="space-y-1">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors ${
                activeLayer === layer.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{layer.icon}</span>
              {layer.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer}
        className="w-full h-full pt-16 bg-gradient-to-br from-green-100 to-blue-100 relative"
      >
        {!mapLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
<>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p
</> className="text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mock Map Content */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-blue-50">
              {/* Property Markers */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <MapPin className="w-8 h-8 text-red-500 drop-shadow-lg" />
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap">
                    123 Main Street
                  </div>
                </div>
              </div>
              
              {/* Additional property markers */}
              <div className="absolute top-1/3 left-2/3">
<>
                <MapPin className="w-6 h-6 text-blue-500 drop-shadow-lg" />
              </div>
              <div
</> className="absolute bottom-1/3 right-1/3">
                <MapPin className="w-6 h-6 text-green-500 drop-shadow-lg" />
              </div>

              {/* Map Info */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm">
<>
                <div className="font-medium text-gray-800">Benton County, WA</div>
                <div
</> className="text-gray-600">47,831 parcels • 672 sq mi</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Property Info Panel */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <div className="text-sm">
<>
          <div className="font-medium text-gray-800 mb-2">Selected Property</div>
          <div
</> className="space-y-1 text-gray-600">
<>
            <div>123 Main Street, Richland, WA</div>
            <div
</>>Parcel: 1102234412</div>
<>
            <div>Assessed: $485,200</div>
            <div
</>>Type: Residential</div>
          </div>
          <button className="mt-3 w-full bg-blue-600 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-700 transition-colors">
            View Property Details
          </button>
        </div>
      </div>
    </div>
  );
}