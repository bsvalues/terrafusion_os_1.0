import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  TerraFusionGlobalStyles,
  TFContainer,
  TFHeading,
  TFText,
  TFFlex,
  TFCard,
  TFButton,
  TFInput,
  TFBadge
} from '@terrafusion';
import { 
  Map, 
  Layers, 
  Search,
  Ruler,
  MapPin,
  Satellite,
  Compass,
  Download,
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid3X3,
  Target
} from 'lucide-react';

const GISContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--tf-color-dark);
`;

const Header = styled.header`
  background: rgba(26, 31, 58, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 153, 255, 0.2);
  padding: var(--tf-spacing-md);
  z-index: 1000;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  position: relative;
`;

const Sidebar = styled.div<{ isOpen: boolean }>`
  width: ${props => props.isOpen ? '350px' : '60px'};
  background: rgba(26, 31, 58, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(0, 153, 255, 0.2);
  transition: width 0.3s ease;
  overflow: hidden;
  z-index: 999;
`;

const MapContainer = styled.div`
  flex: 1;
  position: relative;
  background: linear-gradient(135deg, 
    #0a1a0a 0%, 
    #1a2a1a 25%, 
    #2a3a2a 50%, 
    #1a2a1a 75%, 
    #0a1a0a 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MapControls = styled.div`
  position: absolute;
  top: var(--tf-spacing-lg);
  right: var(--tf-spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--tf-spacing-sm);
  z-index: 998;
`;

const ControlButton = styled(TFButton)`
  width: 48px;
  height: 48px;
  padding: 0;
  border-radius: var(--tf-radius-md);
`;

const LayerPanel = styled(TFCard)`
  margin: var(--tf-spacing-md);
  padding: var(--tf-spacing-md);
`;

const LayerItem = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tf-spacing-sm);
  border-radius: var(--tf-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.active ? 'rgba(0, 153, 255, 0.1)' : 'transparent'};
  border: 1px solid ${props => props.active ? 'var(--tf-color-primary)' : 'transparent'};
  
  &:hover {
    background: rgba(0, 153, 255, 0.05);
  }
`;

const SearchPanel = styled(TFCard)`
  margin: var(--tf-spacing-md);
  padding: var(--tf-spacing-md);
`;

const StatusBar = styled.div`
  height: 40px;
  background: rgba(26, 31, 58, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 153, 255, 0.2);
  display: flex;
  align-items: center;
  padding: 0 var(--tf-spacing-md);
  gap: var(--tf-spacing-lg);
  font-size: 0.875rem;
  color: var(--tf-color-gray);
`;

const MapPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--tf-color-gray);
`;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeLayers, setActiveLayers] = useState(new Set(['parcels', 'roads']));
  const [searchTerm, setSearchTerm] = useState('');

  const layers = [
    { id: 'parcels', name: 'Property Parcels', type: 'Vector', visible: true },
    { id: 'roads', name: 'Road Network', type: 'Vector', visible: true },
    { id: 'buildings', name: 'Building Footprints', type: 'Vector', visible: false },
    { id: 'zoning', name: 'Zoning Districts', type: 'Vector', visible: false },
    { id: 'utilities', name: 'Utility Lines', type: 'Vector', visible: false },
    { id: 'aerial', name: 'Aerial Imagery', type: 'Raster', visible: false },
    { id: 'topographic', name: 'Topographic Map', type: 'Raster', visible: false },
    { id: 'floodplains', name: 'Flood Zones', type: 'Vector', visible: false }
  ];

  const toggleLayer = (layerId: string) => {
    const newActiveLayers = new Set(activeLayers);
    if (newActiveLayers.has(layerId)) {
      newActiveLayers.delete(layerId);
    } else {
      newActiveLayers.add(layerId);
    }
    setActiveLayers(newActiveLayers);
  };

  return (
    <>
      <TerraFusionGlobalStyles />
      <GISContainer>
        <Header>
          <TFFlex justify="space-between" align="center">
            <TFFlex align="center" gap="var(--tf-spacing-md)">
              <TFButton 
                variant="ghost" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Layers size={20} />
              </TFButton>
              <div style={{
                fontSize: '2rem',
                background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                🗺️
              </div>
              <div>
                <TFHeading level={3} gradient style={{ margin: 0 }}>
                  GIS Pro
                </TFHeading>
                <p style={{ 
                  color: 'var(--tf-color-gray)', 
                  fontSize: '0.875rem',
                  margin: 0 
                }}>
                  Advanced Geographic Information System
                </p>
              </div>
            </TFFlex>
            
            <TFFlex gap="var(--tf-spacing-sm)">
              <TFButton variant="secondary">
                <Download size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                Export
              </TFButton>
              <TFButton variant="primary">
                <Target size={18} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                Locate
              </TFButton>
              <TFButton variant="ghost">
                <Settings size={18} />
              </TFButton>
            </TFFlex>
          </TFFlex>
        </Header>

        <MainContent>
          <Sidebar isOpen={sidebarOpen}>
            {sidebarOpen && (
              <>
                <SearchPanel>
                  <TFHeading level={5} style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                    Search Locations
                  </TFHeading>
                  <TFInput
                    placeholder="Enter address or parcel ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    fullWidth
                    style={{ marginBottom: 'var(--tf-spacing-sm)' }}
                  />
                  <TFButton variant="primary" fullWidth>
                    <Search size={16} style={{ marginRight: 'var(--tf-spacing-xs)' }} />
                    Search
                  </TFButton>
                </SearchPanel>

                <LayerPanel>
                  <TFHeading level={5} style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                    Map Layers
                  </TFHeading>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tf-spacing-xs)' }}>
                    {layers.map((layer) => (
                      <LayerItem 
                        key={layer.id}
                        active={activeLayers.has(layer.id)}
                        onClick={() => toggleLayer(layer.id)}
                      >
                        <TFFlex align="center" gap="var(--tf-spacing-sm)">
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '2px',
                            background: activeLayers.has(layer.id) ? 'var(--tf-color-primary)' : 'transparent',
                            border: '2px solid var(--tf-color-primary)'
                          }} />
                          <div>
                            <TFText variant="caption" weight={600}>
                              {layer.name}
                            </TFText>
                            <TFText variant="caption" color="var(--tf-color-gray)">
                              {layer.type}
                            </TFText>
                          </div>
                        </TFFlex>
                        <TFBadge 
                          variant={activeLayers.has(layer.id) ? 'success' : 'primary'} 
                          size="sm"
                        >
                          {activeLayers.has(layer.id) ? 'ON' : 'OFF'}
                        </TFBadge>
                      </LayerItem>
                    ))}
                  </div>
                </LayerPanel>

                <LayerPanel>
                  <TFHeading level={5} style={{ marginBottom: 'var(--tf-spacing-md)' }}>
                    Analysis Tools
                  </TFHeading>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tf-spacing-sm)' }}>
                    <TFButton variant="ghost" size="sm" style={{ justifyContent: 'flex-start' }}>
                      <Ruler size={16} style={{ marginRight: 'var(--tf-spacing-sm)' }} />
                      Measure Distance
                    </TFButton>
                    <TFButton variant="ghost" size="sm" style={{ justifyContent: 'flex-start' }}>
                      <Grid3X3 size={16} style={{ marginRight: 'var(--tf-spacing-sm)' }} />
                      Calculate Area
                    </TFButton>
                    <TFButton variant="ghost" size="sm" style={{ justifyContent: 'flex-start' }}>
                      <MapPin size={16} style={{ marginRight: 'var(--tf-spacing-sm)' }} />
                      Add Marker
                    </TFButton>
                    <TFButton variant="ghost" size="sm" style={{ justifyContent: 'flex-start' }}>
                      <Compass size={16} style={{ marginRight: 'var(--tf-spacing-sm)' }} />
                      Navigation
                    </TFButton>
                  </div>
                </LayerPanel>
              </>
            )}
          </Sidebar>

          <MapContainer>
            <MapPlaceholder>
              <Map size={96} style={{ marginBottom: 'var(--tf-spacing-lg)', color: 'var(--tf-color-primary)' }} />
              <TFHeading level={3} color="var(--tf-color-gray)">
                Interactive GIS Map
              </TFHeading>
              <TFText color="var(--tf-color-gray)" style={{ maxWidth: '400px' }}>
                Advanced mapping interface for Benton County spatial data analysis. 
                Full Leaflet integration with county parcel data, utilities, and zoning information.
              </TFText>
              <TFButton 
                variant="transcendent" 
                style={{ marginTop: 'var(--tf-spacing-lg)' }}
              >
                Initialize Map Engine
              </TFButton>
            </MapPlaceholder>

            <MapControls>
              <ControlButton variant="secondary">
                <ZoomIn size={20} />
              </ControlButton>
              <ControlButton variant="secondary">
                <ZoomOut size={20} />
              </ControlButton>
              <ControlButton variant="secondary">
                <RotateCcw size={20} />
              </ControlButton>
              <ControlButton variant="secondary">
                <Satellite size={20} />
              </ControlButton>
            </MapControls>
          </MapContainer>
        </MainContent>

        <StatusBar>
          <span>Coordinate System: WGS84</span>
          <span>Scale: 1:10,000</span>
          <span>Active Layers: {activeLayers.size}</span>
          <span>County: Benton, WA</span>
          <span>Data Status: Connected</span>
        </StatusBar>
      </GISContainer>
    </>
  );
}

export default App;