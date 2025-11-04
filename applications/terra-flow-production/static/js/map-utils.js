/**
 * TerraFlow Map Utilities
 * 
 * Provides common map functionality for the TerraFlow application
 * Includes:
 * - ESRI Map Configuration
 * - Google Maps Integration
 * - Property Layer Management
 * - Spatial Data Handling
 */

// Global map configuration state
const MapConfig = {
    // Default center coordinates - Benton County
    defaultCenter: [-119.2006, 46.2346],
    defaultZoom: 12,
    
    // Base layers from ESRI
    baseLayers: {
        imagery: {
            name: "Imagery",
            url: "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer",
            type: "ESRITiledLayer",
            visible: true
        },
        street: {
            name: "Street Map",
            url: "https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer",
            type: "ESRITiledLayer",
            visible: false
        },
        topo: {
            name: "Topo",
            url: "https://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer",
            type: "ESRITiledLayer",
            visible: false
        },
        femaFlood: {
            name: "FEMA Flood",
            url: "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHLWMS/MapServer",
            type: "ESRITiledLayer",
            visible: false
        },
        usgsImagery: {
            name: "USGS Imagery",
            url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer",
            type: "ESRITiledLayer",
            visible: false
        }
    },
    
    // Feature layers
    featureLayers: {
        parcels: {
            name: "Parcels",
            url: "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer",
            type: "ESRIDynamicLayer",
            visible: true,
            selectable: true
        },
        shortPlats: {
            name: "Short Plats",
            url: "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Short_Plats/FeatureServer",
            type: "ESRIDynamicLayer",
            visible: false,
            selectable: false
        },
        longPlats: {
            name: "Long Plats",
            url: "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Long_Plats/FeatureServer",
            type: "ESRIDynamicLayer",
            visible: false,
            selectable: false
        },
        floodZones: {
            name: "Flood Zones",
            url: "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/FEMA_FLOOD_ZONES/FeatureServer",
            type: "ESRIDynamicLayer",
            visible: false,
            selectable: false
        },
        wellLogs: {
            name: "Well Logs",
            url: "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/WellLogs/FeatureServer",
            type: "ESRIDynamicLayer",
            visible: false,
            selectable: false
        },
        zoning: {
            name: "Zoning",
            url: "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Zoning/FeatureServer",
            type: "ESRIDynamicLayer",
            visible: false,
            selectable: false
        },
        bcZoning: {
            name: "BC Zoning",
            url: "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/BC_Zoning/FeatureServer",
            type: "ESRIDynamicLayer",
            visible: false,
            selectable: false
        }
    },
    
    // Selection and styling configuration
    selection: {
        fillOpacity: 0.15,
        borderThickness: 1,
        borderColor: "0,255,255", // cyan
        highlightedBorderColor: "0,0,255", // blue
        highlightedBorderThickness: 3,
        filteredFillOpacity: 0.25,
        filteredFillColor: "200,0,0", // red
        filteredBorderColor: "200,0,0", // red
        filteredBorderThickness: 1
    },
    
    // Geometry server for ESRI operations
    geometryServer: "https://webmap.trueautomation.com/arcgis/rest/services/Utilities/Geometry/GeometryServer",
    
    // Map extent configuration
    mapExtent: {
        spatialReference: 3857,
        xMin: -10737120.598997863,
        yMin: 3882813.8569813273,
        xMax: -10710544.958665717,
        yMax: 3890130.8441077187
    },
    
    // Custom settings
    settings: {
        gisKeyField: "Prop_ID",
        mapTitle: "Benton County Assessor Office",
        legalText: "THIS PRODUCT IS FOR INFORMATIONAL PURPOSES AND MAY NOT HAVE BEEN PREPARED FOR OR BE SUITABLE FOR LEGAL, ENGINEERING, OR SURVEYING PURPOSES. IT DOES NOT REPRESENT AN ON-THE-GROUND SURVEY AND REPRESENTS ONLY THE APPROXIMATE RELATIVE LOCATION OF PROPERTY BOUNDARIES.",
        autoSelectMaxRecords: 2000,
        fetchPartitionSize: 200,
        showScaleBar: false,
        appendSearch: false
    }
};

/**
 * Initialize a Leaflet map for property visualization
 * @param {string} containerId - The HTML element ID for the map container
 * @param {Object} options - Map initialization options
 * @returns {Object} - The initialized map object
 */
function initPropertyMap(containerId, options = {}) {
    // Default options
    const defaults = {
        center: MapConfig.defaultCenter,
        zoom: MapConfig.defaultZoom,
        minZoom: 10,
        maxZoom: 20,
        zoomControl: true,
        attributionControl: true
    };
    
    // Merge with provided options
    const mapOptions = {...defaults, ...options};
    
    // Create the map
    const map = L.map(containerId, mapOptions);
    
    // Add base layers from configuration
    const baseLayers = {};
    
    // ESRI World Imagery layer
    const imageryLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });
    baseLayers["Imagery"] = imageryLayer;
    
    // ESRI World Street Map
    const streetLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    });
    baseLayers["Street Map"] = streetLayer;
    
    // ESRI Topo Map
    const topoLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    });
    baseLayers["Topo"] = topoLayer;
    
    // Set the default base layer - Imagery
    imageryLayer.addTo(map);
    
    // Add layer control
    L.control.layers(baseLayers, {}, {collapsed: false}).addTo(map);
    
    // Add measure tool
    L.control.measure({
        position: 'topleft',
        primaryLengthUnit: 'feet',
        secondaryLengthUnit: 'miles',
        primaryAreaUnit: 'sqfeet',
        secondaryAreaUnit: 'acres'
    }).addTo(map);
    
    // Return the initialized map
    return map;
}

/**
 * Function to load properties onto the map
 * @param {Object} map - The Leaflet map instance
 * @param {Array} properties - Array of property data objects
 * @param {Object} options - Display options for the properties
 */
function loadPropertiesOnMap(map, properties, options = {}) {
    // Default styling options
    const defaultStyle = {
        color: '#0F4C5C',
        weight: 1,
        opacity: 1,
        fillColor: '#3D7D8A',
        fillOpacity: 0.4
    };
    
    // Highlight style for hovering
    const highlightStyle = {
        color: '#09A6C0',
        weight: 3,
        opacity: 1,
        fillColor: '#62C6D6',
        fillOpacity: 0.6
    };
    
    // Selected style
    const selectedStyle = {
        color: '#2E8B57',
        weight: 2,
        opacity: 1,
        fillColor: '#57A57D',
        fillOpacity: 0.7
    };
    
    // Merge with provided options
    const style = {...defaultStyle, ...options.style};
    
    // Clear existing property layers if needed
    if (map.propertyLayer) {
        map.removeLayer(map.propertyLayer);
    }
    
    // Function to handle property clicks
    function onPropertyClick(e) {
        const layer = e.target;
        const property = layer.feature.properties;
        
        // Apply selected styling
        layer.setStyle(selectedStyle);
        
        // Display property info in a popup
        const popupContent = `
            <div class="property-popup">
                <h5 class="property-title">${property.property_id || 'Unknown Property'}</h5>
                <p><strong>Address:</strong> ${property.address || 'N/A'}</p>
                <p><strong>Owner:</strong> ${property.owner_name || 'N/A'}</p>
                <p><strong>Value:</strong> $${property.appraised_value?.toLocaleString() || 'N/A'}</p>
                <p><strong>Acres:</strong> ${property.acres?.toFixed(2) || 'N/A'}</p>
                <div class="text-center mt-2">
                    <a href="/property/${property.property_id}" class="btn btn-primary btn-sm">View Details</a>
                </div>
            </div>
        `;
        
        layer.bindPopup(popupContent).openPopup();
        
        // If a callback is provided, execute it
        if (options.onSelect && typeof options.onSelect === 'function') {
            options.onSelect(property);
        }
    }
    
    // Function to highlight property on hover
    function onPropertyMouseOver(e) {
        const layer = e.target;
        layer.setStyle(highlightStyle);
        layer.bringToFront();
    }
    
    // Function to reset property style on mouseout
    function onPropertyMouseOut(e) {
        const layer = e.target;
        // Reset to default style unless it's selected
        if (!layer.selected) {
            propertyLayer.resetStyle(layer);
        }
    }
    
    // Create GeoJSON layer with properties
    const propertyLayer = L.geoJSON(properties, {
        style: style,
        onEachFeature: function(feature, layer) {
            layer.on({
                click: onPropertyClick,
                mouseover: onPropertyMouseOver,
                mouseout: onPropertyMouseOut
            });
        }
    });
    
    // Add the layer to the map
    propertyLayer.addTo(map);
    
    // Store the layer on the map object for later reference
    map.propertyLayer = propertyLayer;
    
    // If bounds option is true, fit map to property bounds
    if (options.fitBounds !== false && properties.length > 0) {
        map.fitBounds(propertyLayer.getBounds(), {
            padding: [20, 20]
        });
    }
    
    return propertyLayer;
}

/**
 * Load property data from API endpoint
 * @param {string} url - The API endpoint URL
 * @param {Object} params - Query parameters
 * @returns {Promise} - Promise resolving to the property data
 */
async function loadPropertyData(url, params = {}) {
    try {
        // Build query string from params
        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        
        const apiUrl = queryString ? `${url}?${queryString}` : url;
        
        // Fetch data from API
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading property data:', error);
        throw error;
    }
}

/**
 * Search properties by criteria
 * @param {Object} map - The Leaflet map instance
 * @param {Object} criteria - Search criteria
 * @returns {Promise} - Promise resolving to the search results
 */
async function searchProperties(map, criteria = {}) {
    try {
        // Fetch search results
        const results = await loadPropertyData('/api/properties/search', criteria);
        
        // Load the results on the map
        if (results.features && results.features.length > 0) {
            loadPropertiesOnMap(map, results, {
                fitBounds: true,
                onSelect: function(property) {
                    console.log('Selected property:', property);
                    // Additional selection handling can be implemented here
                }
            });
            
            // Return both the results and the layer for external use
            return {
                results: results,
                layer: map.propertyLayer
            };
        } else {
            // Handle no results
            if (map.propertyLayer) {
                map.removeLayer(map.propertyLayer);
                map.propertyLayer = null;
            }
            return { results: [], layer: null };
        }
    } catch (error) {
        console.error('Error searching properties:', error);
        throw error;
    }
}

/**
 * Parse ESRI Map Configuration XML
 * @param {string} xmlString - XML configuration string
 * @returns {Object} - Parsed configuration object
 */
function parseEsriMapConfig(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // Initialize config object
    const config = {
        baseLayers: [],
        viewableLayers: [],
        mapExtent: {},
        settings: {}
    };
    
    // Parse base layers
    const baseLayerNodes = xmlDoc.querySelectorAll('BaseLayers > BaseLayerModel');
    baseLayerNodes.forEach(node => {
        const layer = {
            name: node.querySelector('n').textContent,
            url: node.querySelector('URL').textContent,
            type: node.querySelector('Type').textContent,
            visible: node.querySelector('Visible').textContent === 'true',
            enableSelection: node.querySelector('EnableSelection').textContent === 'true',
            order: parseInt(node.querySelector('Order').textContent)
        };
        config.baseLayers.push(layer);
    });
    
    // Parse viewable layers
    const viewableLayerNodes = xmlDoc.querySelectorAll('ViewableLayers > CciLayerModel');
    viewableLayerNodes.forEach(node => {
        const layer = {
            name: node.querySelector('n').textContent,
            url: node.querySelector('URL').textContent,
            type: node.querySelector('Type').textContent,
            visible: node.querySelector('Visible').textContent === 'true',
            enableSelection: node.querySelector('EnableSelection').textContent === 'true',
            order: parseInt(node.querySelector('Order').textContent),
            selectionLayerId: node.querySelector('SelectionLayerID') ? 
                parseInt(node.querySelector('SelectionLayerID').textContent) : 0
        };
        config.viewableLayers.push(layer);
    });
    
    // Parse map extent
    const extentNode = xmlDoc.querySelector('MapExtent');
    if (extentNode) {
        config.mapExtent = {
            spatialReference: parseInt(extentNode.querySelector('SpatialReferenceWKID').textContent),
            xMin: parseFloat(extentNode.querySelector('XMin').textContent),
            yMin: parseFloat(extentNode.querySelector('YMin').textContent),
            xMax: parseFloat(extentNode.querySelector('XMax').textContent),
            yMax: parseFloat(extentNode.querySelector('YMax').textContent)
        };
    }
    
    // Parse general settings
    config.settings = {
        geometryServer: xmlDoc.querySelector('ESRIGeometryServerURL')?.textContent,
        outputFields: xmlDoc.querySelector('EsriOutputFields')?.textContent,
        keyFieldName: xmlDoc.querySelector('GISPINFieldName')?.textContent,
        spatialFilter: xmlDoc.querySelector('SpatialFilter')?.textContent,
        showScaleBar: xmlDoc.querySelector('ShowScaleBar')?.textContent === 'true',
        fetchPartitionSize: parseInt(xmlDoc.querySelector('FetchPartitionSize')?.textContent || '200'),
        appendSearch: xmlDoc.querySelector('AppendSearch')?.textContent === 'true',
        selectionFillOpacity: parseFloat(xmlDoc.querySelector('SelectionFillOpacity')?.textContent || '0.15'),
        selectedBorderThickness: parseInt(xmlDoc.querySelector('SelectedBorderThickness')?.textContent || '1'),
        selectionBorderColor: xmlDoc.querySelector('SelectionBorderColor')?.textContent,
        highlightedBorderColor: xmlDoc.querySelector('HighlightedBorderColor')?.textContent,
        highlightedBorderThickness: parseInt(xmlDoc.querySelector('HighlightedBorderThickness')?.textContent || '3'),
        filteredFillOpacity: parseFloat(xmlDoc.querySelector('FilteredFillOpacity')?.textContent || '0.25'),
        filteredFillColor: xmlDoc.querySelector('FilteredFillColor')?.textContent,
        filteredBorderColor: xmlDoc.querySelector('FilteredBorderColor')?.textContent,
        filteredBorderThickness: parseInt(xmlDoc.querySelector('FilteredBorderThickness')?.textContent || '1'),
        autoSelectMaxRecords: parseInt(xmlDoc.querySelector('AutoSelectMaxRecords')?.textContent || '2000'),
        legalText: xmlDoc.querySelector('LegalText')?.textContent,
        mapTitle: xmlDoc.querySelector('MapTitle')?.textContent
    };
    
    return config;
}

/**
 * Parse Data Connections XML
 * @param {string} xmlString - XML configuration string
 * @returns {Object} - Parsed configuration object
 */
function parseDataConnections(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // Initialize config object
    const config = {
        connections: []
    };
    
    // Parse connections
    const connectionNodes = xmlDoc.querySelectorAll('Connections > DataConnectionModel');
    connectionNodes.forEach(node => {
        const connection = {
            name: node.querySelector('ConnectionName').textContent,
            type: node.querySelector('ConnectionType').textContent,
            path: node.querySelector('ConnectionPath').textContent,
            keyField: node.querySelector('KeyField').textContent,
            queries: []
        };
        
        // Parse queries
        const queryNodes = node.querySelectorAll('Querys > QueryItemModel');
        queryNodes.forEach(queryNode => {
            const query = {
                name: queryNode.querySelector('n').textContent,
                description: queryNode.querySelector('Description').textContent,
                type: queryNode.querySelector('Type').textContent,
                executeImmediate: queryNode.querySelector('ExecuteImmediate').textContent === 'true',
                query: queryNode.querySelector('Query').textContent
            };
            connection.queries.push(query);
        });
        
        config.connections.push(connection);
    });
    
    return config;
}

/**
 * Parse SharedState XML
 * @param {string} xmlString - XML configuration string
 * @returns {Object} - Parsed configuration object
 */
function parseSharedState(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // Initialize config object
    const config = {
        baseLayerName: xmlDoc.querySelector('BaseLayerName')?.textContent,
        savedLocations: [],
        mapUserSettings: []
    };
    
    // Parse saved locations
    const locationNodes = xmlDoc.querySelectorAll('SavedLocations > SavedLocationModel');
    locationNodes.forEach(node => {
        const location = {
            name: node.querySelector('n').textContent,
            description: node.querySelector('Discription').textContent,
            spatialReference: parseInt(node.querySelector('SpatialReferenceWKID').textContent),
            xMin: parseFloat(node.querySelector('XMin').textContent),
            yMin: parseFloat(node.querySelector('YMin').textContent),
            xMax: parseFloat(node.querySelector('XMax').textContent),
            yMax: parseFloat(node.querySelector('YMax').textContent)
        };
        config.savedLocations.push(location);
    });
    
    // Parse map user settings
    const settingNodes = xmlDoc.querySelectorAll('MapUserSettings > MapUserSettingModel');
    settingNodes.forEach(node => {
        const setting = {
            name: node.querySelector('n').textContent,
            layoutName: node.querySelector('LayoutName').textContent,
            zoomToSelected: node.querySelector('ZoomToSelected').textContent === 'true',
            zoomToHighlighted: node.querySelector('ZoomToHighlighted').textContent === 'true',
            showScaleBar: node.querySelector('ShowScaleBar').textContent === 'true',
            showLegend: node.querySelector('ShowLegend').textContent === 'true',
            showLayers: node.querySelector('ShowLayers').textContent === 'true',
            showLegal: node.querySelector('ShowLegal').textContent === 'true',
            showTitle: node.querySelector('ShowTitle').textContent === 'true',
            appendSearch: node.querySelector('AppendSearch').textContent === 'true'
        };
        
        // Parse layer states if they exist
        const layerStateNodes = node.querySelectorAll('LayerStates > LayerItemStateModel');
        if (layerStateNodes && layerStateNodes.length > 0) {
            setting.layerStates = [];
            layerStateNodes.forEach(layerNode => {
                const layerState = {
                    id: layerNode.querySelector('Id').textContent,
                    isEnabled: layerNode.querySelector('IsEnabled').textContent === 'true',
                    isExpanded: layerNode.querySelector('IsExpanded').textContent === 'true'
                };
                
                // Check for child layers
                const childLayerNodes = layerNode.querySelectorAll('ChildLayers > LayerItemStateModel');
                if (childLayerNodes && childLayerNodes.length > 0) {
                    layerState.childLayers = [];
                    childLayerNodes.forEach(childNode => {
                        const childLayer = {
                            id: childNode.querySelector('Id').textContent,
                            isEnabled: childNode.querySelector('IsEnabled').textContent === 'true',
                            isExpanded: childNode.querySelector('IsExpanded').textContent === 'true'
                        };
                        layerState.childLayers.push(childLayer);
                    });
                }
                
                setting.layerStates.push(layerState);
            });
        }
        
        config.mapUserSettings.push(setting);
    });
    
    return config;
}

/**
 * Convert GeoJSON to Esri JSON format
 * @param {Object} geojson - GeoJSON object
 * @returns {Object} - Esri JSON format object
 */
function geojsonToEsriJson(geojson) {
    const esriJson = {
        spatialReference: { wkid: 4326 },
        features: []
    };
    
    // Convert features
    geojson.features.forEach(feature => {
        const esriFeature = {
            attributes: feature.properties || {},
            geometry: {
                spatialReference: { wkid: 4326 }
            }
        };
        
        // Convert geometry based on type
        switch (feature.geometry.type) {
            case 'Point':
                esriFeature.geometry.x = feature.geometry.coordinates[0];
                esriFeature.geometry.y = feature.geometry.coordinates[1];
                break;
            case 'LineString':
                esriFeature.geometry.paths = [feature.geometry.coordinates];
                break;
            case 'Polygon':
                esriFeature.geometry.rings = feature.geometry.coordinates;
                break;
            default:
                console.warn('Unsupported geometry type:', feature.geometry.type);
        }
        
        esriJson.features.push(esriFeature);
    });
    
    return esriJson;
}

// Export modules for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MapConfig,
        initPropertyMap,
        loadPropertiesOnMap,
        loadPropertyData,
        searchProperties,
        parseEsriMapConfig,
        parseDataConnections,
        parseSharedState,
        geojsonToEsriJson
    };
}