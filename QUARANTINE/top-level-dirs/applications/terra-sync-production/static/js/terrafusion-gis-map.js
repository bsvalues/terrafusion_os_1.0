/**
 * Terrafusion GIS Map Component
 * Handles property and district data visualization
 */

class TerraFusionGISMap {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            countyId: options.countyId || 'benton-wa',
            apiBaseUrl: options.apiBaseUrl || '/api/v1',
            ...options
        };
        
        this.properties = [];
        this.districts = [];
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        if (!this.container) {
            console.error('TerraFusionGISMap: Container not found');
            return;
        }
        
        this.render();
        this.loadData();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="terrafusion-gis-map">
                <div class="map-header">
                    <h4>GIS Property Map</h4>
                    <div class="map-controls">
                        <button id="refresh-map" class="btn btn-sm btn-outline-primary">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                        <select id="county-select" class="form-select form-select-sm">
                            <option value="benton-wa">Benton County, WA</option>
                            <option value="franklin-wa">Franklin County, WA</option>
                            <option value="walla-walla-wa">Walla Walla County, WA</option>
                        </select>
                    </div>
                </div>
                <div class="map-content">
                    <div id="map-loading" class="text-center p-4" style="display: none;">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2">Loading map data...</p>
                    </div>
                    <div id="map-error" class="alert alert-warning" style="display: none;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span id="error-message">Unable to load map data</span>
                    </div>
                    <div id="map-display">
                        <div class="row">
                            <div class="col-md-8">
                                <div class="map-placeholder bg-light border rounded p-4 text-center">
                                    <i class="fas fa-map-marked-alt fa-3x text-muted mb-3"></i>
                                    <h5 class="text-muted">Interactive Map View</h5>
                                    <p class="text-muted">Property boundaries and districts will be displayed here</p>
                                    <div id="map-stats" class="mt-3">
                                        <small class="text-muted">
                                            Properties: <span id="property-count">0</span> | 
                                            Districts: <span id="district-count">0</span>
                                        </small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="property-list">
                                    <h6>Recent Properties</h6>
                                    <div id="property-list-container" class="list-group list-group-flush">
                                        <!-- Properties will be listed here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        const refreshBtn = this.container.querySelector('#refresh-map');
        const countySelect = this.container.querySelector('#county-select');
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadData());
        }
        
        if (countySelect) {
            countySelect.value = this.options.countyId;
            countySelect.addEventListener('change', (e) => {
                this.options.countyId = e.target.value;
                this.loadData();
            });
        }
    }
    
    async loadData() {
        this.setLoading(true);
        this.hideError();
        
        try {
            // Load properties data
            await this.loadProperties();
            
            // Load districts data
            await this.loadDistricts();
            
            // Update display
            this.updateDisplay();
            
        } catch (error) {
            console.error('Failed to load map data:', error);
            this.showError('Failed to load map data. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }
    
    async loadProperties() {
        try {
            const response = await fetch(`${this.options.apiBaseUrl}/gis-map/properties?county_id=${this.options.countyId}&limit=50`);
            const data = await response.json();
            
            // Ensure properties is always an array
            this.properties = Array.isArray(data.properties) ? data.properties : [];
            
        } catch (error) {
            console.error('Error loading properties:', error);
            this.properties = [];
        }
    }
    
    async loadDistricts() {
        try {
            const response = await fetch(`${this.options.apiBaseUrl}/gis-map/districts?county_id=${this.options.countyId}`);
            const data = await response.json();
            
            // Ensure districts is always an array
            this.districts = Array.isArray(data.districts) ? data.districts : [];
            
        } catch (error) {
            console.error('Error loading districts:', error);
            this.districts = [];
        }
    }
    
    updateDisplay() {
        // Update counters
        const propertyCountEl = this.container.querySelector('#property-count');
        const districtCountEl = this.container.querySelector('#district-count');
        
        if (propertyCountEl) propertyCountEl.textContent = this.properties.length;
        if (districtCountEl) districtCountEl.textContent = this.districts.length;
        
        // Update property list
        this.updatePropertyList();
    }
    
    updatePropertyList() {
        const listContainer = this.container.querySelector('#property-list-container');
        if (!listContainer) return;
        
        if (this.properties.length === 0) {
            listContainer.innerHTML = '<p class="text-muted p-3">No properties found</p>';
            return;
        }
        
        const propertiesToShow = this.properties.slice(0, 10); // Show first 10
        
        listContainer.innerHTML = propertiesToShow.map(property => `
            <div class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${this.escapeHtml(property.parcel_number || 'Unknown')}</h6>
                    <small>$${this.formatCurrency(property.assessed_value || 0)}</small>
                </div>
                <p class="mb-1">${this.escapeHtml(property.property_address || 'No address')}</p>
                <small class="text-muted">${this.escapeHtml(property.property_type || 'Unknown type')}</small>
            </div>
        `).join('');
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        const loadingEl = this.container.querySelector('#map-loading');
        const displayEl = this.container.querySelector('#map-display');
        
        if (loadingEl && displayEl) {
            loadingEl.style.display = loading ? 'block' : 'none';
            displayEl.style.display = loading ? 'none' : 'block';
        }
    }
    
    showError(message) {
        const errorEl = this.container.querySelector('#map-error');
        const messageEl = this.container.querySelector('#error-message');
        
        if (errorEl && messageEl) {
            messageEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }
    
    hideError() {
        const errorEl = this.container.querySelector('#map-error');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    formatCurrency(value) {
        return new Intl.NumberFormat('en-US').format(value);
    }
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Look for elements with terrafusion-gis-map class
    const mapContainers = document.querySelectorAll('.terrafusion-gis-map-container');
    
    mapContainers.forEach(container => {
        const countyId = container.getAttribute('data-county-id') || 'benton-wa';
        new TerraFusionGISMap(container.id, { countyId });
    });
});

// Export to global namespace
window.TerraFusionGISMap = TerraFusionGISMap;