# Real-time Geospatial Anomaly Visualization

## Overview

The Real-time Geospatial Anomaly Visualization is an advanced interactive mapping system that displays detected data anomalies with geographic context. This tool helps assessors and data quality teams quickly identify, analyze, and address data issues across Benton County's property database.

## Key Features

### Interactive Mapping

- **Dynamic Map Display**: Interactive map of Benton County showing property locations
- **Zoom and Pan**: Easily navigate to specific areas or get a county-wide view
- **Base Layer Options**: Choose between satellite, street, and topographic views
- **Property Boundaries**: Overlay of parcel boundaries for precise location identification

### Anomaly Visualization

- **Color-Coded Severity**: Anomalies displayed with color indicators based on severity:
  - Critical: Red
  - High: Orange
  - Medium: Yellow
  - Low: Blue

- **Clustering**: Automatic grouping of nearby anomalies for cleaner visualization at zoomed-out levels

- **Time-Based Animation**: Option to animate anomaly appearance over time to identify patterns

- **Heat Maps**: Alternative view showing concentration of anomalies by geographic area

### Filtering and Analysis

- **Multi-dimensional Filtering**:
  - By severity level
  - By anomaly type
  - By detection time
  - By property type
  - By responsible assessor

- **Temporal Analysis**: Track anomalies over time with the time slider control

- **Export Capabilities**: Export filtered anomaly data to CSV, Excel, or GeoJSON formats

### Real-time Updates

- **Live Data Feed**: New anomalies appear immediately when detected
- **Update Notifications**: Visual indicators when new anomalies are detected
- **Replay Functionality**: Review how anomalies evolved over a selected time period
- **Change Tracking**: Visualize changes in anomaly status (new, acknowledged, resolved)

## Architecture

The visualization system consists of several components:

```
┌─────────────────┐      ┌───────────────────┐      ┌─────────────────┐
│                 │      │                   │      │                 │
│  Data Sources   │──────▶  Backend Services │──────▶  Frontend Map   │
│                 │      │                   │      │                 │
└─────────────────┘      └───────────────────┘      └─────────────────┘
       │                          │                        │
       │                          │                        │
       ▼                          ▼                        ▼
┌─────────────────┐      ┌───────────────────┐      ┌─────────────────┐
│                 │      │                   │      │                 │
│  Anomaly        │      │  API Layer        │      │  User Interface │
│  Detection      │      │                   │      │                 │
│                 │      │                   │      │                 │
└─────────────────┘      └───────────────────┘      └─────────────────┘
```

### Components

1. **Data Sources**:
   - Property database
   - Assessment records
   - Historical anomaly data
   - GIS parcel data

2. **Anomaly Detection**:
   - AI-powered anomaly detection system
   - Statistical analysis engines
   - Rule-based validation checks
   - Predictive analytics models

3. **Backend Services**:
   - Flask web server
   - PostgreSQL with PostGIS extension
   - Redis for real-time updates
   - ETL processes for data integration

4. **API Layer**:
   - RESTful endpoints for data access
   - WebSocket connections for real-time updates
   - Authentication and authorization controls
   - Rate limiting and caching

5. **Frontend Map**:
   - Leaflet.js mapping library
   - Interactive controls and layers
   - Custom styling and visualization
   - Responsive design for different devices

6. **User Interface**:
   - Filter controls and panels
   - Anomaly details display
   - Statistics and analytics
   - Export and sharing options

## Technical Details

### Database Schema

The visualization relies on two primary tables:

**parcels**:
```sql
CREATE TABLE parcels (
    id SERIAL PRIMARY KEY,
    parcel_id VARCHAR(64) UNIQUE NOT NULL,
    geometry GEOMETRY(POLYGON, 4326) NOT NULL,
    property_type VARCHAR(32),
    address VARCHAR(256),
    owner_name VARCHAR(256),
    last_assessment_date DATE,
    last_assessment_value NUMERIC(12, 2),
    metadata JSONB
);
```

**data_anomaly**:
```sql
CREATE TABLE data_anomaly (
    id SERIAL PRIMARY KEY,
    config_id INTEGER,
    table_name VARCHAR(64) NOT NULL,
    field_name VARCHAR(64) NOT NULL,
    record_id VARCHAR(64) NOT NULL,
    anomaly_type VARCHAR(32) NOT NULL,
    anomaly_details JSONB,
    anomaly_score NUMERIC(5, 4),
    current_value TEXT,
    previous_value TEXT,
    severity VARCHAR(16) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'open',
    resolved_at TIMESTAMP,
    resolved_by INTEGER,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

The visualization system exposes several API endpoints:

#### Get Anomalies

```
GET /api/anomalies?severity=high,critical&days=7&type=outlier,missing
```

Returns anomalies based on filtering criteria.

#### Get Anomaly Details

```
GET /api/anomalies/{anomaly_id}
```

Returns detailed information about a specific anomaly.

#### Get Parcel Data

```
GET /api/parcels/{parcel_id}
```

Returns property information for a specific parcel.

#### Get Anomaly Statistics

```
GET /api/anomalies/stats
```

Returns statistical information about anomalies.

#### Real-time Updates

```
WebSocket: /api/ws/anomalies
```

Provides real-time updates for new anomalies.

### JavaScript Integration

Example of integrating the map in a web application:

```javascript
// Initialize the map
const map = L.map('anomaly-map').setView([46.2804, -119.2752], 10);

// Add base tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Initialize anomaly layer
const anomalyLayer = L.layerGroup().addTo(map);

// Load anomalies with filtering
async function loadAnomalies(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/anomalies?${queryParams}`);
    const data = await response.json();
    
    // Clear existing anomalies
    anomalyLayer.clearLayers();
    
    // Add anomalies to the map
    data.anomalies.forEach(anomaly => {
        const marker = L.circleMarker([anomaly.latitude, anomaly.longitude], {
            radius: 8,
            fillColor: getSeverityColor(anomaly.severity),
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });
        
        marker.bindPopup(createPopupContent(anomaly));
        marker.on('click', () => showAnomalyDetails(anomaly.id));
        anomalyLayer.addLayer(marker);
    });
}

// Get color based on severity
function getSeverityColor(severity) {
    switch(severity) {
        case 'critical': return '#ff0000';
        case 'high': return '#ff9900';
        case 'medium': return '#ffcc00';
        case 'low': return '#3388ff';
        default: return '#3388ff';
    }
}

// Create popup content
function createPopupContent(anomaly) {
    return `
        <h3>Anomaly #${anomaly.id}</h3>
        <p><strong>Type:</strong> ${anomaly.anomaly_type}</p>
        <p><strong>Severity:</strong> ${anomaly.severity}</p>
        <p><strong>Detected:</strong> ${new Date(anomaly.detected_at).toLocaleString()}</p>
        <p><a href="#" onclick="showAnomalyDetails(${anomaly.id}); return false;">View Details</a></p>
    `;
}

// Initialize real-time updates
const socket = new WebSocket(`ws://${window.location.host}/api/ws/anomalies`);
socket.onmessage = event => {
    const newAnomaly = JSON.parse(event.data);
    
    // Flash notification
    showNotification(`New ${newAnomaly.severity} anomaly detected!`);
    
    // Add to map if it matches current filters
    if (matchesCurrentFilters(newAnomaly)) {
        const marker = L.circleMarker([newAnomaly.latitude, newAnomaly.longitude], {
            radius: 8,
            fillColor: getSeverityColor(newAnomaly.severity),
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });
        
        marker.bindPopup(createPopupContent(newAnomaly));
        marker.on('click', () => showAnomalyDetails(newAnomaly.id));
        anomalyLayer.addLayer(marker);
        
        // Highlight the new anomaly
        marker.setStyle({ fillColor: '#fff' });
        setTimeout(() => {
            marker.setStyle({ fillColor: getSeverityColor(newAnomaly.severity) });
        }, 3000);
    }
};

// Initialize the map with default filters
loadAnomalies({ severity: 'critical,high', days: '30' });
```

## User Guide

### Getting Started

1. **Access the Map**: Navigate to `/visualizations/anomaly-map` in the GeoAssessmentPro application
2. **Initial View**: The map will load showing anomalies from the past 30 days by default
3. **Navigation**: Use the mouse to zoom (scroll wheel) and pan (click and drag)
4. **Base Map**: Select different base map styles using the layer control in the top-right

### Working with Anomalies

1. **Viewing Details**:
   - Click on any anomaly marker to see basic information
   - Click "View Details" in the popup for comprehensive information
   - The details panel will show all available information about the anomaly

2. **Filtering Anomalies**:
   - Use the filter panel on the left side
   - Select severity levels to show/hide
   - Choose anomaly types of interest
   - Set the time range using the date controls
   - Filter by property type using the dropdown
   - Click "Apply Filters" to update the map

3. **Real-time Updates**:
   - New anomalies will appear automatically if "Enable Real-time Updates" is toggled on
   - A notification will appear when new anomalies are detected
   - New anomalies will briefly highlight when they first appear

4. **Time-based Analysis**:
   - Use the time slider at the bottom of the map
   - Drag the slider to see anomalies as they existed at a specific point in time
   - Click the play button to animate the appearance of anomalies over time

5. **Exporting Data**:
   - Click the "Export" button in the top toolbar
   - Select the desired format (CSV, Excel, GeoJSON)
   - Choose whether to export all anomalies or only currently filtered ones
   - The export will download automatically

### Advanced Features

1. **Heat Map View**:
   - Toggle "Heat Map" in the layer control
   - Adjust intensity using the slider
   - Areas with more anomalies will show brighter colors

2. **Clustering**:
   - Automatically enabled at zoomed-out levels
   - Click on a cluster to zoom to its extent
   - Hover on a cluster to see a summary of contained anomalies

3. **Comparison Mode**:
   - Enable "Comparison Mode" in the tools menu
   - Select two time periods to compare
   - The map will show new, resolved, and persistent anomalies with different colors

4. **Saved Views**:
   - Save your current filter configuration and map position
   - Access saved views from the dropdown menu
   - Share saved views with other users

## Integration with Data Stability Framework

The Anomaly Visualization is fully integrated with the Data Stability Framework:

1. **Data Classification**: Respects data classification levels when displaying anomaly details
2. **Access Control**: Enforces user permissions for viewing sensitive anomaly information
3. **Audit Logging**: Records all interactions with the visualization system
4. **AI Agents**: Displays anomalies detected by the framework's AI agents

## Performance Considerations

For optimal performance:

1. **Filtering**: Apply specific filters to reduce the number of displayed anomalies
2. **Time Range**: Start with a narrow time range and expand as needed
3. **Browser Resources**: Chrome or Firefox with at least 4GB of available memory recommended
4. **Network**: Stable internet connection required for real-time updates

## Troubleshooting

Common issues and solutions:

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Map doesn't load | Network connectivity | Check internet connection and reload |
| No anomalies visible | Filtering too restrictive | Reset filters to defaults |
| Real-time updates not working | WebSocket connection issue | Refresh the page to reconnect |
| Performance lag | Too many anomalies displayed | Apply more restrictive filters |

For technical support, contact the GeoAssessmentPro support team at support@bentonassessor.gov.