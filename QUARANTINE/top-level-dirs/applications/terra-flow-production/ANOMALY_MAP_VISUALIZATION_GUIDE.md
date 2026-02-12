# Real-time Geospatial Anomaly Map Visualization Guide

## Introduction

The Real-time Geospatial Anomaly Map Visualization is a sophisticated interactive tool designed for the Benton County Assessor's Office. This visualization system helps assessors, data quality teams, and management visualize property data anomalies in a geographical context, allowing for faster identification and resolution of data quality issues.

## Purpose

The primary purpose of this visualization system is to:

1. **Visualize data anomalies geographically**: Display detected anomalies on a map to show spatial patterns and clusters
2. **Enable real-time monitoring**: Show anomalies as they are detected by the Data Stability Framework
3. **Support decision-making**: Help assessors prioritize areas for review and validation
4. **Improve data quality**: Facilitate rapid identification and resolution of data issues

## Key Features

### Interactive Map Interface

![Anomaly Map Overview](static/images/anomaly_map_overview.png)

The map interface includes:

- **Base map layers**: Multiple base map options including satellite, street, and topographic views
- **Parcel boundaries**: Overlay showing property boundaries for precise location identification
- **Zoom and pan controls**: Tools for navigating to specific areas or viewing the entire county
- **Layer controls**: Toggle visibility of different data layers and overlays
- **Search functionality**: Find specific properties by address, parcel ID, or owner name

### Anomaly Visualization

Anomalies are visualized using several techniques:

#### Point Markers

Individual anomalies are shown as point markers with:
- **Color-coding by severity**:
  - Critical (Red)
  - High (Orange)
  - Medium (Yellow)
  - Low (Blue)
- **Size variation by impact**: Larger markers for anomalies affecting more data points
- **Click interaction**: Click to view detailed information about the anomaly

#### Heat Maps

For areas with high concentrations of anomalies:
- **Intensity gradient**: Areas with more anomalies show higher intensity colors
- **Customizable radius**: Adjust the radius of influence for heat map calculation
- **Filtering by type**: Show heat maps for specific types of anomalies

#### Clustering

When zoomed out, nearby anomalies are clustered:
- **Numeric indicators**: Show the number of anomalies in each cluster
- **Expanding on zoom**: Clusters expand to individual anomalies as you zoom in
- **Cluster severity**: Color-coded based on the highest severity anomaly in the cluster

### Filtering and Analysis Tools

The system provides robust filtering capabilities:

- **Time-based filtering**: View anomalies from specific time periods using the time slider
- **Severity filtering**: Show only anomalies of selected severity levels
- **Type filtering**: Filter by anomaly type (e.g., outliers, missing data, format issues)
- **Property type filtering**: Focus on specific property types or classes
- **Department filtering**: View anomalies relevant to specific departments or teams

### Real-time Updates

The map updates in real-time as new anomalies are detected:

- **Live data feed**: New anomalies appear on the map immediately
- **Notification system**: Alerts when new critical anomalies are detected
- **Animation controls**: Play/pause controls for visualizing the appearance of anomalies over time

### Detailed Information Panel

For each anomaly, a detailed information panel shows:

- **Anomaly details**: Type, severity, detection time, and status
- **Property information**: Address, parcel ID, owner, and assessment details
- **Historical context**: Previous anomalies at this location
- **Related anomalies**: Other anomalies that may be connected
- **Resolution options**: Actions that can be taken to resolve the issue

### Analytics Dashboard

The analytics dashboard provides insights into anomaly patterns:

- **Summary statistics**: Total anomalies by severity, type, and area
- **Trend analysis**: Charts showing anomaly trends over time
- **Top affected areas**: Identification of areas with highest anomaly concentrations
- **Resolution performance**: Metrics on time-to-resolution and resolution rates

## Architecture

The visualization system uses a modern web architecture:

```
┌─────────────────────┐     ┌────────────────────┐     ┌─────────────────────┐
│                     │     │                    │     │                     │
│  Data Stability     │────►│  API Layer         │────►│  Web Client         │
│  Framework          │     │                    │     │  (Map Visualization) │
│                     │     │                    │     │                     │
└─────────────────────┘     └────────────────────┘     └─────────────────────┘
          │                           │                          │
          │                           │                          │
          ▼                           ▼                          ▼
┌─────────────────────┐     ┌────────────────────┐     ┌─────────────────────┐
│                     │     │                    │     │                     │
│  PostgreSQL DB      │     │  Real-time         │     │  User Interaction   │
│  with PostGIS       │     │  Event System      │     │  Components         │
│                     │     │                    │     │                     │
└─────────────────────┘     └────────────────────┘     └─────────────────────┘
```

### Components

1. **Data Stability Framework**: Core system that detects and manages data anomalies
2. **API Layer**: RESTful and WebSocket endpoints for data access and real-time updates
3. **Web Client**: Browser-based map visualization built with Leaflet.js
4. **PostgreSQL with PostGIS**: Spatial database for storing and querying geographic data
5. **Real-time Event System**: Handles event streaming for immediate updates
6. **User Interaction Components**: Controls, filters, and information panels for user interaction

## Technical Implementation

### Map Implementation

The map is implemented using Leaflet.js with custom extensions:

```javascript
// Initialize the map
const map = L.map('anomaly-map', {
    center: [46.2804, -119.2752], // Benton County coordinates
    zoom: 10,
    layers: [baseLayer],
    zoomControl: false
});

// Add zoom control in top-right corner
L.control.zoom({
    position: 'topright'
}).addTo(map);

// Add layer control
const baseMaps = {
    "Streets": streetsLayer,
    "Satellite": satelliteLayer,
    "Topographic": topoLayer
};

const overlayMaps = {
    "Parcels": parcelLayer,
    "Anomalies": anomalyLayer,
    "Heat Map": heatmapLayer
};

L.control.layers(baseMaps, overlayMaps, {
    position: 'topright',
    collapsed: false
}).addTo(map);

// Add scale control
L.control.scale({
    imperial: true,
    metric: true,
    position: 'bottomleft'
}).addTo(map);
```

### Anomaly Visualization

Anomalies are rendered using custom markers:

```javascript
function createAnomalyMarker(anomaly) {
    // Determine color based on severity
    const color = getSeverityColor(anomaly.severity);
    
    // Create marker
    const marker = L.circleMarker([anomaly.latitude, anomaly.longitude], {
        radius: getMarkerRadius(anomaly.impact),
        fillColor: color,
        color: '#000',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    });
    
    // Add popup
    marker.bindPopup(createPopupContent(anomaly));
    
    // Add click handler
    marker.on('click', () => {
        showAnomalyDetails(anomaly);
    });
    
    return marker;
}

function getSeverityColor(severity) {
    switch(severity) {
        case 'critical': return '#ff0000';
        case 'high': return '#ff9900';
        case 'medium': return '#ffcc00';
        case 'low': return '#3388ff';
        default: return '#3388ff';
    }
}

function getMarkerRadius(impact) {
    // Scale radius between 5 and 12 based on impact
    return Math.max(5, Math.min(12, impact * 10));
}
```

### Real-time Updates

WebSockets are used for real-time updates:

```javascript
// Initialize WebSocket connection
const socket = new WebSocket(`ws://${window.location.host}/api/ws/anomalies`);

// Handle incoming messages
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'new_anomaly') {
        // Add new anomaly to map
        const marker = createAnomalyMarker(data.anomaly);
        
        // Check if it passes current filters
        if (passesFilters(data.anomaly)) {
            marker.addTo(anomalyLayer);
            
            // Highlight the new anomaly
            highlightMarker(marker, 3000);
            
            // Update heat map if enabled
            if (map.hasLayer(heatmapLayer)) {
                updateHeatmap();
            }
            
            // Show notification
            showNotification(`New ${data.anomaly.severity} anomaly detected!`);
        }
        
        // Store in anomalies collection
        anomalies.push(data.anomaly);
    }
};

// Handle connection issues
socket.onclose = (event) => {
    console.log('WebSocket connection closed, reconnecting...');
    setTimeout(connectWebSocket, 5000);
};
```

### Filtering System

The filtering system updates the map based on user selections:

```javascript
// Apply filters to anomalies
function applyFilters() {
    // Clear existing anomalies
    anomalyLayer.clearLayers();
    
    // Get filter values
    const severityFilters = getSelectedSeverities();
    const typeFilters = getSelectedTypes();
    const timeRange = getTimeRange();
    const propertyTypes = getSelectedPropertyTypes();
    
    // Filter anomalies
    const filteredAnomalies = anomalies.filter(anomaly => {
        return (
            severityFilters.includes(anomaly.severity) &&
            typeFilters.includes(anomaly.type) &&
            anomaly.detected_at >= timeRange.start &&
            anomaly.detected_at <= timeRange.end &&
            (propertyTypes.length === 0 || propertyTypes.includes(anomaly.property_type))
        );
    });
    
    // Add filtered anomalies to map
    filteredAnomalies.forEach(anomaly => {
        const marker = createAnomalyMarker(anomaly);
        marker.addTo(anomalyLayer);
    });
    
    // Update clustering
    updateClustering();
    
    // Update heat map if enabled
    if (map.hasLayer(heatmapLayer)) {
        updateHeatmap();
    }
    
    // Update statistics
    updateStatistics(filteredAnomalies);
}
```

### Animation System

The time-based animation system shows anomaly evolution:

```javascript
let animationTimer = null;
let currentAnimationTime = null;

function startAnimation() {
    // Get animation time range
    const timeRange = getTimeRange();
    
    // Set starting time
    currentAnimationTime = new Date(timeRange.start);
    
    // Clear any existing animation
    stopAnimation();
    
    // Start animation timer
    animationTimer = setInterval(() => {
        // Advance time
        currentAnimationTime = new Date(currentAnimationTime.getTime() + 3600000); // 1 hour increment
        
        // Check if animation is complete
        if (currentAnimationTime > timeRange.end) {
            stopAnimation();
            return;
        }
        
        // Update time display
        updateTimeDisplay(currentAnimationTime);
        
        // Update map to show anomalies up to current time
        updateMapToTime(currentAnimationTime);
    }, 1000); // Update every second
}

function updateMapToTime(time) {
    // Clear existing anomalies
    anomalyLayer.clearLayers();
    
    // Apply all filters except time
    const severityFilters = getSelectedSeverities();
    const typeFilters = getSelectedTypes();
    const propertyTypes = getSelectedPropertyTypes();
    
    // Filter anomalies up to current animation time
    const filteredAnomalies = anomalies.filter(anomaly => {
        return (
            severityFilters.includes(anomaly.severity) &&
            typeFilters.includes(anomaly.type) &&
            new Date(anomaly.detected_at) <= time &&
            (propertyTypes.length === 0 || propertyTypes.includes(anomaly.property_type))
        );
    });
    
    // Add filtered anomalies to map
    filteredAnomalies.forEach(anomaly => {
        const marker = createAnomalyMarker(anomaly);
        marker.addTo(anomalyLayer);
    });
}
```

## Data Models

The visualization relies on two primary data models:

### 1. Anomaly Data Model

```javascript
{
    "id": "a-12345",
    "table_name": "properties",
    "field_name": "assessed_value",
    "record_id": "p-78901",
    "anomaly_type": "outlier",
    "anomaly_details": {
        "expected_range": [150000, 350000],
        "actual_value": 950000,
        "z_score": 3.8
    },
    "anomaly_score": 0.92,
    "current_value": "950000",
    "previous_value": "250000",
    "severity": "high",
    "status": "open",
    "detected_at": "2025-04-15T10:23:45Z",
    "location": {
        "latitude": 46.2804,
        "longitude": -119.2752
    },
    "property_type": "residential",
    "property_info": {
        "address": "123 Main St, Kennewick, WA",
        "parcel_id": "1-2345-6789",
        "owner": "John Doe",
        "last_assessment_date": "2024-10-15"
    }
}
```

### 2. Property Data Model

```javascript
{
    "id": "p-78901",
    "parcel_id": "1-2345-6789",
    "geometry": {
        "type": "Polygon",
        "coordinates": [
            [
                [-119.2755, 46.2807],
                [-119.2750, 46.2807],
                [-119.2750, 46.2801],
                [-119.2755, 46.2801],
                [-119.2755, 46.2807]
            ]
        ]
    },
    "property_type": "residential",
    "address": "123 Main St, Kennewick, WA",
    "owner_name": "John Doe",
    "last_assessment_date": "2024-10-15",
    "last_assessment_value": 250000,
    "building_area": 2100,
    "land_area": 8500,
    "year_built": 1985,
    "metadata": {
        "zone": "R1",
        "school_district": "Kennewick",
        "flood_zone": false
    }
}
```

## API Endpoints

The visualization system exposes several API endpoints:

### Data Endpoints

#### Get Anomalies

```
GET /api/anomalies
```

Query parameters:
- `severity`: Comma-separated list of severities (e.g., `critical,high`)
- `type`: Comma-separated list of anomaly types
- `start_date`: Start date for filtering (ISO format)
- `end_date`: End date for filtering (ISO format)
- `property_type`: Filter by property type
- `status`: Filter by status (e.g., `open`, `resolved`)

Response:
```javascript
{
    "anomalies": [
        // Anomaly objects as described in data model
    ],
    "total_count": 250,
    "page": 1,
    "page_size": 100,
    "statistics": {
        "by_severity": {
            "critical": 15,
            "high": 42,
            "medium": 98,
            "low": 95
        },
        "by_type": {
            "outlier": 78,
            "missing_data": 32,
            "format_error": 45,
            "value_change": 95
        }
    }
}
```

#### Get Anomaly Details

```
GET /api/anomalies/{anomaly_id}
```

Response:
```javascript
{
    // Detailed anomaly object
    // Includes property information and related anomalies
}
```

#### Get Property Information

```
GET /api/properties/{property_id}
```

Response:
```javascript
{
    // Property object as described in data model
    "anomalies": [
        // Anomalies associated with this property
    ]
}
```

### WebSocket Endpoints

#### Real-time Anomaly Updates

```
WebSocket: /api/ws/anomalies
```

Message format:
```javascript
{
    "type": "new_anomaly",
    "anomaly": {
        // Anomaly object as described in data model
    }
}
```

## User Guide

### Getting Started

1. **Access the Map**: Navigate to the Anomaly Map screen from the GeoAssessmentPro dashboard
2. **Orientation**: 
   - The map is centered on Benton County
   - Blue dots represent properties with data anomalies
   - Red, orange, and yellow dots indicate critical, high, and medium severity anomalies
   - The right panel shows filtering options and anomaly details

### Basic Navigation

1. **Zoom and Pan**: 
   - Use the mouse wheel or the +/- buttons to zoom
   - Click and drag to pan the map
   - Double-click to zoom in on a specific location

2. **Base Map Selection**:
   - Click the layers icon in the top-right corner
   - Select from available base maps (Streets, Satellite, or Topographic)

3. **Property Search**:
   - Enter an address or parcel ID in the search box
   - Select a property from the dropdown results
   - The map will zoom to the selected property

### Working with Anomalies

1. **Viewing Anomaly Details**:
   - Click on any anomaly marker to see basic information
   - Click "View Details" in the popup to see complete information
   - The details panel shows anomaly specifics, property information, and resolution options

2. **Filtering Anomalies**:
   - Use the filter panel on the right side of the screen
   - Filter by severity, type, time range, and property type
   - Click "Apply Filters" to update the map
   - Use "Reset Filters" to clear all filters

3. **Time-Based Analysis**:
   - Use the time slider at the bottom of the map
   - Drag the handles to set a specific time range
   - Click "Play" to animate the appearance of anomalies over time
   - Use the speed control to adjust animation speed

4. **Visualization Modes**:
   - Point Mode: Individual anomalies shown as points (default)
   - Heat Map: Toggle the "Heat Map" layer to see concentration areas
   - Cluster Mode: Automatically activated when zoomed out

### Advanced Features

1. **Export and Reporting**:
   - Click "Export" to download anomaly data in CSV, Excel, or GeoJSON format
   - Use "Generate Report" to create a PDF report of current view
   - Save the current map configuration using "Save View"

2. **Notifications**:
   - Enable "Real-time Notifications" to receive alerts about new anomalies
   - Configure notification preferences from the settings menu
   - Click on a notification to zoom to the related anomaly

3. **Analytics Dashboard**:
   - Click "Analytics" to open the analytics dashboard
   - View trends, patterns, and statistics about anomalies
   - Use the dashboard to identify systemic issues

## Best Practices

1. **Regular Monitoring**: Check the anomaly map at least once daily
2. **Prioritization**: Address critical and high severity anomalies first
3. **Pattern Recognition**: Look for clusters or patterns indicating systematic issues
4. **Documentation**: Record resolution actions in the system
5. **Collaboration**: Share views with colleagues when working on related issues
6. **Verification**: After resolving an anomaly, verify the fix in the system

## Troubleshooting

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Map not loading | Network connectivity | Check your internet connection and refresh the page |
| No anomalies visible | Filtering too restrictive | Reset filters to view all anomalies |
| Animation not working | Browser performance | Close other applications and refresh the page |
| Markers not updating | WebSocket disconnection | Refresh the page to reconnect |
| Map appears blank | Zoom level too high | Zoom out to see the entire county |
| Details panel not loading | Data access issue | Check permissions or contact support |

## Performance Considerations

For optimal performance, consider the following:

1. **Time Range**: Limit time ranges to 30 days or less for best performance
2. **Filtering**: Apply appropriate filters to reduce the number of displayed anomalies
3. **Heat Maps**: Disable heat maps when not needed as they are resource-intensive
4. **Animation**: Use animation sparingly on large datasets
5. **Browser**: Chrome or Firefox provide the best performance

## Integration with Data Stability Framework

The Anomaly Map Visualization integrates directly with the Data Stability Framework:

1. **Real-time Detection**: Anomalies detected by the framework appear immediately on the map
2. **Resolution Tracking**: Anomaly resolutions recorded in the framework update the map status
3. **Severity Classification**: The framework's severity ratings determine map visualization
4. **Access Control**: The framework's access controls determine what data is visible to each user
5. **Audit Trail**: All map interactions are recorded in the framework's audit system

## Conclusion

The Real-time Geospatial Anomaly Map Visualization is a powerful tool for maintaining data quality in the GeoAssessmentPro system. By providing intuitive geographic visualization of data anomalies, it enables faster identification, prioritization, and resolution of data issues, ultimately leading to more accurate property assessments and improved service to Benton County residents.