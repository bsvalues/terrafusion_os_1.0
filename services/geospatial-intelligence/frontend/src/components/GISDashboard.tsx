import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, FeatureGroup } from 'react-leaflet';
import { LatLng, LatLngBounds } from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import './GISDashboard.css';

interface SatelliteImagery {
  id: string;
  name: string;
  type: 'satellite' | 'aerial' | 'drone' | 'lidar' | 'thermal' | 'hyperspectral';
  dataSource: string;
  acquisitionDate: string;
  spatialResolution: number;
  spectralBands: number;
  coverageAreaSqKm: number;
  centerLatitude: number;
  centerLongitude: number;
  cloudCoveragePercent: number;
  dataQualityScore: number;
  fileSizeGb: number;
  processingLevel: string;
  coordinateSystem: string;
}

interface SpatialAnalysis {
  id: string;
  name: string;
  type: string;
  analysisDate: string;
  processingTimeSeconds: number;
  coverageAreaSqKm: number;
  confidenceScore: number;
  changeDetected: boolean;
  changeAreaSqKm: number;
  changePercentage: number;
  environmentalImpact: string;
  recommendations: string;
}

interface PropertyBoundary {
  id: string;
  parcelId: string;
  ownerName: string;
  propertyAddress: string;
  areaSqMeters: number;
  zoning: string;
  landUse: string;
  assessedValue: number;
  lastSurveyDate: string;
  boundaryAccuracy: number;
  coordinates: [number, number][];
}

interface EnvironmentalMonitor {
  id: string;
  monitorName: string;
  monitorType: string;
  location: {
    latitude: number;
    longitude: number;
  };
  parameters: string[];
  lastReading: string;
  status: 'active' | 'maintenance' | 'offline';
  dataCollectionFrequency: string;
  alertThresholds: Record<string, number>;
  currentValues: Record<string, number>;
}

const GISDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [satelliteImagery, setSatelliteImagery] = useState<SatelliteImagery[]>([]);
  const [spatialAnalyses, setSpatialAnalyses] = useState<SpatialAnalysis[]>([]);
  const [propertyBoundaries, setPropertyBoundaries] = useState<PropertyBoundary[]>([]);
  const [environmentalMonitors, setEnvironmentalMonitors] = useState<EnvironmentalMonitor[]>([]);
  const [systemMetrics, setSystemMetrics] = useState({
    totalImageryDatasets: 0,
    totalSpatialAnalyses: 0,
    totalPropertyBoundaries: 0,
    totalEnvironmentalMonitors: 0,
    totalCoverageSqKm: 0.0,
    changeDetectionsToday: 0,
    dataProcessingQueue: 0,
    satellitePassesToday: 0,
    gisAccuracyScore: 0.0,
    environmentalAlerts: 0,
    lastUpdate: new Date().toISOString()
  });

  const mapRef = useRef<any>(null);

  // Benton County bounds
  const bentonCountyBounds = new LatLngBounds(
    new LatLng(45.8843, -119.9167), // Southwest
    new LatLng(46.4697, -119.2508)  // Northeast
  );

  // Initialize demo data
  useEffect(() => {
    setSatelliteImagery([
      {
        id: 'BC-SAT-2024-001',
        name: 'Benton County Landsat 9 - September 2024',
        type: 'satellite',
        dataSource: 'landsat',
        acquisitionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        spatialResolution: 30.0,
        spectralBands: 11,
        coverageAreaSqKm: 4428.8,
        centerLatitude: 46.1770,
        centerLongitude: -119.5838,
        cloudCoveragePercent: 5.2,
        dataQualityScore: 0.94,
        fileSizeGb: 2.8,
        processingLevel: 'Level-2',
        coordinateSystem: 'WGS84/UTM Zone 11N'
      },
      {
        id: 'BC-SAT-2024-002',
        name: 'Tri-Cities Urban Area Sentinel-2 - September 2024',
        type: 'satellite',
        dataSource: 'sentinel',
        acquisitionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        spatialResolution: 10.0,
        spectralBands: 13,
        coverageAreaSqKm: 856.4,
        centerLatitude: 46.2427,
        centerLongitude: -119.1372,
        cloudCoveragePercent: 2.1,
        dataQualityScore: 0.97,
        fileSizeGb: 4.2,
        processingLevel: 'Level-2A',
        coordinateSystem: 'WGS84/UTM Zone 11N'
      },
      {
        id: 'BC-AERIAL-2024-003',
        name: 'Columbia River Corridor - High Resolution Aerial',
        type: 'aerial',
        dataSource: 'naip',
        acquisitionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        spatialResolution: 0.6,
        spectralBands: 4,
        coverageAreaSqKm: 145.2,
        centerLatitude: 46.2112,
        centerLongitude: -119.2500,
        cloudCoveragePercent: 0.0,
        dataQualityScore: 0.98,
        fileSizeGb: 12.6,
        processingLevel: 'Orthorectified',
        coordinateSystem: 'WGS84/UTM Zone 11N'
      }
    ]);

    setSpatialAnalyses([
      {
        id: 'BC-ANALYSIS-2024-001',
        name: 'Agricultural Land Use Change Detection',
        type: 'change_detection',
        analysisDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        processingTimeSeconds: 2847,
        coverageAreaSqKm: 2156.3,
        confidenceScore: 0.89,
        changeDetected: true,
        changeAreaSqKm: 23.7,
        changePercentage: 1.1,
        environmentalImpact: 'Agricultural conversion to urban development detected in southeast Benton County',
        recommendations: 'Monitor continued development patterns and assess impact on agricultural productivity'
      },
      {
        id: 'BC-ANALYSIS-2024-002',
        name: 'Columbia River Vegetation Health Assessment',
        type: 'vegetation_analysis',
        analysisDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        processingTimeSeconds: 1523,
        coverageAreaSqKm: 145.2,
        confidenceScore: 0.93,
        changeDetected: false,
        changeAreaSqKm: 0.0,
        changePercentage: 0.0,
        environmentalImpact: 'Riparian vegetation showing healthy growth patterns with adequate water levels',
        recommendations: 'Continue monitoring during late summer drought conditions'
      },
      {
        id: 'BC-ANALYSIS-2024-003',
        name: 'Urban Heat Island Analysis - Tri-Cities',
        type: 'thermal_analysis',
        analysisDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        processingTimeSeconds: 945,
        coverageAreaSqKm: 856.4,
        confidenceScore: 0.91,
        changeDetected: true,
        changeAreaSqKm: 12.4,
        changePercentage: 1.4,
        environmentalImpact: 'Increased urban heat signatures in commercial and industrial zones',
        recommendations: 'Implement green infrastructure and tree canopy expansion programs'
      }
    ]);

    setPropertyBoundaries([
      {
        id: 'BC-PARCEL-123456789',
        parcelId: '123456789',
        ownerName: 'Benton County',
        propertyAddress: '7122 W Okanogan Pl, Kennewick, WA',
        areaSqMeters: 87234.5,
        zoning: 'Agricultural',
        landUse: 'Crop Production',
        assessedValue: 1247500,
        lastSurveyDate: '2023-08-15',
        boundaryAccuracy: 0.96,
        coordinates: [[46.2112, -119.1372], [46.2156, -119.1372], [46.2156, -119.1298], [46.2112, -119.1298]]
      },
      {
        id: 'BC-PARCEL-987654321',
        parcelId: '987654321',
        ownerName: 'City of Richland',
        propertyAddress: '625 Swift Blvd, Richland, WA',
        areaSqMeters: 15678.2,
        zoning: 'Commercial',
        landUse: 'Office/Retail',
        assessedValue: 2567800,
        lastSurveyDate: '2024-03-22',
        boundaryAccuracy: 0.98,
        coordinates: [[46.2859, -119.2845], [46.2875, -119.2845], [46.2875, -119.2820], [46.2859, -119.2820]]
      }
    ]);

    setEnvironmentalMonitors([
      {
        id: 'BC-ENV-001',
        monitorName: 'Columbia River Water Quality Station',
        monitorType: 'water_quality',
        location: { latitude: 46.2112, longitude: -119.2500 },
        parameters: ['pH', 'dissolved_oxygen', 'temperature', 'turbidity', 'nitrates', 'phosphates'],
        lastReading: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        status: 'active',
        dataCollectionFrequency: 'hourly',
        alertThresholds: { pH: 8.5, dissolved_oxygen: 6.0, temperature: 25.0, turbidity: 10.0 },
        currentValues: { pH: 7.8, dissolved_oxygen: 8.2, temperature: 18.3, turbidity: 3.2 }
      },
      {
        id: 'BC-ENV-002',
        monitorName: 'Tri-Cities Air Quality Monitor',
        monitorType: 'air_quality',
        location: { latitude: 46.2427, longitude: -119.1372 },
        parameters: ['PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO'],
        lastReading: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'active',
        dataCollectionFrequency: 'continuous',
        alertThresholds: { 'PM2.5': 35.0, 'PM10': 150.0, O3: 0.12, NO2: 100.0 },
        currentValues: { 'PM2.5': 8.2, 'PM10': 24.1, O3: 0.045, NO2: 18.7 }
      },
      {
        id: 'BC-ENV-003',
        monitorName: 'Agricultural Soil Moisture Network',
        monitorType: 'soil_monitoring',
        location: { latitude: 46.1545, longitude: -119.4123 },
        parameters: ['soil_moisture', 'soil_temperature', 'soil_salinity'],
        lastReading: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        status: 'active',
        dataCollectionFrequency: 'daily',
        alertThresholds: { soil_moisture: 20.0, soil_temperature: 35.0, soil_salinity: 4.0 },
        currentValues: { soil_moisture: 32.4, soil_temperature: 22.1, soil_salinity: 1.8 }
      }
    ]);

    setSystemMetrics(prev => ({
      ...prev,
      totalImageryDatasets: 3,
      totalSpatialAnalyses: 3,
      totalPropertyBoundaries: 2,
      totalEnvironmentalMonitors: 3,
      totalCoverageSqKm: 4428.8,
      changeDetectionsToday: 2,
      dataProcessingQueue: 5,
      satellitePassesToday: 7,
      gisAccuracyScore: 0.94,
      environmentalAlerts: 1
    }));
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        dataProcessingQueue: Math.max(0, prev.dataProcessingQueue + (Math.random() > 0.7 ? 1 : -1)),
        gisAccuracyScore: Math.max(0.85, Math.min(0.98, prev.gisAccuracyScore + (Math.random() - 0.5) * 0.02)),
        lastUpdate: new Date().toISOString()
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const renderDashboard = () => (
    <div className="gis-dashboard-content">
      <div className="dashboard-grid">
        {/* GIS Overview */}
        <div className="metric-card large">
          <div className="card-header">
            <h3>🌍 Geospatial Intelligence Overview</h3>
            <div className="coverage-status">
              <span className="status-value">94%</span>
              <span className="status-label">Coverage Active</span>
            </div>
          </div>
          <div className="overview-grid">
            <div className="overview-item">
              <div className="overview-icon">🛰️</div>
              <div className="overview-info">
                <div className="overview-value">{systemMetrics.totalImageryDatasets}</div>
                <div className="overview-label">Satellite Datasets</div>
              </div>
            </div>
            <div className="overview-item">
              <div className="overview-icon">📊</div>
              <div className="overview-info">
                <div className="overview-value">{systemMetrics.totalSpatialAnalyses}</div>
                <div className="overview-label">Active Analyses</div>
              </div>
            </div>
            <div className="overview-item">
              <div className="overview-icon">🏘️</div>
              <div className="overview-info">
                <div className="overview-value">89,247</div>
                <div className="overview-label">Property Parcels</div>
              </div>
            </div>
            <div className="overview-item">
              <div className="overview-icon">🌱</div>
              <div className="overview-info">
                <div className="overview-value">{systemMetrics.totalEnvironmentalMonitors}</div>
                <div className="overview-label">Environmental Monitors</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Satellite Imagery */}
        <div className="metric-card">
          <div className="card-header">
            <h3>🛰️ Recent Satellite Imagery</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="imagery-list">
            {satelliteImagery.slice(0, 3).map(imagery => (
              <div key={imagery.id} className="imagery-item">
                <div className="imagery-header">
                  <div className="imagery-name">{imagery.name}</div>
                  <div className={`imagery-type type-${imagery.type}`}>
                    {imagery.type.toUpperCase()}
                  </div>
                </div>
                <div className="imagery-details">
                  <div className="detail-row">
                    <span>📅 {new Date(imagery.acquisitionDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-row">
                    <span>📏 {imagery.spatialResolution}m resolution</span>
                  </div>
                  <div className="detail-row">
                    <span>☁️ {imagery.cloudCoveragePercent}% cloud cover</span>
                  </div>
                  <div className="detail-row">
                    <span>⭐ {(imagery.dataQualityScore * 100).toFixed(0)}% quality</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spatial Analyses */}
        <div className="metric-card">
          <div className="card-header">
            <h3>📊 Recent Spatial Analyses</h3>
            <button className="new-analysis-btn">+ New Analysis</button>
          </div>
          <div className="analyses-list">
            {spatialAnalyses.slice(0, 3).map(analysis => (
              <div key={analysis.id} className="analysis-item">
                <div className="analysis-header">
                  <div className="analysis-name">{analysis.name}</div>
                  <div className={`change-indicator ${analysis.changeDetected ? 'change-detected' : 'no-change'}`}>
                    {analysis.changeDetected ? 'CHANGE' : 'STABLE'}
                  </div>
                </div>
                <div className="analysis-details">
                  <div className="detail-row">
                    <span>🕐 {new Date(analysis.analysisDate).toLocaleTimeString()}</span>
                  </div>
                  <div className="detail-row">
                    <span>📏 {analysis.coverageAreaSqKm.toFixed(1)} km²</span>
                  </div>
                  <div className="detail-row">
                    <span>🎯 {(analysis.confidenceScore * 100).toFixed(0)}% confidence</span>
                  </div>
                  {analysis.changeDetected && (
                    <div className="detail-row">
                      <span>⚠️ {analysis.changePercentage.toFixed(1)}% change detected</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Environmental Monitors */}
        <div className="metric-card">
          <div className="card-header">
            <h3>🌱 Environmental Monitoring</h3>
          </div>
          <div className="monitors-list">
            {environmentalMonitors.slice(0, 3).map(monitor => (
              <div key={monitor.id} className="monitor-item">
                <div className="monitor-header">
                  <div className="monitor-name">{monitor.monitorName}</div>
                  <div className={`monitor-status status-${monitor.status}`}>
                    {monitor.status.toUpperCase()}
                  </div>
                </div>
                <div className="monitor-details">
                  <div className="detail-row">
                    <span>📍 {monitor.location.latitude.toFixed(4)}, {monitor.location.longitude.toFixed(4)}</span>
                  </div>
                  <div className="detail-row">
                    <span>🕐 {new Date(monitor.lastReading).toLocaleTimeString()}</span>
                  </div>
                  <div className="parameters-grid">
                    {Object.entries(monitor.currentValues).slice(0, 2).map(([param, value]) => (
                      <div key={param} className="parameter-value">
                        <span className="param-name">{param}</span>
                        <span className="param-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Map */}
        <div className="metric-card map-card">
          <div className="card-header">
            <h3>🗺️ Benton County Interactive Map</h3>
            <div className="map-controls">
              <button className="map-btn">Satellite</button>
              <button className="map-btn">Terrain</button>
              <button className="map-btn">Boundaries</button>
            </div>
          </div>
          <div className="map-container">
            <MapContainer
              ref={mapRef}
              bounds={bentonCountyBounds}
              style={{ height: '400px', width: '100%' }}
              scrollWheelZoom={true}
            >
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="OpenStreetMap">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>
                
                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </LayersControl.BaseLayer>

                <LayersControl.Overlay name="Environmental Monitors" checked>
                  <FeatureGroup>
                    {environmentalMonitors.map(monitor => (
                      <Marker
                        key={monitor.id}
                        position={[monitor.location.latitude, monitor.location.longitude]}
                      >
                        <Popup>
                          <div>
                            <h4>{monitor.monitorName}</h4>
                            <p><strong>Type:</strong> {monitor.monitorType}</p>
                            <p><strong>Status:</strong> {monitor.status}</p>
                            <p><strong>Last Reading:</strong> {new Date(monitor.lastReading).toLocaleString()}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </FeatureGroup>
                </LayersControl.Overlay>
              </LayersControl>
            </MapContainer>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="metric-card">
          <div className="card-header">
            <h3>📈 System Performance</h3>
          </div>
          <div className="performance-metrics">
            <div className="metric-item">
              <div className="metric-circle">
                <svg viewBox="0 0 100 100" className="metric-chart">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#1976d2"
                    strokeWidth="8"
                    strokeDasharray={`${systemMetrics.gisAccuracyScore * 282.7} 282.7`}
                    strokeDashoffset="-70.675"
                    className="metric-progress"
                  />
                </svg>
                <div className="metric-value">
                  <span className="percentage">{(systemMetrics.gisAccuracyScore * 100).toFixed(0)}%</span>
                  <span className="label">Accuracy</span>
                </div>
              </div>
            </div>
            <div className="processing-queue">
              <div className="queue-header">
                <span>Processing Queue</span>
                <span className="queue-count">{systemMetrics.dataProcessingQueue}</span>
              </div>
              <div className="queue-items">
                <div className="queue-item">Change Detection Analysis</div>
                <div className="queue-item">Vegetation Health Assessment</div>
                <div className="queue-item">Property Boundary Update</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'satellite':
        return (
          <div className="satellite-content">
            <div className="content-header">
              <h2>🛰️ Satellite Imagery Management</h2>
              <button className="new-imagery-btn">+ Import Imagery</button>
            </div>
            <div className="imagery-grid">
              {satelliteImagery.map(imagery => (
                <div key={imagery.id} className="imagery-detail-card">
                  <div className="imagery-card-header">
                    <h3>{imagery.name}</h3>
                    <div className={`type-badge type-${imagery.type}`}>
                      {imagery.type.toUpperCase()}
                    </div>
                  </div>
                  <div className="imagery-details">
                    <p><strong>Source:</strong> {imagery.dataSource}</p>
                    <p><strong>Acquisition:</strong> {new Date(imagery.acquisitionDate).toLocaleDateString()}</p>
                    <p><strong>Resolution:</strong> {imagery.spatialResolution}m</p>
                    <p><strong>Bands:</strong> {imagery.spectralBands}</p>
                    <p><strong>Coverage:</strong> {imagery.coverageAreaSqKm.toFixed(1)} km²</p>
                    <p><strong>Cloud Cover:</strong> {imagery.cloudCoveragePercent}%</p>
                    <p><strong>Quality:</strong> {(imagery.dataQualityScore * 100).toFixed(0)}%</p>
                    <p><strong>File Size:</strong> {imagery.fileSizeGb} GB</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'maps':
        return (
          <div className="maps-content">
            <div className="content-header">
              <h2>🗺️ Interactive Mapping Platform</h2>
              <div className="map-tools">
                <button className="tool-btn">Measure</button>
                <button className="tool-btn">Draw</button>
                <button className="tool-btn">Export</button>
              </div>
            </div>
            <div className="full-map-container">
              <MapContainer
                bounds={bentonCountyBounds}
                style={{ height: '600px', width: '100%' }}
                scrollWheelZoom={true}
              >
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked name="OpenStreetMap">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </LayersControl.BaseLayer>
                  
                  <LayersControl.BaseLayer name="Satellite">
                    <TileLayer
                      attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                  </LayersControl.BaseLayer>

                  <LayersControl.Overlay name="Environmental Monitors" checked>
                    <FeatureGroup>
                      {environmentalMonitors.map(monitor => (
                        <Marker
                          key={monitor.id}
                          position={[monitor.location.latitude, monitor.location.longitude]}
                        >
                          <Popup>
                            <div>
                              <h4>{monitor.monitorName}</h4>
                              <p><strong>Type:</strong> {monitor.monitorType}</p>
                              <p><strong>Status:</strong> {monitor.status}</p>
                              <p><strong>Parameters:</strong> {monitor.parameters.join(', ')}</p>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </FeatureGroup>
                  </LayersControl.Overlay>
                </LayersControl>
              </MapContainer>
            </div>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="gis-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h1>🌍 Geospatial Intelligence Dashboard</h1>
          <p>Advanced GIS mapping, satellite imagery analysis, and spatial data processing for Benton County</p>
        </div>
        <div className="header-actions">
          <button className="sync-button">🔄 Sync Data</button>
          <button className="export-button">📥 Export</button>
        </div>
      </div>

      <div className="dashboard-tabs">
        {[
          { id: 'dashboard', label: 'GIS Dashboard', icon: '🏠' },
          { id: 'satellite', label: 'Satellite Imagery', icon: '🛰️' },
          { id: 'maps', label: 'Interactive Maps', icon: '🗺️' },
          { id: 'analysis', label: 'Spatial Analysis', icon: '📊' },
          { id: 'properties', label: 'Property Boundaries', icon: '🏘️' },
          { id: 'environmental', label: 'Environmental', icon: '🌱' },
          { id: 'infrastructure', label: 'Infrastructure', icon: '🚧' },
          { id: 'analytics', label: 'Analytics', icon: '📈' },
          { id: 'admin', label: 'Admin', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default GISDashboard;