import "./terrafusion-brand.css";
import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Map, MapPin, Layers, Globe, Search, Settings, BarChart3, Database  } from '@mui/icons-material';
import './App.css';

interface MapLayer {
  id: string;
  name: string;
  type: 'vector' | 'raster' | 'satellite';
  visible: boolean;
  opacity: number;
}

interface GISFeature {
  id: string;
  geometry: any;
  properties: Record<string, any>;
  type: 'Point' | 'LineString' | 'Polygon';
}

function App() {
  const [activeView, setActiveView] = useState('map');
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([
    { id: 'base', name: 'Base Map', type: 'raster', visible: true, opacity: 1.0 },
    { id: 'roads', name: 'Roads', type: 'vector', visible: true, opacity: 0.8 },
    { id: 'buildings', name: 'Buildings', type: 'vector', visible: false, opacity: 0.6 },
    { id: 'satellite', name: 'Satellite Imagery', type: 'satellite', visible: false, opacity: 1.0 }
  ]);
  const [selectedFeatures, setSelectedFeatures] = useState<GISFeature[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeGIS();
  }, []);

  const initializeGIS = async () => {
    try {
      await invoke('init_gis_engine');
      console.log('GIS Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize GIS engine:', error);
    }
  };

  const toggleLayer = (layerId: string) => {
    setMapLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setMapLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, opacity } : layer
    ));
  };

  const performSpatialAnalysis = async (analysisType: string) => {
    setIsProcessing(true);
    try {
      const result = await invoke('perform_spatial_analysis', { 
        analysisType,
        features: selectedFeatures 
      });
      console.log('Spatial analysis result:', result);
    } catch (error) {
      console.error('Spatial analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const exportData = async (format: string) => {
    try {
      const result = await invoke('export_gis_data', { format, features: selectedFeatures });
      console.log('Export successful:', result);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const renderMapView = () => (
    <div className="gis-map-container">
      <div className="map-toolbar">
        <button className="tool-btn"><MapPin size={20} /></button>
        <button className="tool-btn"><Search size={20} /></button>
        <button className="tool-btn"><Layers size={20} /></button>
        <button className="tool-btn"><Globe size={20} /></button>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      <div ref={mapRef} className="map-canvas">
        <div className="map-placeholder">
          <Globe size={64} className="map-icon" /><>

          <h3>Professional GIS Map View</h3>
          <p
</>
</>>Interactive mapping with advanced spatial analysis</p>
        </div>
      </div>
    </div>
  );

  const renderLayerPanel = () => (
    <div className="layer-panel">
      <h3>Map Layers</h3>
      {mapLayers.map(layer => (
        <div key={layer.id} className="layer-item">
          <div className="layer-header">
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={() => toggleLayer(layer.id)}
            /><>

            <span className={`layer-name ${layer.visible ? 'active' : 'inactive'}`}>
              {layer.name}
            </span>
            <span
</>
className="layer-type">{layer.type}</span>
          </div>
          {layer.visible && (
            <div className="layer-controls"><>

              <label>Opacity: {Math.round(layer.opacity * 100)}%</label>
              <input
</>

                type="range"
                min="0"
                max="1"
                step="0.1"
                value={layer.opacity}
                onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                className="opacity-slider"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderAnalysisPanel = () => (
    <div className="analysis-panel"><>

      <h3>Spatial Analysis</h3>
      <div
</>
className="analysis-tools">
        <button 
          className="analysis-btn"
          onClick={() => performSpatialAnalysis('buffer')}
          disabled={isProcessing}
        ><>

          <BarChart3 size={16} />
          Buffer Analysis
        </button>
        <button
</>

          className="analysis-btn"
          onClick={() => performSpatialAnalysis('intersection')}
          disabled={isProcessing}
        ><>

          <Database size={16} />
          Intersection
        </button>
        <button
</>

          className="analysis-btn"
          onClick={() => performSpatialAnalysis('proximity')}
          disabled={isProcessing}
        >
          <MapPin size={16} />
          Proximity Analysis
        </button>
      </div>
      <div className="export-tools"><>

        <h4>Export Data</h4>
        <button
</>
onClick={() => exportData('geojson')} className="export-btn">
          Export as GeoJSON
        </button><>

        <button onClick={() => exportData('shapefile')} className="export-btn">
          Export as Shapefile
        </button>
        <button
</>
onClick={() => exportData('kml')} className="export-btn">
          Export as KML
        </button>
      </div>
    </div>
  );

  return (
    <div className="gispro-app">
      <header className="app-header">
        <div className="header-left">
          <Globe size={24} className="app-icon" /><>

          <h1>GISPRO</h1>
          <span
</>
className="app-subtitle">Professional GIS Suite</span>
        </div>
        <div className="header-right">
          <button className="header-btn">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="app-body">
        <nav className="sidebar">
          <button 
            className={`nav-btn ${activeView === 'map' ? 'active' : ''}`}
            onClick={() => setActiveView('map')}
          ><>

            <Map size={20} />
            Map View
          </button>
          <button
</>

            className={`nav-btn ${activeView === 'layers' ? 'active' : ''}`}
            onClick={() => setActiveView('layers')}
          ><>

            <Layers size={20} />
            Layers
          </button>
          <button
</>

            className={`nav-btn ${activeView === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveView('analysis')}
          >
            <BarChart3 size={20} />
            Analysis
          </button>
        </nav>

        <main className="main-content">
          {activeView === 'map' && renderMapView()}
          {activeView === 'layers' && renderLayerPanel()}
          {activeView === 'analysis' && renderAnalysisPanel()}
        </main>
      </div>

      {isProcessing && (
        <div className="processing-overlay"><>

          <div className="processing-spinner"></div>
          <p
</>
</>>Processing spatial analysis...</p>
        </div>
      )}
    </div>
  );
}

export default App;
