/**
 * System Status Component for TerraAgent
 * Provides visibility into service availability
 */

// System status state
let systemStatus = {
    database: true,
    vector_store: false,
    ai_model: true,
    levy_calculator: true,
    trends_analyzer: false
};

// DOM Element references
let statusContainer;

/**
 * Initialize the system status component
 * @param {HTMLElement} container - Container element for status indicators
 */
function initSystemStatus(container) {
    statusContainer = container;
    
    // Create status indicators if container exists
    if (statusContainer) {
        renderStatusIndicators();
        
        // Fetch initial status
        fetchSystemStatus();
        
        // Set up regular polling (every 30 seconds)
        setInterval(fetchSystemStatus, 30000);
    }
}

/**
 * Render the status indicators in the container
 */
function renderStatusIndicators() {
    if (!statusContainer) return;
    
    statusContainer.innerHTML = `
        <div class="system-status">
            <div class="status-item">
                <span class="status-label">Database</span>
                <span id="status-database" class="status-indicator">
                    <i class="fas fa-circle-notch fa-spin"></i>
                </span>
            </div>
            <div class="status-item">
                <span class="status-label">Vector Store</span>
                <span id="status-vector-store" class="status-indicator">
                    <i class="fas fa-circle-notch fa-spin"></i>
                </span>
            </div>
            <div class="status-item">
                <span class="status-label">AI Model</span>
                <span id="status-ai-model" class="status-indicator">
                    <i class="fas fa-circle-notch fa-spin"></i>
                </span>
            </div>
        </div>
    `;
    
    // Add styles if not already in CSS
    if (!document.getElementById('system-status-styles')) {
        const style = document.createElement('style');
        style.id = 'system-status-styles';
        style.textContent = `
            .system-status {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 10px;
                font-size: 0.8rem;
            }
            
            .status-item {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .status-label {
                color: var(--bs-gray-600);
            }
            
            .status-indicator {
                font-size: 0.7rem;
            }
            
            .status-indicator.active {
                color: var(--bs-success);
            }
            
            .status-indicator.inactive {
                color: var(--bs-danger);
            }
            
            .status-indicator.unknown {
                color: var(--bs-warning);
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Fetch the current system status from the API
 */
function fetchSystemStatus() {
    fetch('/api/status')
        .then(response => response.json())
        .then(data => {
            if (data && data.status) {
                // Get previous status for comparison
                const previousStatus = { ...systemStatus };
                
                // Update the local status state
                systemStatus = { ...data.status };
                
                // Update the UI indicators
                updateStatusIndicators();
                
                // Notify on critical status changes (first load is handled separately)
                if (window.initialStatusCheck) {
                    notifyStatusChanges(data.status, previousStatus);
                } else {
                    window.initialStatusCheck = true;
                }
                
                // Dispatch custom event for other components to react
                const statusEvent = new CustomEvent('systemStatusUpdate', { 
                    detail: { 
                        status: systemStatus,
                        previous: previousStatus,
                        timestamp: new Date().toISOString()
                    } 
                });
                document.dispatchEvent(statusEvent);
            }
        })
        .catch(error => {
            console.error('Error fetching system status:', error);
            // Mark all services as unknown on error
            const previousStatus = { ...systemStatus };
            for (const [key, _] of Object.entries(systemStatus)) {
                systemStatus[key] = null;
            }
            updateStatusIndicators();
            
            // Dispatch error event
            const errorEvent = new CustomEvent('systemStatusError', { 
                detail: { 
                    error: error.message,
                    previous: previousStatus,
                    timestamp: new Date().toISOString()
                } 
            });
            document.dispatchEvent(errorEvent);
        });
}

/**
 * Update the status indicators in the UI
 */
function updateStatusIndicators() {
    // Update each indicator based on current status
    for (const [key, value] of Object.entries(systemStatus)) {
        const indicator = document.getElementById(`status-${key.replace('_', '-')}`);
        if (indicator) {
            // Remove previous classes
            indicator.classList.remove('active', 'inactive', 'unknown');
            
            // Add current status class
            if (value === true) {
                indicator.classList.add('active');
                indicator.innerHTML = '<i class="fas fa-check-circle"></i>';
            } else if (value === false) {
                indicator.classList.add('inactive');
                indicator.innerHTML = '<i class="fas fa-times-circle"></i>';
            } else {
                indicator.classList.add('unknown');
                indicator.innerHTML = '<i class="fas fa-question-circle"></i>';
            }
        }
    }
}

/**
 * Notify the user of critical status changes
 * @param {Object} newStatus - The new system status
 * @param {Object} previousStatus - The previous system status for comparison
 */
function notifyStatusChanges(newStatus, previousStatus) {
    // Only notify about critical services
    const criticalServices = {
        'database': 'Database',
        'vector_store': 'Document Search',
        'ai_model': 'AI Assistant'
    };
    
    for (const [key, label] of Object.entries(criticalServices)) {
        // Check if status changed for this service
        if (newStatus[key] !== previousStatus[key]) {
            if (newStatus[key] === true && previousStatus[key] === false) {
                // Service became available
                window.Notifications?.success(`${label} is now available!`);
            } else if (newStatus[key] === false && previousStatus[key] === true) {
                // Service became unavailable
                window.Notifications?.warning(`${label} is currently unavailable. Some features may be limited.`);
            }
        }
    }
}

/**
 * Get the current system status
 * @returns {Object} The current system status
 */
function getSystemStatus() {
    return { ...systemStatus };
}

// Export the system status API
window.SystemStatus = {
    init: initSystemStatus,
    getStatus: getSystemStatus,
    refresh: fetchSystemStatus
};