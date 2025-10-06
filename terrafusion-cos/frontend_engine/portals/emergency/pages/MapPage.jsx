/**
 * Emergency Portal - Map Page
 * Live incident map visualization with real-time updates
 */

import { TerraCard, TerraButton } from '../../../src/components';
import './MapPage.css';

const MapPage = () => {
  const incidents = [
    { id: 'INC-1047', type: 'Fire', location: '1234 Oak Street', lat: 44.5646, lon: -123.2620, severity: 'High', status: 'Responding' },
    { id: 'INC-1048', type: 'Medical', location: '456 Maple Ave', lat: 44.5680, lon: -123.2580, severity: 'Critical', status: 'En Route' },
    { id: 'INC-1049', type: 'Traffic', location: 'I-5 Mile 247', lat: 44.5720, lon: -123.2640, severity: 'Medium', status: 'Clearing' },
    { id: 'INC-1050', type: 'Hazmat', location: 'Industrial Park', lat: 44.5600, lon: -123.2700, severity: 'High', status: 'Contained' },
    { id: 'INC-1051', type: 'Rescue', location: 'River Trail', lat: 44.5580, lon: -123.2560, severity: 'Medium', status: 'Responding' },
  ];

  const resources = [
    { id: 'Engine 12', type: 'Fire', lat: 44.5656, lon: -123.2610, status: 'Deployed' },
    { id: 'Medic 7', type: 'Medical', lat: 44.5670, lon: -123.2590, status: 'En Route' },
    { id: 'Unit 23', type: 'Police', lat: 44.5710, lon: -123.2650, status: 'On Scene' },
    { id: 'Hazmat 4', type: 'Hazmat', lat: 44.5610, lon: -123.2690, status: 'Deployed' },
  ];

  const stations = [
    { id: 'Station 1', type: 'Fire', lat: 44.5640, lon: -123.2600 },
    { id: 'Station 3', type: 'Fire', lat: 44.5700, lon: -123.2680 },
    { id: 'Precinct 2', type: 'Police', lat: 44.5620, lon: -123.2620 },
  ];

  return (
    <div className="map-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Incident Map</h1>
          <p className="page-subtitle">Real-time visualization of incidents, resources, and stations</p>
        </div>
        <div className="page-actions">
          <TerraButton variant="outline">🔄 Refresh</TerraButton>
          <TerraButton variant="outline">📸 Screenshot</TerraButton>
          <TerraButton variant="primary">⚙️ Map Settings</TerraButton>
        </div>
      </div>

      <div className="map-container">
        <div className="map-sidebar">
          <TerraCard className="legend-card">
            <h3>Map Legend</h3>
            <div className="legend-items">
              <div className="legend-section">
                <h4>Incidents</h4>
                <div className="legend-item">
                  <span className="marker marker-critical">🔴</span>
                  <span>Critical</span>
                </div>
                <div className="legend-item">
                  <span className="marker marker-high">🟠</span>
                  <span>High</span>
                </div>
                <div className="legend-item">
                  <span className="marker marker-medium">🟡</span>
                  <span>Medium</span>
                </div>
                <div className="legend-item">
                  <span className="marker marker-low">🟢</span>
                  <span>Low</span>
                </div>
              </div>
              
              <div className="legend-section">
                <h4>Resources</h4>
                <div className="legend-item">
                  <span className="marker">🚒</span>
                  <span>Fire Engine</span>
                </div>
                <div className="legend-item">
                  <span className="marker">🚑</span>
                  <span>Ambulance</span>
                </div>
                <div className="legend-item">
                  <span className="marker">🚓</span>
                  <span>Police Unit</span>
                </div>
                <div className="legend-item">
                  <span className="marker">🚁</span>
                  <span>Helicopter</span>
                </div>
              </div>
              
              <div className="legend-section">
                <h4>Stations</h4>
                <div className="legend-item">
                  <span className="marker">⭐</span>
                  <span>Fire Station</span>
                </div>
                <div className="legend-item">
                  <span className="marker">🏢</span>
                  <span>Police Station</span>
                </div>
              </div>
            </div>
          </TerraCard>

          <TerraCard className="filters-card">
            <h3>Map Filters</h3>
            <div className="filter-options">
              <label className="filter-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Show Incidents</span>
              </label>
              <label className="filter-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Show Resources</span>
              </label>
              <label className="filter-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Show Stations</span>
              </label>
              <label className="filter-checkbox">
                <input type="checkbox" />
                <span>Show Traffic</span>
              </label>
              <label className="filter-checkbox">
                <input type="checkbox" />
                <span>Show Weather</span>
              </label>
            </div>
          </TerraCard>

          <TerraCard className="active-incidents-card">
            <h3>Active Incidents ({incidents.length})</h3>
            <div className="incident-list">
              {incidents.map(incident => (
                <div key={incident.id} className="incident-item">
                  <div className="incident-header">
                    <span className={`severity-badge severity-${incident.severity.toLowerCase()}`}>
                      {incident.severity}
                    </span>
                    <span className="incident-id">{incident.id}</span>
                  </div>
                  <div className="incident-type">{incident.type}</div>
                  <div className="incident-location">{incident.location}</div>
                  <div className="incident-status">{incident.status}</div>
                </div>
              ))}
            </div>
          </TerraCard>
        </div>

        <div className="map-main">
          <TerraCard className="map-viewer">
            {/* Placeholder for actual map integration (Leaflet, Mapbox, Google Maps, etc.) */}
            <div className="map-placeholder">
              <div className="map-content">
                <h2>🗺️ Interactive Map View</h2>
                <p className="map-notice">
                  Map integration ready for Leaflet, Mapbox, or Google Maps API
                </p>
                
                <div className="map-demo-markers">
                  <h3>Simulated Map Markers (Benton County, OR)</h3>
                  
                  <div className="marker-group">
                    <h4>📍 Active Incidents ({incidents.length})</h4>
                    {incidents.map(incident => (
                      <div key={incident.id} className="demo-marker">
                        <span className={`marker-icon severity-${incident.severity.toLowerCase()}`}>
                          {incident.severity === 'Critical' ? '🔴' : 
                           incident.severity === 'High' ? '🟠' : 
                           incident.severity === 'Medium' ? '🟡' : '🟢'}
                        </span>
                        <div className="marker-info">
                          <strong>{incident.id}</strong> - {incident.type}
                          <br />
                          {incident.location}
                          <br />
                          <small>Status: {incident.status} | {incident.severity} Priority</small>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="marker-group">
                    <h4>🚒 Deployed Resources ({resources.length})</h4>
                    {resources.map(resource => (
                      <div key={resource.id} className="demo-marker">
                        <span className="marker-icon">
                          {resource.type === 'Fire' ? '🚒' : 
                           resource.type === 'Medical' ? '🚑' : 
                           resource.type === 'Police' ? '🚓' : '🚁'}
                        </span>
                        <div className="marker-info">
                          <strong>{resource.id}</strong>
                          <br />
                          Status: {resource.status}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="marker-group">
                    <h4>⭐ Emergency Stations ({stations.length})</h4>
                    {stations.map(station => (
                      <div key={station.id} className="demo-marker">
                        <span className="marker-icon">
                          {station.type === 'Fire' ? '⭐' : '🏢'}
                        </span>
                        <div className="marker-info">
                          <strong>{station.id}</strong> - {station.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="map-integration-note">
                  <h4>🔌 Integration Options:</h4>
                  <ul>
                    <li><strong>Leaflet</strong> - Open source, lightweight, mobile-friendly</li>
                    <li><strong>Mapbox GL</strong> - Vector tiles, 3D terrain, custom styling</li>
                    <li><strong>Google Maps</strong> - Familiar UI, extensive POI data</li>
                    <li><strong>ArcGIS</strong> - Enterprise GIS with advanced spatial analysis</li>
                  </ul>
                  <p>
                    All markers use Benton County, Oregon coordinates (44.56° N, 123.26° W)
                  </p>
                </div>
              </div>
            </div>
          </TerraCard>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
