/**
 * Geospatial Anomaly Visualization
 * 
 * This script provides an interactive map visualization of data anomalies
 * in property assessment data, with real-time updates and filtering capabilities.
 */

// Global variables
let map;
let anomalyMarkers = {};
let markerClusters = {};
let severityGroups = ['critical', 'high', 'medium', 'low'];
let anomalyTypeFilters = {};
let realtimeUpdateTimer;
let lastUpdateTime;
let dailyStatsChart;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    loadAnomalyTypes();
    loadStatistics();
    setupEventListeners();
    startRealtimeUpdates();
});

/**
 * Initialize the Leaflet map
 */
function initializeMap() {
    // Create map centered on Benton County, WA
    map = L.map('anomaly-map').setView([46.2325, -119.1637], 11);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Initialize marker clusters for each severity level
    severityGroups.forEach(severity => {
        markerClusters[severity] = L.markerClusterGroup({
            iconCreateFunction: function(cluster) {
                return createClusterIcon(cluster, severity);
            },
            disableClusteringAtZoom: 18,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false
        });
        map.addLayer(markerClusters[severity]);
    });

    // Add legend
    addMapLegend();

    // Initial data load
    loadAnomalies();
}

/**
 * Create a custom cluster icon for anomaly markers
 */
function createClusterIcon(cluster, severity) {
    const count = cluster.getChildCount();
    let size = 'small';
    
    if (count > 50) {
        size = 'large';
    } else if (count > 20) {
        size = 'medium';
    }
    
    return L.divIcon({
        html: `<div><span>${count}</span></div>`,
        className: `marker-cluster marker-cluster-${severity} marker-${size}`,
        iconSize: L.point(40, 40)
    });
}

/**
 * Add a legend to the map
 */
function addMapLegend() {
    const legend = L.control({position: 'bottomright'});
    
    legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'map-legend');
        div.innerHTML = `
            <h6>Anomaly Severity</h6>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #dc3545;"></div>
                <div class="legend-label">Critical</div>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #ffc107;"></div>
                <div class="legend-label">High</div>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #0dcaf0;"></div>
                <div class="legend-label">Medium</div>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #198754;"></div>
                <div class="legend-label">Low</div>
            </div>
        `;
        return div;
    };
    
    legend.addTo(map);
}

/**
 * Load anomaly data based on current filters
 */
function loadAnomalies() {
    // Show loading state
    document.getElementById('anomaly-map').classList.add('loading');
    
    // Get filter values
    const days = document.getElementById('timePeriod').value;
    
    // Get selected severity levels
    const selectedSeverities = [];
    severityGroups.forEach(severity => {
        const checkbox = document.getElementById(`${severity}Check`);
        if (checkbox && checkbox.checked) {
            selectedSeverities.push(severity);
        }
    });
    
    // Get selected anomaly types
    const selectedTypes = [];
    Object.keys(anomalyTypeFilters).forEach(type => {
        if (anomalyTypeFilters[type]) {
            selectedTypes.push(type);
        }
    });
    
    // Build API query parameters
    const params = new URLSearchParams({
        days: days,
        severity: selectedSeverities.join(','),
        type: selectedTypes.join(','),
        table: 'parcels',
        limit: 1000
    });
    
    // Fetch data from API
    fetch(`/api/anomalies/geospatial?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateMap(data.anomalies);
                document.getElementById('anomaly-map').classList.remove('loading');
            } else {
                console.error('Error loading anomalies:', data.message);
                document.getElementById('anomaly-map').classList.remove('loading');
            }
        })
        .catch(error => {
            console.error('Error fetching anomaly data:', error);
            document.getElementById('anomaly-map').classList.remove('loading');
        });
}

/**
 * Load available anomaly types for filters
 */
function loadAnomalyTypes() {
    // Get days filter
    const days = document.getElementById('timePeriod').value;
    
    // Fetch statistics to get anomaly types
    fetch(`/api/anomalies/stats?days=${days}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.stats && data.stats.by_type) {
                // Initialize filters with all types checked
                Object.keys(data.stats.by_type).forEach(type => {
                    anomalyTypeFilters[type] = true;
                });
                
                // Render filter checkboxes
                renderAnomalyTypeFilters(data.stats.by_type);
            }
        })
        .catch(error => {
            console.error('Error loading anomaly types:', error);
        });
}

/**
 * Render anomaly type filter checkboxes
 */
function renderAnomalyTypeFilters(typeStats) {
    const container = document.getElementById('anomalyTypeFilters');
    container.innerHTML = '';
    
    Object.keys(typeStats).forEach(type => {
        const count = typeStats[type];
        
        const div = document.createElement('div');
        div.className = 'form-check';
        
        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.type = 'checkbox';
        input.id = `${type}TypeCheck`;
        input.value = type;
        input.checked = anomalyTypeFilters[type];
        
        input.addEventListener('change', function() {
            anomalyTypeFilters[type] = this.checked;
        });
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = `${type}TypeCheck`;
        label.textContent = `${formatAnomalyTypeName(type)} (${count})`;
        
        div.appendChild(input);
        div.appendChild(label);
        container.appendChild(div);
    });
}

/**
 * Format anomaly type name for display
 */
function formatAnomalyTypeName(type) {
    // Convert snake_case or camelCase to Title Case with spaces
    return type
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^\w/, c => c.toUpperCase());
}

/**
 * Load statistics and render charts
 */
function loadStatistics() {
    // Get days filter
    const days = document.getElementById('timePeriod').value;
    
    // Fetch statistics
    fetch(`/api/anomalies/stats?days=${days}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                renderStatistics(data.stats);
            }
        })
        .catch(error => {
            console.error('Error loading statistics:', error);
        });
}

/**
 * Render statistics and charts
 */
function renderStatistics(stats) {
    const container = document.getElementById('statistics-panel');
    container.innerHTML = '';
    
    // Total count card
    const totalCard = document.createElement('div');
    totalCard.className = 'stat-card';
    totalCard.innerHTML = `
        <div class="d-flex justify-content-between">
            <div>
                <div class="stat-value">${stats.total_count || 0}</div>
                <div class="stat-label">Total Anomalies</div>
            </div>
            <div>
                <i class="bi bi-exclamation-triangle fs-3 text-secondary"></i>
            </div>
        </div>
    `;
    container.appendChild(totalCard);
    
    // Severity counts
    if (stats.by_severity) {
        const severityRow = document.createElement('div');
        severityRow.className = 'row g-2 mb-3';
        
        severityGroups.forEach(severity => {
            const count = stats.by_severity[severity] || 0;
            const severityCard = document.createElement('div');
            severityCard.className = 'col-6';
            severityCard.innerHTML = `
                <div class="stat-card stat-card-${severity}">
                    <div class="stat-value">${count}</div>
                    <div class="stat-label">${severity.charAt(0).toUpperCase() + severity.slice(1)}</div>
                </div>
            `;
            severityRow.appendChild(severityCard);
        });
        
        container.appendChild(severityRow);
    }
    
    // Daily trend chart
    if (stats.daily && stats.daily.length > 0) {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'stat-chart-container';
        chartContainer.innerHTML = '<canvas id="dailyTrendChart"></canvas>';
        container.appendChild(chartContainer);
        
        renderDailyTrendChart(stats.daily);
    }
}

/**
 * Render daily trend chart
 */
function renderDailyTrendChart(dailyData) {
    // Destroy previous chart if exists
    if (dailyStatsChart) {
        dailyStatsChart.destroy();
    }
    
    const ctx = document.getElementById('dailyTrendChart').getContext('2d');
    
    // Prepare chart data
    const labels = dailyData.map(item => {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    const counts = dailyData.map(item => item.count);
    
    // Create chart
    dailyStatsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Anomalies',
                data: counts,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.2)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

/**
 * Update the map with anomaly data
 */
function updateMap(anomalies) {
    // Clear existing markers
    clearAllMarkers();
    
    // Create marker for each anomaly
    anomalies.forEach(anomaly => {
        // Skip if no geometry
        if (!anomaly.geometry) {
            return;
        }
        
        // Create marker
        createAnomalyMarker(anomaly);
    });
}

/**
 * Clear all markers from the map
 */
function clearAllMarkers() {
    // Clear stored markers
    anomalyMarkers = {};
    
    // Clear marker clusters
    severityGroups.forEach(severity => {
        markerClusters[severity].clearLayers();
    });
}

/**
 * Create a marker for an anomaly
 */
function createAnomalyMarker(anomaly) {
    // Skip if already exists
    if (anomalyMarkers[anomaly.id]) {
        return;
    }
    
    // Default to medium if severity not set
    const severity = anomaly.severity || 'medium';
    
    // Convert GeoJSON to Leaflet
    let marker;
    
    try {
        // Different marker creation based on geometry type
        if (anomaly.geometry.type === 'Point') {
            // Create a point marker
            const coords = anomaly.geometry.coordinates;
            marker = L.marker([coords[1], coords[0]], {
                icon: createMarkerIcon(severity)
            });
        } else if (anomaly.geometry.type === 'Polygon') {
            // Create a polygon with styling based on severity
            const coords = anomaly.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
            marker = L.polygon(coords, {
                color: getSeverityColor(severity),
                fillColor: getSeverityColor(severity),
                fillOpacity: 0.3,
                weight: 2
            });
        } else if (anomaly.geometry.type === 'MultiPolygon') {
            // Create multi-polygon with styling
            const polygons = anomaly.geometry.coordinates.map(polygon => 
                polygon[0].map(coord => [coord[1], coord[0]])
            );
            marker = L.polygon(polygons, {
                color: getSeverityColor(severity),
                fillColor: getSeverityColor(severity),
                fillOpacity: 0.3,
                weight: 2
            });
        } else {
            // Default to center point if geometry type not supported
            console.warn('Unsupported geometry type:', anomaly.geometry.type);
            return;
        }
        
        // Add popup with anomaly information
        marker.bindPopup(createPopupContent(anomaly));
        
        // Add click handler to show details
        marker.on('click', function() {
            showAnomalyDetails(anomaly);
        });
        
        // Add to appropriate cluster group
        markerClusters[severity].addLayer(marker);
        
        // Store for later reference
        anomalyMarkers[anomaly.id] = {
            marker: marker,
            severity: severity,
            anomaly: anomaly
        };
    } catch (error) {
        console.error('Error creating marker for anomaly:', error, anomaly);
    }
}

/**
 * Create a marker icon based on severity
 */
function createMarkerIcon(severity) {
    return L.divIcon({
        html: `<i class="bi bi-exclamation-triangle-fill"></i>`,
        className: `anomaly-marker ${severity}`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

/**
 * Get color for severity level
 */
function getSeverityColor(severity) {
    switch (severity) {
        case 'critical':
            return '#dc3545';
        case 'high':
            return '#ffc107';
        case 'medium':
            return '#0dcaf0';
        case 'low':
            return '#198754';
        default:
            return '#6c757d';
    }
}

/**
 * Create popup content for an anomaly marker
 */
function createPopupContent(anomaly) {
    // Format address
    const address = anomaly.address || 'N/A';
    
    // Format parcel ID
    const parcelId = anomaly.parcel_id || 'N/A';
    
    // Format date
    let detectedDate = 'N/A';
    if (anomaly.detected_at) {
        const date = new Date(anomaly.detected_at);
        detectedDate = date.toLocaleString();
    }
    
    // Format anomaly type
    const anomalyType = formatAnomalyTypeName(anomaly.anomaly_type || 'unknown');
    
    // Create popup content
    return `
        <div class="anomaly-popup">
            <div class="anomaly-popup-header">${anomalyType} (${anomaly.severity || 'medium'})</div>
            <div class="anomaly-popup-item">
                <span class="anomaly-popup-label">Parcel ID:</span> ${parcelId}
            </div>
            <div class="anomaly-popup-item">
                <span class="anomaly-popup-label">Address:</span> ${address}
            </div>
            <div class="anomaly-popup-item">
                <span class="anomaly-popup-label">Detected:</span> ${detectedDate}
            </div>
            <div class="mt-2">
                <button class="btn btn-sm btn-primary btn-view-details" data-anomaly-id="${anomaly.id}">
                    View Details
                </button>
            </div>
        </div>
    `;
}

/**
 * Show anomaly details in the details panel
 */
function showAnomalyDetails(anomaly) {
    const detailsPanel = document.getElementById('anomaly-details');
    
    // Format date
    let detectedDate = 'N/A';
    if (anomaly.detected_at) {
        const date = new Date(anomaly.detected_at);
        detectedDate = date.toLocaleString();
    }
    
    // Format anomaly type
    const anomalyType = formatAnomalyTypeName(anomaly.anomaly_type || 'unknown');
    
    // Format score
    const score = anomaly.anomaly_score ? anomaly.anomaly_score.toFixed(2) : 'N/A';
    
    // Format property value
    const propertyValue = anomaly.total_value 
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(anomaly.total_value)
        : 'N/A';
    
    // Create details content
    detailsPanel.innerHTML = `
        <div class="anomaly-detail-header ${anomaly.severity || 'medium'}">
            <h5 class="mb-0">${anomalyType}</h5>
            <span class="badge bg-${getSeverityBadgeClass(anomaly.severity)}">${anomaly.severity || 'medium'}</span>
        </div>
        
        <div class="row mb-3">
            <div class="col-md-6">
                <div class="mb-2"><strong>Parcel ID:</strong> ${anomaly.parcel_id || 'N/A'}</div>
                <div class="mb-2"><strong>Address:</strong> ${anomaly.address || 'N/A'}</div>
                <div class="mb-2"><strong>Property Type:</strong> ${anomaly.property_type || 'N/A'}</div>
                <div class="mb-2"><strong>Property Value:</strong> ${propertyValue}</div>
            </div>
            <div class="col-md-6">
                <div class="mb-2"><strong>Anomaly ID:</strong> ${anomaly.id}</div>
                <div class="mb-2"><strong>Field:</strong> ${anomaly.field_name || 'Multiple'}</div>
                <div class="mb-2"><strong>Score:</strong> ${score}</div>
                <div class="mb-2"><strong>Detected:</strong> ${detectedDate}</div>
            </div>
        </div>
        
        <div class="mb-3">
            <h6>Anomaly Details</h6>
            <div class="p-2 bg-light rounded small">
                ${formatAnomalyDetails(anomaly)}
            </div>
        </div>
        
        <div class="d-flex justify-content-end">
            <button class="btn btn-sm btn-outline-primary me-2" onclick="markReviewed('${anomaly.id}')">
                Mark as Reviewed
            </button>
            <button class="btn btn-sm btn-primary" onclick="showResolutionForm('${anomaly.id}')">
                Resolve Anomaly
            </button>
        </div>
    `;
}

/**
 * Format anomaly details for display
 */
function formatAnomalyDetails(anomaly) {
    let detailsHTML = '';
    
    if (anomaly.anomaly_details) {
        let details;
        
        // Parse details if needed
        if (typeof anomaly.anomaly_details === 'string') {
            try {
                details = JSON.parse(anomaly.anomaly_details);
            } catch (e) {
                details = { message: anomaly.anomaly_details };
            }
        } else {
            details = anomaly.anomaly_details;
        }
        
        // Format details based on anomaly type
        if (anomaly.anomaly_type === 'statistical_outlier') {
            detailsHTML = formatStatisticalOutlier(details, anomaly);
        } else if (anomaly.anomaly_type === 'rule_violation') {
            detailsHTML = formatRuleViolation(details, anomaly);
        } else if (anomaly.anomaly_type === 'value_change') {
            detailsHTML = formatValueChange(details, anomaly);
        } else {
            // Generic details formatting
            detailsHTML = formatGenericDetails(details);
        }
    } else {
        detailsHTML = 'No detailed information available for this anomaly.';
    }
    
    return detailsHTML;
}

/**
 * Format statistical outlier details
 */
function formatStatisticalOutlier(details, anomaly) {
    let html = '<div>';
    
    if (details.value !== undefined && details.expected_range) {
        html += `<div><strong>Current Value:</strong> ${details.value}</div>`;
        html += `<div><strong>Expected Range:</strong> ${details.expected_range[0]} to ${details.expected_range[1]}</div>`;
    }
    
    if (details.z_score !== undefined) {
        html += `<div><strong>Z-Score:</strong> ${parseFloat(details.z_score).toFixed(2)}</div>`;
    }
    
    html += '</div>';
    return html;
}

/**
 * Format rule violation details
 */
function formatRuleViolation(details, anomaly) {
    let html = '<div>';
    
    if (details.rule_name) {
        html += `<div><strong>Rule:</strong> ${details.rule_name}</div>`;
    }
    
    if (details.rule_description) {
        html += `<div><strong>Description:</strong> ${details.rule_description}</div>`;
    }
    
    if (details.message) {
        html += `<div><strong>Message:</strong> ${details.message}</div>`;
    }
    
    html += '</div>';
    return html;
}

/**
 * Format value change details
 */
function formatValueChange(details, anomaly) {
    let html = '<div>';
    
    if (anomaly.current_value !== undefined && anomaly.previous_value !== undefined) {
        html += `<div><strong>Previous Value:</strong> ${anomaly.previous_value}</div>`;
        html += `<div><strong>Current Value:</strong> ${anomaly.current_value}</div>`;
        
        // Calculate percent change if numeric
        if (!isNaN(parseFloat(anomaly.current_value)) && !isNaN(parseFloat(anomaly.previous_value))) {
            const prevVal = parseFloat(anomaly.previous_value);
            const currVal = parseFloat(anomaly.current_value);
            
            if (prevVal !== 0) {
                const percentChange = ((currVal - prevVal) / Math.abs(prevVal)) * 100;
                html += `<div><strong>Change:</strong> ${percentChange.toFixed(2)}%</div>`;
            }
        }
    }
    
    if (details.threshold) {
        html += `<div><strong>Threshold:</strong> ${details.threshold}</div>`;
    }
    
    html += '</div>';
    return html;
}

/**
 * Format generic details
 */
function formatGenericDetails(details) {
    if (typeof details === 'string') {
        return details;
    }
    
    let html = '<div>';
    
    for (const key in details) {
        if (details.hasOwnProperty(key)) {
            const value = details[key];
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            if (typeof value === 'object' && value !== null) {
                html += `<div><strong>${formattedKey}:</strong> ${JSON.stringify(value)}</div>`;
            } else {
                html += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
            }
        }
    }
    
    html += '</div>';
    return html;
}

/**
 * Get appropriate Bootstrap badge class for severity
 */
function getSeverityBadgeClass(severity) {
    switch (severity) {
        case 'critical':
            return 'danger';
        case 'high':
            return 'warning';
        case 'medium':
            return 'info';
        case 'low':
            return 'success';
        default:
            return 'secondary';
    }
}

/**
 * Mark an anomaly as reviewed (placeholder)
 */
function markReviewed(anomalyId) {
    console.log(`Marking anomaly ${anomalyId} as reviewed`);
    alert('This functionality is not yet implemented.');
}

/**
 * Show resolution form for an anomaly (placeholder)
 */
function showResolutionForm(anomalyId) {
    console.log(`Showing resolution form for anomaly ${anomalyId}`);
    alert('This functionality is not yet implemented.');
}

/**
 * Setup event listeners for UI controls
 */
function setupEventListeners() {
    // Update button click
    document.getElementById('updateMapBtn').addEventListener('click', function() {
        loadAnomalies();
        loadStatistics();
    });
    
    // Time period change
    document.getElementById('timePeriod').addEventListener('change', function() {
        loadAnomalyTypes();
        loadStatistics();
    });
    
    // Real-time toggle
    document.getElementById('realtimeToggle').addEventListener('change', function() {
        if (this.checked) {
            startRealtimeUpdates();
        } else {
            stopRealtimeUpdates();
        }
    });
    
    // Add event delegation for view details buttons in popups
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('btn-view-details')) {
            const anomalyId = e.target.getAttribute('data-anomaly-id');
            const anomalyData = anomalyMarkers[anomalyId]?.anomaly;
            
            if (anomalyData) {
                showAnomalyDetails(anomalyData);
            }
        }
    });
}

/**
 * Start real-time updates
 */
function startRealtimeUpdates() {
    // Clear existing timer if any
    if (realtimeUpdateTimer) {
        clearInterval(realtimeUpdateTimer);
    }
    
    // Set initial last update time
    lastUpdateTime = new Date().toISOString();
    
    // Show active indicator
    updateRealtimeIndicator(true);
    
    // Set up timer for updates
    realtimeUpdateTimer = setInterval(fetchRealtimeUpdates, 30000); // 30 seconds
    
    // Do an initial update
    fetchRealtimeUpdates();
}

/**
 * Stop real-time updates
 */
function stopRealtimeUpdates() {
    if (realtimeUpdateTimer) {
        clearInterval(realtimeUpdateTimer);
        realtimeUpdateTimer = null;
    }
    
    updateRealtimeIndicator(false);
}

/**
 * Update the visual indicator for real-time updates
 */
function updateRealtimeIndicator(active) {
    const lastUpdateElement = document.getElementById('lastUpdateTime');
    
    if (active) {
        const updateTime = new Date().toLocaleTimeString();
        lastUpdateElement.innerHTML = `
            <span class="update-indicator active"></span>
            Last update: ${updateTime}
        `;
    } else {
        const updateTime = new Date().toLocaleTimeString();
        lastUpdateElement.innerHTML = `
            <span class="update-indicator inactive"></span>
            Updates paused at: ${updateTime}
        `;
    }
}

/**
 * Fetch real-time anomaly updates
 */
function fetchRealtimeUpdates() {
    // Skip if toggle is off
    if (!document.getElementById('realtimeToggle').checked) {
        return;
    }
    
    // Build API query parameters
    const params = new URLSearchParams({
        since: lastUpdateTime,
        limit: 50
    });
    
    // Fetch data from API
    fetch(`/api/anomalies/real-time?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Update last update time for next query
                lastUpdateTime = data.timestamp;
                
                // Update visual indicator
                updateRealtimeIndicator(true);
                
                // Process new anomalies if any
                if (data.anomalies && data.anomalies.length > 0) {
                    processNewAnomalies(data.anomalies);
                }
            }
        })
        .catch(error => {
            console.error('Error fetching real-time updates:', error);
        });
}

/**
 * Process newly detected anomalies
 */
function processNewAnomalies(anomalies) {
    // Get selected severity levels
    const selectedSeverities = [];
    severityGroups.forEach(severity => {
        const checkbox = document.getElementById(`${severity}Check`);
        if (checkbox && checkbox.checked) {
            selectedSeverities.push(severity);
        }
    });
    
    // Filter anomalies by selected severities
    const filteredAnomalies = anomalies.filter(anomaly => 
        selectedSeverities.includes(anomaly.severity) && 
        anomaly.geometry // Must have geometry data
    );
    
    // Add new anomalies to map
    filteredAnomalies.forEach(anomaly => {
        // Skip if already on map
        if (anomalyMarkers[anomaly.id]) {
            return;
        }
        
        // Create marker
        createAnomalyMarker(anomaly);
    });
    
    // Show notification if new anomalies were added
    if (filteredAnomalies.length > 0) {
        showNewAnomaliesNotification(filteredAnomalies.length);
        
        // Refresh statistics
        loadStatistics();
    }
}

/**
 * Show notification for new anomalies
 */
function showNewAnomaliesNotification(count) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('anomalyNotification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'anomalyNotification';
        notification.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(notification);
    }
    
    // Create toast
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';
    toast.id = toastId;
    
    toast.innerHTML = `
        <div class="toast-header bg-primary text-white">
            <i class="bi bi-bell me-2"></i>
            <strong class="me-auto">New Anomalies Detected</strong>
            <small>${new Date().toLocaleTimeString()}</small>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${count} new anomalies have been detected and added to the map.
        </div>
    `;
    
    // Add to container
    notification.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        const oldToast = document.getElementById(toastId);
        if (oldToast) {
            oldToast.className = 'toast fade';
            setTimeout(() => oldToast.remove(), 500);
        }
    }, 5000);
    
    // Add close button handler
    const closeBtn = toast.querySelector('.btn-close');
    closeBtn.addEventListener('click', function() {
        toast.className = 'toast fade';
        setTimeout(() => toast.remove(), 500);
    });
}