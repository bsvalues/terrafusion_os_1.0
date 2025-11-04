import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { arcgisService } from '@/services/arcgis-service';

interface MapProps {
  selectedProperty?: {
    id: string;
    parcelId: string;
    address: string;
    assessedValue: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    } | null;
  };
  onPropertyClick?: (property: any) => void;
}

export default function InteractiveMap({ selectedProperty, onPropertyClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [activeLayer, setActiveLayer] = useState('satellite');
  const [mapInitialized, setMapInitialized] = useState(false);
  const [parcels, setParcels] = useState<any[]>([]);
  const [floodZones, setFloodZones] = useState<any[]>([]);
  const [zoning, setZoning] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const bentonCountyBounds = arcgisService.getBentonCountyBounds();
  
  // Mock coordinates for demonstration - in production these would come from ArcGIS
  const generateMockCoordinates = (parcelId: string) => {
    const hash = parcelId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const latOffset = (hash % 1000) / 10000;
    const lonOffset = ((hash * 7) % 1000) / 10000;
    
    return {
      lat: bentonCountyBounds.center.lat + latOffset,
      lon: bentonCountyBounds.center.lon + lonOffset
    };
  };

  const loadMapData = async (bounds: any) => {
    setLoading(true);
    try {
      // Simulate loading different layer data
      switch (activeLayer) {
        case 'parcels':
          // Load parcel boundaries
          setParcels([
            { id: 'parcel-1', coordinates: bentonCountyBounds.center, value: 450000 },
            { id: 'parcel-2', coordinates: { lat: 46.24, lon: -119.28 }, value: 320000 },
            { id: 'parcel-3', coordinates: { lat: 46.23, lon: -119.27 }, value: 680000 }
          ]);
          break;
        case 'flood':
          setFloodZones([
            { zone: 'X', risk: 'minimal', area: 'downtown' },
            { zone: 'AE', risk: 'moderate', area: 'riverside' }
          ]);
          break;
        case 'zoning':
          setZoning([
            { type: 'residential', code: 'R-1', density: 'low' },
            { type: 'commercial', code: 'C-1', usage: 'retail' },
            { type: 'agricultural', code: 'AG', purpose: 'farming' }
          ]);
          break;
        default:
          // Satellite layer - clear overlays
          setParcels([]);
          setFloodZones([]);
          setZoning([]);
      }
      
      // Add delay to simulate real data loading
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error('Failed to load map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || mapInitialized) return;
    
    // Initialize basic map view
    setMapInitialized(true);
    
    // Load initial data for Benton County
    const initialBounds = {
      xmin: -119.8540,
      ymin: 45.9380,
      xmax: -118.8950,
      ymax: 46.4650
    };
    
    loadMapData(initialBounds);
  };

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (mapInitialized) {
      const bounds = {
        xmin: -119.8540,
        ymin: 45.9380,
        xmax: -118.8950,
        ymax: 46.4650
      };
      loadMapData(bounds);
    }
  }, [activeLayer]);

  const getLayerBackground = () => {
    switch (activeLayer) {
      case 'satellite':
        return 'linear-gradient(45deg, #1a365d, #2a5a87)';
      case 'parcels':
        return 'linear-gradient(45deg, #065f46, #047857)';
      case 'zoning':
        return 'linear-gradient(45deg, #7c2d12, #dc2626)';
      case 'flood':
        return 'linear-gradient(45deg, #1e3a8a, #3b82f6)';
      default:
        return 'linear-gradient(45deg, #1a365d, #2a5a87)';
    }
  };

  const renderParcelMarkers = () => {
    // Generate property markers based on actual data
    const markerData = selectedProperty ? [selectedProperty] : [];
    
    // Add some nearby properties for visualization
    if (selectedProperty) {
      // Generate coordinates for the selected property using deterministic algorithm
      const baseCoords = generateMockCoordinates(selectedProperty.parcelId);
      
      return (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer'
          }}
        >
<>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #00d2ff, #3a7bd5)',
            boxShadow: '0 6px 16px rgba(0, 210, 255, 0.6)',
            border: '3px solid rgba(255,255,255,1)',
            animation: 'pulse 2s infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            📍
          </div>
          <div
</> style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(45deg, #00d2ff, #3a7bd5)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            marginBottom: '8px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0, 210, 255, 0.4)'
          }}>
            📍 {selectedProperty.parcelId}
            <br />
            💰 {selectedProperty.assessedValue ? `$${(parseFloat(selectedProperty.assessedValue) / 1000).toFixed(0)}K` : 'N/A'}
            <br />
            📍 {baseCoords.lat.toFixed(4)}°N, {Math.abs(baseCoords.lon).toFixed(4)}°W
          </div>
        </div>
      );
    }
    
    // Show sample markers for the area when no property is selected
    return Array.from({ length: 12 }).map((_ /* , index */) => {
      const value = 100000 + Math.random() * 900000;
      return (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${15 + (index % 4) * 20}%`,
            top: `${15 + Math.floor(index / 4) * 20}%`,
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
          }}
        >
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: value > 500000 ? '#ef4444' : 
                       value > 300000 ? '#f59e0b' : '#10b981',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            border: '2px solid rgba(255,255,255,0.9)'
          }} />
        </div>
      );
    });
  };

  const renderLayerOverlay = () => {
    if (activeLayer === 'flood' && floodZones.length > 0) {
      return (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(59, 130, 246, 0.2)',
          pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(59, 130, 246, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px'
          }}>
            Flood Zones Active
          </div>
        </div>
      );
    }
    
    if (activeLayer === 'zoning' && zoning.length > 0) {
      return (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(220, 38, 38, 0.15)',
          pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(220, 38, 38, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px'
          }}>
            Zoning Layer Active
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Map Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['satellite', 'parcels', 'zoning', 'flood'].map((layer) => (
          <Button
            key={layer}
            onClick={() => setActiveLayer(layer)}
            style={{
              background: activeLayer === layer ? 
                'linear-gradient(45deg, #00d2ff, #3a7bd5)' : 
                'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              color: 'white',
              fontSize: '0.875rem',
              textTransform: 'capitalize',
              fontWeight: activeLayer === layer ? '600' : '400'
            }}
          >
            {layer}
          </Button>
        ))}
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '300px',
          background: getLayerBackground(),
          borderRadius: '8px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}
      >
        {/* Grid Pattern */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1 }}>
          <defs>
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapGrid)" />
        </svg>

        {/* Loading Indicator */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            Loading map data...
          </div>
        )}

        {/* Layer Overlay */}
        {renderLayerOverlay()}

        {/* Property Markers */}
        {renderParcelMarkers()}

        {/* Map Info */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '11px'
        }}>
          Benton County, WA • Layer: {activeLayer.charAt(0).toUpperCase() + activeLayer.slice(1)}
        </div>
      </div>

      {/* Geographic Details */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '1rem',
        borderRadius: '8px',
        marginTop: '1rem'
      }}>
<>
        <h4 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>Geographic Details</h4>
        <div
</> style={{ display: 'grid', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
<>
            <span style={{ opacity: '0.8' }}>Coordinates:</span>
            <span
</>>
              {selectedProperty?.coordinates ? 
                `${selectedProperty.coordinates.latitude.toFixed(4)}°N, ${selectedProperty.coordinates.longitude.toFixed(4)}°W` :
                '46.2382°N, 119.2751°W'
              }
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
<>
            <span style={{ opacity: '0.8' }}>Elevation:</span>
            <span
</>>345 ft</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
<>
            <span style={{ opacity: '0.8' }}>Flood Zone:</span>
            <span
</>>Zone X</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
<>
            <span style={{ opacity: '0.8' }}>Parcels Loaded:</span>
            <span
</>>{parcels.length} properties</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </div>
  );
}