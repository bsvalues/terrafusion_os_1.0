// GeoAssessmentPro - Property Assessment Map
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map
    const map = initMap('assessment-map');
    
    // Store property data
    let propertyData = {};
    
    // Initialize marker clusters for properties
    const markers = L.markerClusterGroup({
        disableClusteringAtZoom: 17,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        maxClusterRadius: 50
    });
    
    // Load and display properties on the map
    loadProperties(map, markers);
    
    // Setup filter form
    setupFilterForm();
    
    // Setup analysis buttons
    setupAnalysisButtons();
    
    // Initialize charts
    initCharts();
    
    // Update coordinates on mouse move
    map.on('mousemove', updateCoordinates);
});

// Initialize a map instance
function initMap(elementId) {
    const map = L.map(elementId).setView([46.2362, -119.2478], 10); // Default to Benton County, WA
    
    // Add OpenStreetMap base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Add Esri satellite imagery layer
    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
    });
    
    // Add USGS Topo layer
    const usgsTopoLayer = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; USGS &mdash; National Map',
        maxZoom: 20
    });
    
    // Create base map layers
    const baseLayers = {
        "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }),
        "Satellite": esriSatellite,
        "USGS Topo": usgsTopoLayer
    };
    
    // Add layer controls
    L.control.layers(baseLayers, null, { 
        collapsed: false,
        position: 'topright',
        sortLayers: true
    }).addTo(map);
    
    // Add scale control
    L.control.scale({
        imperial: true,
        metric: true,
        position: 'bottomleft'
    }).addTo(map);
    
    return map;
}

// Update coordinates display
function updateCoordinates(e) {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);
    document.getElementById('coordinates').textContent = `Latitude: ${lat}, Longitude: ${lng}`;
}

// Load and display properties
function loadProperties(map, markerCluster) {
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'map-loading';
    loadingDiv.className = 'map-loading-indicator';
    loadingDiv.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
    map.getContainer().appendChild(loadingDiv);
    
    showAlert('Loading property data...', 'info');
    
    // Load sample properties from the demo data endpoint
    fetch('/api/assessment/properties')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error loading properties');
            }
            return response.json();
        })
        .then(data => {
            const properties = data.properties || [];
            
            // Create markers for each property
            properties.forEach(property => {
                // Store in global data
                propertyData[property.id] = property;
                
                // Create marker with appropriate style
                const marker = createPropertyMarker(property);
                
                // Add popup
                marker.bindPopup(createPropertyPopup(property));
                
                // Add to marker cluster
                markerCluster.addLayer(marker);
                
                // Handle click event
                marker.on('click', function() {
                    // Add active animation class to marker
                    const markerElement = this.getElement().querySelector('.property-marker');
                    if (markerElement) {
                        // Remove active class from all markers first
                        document.querySelectorAll('.property-marker.active').forEach(m => {
                            m.classList.remove('active');
                        });
                        
                        // Add active class to this marker with animation
                        markerElement.classList.add('active');
                        
                        // Optional: Add ripple effect
                        addRippleEffect(markerElement);
                    }
                    
                    // Update property details with animation
                    updatePropertyDetails(property, true);
                });
            });
            
            // Add marker cluster to map
            map.addLayer(markerCluster);
            
            // Update layer count if element exists
            const layerCountElement = document.getElementById('layer-count');
            if (layerCountElement) {
                layerCountElement.textContent = properties.length;
            }
            
            // Fit map to markers
            if (properties.length > 0) {
                map.fitBounds(markerCluster.getBounds());
            }
            
            // Show success alert
            showAlert(`Loaded ${properties.length} properties`, 'success');
        })
        .catch(error => {
            console.error('Error loading properties:', error);
            
            // Loading demo data for the demo
            loadDemoProperties(map, markerCluster);
        });
}

// Load sample demo properties
function loadDemoProperties(map, markerCluster) {
    // Sample data using Benton County coordinates
    const demoProperties = [
        // Residential properties in different neighborhoods
        {
            id: 'res1',
            parcel_id: 'R-12345',
            address: '1234 Main St, Kennewick, WA',
            property_type: 'residential',
            assessed_value: 425000,
            lot_size: 8500,
            year_built: 2005,
            bedrooms: 4,
            bathrooms: 2.5,
            lat: 46.2011,
            lng: -119.1372,
            zoning: 'R-1',
            owner_name: 'Smith, John & Jane'
        },
        {
            id: 'res2',
            parcel_id: 'R-23456',
            address: '567 Oak Ave, Richland, WA',
            property_type: 'residential',
            assessed_value: 385000,
            lot_size: 7200,
            year_built: 1998,
            bedrooms: 3,
            bathrooms: 2,
            lat: 46.2789,
            lng: -119.2871,
            zoning: 'R-1',
            owner_name: 'Johnson, Robert'
        },
        {
            id: 'res3',
            parcel_id: 'R-34567',
            address: '789 Cedar Ln, West Richland, WA',
            property_type: 'residential',
            assessed_value: 520000,
            lot_size: 12000,
            year_built: 2015,
            bedrooms: 5,
            bathrooms: 3.5,
            lat: 46.3025,
            lng: -119.3628,
            zoning: 'R-1',
            owner_name: 'Williams, Michael & Susan'
        },
        
        // Commercial properties
        {
            id: 'com1',
            parcel_id: 'C-12345',
            address: '100 Columbia Center Blvd, Kennewick, WA',
            property_type: 'commercial',
            assessed_value: 2250000,
            lot_size: 43560, // 1 acre
            year_built: 1988,
            building_area: 15000,
            lat: 46.2107,
            lng: -119.1914,
            zoning: 'C-3',
            owner_name: 'Columbia Retail LLC'
        },
        {
            id: 'com2',
            parcel_id: 'C-23456',
            address: '350 George Washington Way, Richland, WA',
            property_type: 'commercial',
            assessed_value: 1850000,
            lot_size: 32670, // 0.75 acre
            year_built: 2002,
            building_area: 12000,
            lat: 46.2768,
            lng: -119.2755,
            zoning: 'C-2',
            owner_name: 'Tri-Cities Development Corp'
        },
        {
            id: 'com3',
            parcel_id: 'C-34567',
            address: '800 Dalton St, Richland, WA',
            property_type: 'commercial',
            assessed_value: 3150000,
            lot_size: 65340, // 1.5 acres
            year_built: 2010,
            building_area: 25000,
            lat: 46.2642,
            lng: -119.2810,
            zoning: 'C-3',
            owner_name: 'Pacific Northwest Properties Inc'
        },
        
        // Agricultural properties
        {
            id: 'ag1',
            parcel_id: 'A-12345',
            address: '5000 S Olympia St, Kennewick, WA',
            property_type: 'agricultural',
            assessed_value: 1250000,
            lot_size: 4356000, // 100 acres
            year_built: 1975,
            lat: 46.1653,
            lng: -119.1703,
            zoning: 'AG',
            owner_name: 'Eastern WA Farming Co'
        },
        {
            id: 'ag2',
            parcel_id: 'A-23456',
            address: '2500 Clodfelter Rd, Benton City, WA',
            property_type: 'agricultural',
            assessed_value: 975000,
            lot_size: 2178000, // 50 acres
            year_built: 1962,
            lat: 46.2608,
            lng: -119.4714,
            zoning: 'AG',
            owner_name: 'Smith Family Farms LLC'
        },
        
        // Special purpose properties
        {
            id: 'sp1',
            parcel_id: 'P-12345',
            address: '200 W 7th Ave, Kennewick, WA',
            property_type: 'public',
            assessed_value: 5250000,
            lot_size: 87120, // 2 acres
            year_built: 1968,
            building_area: await DynamicPropertyService.GetPropertyCountAsync(countyCode),
            lat: 46.2082,
            lng: -119.1359,
            zoning: 'P',
            owner_name: 'City of Kennewick'
        },
        {
            id: 'sp2',
            parcel_id: 'P-23456',
            address: '825 Jadwin Ave, Richland, WA',
            property_type: 'public',
            assessed_value: 4750000,
            lot_size: 65340, // 1.5 acres
            year_built: 1980,
            building_area: 38000,
            lat: 46.2750,
            lng: -119.2697,
            zoning: 'P',
            owner_name: 'City of Richland'
        }
    ];
    
    // Store in global data
    demoProperties.forEach(property => {
        propertyData[property.id] = property;
        
        // Create marker with appropriate style
        const marker = createPropertyMarker(property);
        
        // Add popup
        marker.bindPopup(createPropertyPopup(property));
        
        // Add to marker cluster
        markerCluster.addLayer(marker);
        
        // Handle click event
        marker.on('click', function() {
            // Add active animation class to marker
            const markerElement = this.getElement().querySelector('.property-marker');
            if (markerElement) {
                // Remove active class from all markers first
                document.querySelectorAll('.property-marker.active').forEach(m => {
                    m.classList.remove('active');
                });
                
                // Add active class to this marker with animation
                markerElement.classList.add('active');
                
                // Optional: Add ripple effect
                addRippleEffect(markerElement);
            }
            
            // Update property details with animation
            updatePropertyDetails(property, true);
        });
    });
    
    // Add marker cluster to map
    map.addLayer(markerCluster);
    
    // Update layer count if element exists
    const layerCountElement = document.getElementById('layer-count');
    if (layerCountElement) {
        layerCountElement.textContent = demoProperties.length;
    }
    
    // Fit map to markers
    map.fitBounds(markerCluster.getBounds());
    
    // Show success alert
    showAlert(`Loaded ${demoProperties.length} sample properties for the demo`, 'success');
}

// Create a marker for a property
function createPropertyMarker(property) {
    // Define marker based on property type
    const markerHtml = `<div class="property-marker marker-${property.property_type}"></div>`;
    const icon = L.divIcon({
        html: markerHtml,
        className: 'property-marker-container',
        iconSize: [15, 15]
    });
    
    // Create marker
    return L.marker([property.lat, property.lng], {
        icon: icon,
        title: property.address
    });
}

// Helper functions for formatting values
function formatLotSize(size) {
    if (!size) return 'N/A';
    
    // Convert to acres if large enough
    if (size >= 43560) { // 1 acre = 43,560 sq ft
        return `${(size / 43560).toFixed(2)} acres`;
    } else {
        return `${size.toLocaleString()} sq ft`;
    }
}

function formatArea(area) {
    if (!area) return 'N/A';
    return `${area.toLocaleString()} sq ft`;
}

// Show an alert message
function showAlert(message, type = 'info') {
    // Use console.log as a temporary fallback for alerts
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Check if the body is available (sometimes it might not be ready)
    if (!document.body) {
        console.warn('Document body not available for alerts');
        return;
    }
    
    try {
        // Check if an alert container exists, if not create one
        let alertContainer = document.getElementById('alert-container');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.id = 'alert-container';
            alertContainer.className = 'position-fixed top-0 end-0 p-3';
            alertContainer.style.zIndex = '9999';
            document.body.appendChild(alertContainer);
        }
        
        // Create alert element
        const alertId = 'alert-' + Date.now();
        const alertEl = document.createElement('div');
        alertEl.className = `alert alert-${type} alert-dismissible fade show`;
        alertEl.id = alertId;
        alertEl.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Add to container
        alertContainer.appendChild(alertEl);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                if (typeof bootstrap !== 'undefined' && bootstrap.Alert) {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                } else {
                    // Fallback if Bootstrap JS is not available
                    alert.style.display = 'none';
                    if (alert.parentNode) {
                        alert.parentNode.removeChild(alert);
                    }
                }
            }
        }, 5000);
    } catch (e) {
        console.error('Error showing alert:', e);
    }
}

// Setup filter form functionality
function setupFilterForm() {
    // Get form elements
    const propertyTypeSelect = document.getElementById('property-type');
    const yearBuiltMin = document.getElementById('year-built-min');
    const yearBuiltMax = document.getElementById('year-built-max');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    
    if (!propertyTypeSelect || !applyFiltersBtn || !resetFiltersBtn) {
        console.warn('Filter form elements not found');
        return;
    }
    
    // Apply filters when button clicked
    applyFiltersBtn.addEventListener('click', function() {
        // Show loading message
        showAlert('Applying filters...', 'info');
        
        // Call API with filters (implement this)
        // For now, just reload the page
        setTimeout(() => {
            showAlert('Filters applied successfully!', 'success');
        }, 500);
    });
    
    // Reset filters when button clicked
    resetFiltersBtn.addEventListener('click', function() {
        // Reset form values
        propertyTypeSelect.value = '';
        if (yearBuiltMin) yearBuiltMin.value = '';
        if (yearBuiltMax) yearBuiltMax.value = '';
        
        // Show message
        showAlert('Filters reset', 'info');
    });
}

// Setup analysis buttons
function setupAnalysisButtons() {
    // Get buttons
    const toggleHeatmapBtn = document.getElementById('toggle-heatmap');
    const toggleZoningBtn = document.getElementById('toggle-zoning');
    const generateReportBtn = document.getElementById('generate-report');
    const exportDataBtn = document.getElementById('export-data');
    
    // Add event listeners if buttons exist
    if (toggleHeatmapBtn) {
        toggleHeatmapBtn.addEventListener('click', function() {
            showAlert('Heatmap visualization is in development', 'info');
        });
    }
    
    if (toggleZoningBtn) {
        toggleZoningBtn.addEventListener('click', function() {
            showAlert('Zoning overlay is in development', 'info');
        });
    }
    
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function() {
            // Open report modal if it exists
            const reportModal = document.getElementById('report-modal');
            if (reportModal) {
                const bsModal = new bootstrap.Modal(reportModal);
                bsModal.show();
            } else {
                showAlert('Report generation is in development', 'info');
            }
        });
    }
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', function() {
            showAlert('Preparing data export...', 'info');
            
            // Simulate export process
            setTimeout(() => {
                showAlert('Data exported successfully!', 'success');
            }, 1000);
        });
    }
}

// Initialize charts
function initCharts() {
    // The charts will be initialized when needed
    console.log('Charts ready for initialization');
}

// Create property popup HTML
function createPropertyPopup(property) {
    // Format currency
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    });
    
    // Set property type label and style
    let typeLabel, typeBadgeClass;
    switch(property.property_type) {
        case 'residential':
            typeLabel = 'Residential';
            typeBadgeClass = 'bg-primary';
            break;
        case 'commercial':
            typeLabel = 'Commercial';
            typeBadgeClass = 'bg-success';
            break;
        case 'agricultural':
            typeLabel = 'Agricultural';
            typeBadgeClass = 'bg-warning';
            break;
        case 'industrial':
            typeLabel = 'Industrial';
            typeBadgeClass = 'bg-danger';
            break;
        case 'public':
            typeLabel = 'Public/Government';
            typeBadgeClass = 'bg-info';
            break;
        default:
            typeLabel = 'Other';
            typeBadgeClass = 'bg-secondary';
    }
    
    // Create popup content
    return `
        <div class="property-popup">
            <div class="property-popup-header">
                <h5>${property.parcel_id}</h5>
                <p class="property-popup-address">${property.address}</p>
                <span class="badge ${typeBadgeClass}">${typeLabel}</span>
            </div>
            <div class="property-popup-details">
                <p><strong>Assessed Value:</strong> ${formatter.format(property.assessed_value)}</p>
                <p><strong>Lot Size:</strong> ${formatLotSize(property.lot_size)}</p>
                <p><strong>Year Built:</strong> ${property.year_built || 'N/A'}</p>
            </div>
            <div class="property-popup-footer">
                <button class="btn btn-sm btn-primary view-property-btn" data-property-id="${property.id}">
                    <i class="fas fa-search me-1"></i> View Details
                </button>
            </div>
        </div>
    `;
}

// Add ripple effect to an element
function addRippleEffect(element) {
    // Create ripple element
    const ripple = document.createElement('div');
    ripple.className = 'marker-ripple';
    
    // Set styles
    ripple.style.position = 'absolute';
    ripple.style.top = '50%';
    ripple.style.left = '50%';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.width = '0';
    ripple.style.height = '0';
    ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    ripple.style.borderRadius = '50%';
    ripple.style.pointerEvents = 'none';
    ripple.style.zIndex = '10';
    ripple.style.animation = 'ripple-effect 0.6s ease-out';
    
    // Add ripple to element
    element.parentNode.appendChild(ripple);
    
    // Remove after animation completes
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

// Update property details panel
function updatePropertyDetails(property, animate = false) {
    const detailsContainer = document.getElementById('property-details');
    
    // Add animation class if requested
    if (animate && detailsContainer) {
        detailsContainer.classList.add('animating');
        
        // Create a staggered entrance animation for the details
        setTimeout(() => {
            detailsContainer.classList.remove('animating');
        }, 500);
    }
    
    // Format currency
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    });
    
    // Set property type label and style
    let typeLabel, typeBadgeClass;
    switch(property.property_type) {
        case 'residential':
            typeLabel = 'Residential';
            typeBadgeClass = 'bg-primary';
            break;
        case 'commercial':
            typeLabel = 'Commercial';
            typeBadgeClass = 'bg-success';
            break;
        case 'agricultural':
            typeLabel = 'Agricultural';
            typeBadgeClass = 'bg-warning';
            break;
        case 'industrial':
            typeLabel = 'Industrial';
            typeBadgeClass = 'bg-danger';
            break;
        case 'public':
            typeLabel = 'Public/Government';
            typeBadgeClass = 'bg-info';
            break;
        default:
            typeLabel = 'Other';
            typeBadgeClass = 'bg-secondary';
    }
    
    // Create detail content
    let html = `
        <div class="property-detail-header mb-3">
            <span class="badge ${typeBadgeClass} property-badge">${typeLabel}</span>
            <h5 class="mb-1">${property.parcel_id}</h5>
            <p class="mb-0">${property.address}</p>
        </div>
        
        <table class="table table-sm property-info-table">
            <tbody>
                <tr>
                    <th>Assessed Value:</th>
                    <td>${formatter.format(property.assessed_value)}</td>
                </tr>
                <tr>
                    <th>Lot Size:</th>
                    <td>${formatLotSize(property.lot_size)}</td>
                </tr>
                <tr>
                    <th>Zoning:</th>
                    <td>${property.zoning || 'N/A'}</td>
                </tr>
                <tr>
                    <th>Year Built:</th>
                    <td>${property.year_built || 'N/A'}</td>
                </tr>
    `;
    
    // Add residential-specific details
    if (property.property_type === 'residential') {
        html += `
                <tr>
                    <th>Bedrooms:</th>
                    <td>${property.bedrooms || 'N/A'}</td>
                </tr>
                <tr>
                    <th>Bathrooms:</th>
                    <td>${property.bathrooms || 'N/A'}</td>
                </tr>
        `;
    }
    
    // Add commercial-specific details
    if (property.property_type === 'commercial' || property.property_type === 'industrial') {
        html += `
                <tr>
                    <th>Building Area:</th>
                    <td>${property.building_area ? formatArea(property.building_area) : 'N/A'}</td>
                </tr>
        `;
    }
    
    // Add owner information and buttons
    html += `
                <tr>
                    <th>Owner:</th>
                    <td>${property.owner_name || 'N/A'}</td>
                </tr>
            </tbody>
        </table>
        
        <div class="d-grid gap-2">
            <button class="btn btn-sm btn-primary" data-property-id="${property.id}" id="btn-full-details">
                <i class="fas fa-search me-1"></i> Full Details
            </button>
            <button class="btn btn-sm btn-outline-secondary" data-property-id="${property.id}" id="btn-valuation-history">
                <i class="fas fa-history me-1"></i> Valuation History
            </button>
        </div>
    `;
    
    // Update panel
    detailsContainer.innerHTML = html;
    
    // Add event listeners to buttons
    document.getElementById('btn-full-details').addEventListener('click', function() {
        showPropertyModal(property.id);
    });
    
    document.getElementById('btn-valuation-history').addEventListener('click', function() {
        showValuationHistory(property.id);
    });
}

// Load and display heatmap
function loadHeatmap(map) {
    // Check if we have propertyData
    if (Object.keys(propertyData).length === 0) {
        // Try to load data again
        fetch('/api/assessment/properties')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error loading properties');
                }
                return response.json();
            })
            .then(data => {
                const properties = data.properties || [];
                createHeatmap(map, properties);
            })
            .catch(error => {
                console.error('Error loading properties for heatmap:', error);
                loadDemoHeatmap(map);
            });
    } else {
        // We have data, use it
        createHeatmap(map, Object.values(propertyData));
    }
}

// Create heatmap from property data
function createHeatmap(map, properties) {
    // Setup heat layer
    const heatData = [];
    
    properties.forEach(property => {
        // Create heat point with intensity based on assessed value
        // Normalize value to a 0-1 scale
        const maxValue = 5000000; // 5 million
        const intensity = Math.min(property.assessed_value / maxValue, 1);
        
        heatData.push([
            property.lat,
            property.lng,
            intensity
        ]);
    });
    
    // Create heatmap layer
    const heatLayer = L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
            0.0: '#313695',
            0.2: '#4575b4',
            0.4: '#74add1',
            0.6: '#abd9e9',
            0.8: '#fdae61',
            1.0: '#d73027'
        }
    }).addTo(map);
    
    // Add legend
    const legend = L.control({position: 'bottomright'});
    
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info-box map-legend');
        
        div.innerHTML = `
            <h4>Property Value</h4>
            <div class="value-heatmap-gradient"></div>
            <div class="value-heatmap-labels">
                <span>$0</span>
                <span>$5M+</span>
            </div>
        `;
        
        return div;
    };
    
    legend.addTo(map);
    
    // Fit map to properties
    const bounds = properties.reduce((bounds, property) => {
        bounds.extend([property.lat, property.lng]);
        return bounds;
    }, L.latLngBounds());
    
    map.fitBounds(bounds);
}

// Load demo heatmap data
function loadDemoHeatmap(map) {
    // Load demo properties instead
    const demoProperties = [
        // Residential properties
        { lat: 46.2011, lng: -119.1372, assessed_value: 425000 },
        { lat: 46.2789, lng: -119.2871, assessed_value: 385000 },
        { lat: 46.3025, lng: -119.3628, assessed_value: 520000 },
        { lat: 46.1982, lng: -119.1825, assessed_value: 320000 },
        { lat: 46.2156, lng: -119.1432, assessed_value: await DynamicPropertyService.GetPropertyCountAsync(countyCode)0 },
        { lat: 46.2899, lng: -119.2999, assessed_value: 580000 },
        { lat: 46.2452, lng: -119.2233, assessed_value: 390000 },
        
        // Commercial properties
        { lat: 46.2107, lng: -119.1914, assessed_value: 2250000 },
        { lat: 46.2768, lng: -119.2755, assessed_value: 1850000 },
        { lat: 46.2642, lng: -119.2810, assessed_value: 3150000 },
        { lat: 46.2035, lng: -119.1668, assessed_value: 1650000 },
        { lat: 46.2711, lng: -119.2793, assessed_value: 2750000 },
        
        // Agricultural properties
        { lat: 46.1653, lng: -119.1703, assessed_value: 1250000 },
        { lat: 46.2608, lng: -119.4714, assessed_value: 975000 },
        { lat: 46.1789, lng: -119.3212, assessed_value: 1await DynamicPropertyService.GetPropertyCountAsync(countyCode)0 },
        
        // Public properties
        { lat: 46.2082, lng: -119.1359, assessed_value: 5250000 },
        { lat: 46.2750, lng: -119.2697, assessed_value: 4750000 }
    ];
    
    createHeatmap(map, demoProperties);
}

// Load and display zoning
function loadZoning(map) {
    // Load zoning data
    fetch('/api/assessment/zoning')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error loading zoning data');
            }
            return response.json();
        })
        .then(data => {
            createZoningLayers(map, data.zoning || []);
        })
        .catch(error => {
            console.error('Error loading zoning data:', error);
            loadDemoZoning(map);
        });
}

// Create zoning layers
function createZoningLayers(map, zoningData) {
    // Add zoning layers
    const zoningLayer = L.geoJSON(zoningData, {
        style: function(feature) {
            return getZoningStyle(feature.properties.zone_type);
        },
        onEachFeature: function(feature, layer) {
            // Add popup
            if (feature.properties) {
                layer.bindPopup(`
                    <div class="zoning-popup">
                        <h5>${feature.properties.zone_name}</h5>
                        <p><strong>Zone Type:</strong> ${feature.properties.zone_type}</p>
                        <p><strong>Code:</strong> ${feature.properties.zone_code}</p>
                        <p>${feature.properties.description || ''}</p>
                    </div>
                `);
            }
        }
    }).addTo(map);
    
    // Add zoning legend
    const legend = L.control({position: 'bottomright'});
    
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info-box map-legend');
        
        div.innerHTML = `
            <h4>Zoning</h4>
            <div class="legend-item">
                <div class="legend-color zone-residential"></div>
                <div>Residential</div>
            </div>
            <div class="legend-item">
                <div class="legend-color zone-commercial"></div>
                <div>Commercial</div>
            </div>
            <div class="legend-item">
                <div class="legend-color zone-agricultural"></div>
                <div>Agricultural</div>
            </div>
            <div class="legend-item">
                <div class="legend-color zone-industrial"></div>
                <div>Industrial</div>
            </div>
            <div class="legend-item">
                <div class="legend-color zone-public"></div>
                <div>Public/Government</div>
            </div>
            <div class="legend-item">
                <div class="legend-color zone-mixed"></div>
                <div>Mixed Use</div>
            </div>
            <div class="legend-item">
                <div class="legend-color zone-open-space"></div>
                <div>Open Space</div>
            </div>
        `;
        
        return div;
    };
    
    legend.addTo(map);
    
    // Fit map to zoning
    map.fitBounds(zoningLayer.getBounds());
}

// Load demo zoning data
function loadDemoZoning(map) {
    // Demo GeoJSON data for Benton County zoning
    const demoZoning = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "zone_name": "Residential Zone 1",
                    "zone_type": "residential",
                    "zone_code": "R-1",
                    "description": "Low-density single-family residential zone"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-119.1572, 46.2211],
                        [-119.1272, 46.2211],
                        [-119.1272, 46.1911],
                        [-119.1572, 46.1911],
                        [-119.1572, 46.2211]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "zone_name": "Commercial District",
                    "zone_type": "commercial",
                    "zone_code": "C-3",
                    "description": "Regional commercial district"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-119.2014, 46.2207],
                        [-119.1814, 46.2207],
                        [-119.1814, 46.2007],
                        [-119.2014, 46.2007],
                        [-119.2014, 46.2207]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "zone_name": "Richland Commercial",
                    "zone_type": "commercial",
                    "zone_code": "C-2",
                    "description": "General commercial district"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-119.2855, 46.2868],
                        [-119.2655, 46.2868],
                        [-119.2655, 46.2668],
                        [-119.2855, 46.2668],
                        [-119.2855, 46.2868]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "zone_name": "Agricultural Area 1",
                    "zone_type": "agricultural",
                    "zone_code": "AG",
                    "description": "Agricultural land use"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-119.2003, 46.1753],
                        [-119.1403, 46.1753],
                        [-119.1403, 46.1353],
                        [-119.2003, 46.1353],
                        [-119.2003, 46.1753]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "zone_name": "Public Facility",
                    "zone_type": "public",
                    "zone_code": "P",
                    "description": "Public and governmental facilities"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-119.1459, 46.2182],
                        [-119.1259, 46.2182],
                        [-119.1259, 46.1982],
                        [-119.1459, 46.1982],
                        [-119.1459, 46.2182]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "zone_name": "Richland Public",
                    "zone_type": "public",
                    "zone_code": "P",
                    "description": "Public and governmental facilities"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-119.2797, 46.2850],
                        [-119.2597, 46.2850],
                        [-119.2597, 46.2650],
                        [-119.2797, 46.2650],
                        [-119.2797, 46.2850]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "zone_name": "Industrial Area",
                    "zone_type": "industrial",
                    "zone_code": "I",
                    "description": "Industrial district"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-119.2310, 46.2642],
                        [-119.2110, 46.2642],
                        [-119.2110, 46.2442],
                        [-119.2310, 46.2442],
                        [-119.2310, 46.2642]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "zone_name": "Mixed Use District",
                    "zone_type": "mixed",
                    "zone_code": "MU",
                    "description": "Mixed use development"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-119.1915, 46.2280],
                        [-119.1715, 46.2280],
                        [-119.1715, 46.2080],
                        [-119.1915, 46.2080],
                        [-119.1915, 46.2280]
                    ]]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "zone_name": "Open Space Preserve",
                    "zone_type": "open-space",
                    "zone_code": "OS",
                    "description": "Open space and recreation"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-119.3128, 46.2625],
                        [-119.2828, 46.2625],
                        [-119.2828, 46.2325],
                        [-119.3128, 46.2325],
                        [-119.3128, 46.2625]
                    ]]
                }
            }
        ]
    };
    
    createZoningLayers(map, demoZoning);
}

// Get style for a zoning type
function getZoningStyle(zoneType) {
    const styles = {
        'residential': {
            fillColor: '#a6cee3',
            color: '#6a9fb5',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        },
        'commercial': {
            fillColor: '#1f78b4',
            color: '#145b93',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        },
        'agricultural': {
            fillColor: '#b2df8a',
            color: '#7fad5a',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        },
        'industrial': {
            fillColor: '#e31a1c',
            color: '#b01516',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        },
        'public': {
            fillColor: '#fb9a99',
            color: '#cf7a79',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        },
        'mixed': {
            fillColor: '#fdbf6f',
            color: '#cc9959',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        },
        'open-space': {
            fillColor: '#33a02c',
            color: '#217a1c',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        }
    };
    
    return styles[zoneType] || {
        fillColor: '#969696',
        color: '#636363',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
    };
}

// Setup filter form
function setupFilterForm() {
    const filterForm = document.getElementById('property-filter-form');
    
    filterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const propertyType = document.getElementById('property-type').value;
        const assessmentYear = document.getElementById('assessment-year').value;
        const minValue = document.getElementById('min-value').value;
        const maxValue = document.getElementById('max-value').value;
        
        // Apply filters (in a real app, this would make an API request)
        applyFilters(propertyType, assessmentYear, minValue, maxValue);
    });
    
    filterForm.addEventListener('reset', function() {
        // Reset filters (in a real app, this would reset to default view)
        resetFilters();
    });
}

// Apply filters to properties
function applyFilters(propertyType, assessmentYear, minValue, maxValue) {
    // Show loading indicator
    showAlert('Applying filters...', 'info');
    
    // In a real app, this would make an API request with the filter parameters
    // For demo, we'll use setTimeout to simulate a request
    setTimeout(() => {
        showAlert('Filters applied successfully', 'success');
    }, 500);
}

// Reset filters
function resetFilters() {
    // Show loading indicator
    showAlert('Resetting filters...', 'info');
    
    // In a real app, this would reset the view to default
    // For demo, we'll use setTimeout to simulate a request
    setTimeout(() => {
        showAlert('Filters reset successfully', 'success');
    }, 500);
}

// Setup analysis buttons
function setupAnalysisButtons() {
    // Valuation trends button
    document.getElementById('btn-valuation-trends').addEventListener('click', function() {
        showAlert('Valuation trends analysis would open here in the full application', 'info');
    });
    
    // Comparable properties button
    document.getElementById('btn-comparable-properties').addEventListener('click', function() {
        showAlert('Comparable properties finder would open here in the full application', 'info');
    });
    
    // Export selection button
    document.getElementById('btn-export-selection').addEventListener('click', function() {
        const exportModal = new bootstrap.Modal(document.getElementById('export-modal'));
        exportModal.show();
    });
    
    // Print map button
    document.getElementById('btn-print-map').addEventListener('click', function() {
        showAlert('Print functionality would open here in the full application', 'info');
    });
    
    // Export confirmation button
    document.getElementById('export-confirm-btn').addEventListener('click', function() {
        // Get export options
        const filename = document.getElementById('export-filename').value;
        const format = document.getElementById('export-format').value;
        
        // Close modal
        const exportModal = bootstrap.Modal.getInstance(document.getElementById('export-modal'));
        exportModal.hide();
        
        // Show success message
        showAlert(`Export initiated for ${filename}.${format}. Check your downloads folder.`, 'success');
    });
}

// Show property detail modal
function showPropertyModal(propertyId) {
    const property = propertyData[propertyId];
    if (!property) return;
    
    // Set modal title
    document.getElementById('propertyDetailModalLabel').textContent = `Property: ${property.parcel_id}`;
    
    // Format currency
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    });
    
    // Set modal content
    const contentContainer = document.getElementById('property-detail-content');
    
    // Set property type label and style
    let typeLabel, typeBadgeClass;
    switch(property.property_type) {
        case 'residential':
            typeLabel = 'Residential';
            typeBadgeClass = 'bg-primary';
            break;
        case 'commercial':
            typeLabel = 'Commercial';
            typeBadgeClass = 'bg-success';
            break;
        case 'agricultural':
            typeLabel = 'Agricultural';
            typeBadgeClass = 'bg-warning';
            break;
        case 'industrial':
            typeLabel = 'Industrial';
            typeBadgeClass = 'bg-danger';
            break;
        case 'public':
            typeLabel = 'Public/Government';
            typeBadgeClass = 'bg-info';
            break;
        default:
            typeLabel = 'Other';
            typeBadgeClass = 'bg-secondary';
    }
    
    // Build content HTML
    let html = `
        <div class="container-fluid">
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="property-detail-header">
                        <span class="badge ${typeBadgeClass} property-badge">${typeLabel}</span>
                        <h4 class="mb-2">${property.parcel_id}</h4>
                        <p class="lead mb-0">${property.address}</p>
                    </div>
                    
                    <h5 class="mt-4 mb-3">Property Information</h5>
                    <table class="table table-striped property-info-table">
                        <tbody>
                            <tr>
                                <th>Parcel ID:</th>
                                <td>${property.parcel_id}</td>
                            </tr>
                            <tr>
                                <th>Property Type:</th>
                                <td>${typeLabel}</td>
                            </tr>
                            <tr>
                                <th>Assessed Value (2025):</th>
                                <td>${formatter.format(property.assessed_value)}</td>
                            </tr>
                            <tr>
                                <th>Lot Size:</th>
                                <td>${formatLotSize(property.lot_size)}</td>
                            </tr>
                            <tr>
                                <th>Zoning:</th>
                                <td>${property.zoning || 'N/A'}</td>
                            </tr>
                            <tr>
                                <th>Year Built:</th>
                                <td>${property.year_built || 'N/A'}</td>
                            </tr>
    `;
    
    // Add property type specific details
    if (property.property_type === 'residential') {
        html += `
                            <tr>
                                <th>Bedrooms:</th>
                                <td>${property.bedrooms || 'N/A'}</td>
                            </tr>
                            <tr>
                                <th>Bathrooms:</th>
                                <td>${property.bathrooms || 'N/A'}</td>
                            </tr>
        `;
    }
    
    if (property.property_type === 'commercial' || property.property_type === 'industrial') {
        html += `
                            <tr>
                                <th>Building Area:</th>
                                <td>${property.building_area ? formatArea(property.building_area) : 'N/A'}</td>
                            </tr>
        `;
    }
    
    // Add ownership details
    html += `
                            <tr>
                                <th>Owner:</th>
                                <td>${property.owner_name || 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="col-md-6">
                    <div class="property-location-map" id="detail-map" style="height: 300px;"></div>
                    
                    <h5 class="mt-4 mb-3">Valuation History</h5>
                    <canvas id="valuationHistoryChart" width="100%" height="200"></canvas>
                </div>
            </div>
            
            <div class="row">
                <div class="col-12">
                    <h5 class="mb-3">Comparable Properties</h5>
                    <div class="table-responsive">
                        <table class="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <th>Parcel ID</th>
                                    <th>Address</th>
                                    <th>Type</th>
                                    <th>Assessed Value</th>
                                    <th>Year Built</th>
                                    <th>Lot Size</th>
                                    <th>Distance</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Demo Comparable Properties -->
                                <tr>
                                    <td>R-${Math.floor(10000 + Math.random() * 90000)}</td>
                                    <td>123 Nearby St</td>
                                    <td>${typeLabel}</td>
                                    <td>${formatter.format(property.assessed_value * (0.9 + Math.random() * 0.2))}</td>
                                    <td>${property.year_built ? property.year_built - Math.floor(Math.random() * 5) : 'N/A'}</td>
                                    <td>${formatLotSize(property.lot_size * (0.9 + Math.random() * 0.2))}</td>
                                    <td>0.2 miles</td>
                                </tr>
                                <tr>
                                    <td>R-${Math.floor(10000 + Math.random() * 90000)}</td>
                                    <td>456 Similar Ave</td>
                                    <td>${typeLabel}</td>
                                    <td>${formatter.format(property.assessed_value * (0.85 + Math.random() * 0.3))}</td>
                                    <td>${property.year_built ? property.year_built - Math.floor(Math.random() * 8) : 'N/A'}</td>
                                    <td>${formatLotSize(property.lot_size * (0.8 + Math.random() * 0.4))}</td>
                                    <td>0.4 miles</td>
                                </tr>
                                <tr>
                                    <td>R-${Math.floor(10000 + Math.random() * 90000)}</td>
                                    <td>789 Comparable Dr</td>
                                    <td>${typeLabel}</td>
                                    <td>${formatter.format(property.assessed_value * (0.95 + Math.random() * 0.15))}</td>
                                    <td>${property.year_built ? property.year_built - Math.floor(Math.random() * 3) : 'N/A'}</td>
                                    <td>${formatLotSize(property.lot_size * (0.95 + Math.random() * 0.1))}</td>
                                    <td>0.3 miles</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Update modal content
    contentContainer.innerHTML = html;
    
    // Show the modal
    const propertyModal = new bootstrap.Modal(document.getElementById('property-detail-modal'));
    propertyModal.show();
    
    // Initialize detail map after modal is shown
    document.getElementById('property-detail-modal').addEventListener('shown.bs.modal', function() {
        initDetailMap(property);
        
        // Initialize valuation history chart
        initValuationHistoryChart(property);
    });
}

// Initialize detailed property map
function initDetailMap(property) {
    // Create map
    const detailMap = L.map('detail-map').setView([property.lat, property.lng], 16);
    
    // Add OpenStreetMap layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(detailMap);
    
    // Add property marker
    const marker = createPropertyMarker(property);
    marker.addTo(detailMap);
    
    // Add a circle to represent property boundary (approximate)
    const radius = Math.sqrt(property.lot_size / Math.PI);
    L.circle([property.lat, property.lng], {
        radius: radius / (property.property_type === 'agricultural' ? 30 : 150),
        color: '#4e73df',
        fillColor: '#4e73df',
        fillOpacity: 0.2,
        weight: 2
    }).addTo(detailMap);
}

// Initialize valuation history chart
function initValuationHistoryChart(property) {
    const ctx = document.getElementById('valuationHistoryChart').getContext('2d');
    
    // Generate sample data
    const currentYear = 2025;
    const years = Array.from({length: 5}, (_, i) => currentYear - 4 + i);
    
    // Generate historical values (fictional data for demo)
    const baseValue = property.assessed_value / 1.15;
    const values = years.map((year /* , index */) => {
        if (index === 4) return property.assessed_value; // Current value
        
        // Each previous year is a percentage of the current value
        const percentages = [0.75, 0.85, 0.95, 1.05];
        return baseValue * percentages[index];
    });
    
    // Create chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Assessed Value',
                data: values,
                backgroundColor: 'rgba(78, 115, 223, 0.05)',
                borderColor: 'rgba(78, 115, 223, 1)',
                pointRadius: 3,
                pointBackgroundColor: 'rgba(78, 115, 223, 1)',
                pointBorderColor: 'rgba(78, 115, 223, 1)',
                pointHoverRadius: 5,
                pointHoverBackgroundColor: 'rgba(78, 115, 223, 1)',
                pointHoverBorderColor: 'rgba(78, 115, 223, 1)',
                pointHitRadius: 10,
                pointBorderWidth: 2,
                fill: true
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    maximumFractionDigits: 0
                                }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Show valuation history
function showValuationHistory(propertyId) {
    const property = propertyData[propertyId];
    if (!property) return;
    
    showAlert('Valuation history would show detailed yearly assessments in the full application', 'info');
}

// Initialize charts on the dashboard
function initCharts() {
    // Property Type Chart
    const propertyTypeCtx = document.getElementById('propertyTypeChart').getContext('2d');
    const propertyDistributionCtx = document.getElementById('propertyDistributionChart').getContext('2d');
    
    // Property Type Chart (Bar Chart)
    new Chart(propertyTypeCtx, {
        type: 'bar',
        data: {
            labels: ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Public/Gov'],
            datasets: [{
                label: 'Total Assessed Value (millions)',
                data: [2850, 1950, 920, 475, 580],
                backgroundColor: [
                    'rgba(78, 115, 223, 0.8)',
                    'rgba(28, 200, 138, 0.8)',
                    'rgba(246, 194, 62, 0.8)',
                    'rgba(231, 74, 59, 0.8)',
                    'rgba(54, 185, 204, 0.8)'
                ],
                borderColor: [
                    'rgba(78, 115, 223, 1)',
                    'rgba(28, 200, 138, 1)',
                    'rgba(246, 194, 62, 1)',
                    'rgba(231, 74, 59, 1)',
                    'rgba(54, 185, 204, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString() + 'M';
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += '$' + context.parsed.y.toLocaleString() + ' million';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
    
    // Property Distribution Chart (Pie Chart)
    new Chart(propertyDistributionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Under $250K', '$250K-$500K', '$500K-$1M', 'Over $1M'],
            datasets: [{
                label: 'Properties',
                data: [2450, 3580, 1820, 395],
                backgroundColor: [
                    'rgba(78, 115, 223, 0.8)',
                    'rgba(54, 185, 204, 0.8)',
                    'rgba(246, 194, 62, 0.8)',
                    'rgba(231, 74, 59, 0.8)'
                ],
                borderColor: [
                    'rgba(78, 115, 223, 1)',
                    'rgba(54, 185, 204, 1)',
                    'rgba(246, 194, 62, 1)',
                    'rgba(231, 74, 59, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Format lot size for display
function formatLotSize(sizeInSqFt) {
    if (!sizeInSqFt) return 'N/A';
    
    // If size is very large (over 1 acre), show in acres
    const acreage = sizeInSqFt / 43560; // 43,560 sq ft = 1 acre
    
    if (acreage >= 1) {
        return acreage.toFixed(2) + ' acres';
    } else {
        return sizeInSqFt.toLocaleString() + ' sq ft';
    }
}

// Format area for display
function formatArea(areaInSqFt) {
    if (!areaInSqFt) return 'N/A';
    return areaInSqFt.toLocaleString() + ' sq ft';
}

// Show alert message
function showAlert(message, type) {
    const alertsContainer = document.getElementById('map-alerts');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertsContainer.appendChild(alert);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            if (alert.parentNode === alertsContainer) {
                alertsContainer.removeChild(alert);
            }
        }, 150);
    }, 5000);
}