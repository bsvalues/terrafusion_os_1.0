import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { MapContainer, TileLayer, LayersControl, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { 
  Map, Layers, Database, Settings, Search, Filter, Ruler, 
  Download, Upload, Target, Zap, BarChart3, Globe, Satellite 
} from 'lucide-react';
import { TerraFusionTheme, TFCard, TFButton, TFInput, TFSelect } from '../../../frontend/src/components/TerraFusion';
import 'leaflet/dist/leaflet.css';

const LeafScopeContainer = styled.div`
  ${TerraFusionTheme.getFullScreenLayout()}
  background: ${TerraFusionTheme.colors.background.main};
`;

const LeafScopeHeader = styled.header`
  ${TerraFusionTheme.getHeaderLayout()}
  background: linear-gradient(135deg, 
    ${TerraFusionTheme.colors.primary.main}20 0%, 
    ${TerraFusionTheme.colors.accent.main}20 100%);
  border-bottom: 2px solid ${TerraFusionTheme.colors.primary.main}40;
`;

const LeafScopeTitle = styled.h1`
  ${TerraFusionTheme.getPageTitle()}
  display: flex;
  align-items: center;
  gap: 15px;
  
  .icon {
    ${TerraFusionTheme.getIcon('32px')}
    color: ${TerraFusionTheme.colors.accent.main};
  }
`;

const LeafScopeMain = styled.main`
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
`;

const LeafScopeSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const LeafScopeMapArea = styled.div`
  background: ${TerraFusionTheme.colors.surface.main};
  border-radius: 12px;
  border: 1px solid ${TerraFusionTheme.colors.primary.main}30;
  overflow: hidden;
  position: relative;
`;

const MapToolbar = styled.div`
  position: absolute;
  top: 15px;
  left: 15px;
  right: 15px;
  background: ${TerraFusionTheme.colors.surface.main}95;
  border: 1px solid ${TerraFusionTheme.colors.primary.main}30;
  border-radius: 8px;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
`;

const MapStatusBar = styled.div`
  position: absolute;
  bottom: 15px;
  left: 15px;
  right: 15px;
  background: ${TerraFusionTheme.colors.surface.main}95;
  border: 1px solid ${TerraFusionTheme.colors.primary.main}30;
  border-radius: 8px;
  padding: 8px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
  font-size: 12px;
`;

const LayerItem = styled.div<{ active?: boolean }>`
  padding: 12px 15px;
  background: ${props => props.active ? 
    TerraFusionTheme.colors.primary.main + '20' : 
    TerraFusionTheme.colors.surface.main};
  border: 1px solid ${props => props.active ? 
    TerraFusionTheme.colors.primary.main + '40' : 
    TerraFusionTheme.colors.primary.main + '20'};
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${TerraFusionTheme.colors.primary.main}15;
    border-color: ${TerraFusionTheme.colors.primary.main}40;
  }
  
  .layer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .layer-title {
    font-weight: 600;
    color: ${TerraFusionTheme.colors.text.primary};
  }
  
  .layer-toggle {
    width: 40px;
    height: 20px;
    background: ${props => props.active ? 
      TerraFusionTheme.colors.accent.main : 
      TerraFusionTheme.colors.surface.light};
    border-radius: 10px;
    position: relative;
    transition: all 0.2s ease;
    
    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: ${props => props.active ? '22px' : '2px'};
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      transition: all 0.2s ease;
    }
  }
  
  .layer-meta {
    font-size: 12px;
    color: ${TerraFusionTheme.colors.text.muted};
    display: flex;
    justify-content: space-between;
  }
`;

const AnalysisPanel = styled.div`
  background: ${TerraFusionTheme.colors.surface.dark};
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
  
  .analysis-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 15px;
  }
  
  .analysis-result {
    text-align: center;
    padding: 10px;
    background: ${TerraFusionTheme.colors.surface.main};
    border-radius: 6px;
    border: 1px solid ${TerraFusionTheme.colors.primary.main}20;
    
    .value {
      font-size: 16px;
      font-weight: bold;
      color: ${TerraFusionTheme.colors.accent.main};
    }
    
    .label {
      font-size: 12px;
      color: ${TerraFusionTheme.colors.text.muted};
      margin-top: 4px;
    }
  }
`;

interface Layer {
  id: string;
  name: string;
  type: 'wms' | 'wfs' | 'vector' | 'raster';
  url?: string;
  visible: boolean;
  opacity: number;
  source: 'postgis' | 'file' | 'service';
  records?: number;
}

interface AnalysisResult {
  area: string;
  perimeter: string;
  parcels: number;
  avgValue: string;
}

const LeafScope: React.FC = () => {
  const mapRef = useRef<any>(null);
  const [currentCoords, setCurrentCoords] = useState<[number, number]>([47.0379, -122.9015]); // Benton County
  const [currentZoom, setCurrentZoom] = useState(10);
  const [selectedTool, setSelectedTool] = useState<string>('pan');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'parcels', name: 'County Parcels', type: 'wfs', visible: true, opacity: 1, source: 'postgis', records: 89247 },
    { id: 'roads', name: 'Road Network', type: 'vector', visible: true, opacity: 0.8, source: 'postgis', records: 12847 },
    { id: 'zoning', name: 'Zoning Districts', type: 'wfs', visible: false, opacity: 0.6, source: 'postgis', records: 1247 },
    { id: 'utilities', name: 'Utility Lines', type: 'vector', visible: false, opacity: 0.7, source: 'postgis', records: 8456 },
    { id: 'floodplains', name: 'Flood Zones', type: 'wms', visible: false, opacity: 0.5, source: 'service' },
    { id: 'aerial', name: 'Aerial Imagery 2024', type: 'raster', visible: false, opacity: 1, source: 'service' },
  ]);
  
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult>({
    area: '2,847.3 sq mi',
    perimeter: '342.7 mi',
    parcels: 89247,
    avgValue: '$347,890'
  });
  
  // Map center for Benton County, WA
  const mapCenter: LatLngExpression = [46.2619, -119.2706];
  
  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };
  
  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool);
  };
  
  const MapEventHandler = () => {
    const map = useMap();
    
    useMapEvents({
      mousemove: (e) => {
        setCurrentCoords([e.latlng.lat, e.latlng.lng]);
      },
      zoomend: () => {
        setCurrentZoom(map.getZoom());
      }
    });
    
    return null;
  };
  
  return (
    <LeafScopeContainer>
      <LeafScopeHeader>
        <LeafScopeTitle>
          <Globe className="icon" />
          LeafScope - Advanced Geospatial Platform
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>PostGIS Connected</span>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>89,247 Parcels</span>
          </div>
        </LeafScopeTitle>
      </LeafScopeHeader>
      
      <LeafScopeMain>
        {/* Left Sidebar - Layers & Data Sources */}
        <LeafScopeSidebar>
          <TFCard title="Data Layers" icon={<Layers />}>
            <TFInput 
              placeholder="Search layers..."
              icon={<Search />}
              style={{ marginBottom: '15px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {layers
              .filter(layer => layer.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(layer => (
                <LayerItem 
                  key={layer.id} 
                  active={layer.visible}
                  onClick={() => toggleLayer(layer.id)}
                >
                  <div className="layer-header">
                    <span className="layer-title">{layer.name}</span>
                    <div className="layer-toggle" />
                  </div>
                  <div className="layer-meta">
                    <span>{layer.type.toUpperCase()} • {layer.source}</span>
                    {layer.records && <span>{layer.records.toLocaleString()} records</span>}
                  </div>
                </LayerItem>
              ))
            }
          </TFCard>
          
          <TFCard title="Data Sources" icon={<Database />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ 
                padding: '10px', 
                background: TerraFusionTheme.colors.surface.dark, 
                borderRadius: '6px',
                border: `1px solid ${TerraFusionTheme.colors.accent.main}40`
              }}>
                <div style={{ fontWeight: 'bold', color: TerraFusionTheme.colors.accent.main }}>
                  PostGIS Database
                </div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>
                  Connected • 156 tables
                </div>
              </div>
              
              <div style={{ 
                padding: '10px', 
                background: TerraFusionTheme.colors.surface.dark, 
                borderRadius: '6px',
                border: `1px solid ${TerraFusionTheme.colors.primary.main}20`
              }}>
                <div style={{ fontWeight: 'bold', color: TerraFusionTheme.colors.text.primary }}>
                  WMS Services
                </div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>
                  3 active endpoints
                </div>
              </div>
              
              <div style={{ 
                padding: '10px', 
                background: TerraFusionTheme.colors.surface.dark, 
                borderRadius: '6px',
                border: `1px solid ${TerraFusionTheme.colors.primary.main}20`
              }}>
                <div style={{ fontWeight: 'bold', color: TerraFusionTheme.colors.text.primary }}>
                  File Geodatabase
                </div>
                <div style={{ fontSize: '12px', color: TerraFusionTheme.colors.text.muted }}>
                  12.7 GB • 47 datasets
                </div>
              </div>
            </div>
          </TFCard>
        </LeafScopeSidebar>
        
        {/* Center - Map Interface */}
        <LeafScopeMapArea>
          <MapToolbar>
            <div style={{ display: 'flex', gap: '10px' }}>
              <TFButton 
                size="small"
                variant={selectedTool === 'pan' ? 'primary' : 'secondary'}
                onClick={() => handleToolSelect('pan')}
              >
                Pan
              </TFButton>
              <TFButton 
                size="small"
                variant={selectedTool === 'measure' ? 'primary' : 'secondary'}
                onClick={() => handleToolSelect('measure')}
                icon={<Ruler />}
              >
                Measure
              </TFButton>
              <TFButton 
                size="small"
                variant={selectedTool === 'identify' ? 'primary' : 'secondary'}
                onClick={() => handleToolSelect('identify')}
                icon={<Target />}
              >
                Identify
              </TFButton>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <TFSelect defaultValue="wgs84" style={{ minWidth: '120px' }}>
                <option value="wgs84">WGS84</option>
                <option value="nad83">NAD83</option>
                <option value="state_plane">State Plane</option>
              </TFSelect>
              
              <TFButton size="small" icon={<Satellite />}>
                Satellite
              </TFButton>
            </div>
          </MapToolbar>
          
          <MapContainer
            center={mapCenter}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <MapEventHandler />
            
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="OpenStreetMap">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              
              <LayersControl.BaseLayer name="Satellite">
                <TileLayer
                  attribution='&copy; Esri'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>
              
              <LayersControl.BaseLayer name="Terrain">
                <TileLayer
                  attribution='&copy; OpenTopoMap'
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
            </LayersControl>
            
            {/* Sample markers for demonstration */}
            <Marker position={[46.2619, -119.2706]}>
              <Popup>
                <strong>Benton County Courthouse</strong><br />
                Administrative Center
              </Popup>
            </Marker>
          </MapContainer>
          
          <MapStatusBar>
            <div>
              Coordinates: {currentCoords[0].toFixed(4)}, {currentCoords[1].toFixed(4)}
            </div>
            <div>
              Zoom: {currentZoom} • Scale: 1:{Math.round(591657527.591555 / Math.pow(2, currentZoom)).toLocaleString()}
            </div>
            <div>
              Projection: WGS84 (EPSG:4326)
            </div>
          </MapStatusBar>
        </LeafScopeMapArea>
        
        {/* Right Sidebar - Analysis & Tools */}
        <LeafScopeSidebar>
          <TFCard title="Spatial Analysis" icon={<BarChart3 />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <TFButton icon={<Target />}>
                Buffer Analysis
              </TFButton>
              <TFButton icon={<Layers />}>
                Overlay Analysis
              </TFButton>
              <TFButton icon={<Ruler />}>
                Distance Matrix
              </TFButton>
              <TFButton icon={<Zap />}>
                Proximity Analysis
              </TFButton>
            </div>
            
            <AnalysisPanel>
              <strong>Current Selection</strong>
              <div className="analysis-grid">
                <div className="analysis-result">
                  <div className="value">{analysisResults.area}</div>
                  <div className="label">Total Area</div>
                </div>
                <div className="analysis-result">
                  <div className="value">{analysisResults.perimeter}</div>
                  <div className="label">Perimeter</div>
                </div>
                <div className="analysis-result">
                  <div className="value">{analysisResults.parcels.toLocaleString()}</div>
                  <div className="label">Parcels</div>
                </div>
                <div className="analysis-result">
                  <div className="value">{analysisResults.avgValue}</div>
                  <div className="label">Avg Value</div>
                </div>
              </div>
            </AnalysisPanel>
          </TFCard>
          
          <TFCard title="Query Builder" icon={<Filter />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <TFSelect>
                <option value="">Select Layer</option>
                <option value="parcels">County Parcels</option>
                <option value="zoning">Zoning Districts</option>
                <option value="roads">Road Network</option>
              </TFSelect>
              
              <TFSelect>
                <option value="">Select Field</option>
                <option value="assessed_value">Assessed Value</option>
                <option value="land_use">Land Use</option>
                <option value="acreage">Acreage</option>
              </TFSelect>
              
              <TFInput placeholder="Query condition..." />
              
              <TFButton>
                Execute Query
              </TFButton>
              
              <div style={{ 
                background: TerraFusionTheme.colors.surface.dark,
                padding: '10px',
                borderRadius: '6px',
                border: `1px solid ${TerraFusionTheme.colors.primary.main}20`,
                fontSize: '12px'
              }}>
                <strong>Last Query:</strong><br />
                SELECT * FROM parcels WHERE assessed_value > 500000
              </div>
            </div>
          </TFCard>
          
          <TFCard title="Export Tools" icon={<Download />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <TFButton icon={<Download />}>
                Export to Shapefile
              </TFButton>
              <TFButton icon={<Download />}>
                Export to GeoJSON
              </TFButton>
              <TFButton icon={<Download />}>
                Export to KML
              </TFButton>
              <TFButton icon={<Upload />}>
                Import Data
              </TFButton>
            </div>
          </TFCard>
        </LeafScopeSidebar>
      </LeafScopeMain>
    </LeafScopeContainer>
  );
};

export default LeafScope;