import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Map, Search, Layers, ZoomIn, ZoomOut, Maximize2, RefreshCw, MapPin, Home, Building2, DollarSign, Calendar } from 'lucide-react';
import DatabaseService from '../services/DatabaseService';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ParcelData {
  ParcelID?: string;
  Address?: string;
  AssessedValue?: number;
  LandValue?: number;
  TaxYear?: number;
  Latitude?: number;
  Longitude?: number;
  Owner?: string;
  PropertyType?: string;
  [key: string]: any;
}

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onRefresh: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({ onZoomIn, onZoomOut, onReset, onRefresh }) => {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="p-2 bg-white hover:bg-gray-100 rounded shadow-lg transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-5 h-5 text-gray-700" />
      </button>
      <button
        onClick={onZoomOut}
        className="p-2 bg-white hover:bg-gray-100 rounded shadow-lg transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-5 h-5 text-gray-700" />
      </button>
      <button
        onClick={onReset}
        className="p-2 bg-white hover:bg-gray-100 rounded shadow-lg transition-colors"
        title="Reset View"
      >
        <Maximize2 className="w-5 h-5 text-gray-700" />
      </button>
      <button
        onClick={onRefresh}
        className="p-2 bg-white hover:bg-gray-100 rounded shadow-lg transition-colors"
        title="Refresh Data"
      >
        <RefreshCw className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  );
};

const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

export const GISMapViewer: React.FC = () => {
  // Benton County, WA approximate center coordinates
  const [center, setCenter] = useState<[number, number]>([46.2396, -119.1006]);
  const [zoom, setZoom] = useState(11);
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<ParcelData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const mapRef = useRef<L.Map>(null);

  // Load initial parcel data
  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    setLoading(true);
    try {
      // Query for parcels with coordinates
      const result = await DatabaseService.executeQuery({
        DatabaseName: 'benton_county_parcels',
        Query: `SELECT * FROM parcels WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL LIMIT 100`,
        MaxRows: 100
      });

      if (result.Success) {
        setParcels(result.Rows as ParcelData[]);
      }
    } catch (error) {
      console.error('Failed to load parcels:', error);
      // Use demo data with Benton County coordinates
      setParcels([
        { ParcelID: 'P001', Address: '123 Main St, Richland, WA', AssessedValue: 250000, LandValue: 75000, TaxYear: 2024, Latitude: 46.2856, Longitude: -119.2844, Owner: 'John Doe', PropertyType: 'Residential' },
        { ParcelID: 'P002', Address: '456 Oak Ave, Kennewick, WA', AssessedValue: 325000, LandValue: 95000, TaxYear: 2024, Latitude: 46.2112, Longitude: -119.1372, Owner: 'Jane Smith', PropertyType: 'Residential' },
        { ParcelID: 'P003', Address: '789 Pine Rd, Pasco, WA', AssessedValue: 185000, LandValue: 55000, TaxYear: 2024, Latitude: 46.2396, Longitude: -119.1006, Owner: 'Bob Johnson', PropertyType: 'Residential' },
        { ParcelID: 'P004', Address: '321 Elm Dr, West Richland, WA', AssessedValue: 410000, LandValue: 120000, TaxYear: 2024, Latitude: 46.3043, Longitude: -119.3617, Owner: 'Alice Williams', PropertyType: 'Commercial' },
        { ParcelID: 'P005', Address: '654 Maple Ct, Benton City, WA', AssessedValue: 275000, LandValue: 82000, TaxYear: 2024, Latitude: 46.2632, Longitude: -119.4882, Owner: 'Charlie Brown', PropertyType: 'Residential' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const result = await DatabaseService.searchParcelsByAddress(searchQuery);
      if (result.Success && result.Rows.length > 0) {
        const searchParcels = result.Rows as ParcelData[];
        setParcels(searchParcels);
        
        // Zoom to first result if it has coordinates
        const firstParcel = searchParcels[0];
        if (firstParcel.Latitude && firstParcel.Longitude) {
          setCenter([firstParcel.Latitude, firstParcel.Longitude]);
          setZoom(15);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 1, 18));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 1, 8));
  const handleReset = () => {
    setCenter([46.2396, -119.1006]);
    setZoom(11);
    setSelectedParcel(null);
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold">GIS Map Viewer</h2>
          <span className="text-sm text-gray-400">
            Benton County, WA | {parcels.length} parcels loaded
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSatellite(!showSatellite)}
            className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
              showSatellite ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Layers className="w-4 h-4" />
            {showSatellite ? 'Satellite' : 'Street'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-gray-700 rounded">
            <Search className="w-5 h-5 text-gray-400 ml-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by address (e.g., 'Main St' or 'Richland')..."
              className="flex-1 bg-transparent px-3 py-2 focus:outline-none text-white"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={loadParcels}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
          >
            Load All
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={zoom}
          className="h-full w-full"
          zoomControl={false}
          ref={mapRef}
        >
          <MapController center={center} zoom={zoom} />
          
          {/* Base Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={
              showSatellite
                ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            }
          />

          {/* Parcel Markers */}
          {parcels.map((parcel, index) => {
            if (!parcel.Latitude || !parcel.Longitude) return null;
            
            return (
              <Marker
                key={parcel.ParcelID || index}
                position={[parcel.Latitude, parcel.Longitude]}
                eventHandlers={{
                  click: () => setSelectedParcel(parcel),
                }}
              >
                <Popup>
                  <div className="text-gray-900 min-w-[250px]">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      {parcel.Address || 'Unknown Address'}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Parcel ID:</span>
                        <span className="font-medium">{parcel.ParcelID || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Owner:</span>
                        <span className="font-medium">{parcel.Owner || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Property Type:</span>
                        <span className="font-medium">{parcel.PropertyType || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 mt-1">
                        <span className="text-gray-600">Assessed Value:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(parcel.AssessedValue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Land Value:</span>
                        <span className="font-medium">
                          {formatCurrency(parcel.LandValue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax Year:</span>
                        <span className="font-medium">{parcel.TaxYear || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Selected Parcel Highlight */}
          {selectedParcel && selectedParcel.Latitude && selectedParcel.Longitude && (
            <Circle
              center={[selectedParcel.Latitude, selectedParcel.Longitude]}
              radius={100}
              pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
            />
          )}
        </MapContainer>

        {/* Custom Map Controls */}
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
          onRefresh={loadParcels}
        />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
            <div className="bg-gray-800 px-6 py-4 rounded-lg shadow-xl">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                <span className="text-white font-medium">Loading parcels...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Parcel Info Panel */}
      {selectedParcel && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              Selected Property
            </h3>
            <button
              onClick={() => setSelectedParcel(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-3 rounded">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Home className="w-3 h-3" />
                Address
              </div>
              <div className="text-white font-medium text-sm">
                {selectedParcel.Address || 'N/A'}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Building2 className="w-3 h-3" />
                Parcel ID
              </div>
              <div className="text-white font-medium text-sm">
                {selectedParcel.ParcelID || 'N/A'}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <DollarSign className="w-3 h-3" />
                Assessed Value
              </div>
              <div className="text-green-400 font-bold text-sm">
                {formatCurrency(selectedParcel.AssessedValue)}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Calendar className="w-3 h-3" />
                Tax Year
              </div>
              <div className="text-white font-medium text-sm">
                {selectedParcel.TaxYear || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow-lg z-[1000] max-w-xs">
        <h4 className="font-bold text-gray-900 mb-2 text-sm">Legend</h4>
        <div className="space-y-1 text-xs text-gray-700">
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3 text-blue-600" />
            <span>Property Parcel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400 opacity-50"></div>
            <span>Selected Area (100m radius)</span>
          </div>
          <div className="text-gray-500 mt-2 pt-2 border-t">
            Click marker for property details
          </div>
        </div>
      </div>
    </div>
  );
};

export default GISMapViewer;
