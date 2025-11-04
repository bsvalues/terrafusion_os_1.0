#!/bin/bash

# TerraFusion Map Performance Optimization Script
# This script analyzes and optimizes map performance components

echo "TerraFusion Map Performance Optimization"
echo "========================================"

# Ensure we're in the tools directory
cd "$(dirname "$0")"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js."
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Create performance reports directory
mkdir -p ../performance_reports/maps
mkdir -p ../performance_reports/render-blocking

# Run the map performance analysis
echo "Running map performance analysis..."
node map_performance_analysis.js

# Run render-blocking resources analysis
echo "Identifying render-blocking resources..."
node identify_render_blocking.js

# Run performance audit
echo "Running comprehensive performance audit..."
npm run audit

# After analysis, optimize GeoJSON files
echo "Optimizing GeoJSON files..."
find ../static/data -name "*.geojson" -type f | while read file; do
    echo "Processing $file"
    # Create a backup
    cp "$file" "${file}.bak"
    # Simplify the GeoJSON file using mapshaper if available
    if command -v mapshaper &> /dev/null; then
        mapshaper "$file" -simplify dp 20% -o "$file"
    else
        # If mapshaper isn't available, at least minify the JSON
        tmpfile=$(mktemp)
        jq -c '.' "$file" > "$tmpfile"
        mv "$tmpfile" "$file"
    fi
    # Calculate size reduction
    original_size=$(stat -c %s "${file}.bak")
    new_size=$(stat -c %s "${file}")
    reduction=$((original_size - new_size))
    percent=$(echo "scale=2; $reduction / $original_size * 100" | bc)
    echo "  Reduced from ${original_size} to ${new_size} bytes (${percent}% reduction)"
done

# Optimize JavaScript files
echo "Optimizing JavaScript files..."
if [ -f "../static/js/map.js" ]; then
    echo "Analyzing map.js for optimization opportunities..."
    
    # Create a backup
    cp ../static/js/map.js ../static/js/map.js.bak
    
    # Basic optimizations
    # 1. Remove console.log statements in production
    sed -i 's/console\.log(/\/\/ console.log(/g' ../static/js/map.js
    
    # 2. Add event throttling for map events
    echo "Adding event throttling..."
    cat >> ../static/js/map_optimizations.js << 'EOF'
// Map performance optimizations

// Throttle function to limit how often a function can be called
function throttle(callback, limit) {
    var waiting = false;
    return function() {
        if (!waiting) {
            callback.apply(this, arguments);
            waiting = true;
            setTimeout(function() {
                waiting = false;
            }, limit);
        }
    };
}

// Apply throttling to map events if Leaflet is loaded
if (typeof L !== 'undefined' && L.Map) {
    // Store original event handling methods
    const originalOn = L.Map.prototype.on;
    
    // Override the 'on' method to apply throttling to expensive events
    L.Map.prototype.on = function(type, fn, context) {
        if (type === 'move' || type === 'zoom' || type === 'moveend' || type === 'zoomend') {
            // Throttle these events
            return originalOn.call(this, type, throttle(fn, 100), context);
        }
        // Otherwise, use the original method
        return originalOn.call(this, type, fn, context);
    };
    
    // Enable Leaflet's tap handler for mobile devices
    if (L.Browser.touch && !L.Browser.pointer) {
        L.Map.addInitHook(function() {
            this.tap = new L.Tap();
            this.tap.enable();
        });
    }
}

// Add support for marker clustering if many markers are on the map
function enableClusteringForLargeDataSets() {
    if (typeof L !== 'undefined' && document.querySelectorAll('.leaflet-marker-icon').length > 100) {
        console.log('Large number of markers detected. Consider using MarkerCluster.');
    }
}

// Optimize vector layers
function optimizeVectorLayers() {
    if (typeof L !== 'undefined') {
        // Store the original GeoJSON initialize
        const originalGeoJSONInit = L.GeoJSON.prototype.initialize;
        
        // Override to add optimization
        L.GeoJSON.prototype.initialize = function(geojson, options) {
            // Call the original method
            originalGeoJSONInit.call(this, geojson, options);
            
            // Add optimization for large data sets
            if (this.getLayers().length > 500) {
                // For very large data sets, implement simplification
                this.eachLayer(function(layer) {
                    if (layer.feature && layer.feature.geometry) {
                        // Enable bounding box filtering
                        layer._boundsCache = layer.getBounds();
                    }
                });
                
                // Override the original _update method to only render visible features
                const originalUpdate = this._update;
                this._update = function() {
                    // Get the current map bounds
                    const mapBounds = this._map.getBounds();
                    
                    // Filter layers to only show those in the viewport
                    this.eachLayer(function(layer) {
                        if (layer._boundsCache) {
                            if (mapBounds.intersects(layer._boundsCache)) {
                                layer.addTo(this._map);
                            } else {
                                this._map.removeLayer(layer);
                            }
                        }
                    }, this);
                    
                    // Call the original update method
                    originalUpdate.call(this);
                };
            }
        };
    }
}

// Run optimizations when the page loads
window.addEventListener('load', function() {
    enableClusteringForLargeDataSets();
    optimizeVectorLayers();
});
EOF
    
    echo "Optimizations applied to map.js"
fi

echo "Performance optimization completed!"
echo "Check the performance reports directory for detailed analysis."
echo "Map optimizations have been applied and can be found in static/js/map_optimizations.js"