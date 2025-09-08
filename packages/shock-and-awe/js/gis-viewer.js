/**
 * Terrafusion GIS Viewer - FULL-SCREEN SPECTACULAR VERSION
 * Interactive mapping and geospatial analysis
 */

class TerraFusionGIS {
    constructor() {
        this.map = null;
        this.markers = [];
        this.init();
    }

    init() {
        this.createGISInterface();
        this.bindEvents();
    }

    createGISInterface() {
        const gisContainer = document.createElement('div');
        gisContainer.id = 'gis-viewer';
        gisContainer.className = 'tf-fullscreen-app tf-cosmic-bg';
        gisContainer.style.display = 'none';
        gisContainer.innerHTML = `
            <div class="gis-container">
                <div class="gis-header">
                    <div class="gis-title">
                        <svg class="wizard-icon" viewBox="0 0 24 24" fill="currentColor" style="width: 60px; height: 60px; color: #00ffee;">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                            <circle cx="12" cy="9" r="2.5"/>
                        </svg>
                        Terrafusion GIS Pro
                    </div>
                    <button class="tf-feature-close" id="gis-close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
                <div class="gis-map-container">
                    <div id="terrafusion-map" class="gis-map">
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ffffff; font-size: 2rem; text-align: center; flex-direction: column; gap: 1rem;">
                            <svg width="120" height="120" viewBox="0 0 24 24" fill="#00ffee">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                                <circle cx="12" cy="9" r="2.5"/>
                            </svg>
                            <div>Interactive GIS Map</div>
                            <div style="font-size: 1.2rem; color: rgba(255,255,255,0.8);">Property analysis and mapping tools</div>
                        </div>
                    </div>
                    <div class="gis-controls">
                        <h4>Map Controls</h4>
                        <button data-action="zoom-in">🔍 Zoom In</button>
                        <button data-action="zoom-out">🔍 Zoom Out</button>
                        <button data-action="reset-view">🎯 Reset View</button>
                        <button data-action="toggle-3d">📦 3D View</button>
                        <button data-action="heatmap">🔥 Property Heatmap</button>
                        <button data-action="layers">📋 Toggle Layers</button>
                        <button data-action="measure">📏 Measure Tool</button>
                        <button data-action="search">🔍 Property Search</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(gisContainer);
    }

    bindEvents() {
        // Close button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#gis-close')) {
                this.close();
            }
        });

        // GIS controls
        document.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action) {
                this.handleAction(action);
            }
        });

        // Close on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'gis-viewer') {
                this.close();
            }
        });
    }

    handleAction(action) {
        console.log(`🗺️ GIS Action: ${action}`);
        
        // Show visual feedback
        const button = document.querySelector(`[data-action="${action}"]`);
        if (button) {
            button.style.background = 'rgba(0, 255, 238, 0.3)';
            setTimeout(() => {
                button.style.background = '';
            }, 200);
        }

        switch(action) {
            case 'zoom-in':
                console.log('🔍 Zooming in...');
                break;
            case 'zoom-out':
                console.log('🔍 Zooming out...');
                break;
            case 'reset-view':
                console.log('🎯 Resetting view to Benton County...');
                break;
            case 'toggle-3d':
                console.log('📦 Toggling 3D view...');
                break;
            case 'heatmap':
                console.log('🔥 Showing property value heatmap...');
                break;
            case 'layers':
                console.log('📋 Toggling map layers...');
                break;
            case 'measure':
                console.log('📏 Activating measure tool...');
                break;
            case 'search':
                console.log('🔍 Opening property search...');
                break;
        }
    }

    show() {
        const container = document.getElementById('gis-viewer');
        if (container) {
            container.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            console.log('🗺️ Terrafusion GIS Pro launched - FULL SCREEN');
        }
    }

    close() {
        const container = document.getElementById('gis-viewer');
        if (container) {
            container.style.display = 'none';
            document.body.style.overflow = 'auto';
            console.log('🗺️ GIS viewer closed');
        }
    }

    initializeMap() {
        // Placeholder for actual map initialization
        console.log('🗺️ Initializing interactive map for Benton County...');
        console.log('📍 Loading property parcels and GIS layers...');
    }
}

// Export for use in main application
window.TerraFusionGIS = TerraFusionGIS;
window.GISViewer = TerraFusionGIS; // Alias for compatibility

// Add show method
TerraFusionGIS.prototype.show = function() {
    const gisViewer = document.getElementById('gis-viewer');
    if (gisViewer) {
        gisViewer.style.display = 'flex';
        this.initializeMap();
        console.log('🗺️ GIS Viewer displayed');
    }
};