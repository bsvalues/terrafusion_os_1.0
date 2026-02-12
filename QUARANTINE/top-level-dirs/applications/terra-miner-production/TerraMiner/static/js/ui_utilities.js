/**
 * UI Utilities for TerraMiner
 * 
 * This file contains utility functions for creating charts, managing UI states,
 * and handling common UI patterns throughout the application.
 */

/**
 * Create a chart with standardized options
 * @param {string} chartId - ID of the canvas element
 * @param {string} type - Chart type (line, bar, pie, etc.)
 * @param {Object} data - Chart data (labels, datasets)
 * @param {Object} options - Additional chart options
 * @returns {Chart} - Chart.js instance
 */
function createChart(chartId, type, data, options = {}) {
    // Get the canvas element
    const canvas = document.getElementById(chartId);
    if (!canvas) {
        console.error(`Canvas element with ID '${chartId}' not found.`);
        return null;
    }
    
    // Check if a chart already exists on this canvas
    if (canvas._chart) {
        canvas._chart.destroy();
    }
    
    // Default chart colors for consistent styling
    const defaultColors = [
        'rgba(0, 191, 179, 0.8)',    // Primary teal
        'rgba(66, 232, 220, 0.8)',   // Secondary teal
        'rgba(13, 110, 253, 0.8)',   // Bootstrap primary
        'rgba(108, 117, 125, 0.8)',  // Bootstrap secondary
        'rgba(25, 135, 84, 0.8)',    // Bootstrap success
        'rgba(220, 53, 69, 0.8)',    // Bootstrap danger
        'rgba(255, 193, 7, 0.8)',    // Bootstrap warning
        'rgba(13, 202, 240, 0.8)'    // Bootstrap info
    ];
    
    // Apply default colors if not specified in datasets
    if (data && data.datasets) {
        data.datasets.forEach((dataset /* , index */) => {
            const colorIndex = index % defaultColors.length;
            
            if (!dataset.backgroundColor) {
                if (type === 'line') {
                    dataset.backgroundColor = defaultColors[colorIndex].replace('0.8', '0.2');
                } else {
                    dataset.backgroundColor = defaultColors[colorIndex];
                }
            }
            
            if (!dataset.borderColor && (type === 'line' || type === 'radar')) {
                dataset.borderColor = defaultColors[colorIndex];
            }
        });
    }
    
    // Common options for dark theme
    const darkThemeOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'rgba(255, 255, 255, 0.7)'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(21, 50, 73, 0.9)',
                titleColor: '#fff',
                bodyColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(0, 191, 179, 0.3)',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)'
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)'
                }
            }
        }
    };
    
    // Merge options
    const mergedOptions = mergeDeep(darkThemeOptions, options);
    
    // Create chart
    const chart = new Chart(canvas, {
        type: type,
        data: data,
        options: mergedOptions
    });
    
    // Store chart instance on the canvas for later reference
    canvas._chart = chart;
    
    return chart;
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function mergeDeep(target, source) {
    const output = Object.assign({}, target);
    
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    
    return output;
}

/**
 * Check if value is an object
 * @param {*} item - Item to check
 * @returns {boolean} True if item is an object
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Format number with specified options
 * @param {number} value - Number to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted number
 */
function formatNumber(value, options = {}) {
    const defaults = {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        notation: 'standard',
        currency: 'USD',
        compact: false
    };
    
    const config = { ...defaults, ...options };
    
    if (config.compact) {
        config.notation = 'compact';
    }
    
    try {
        const formatter = new Intl.NumberFormat('en-US', config);
        return formatter.format(value);
    } catch (e) {
        console.error('Error formatting number:', e);
        return value.toString();
    }
}

/**
 * Format currency value
 * @param {number} value - Value to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency value
 */
function formatCurrency(value, currency = 'USD') {
    return formatNumber(value, {
        style: 'currency',
        currency: currency
    });
}

/**
 * Format date with specified format
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string
 * @returns {string} Formatted date
 */
function formatDate(date, format = 'medium') {
    if (!date) return '';
    
    try {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const options = {};
        
        switch (format) {
            case 'short':
                options.year = 'numeric';
                options.month = 'numeric';
                options.day = 'numeric';
                break;
            case 'medium':
                options.year = 'numeric';
                options.month = 'short';
                options.day = 'numeric';
                break;
            case 'long':
                options.year = 'numeric';
                options.month = 'long';
                options.day = 'numeric';
                break;
            case 'full':
                options.year = 'numeric';
                options.month = 'long';
                options.day = 'numeric';
                options.weekday = 'long';
                break;
            case 'time':
                options.hour = 'numeric';
                options.minute = 'numeric';
                break;
            case 'datetime':
                options.year = 'numeric';
                options.month = 'short';
                options.day = 'numeric';
                options.hour = 'numeric';
                options.minute = 'numeric';
                break;
        }
        
        return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (e) {
        console.error('Error formatting date:', e);
        return date.toString();
    }
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Bytes to format
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Formatted size
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Show loading state in a container
 * @param {string} containerId - ID of container
 * @param {string} message - Loading message
 */
function showLoading(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Check if loading overlay already exists
    let loadingOverlay = container.querySelector('.loading-overlay');
    
    // Create loading overlay if it doesn't exist
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="d-flex flex-column align-items-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted loading-message">${message}</p>
            </div>
        `;
        
        // Set container to relative positioning if not already
        if (window.getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }
        
        container.appendChild(loadingOverlay);
    } else {
        // Update loading message if overlay already exists
        const messageElement = loadingOverlay.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        // Display overlay
        loadingOverlay.style.display = 'flex';
    }
}

/**
 * Hide loading state in a container
 * @param {string} containerId - ID of container
 */
function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const loadingOverlay = container.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * Display confirmation dialog
 * @param {string} message - Confirmation message
 * @param {string} title - Dialog title
 * @param {Object} options - Additional options
 * @returns {Promise<boolean>} - Promise resolving to user's choice (true/false)
 */
function confirmDialog(message, title = 'Confirm', options = {}) {
    const defaults = {
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        confirmButtonClass: 'btn-primary',
        cancelButtonClass: 'btn-secondary',
        size: 'medium', // small, medium, large
        backdrop: true,
        keyboard: true
    };
    
    const config = { ...defaults, ...options };
    
    return new Promise((resolve) => {
        // Create modal element
        const modalId = `modal-${Date.now()}`;
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.tabIndex = -1;
        modal.setAttribute('aria-labelledby', `${modalId}-title`);
        modal.setAttribute('aria-hidden', 'true');
        
        // Set modal size
        let modalDialogClass = 'modal-dialog modal-dialog-centered';
        if (config.size === 'small') modalDialogClass += ' modal-sm';
        if (config.size === 'large') modalDialogClass += ' modal-lg';
        
        // Set modal content
        modal.innerHTML = `
            <div class="${modalDialogClass}">
                <div class="modal-content bg-dark text-light border-secondary">
                    <div class="modal-header border-secondary">
                        <h5 class="modal-title" id="${modalId}-title">${title}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${message}
                    </div>
                    <div class="modal-footer border-secondary">
                        <button type="button" class="btn ${config.cancelButtonClass} cancel-btn" data-bs-dismiss="modal">${config.cancelText}</button>
                        <button type="button" class="btn ${config.confirmButtonClass} confirm-btn">${config.confirmText}</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.appendChild(modal);
        
        // Initialize Bootstrap modal
        const modalInstance = new bootstrap.Modal(modal, {
            backdrop: config.backdrop,
            keyboard: config.keyboard,
            focus: true
        });
        
        // Add event listeners
        const confirmBtn = modal.querySelector('.confirm-btn');
        confirmBtn.addEventListener('click', () => {
            modalInstance.hide();
            resolve(true);
        });
        
        const cancelBtn = modal.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => {
            modalInstance.hide();
            resolve(false);
        });
        
        // Handle modal hidden event
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
        
        // Show modal
        modalInstance.show();
    });
}

/**
 * Toast notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {Object} options - Additional options
 */
function showToast(message, type = 'info', options = {}) {
    const defaults = {
        title: null,
        duration: 5000,
        position: 'top-end' // top-start, top-center, top-end, bottom-start, bottom-center, bottom-end
    };
    
    const config = { ...defaults, ...options };
    
    // Set title based on type if not provided
    if (!config.title) {
        switch (type) {
            case 'success':
                config.title = 'Success';
                break;
            case 'error':
                config.title = 'Error';
                break;
            case 'warning':
                config.title = 'Warning';
                break;
            default:
                config.title = 'Information';
        }
    }
    
    // Set icon based on type
    let icon;
    switch (type) {
        case 'success':
            icon = 'check-circle-fill';
            break;
        case 'error':
            icon = 'x-circle-fill';
            break;
        case 'warning':
            icon = 'exclamation-triangle-fill';
            break;
        default:
            icon = 'info-circle-fill';
    }
    
    // Set position classes
    let positionClasses = 'position-fixed ';
    switch (config.position) {
        case 'top-start':
            positionClasses += 'top-0 start-0 m-3';
            break;
        case 'top-center':
            positionClasses += 'top-0 start-50 translate-middle-x mt-3';
            break;
        case 'top-end':
            positionClasses += 'top-0 end-0 m-3';
            break;
        case 'bottom-start':
            positionClasses += 'bottom-0 start-0 m-3';
            break;
        case 'bottom-center':
            positionClasses += 'bottom-0 start-50 translate-middle-x mb-3';
            break;
        case 'bottom-end':
            positionClasses += 'bottom-0 end-0 m-3';
            break;
    }
    
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = `toast-container ${positionClasses}`;
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    toast.className = `toast bg-dark text-light border-${type === 'error' ? 'danger' : type} show mb-2`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Set toast content
    toast.innerHTML = `
        <div class="toast-header bg-dark text-light border-secondary">
            <i class="bi bi-${icon} text-${type === 'error' ? 'danger' : type} me-2"></i>
            <strong class="me-auto">${config.title}</strong>
            <small>Just now</small>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Set auto-hide timer
    if (config.duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toastContainer.removeChild(toast);
                // Remove container if empty
                if (toastContainer.children.length === 0) {
                    document.body.removeChild(toastContainer);
                }
            }, 300);
        }, config.duration);
    }
    
    // Add close button event listener
    const closeButton = toast.querySelector('.btn-close');
    closeButton.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
            // Remove container if empty
            if (toastContainer.children.length === 0) {
                document.body.removeChild(toastContainer);
            }
        }, 300);
    });
}

// Export globals
window.createChart = createChart;
window.formatNumber = formatNumber;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatBytes = formatBytes;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.confirmDialog = confirmDialog;
window.showToast = showToast;