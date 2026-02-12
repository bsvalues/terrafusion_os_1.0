/**
 * ErrorHandler.js
 * 
 * Standardized error handling for the TerraMiner application
 */

class ErrorHandler {
    constructor() {
        this.errorMap = new Map();
        
        // Define common error types
        this.ERROR_TYPES = {
            NETWORK: 'network',
            API: 'api',
            AUTH: 'auth',
            VALIDATION: 'validation',
            DATABASE: 'database',
            TIMEOUT: 'timeout',
            UNKNOWN: 'unknown'
        };
        
        // Initialize error templates
        this._initErrorTemplates();
    }
    
    /**
     * Initialize error message templates for different error types
     * @private
     */
    _initErrorTemplates() {
        this.errorTemplates = {
            [this.ERROR_TYPES.NETWORK]: {
                title: 'Network Error',
                message: 'Unable to connect to the server. Please check your internet connection and try again.',
                icon: 'wifi-off',
                actionText: 'Retry'
            },
            [this.ERROR_TYPES.API]: {
                title: 'API Error',
                message: 'The server responded with an error. Please try again later.',
                icon: 'exclamation-triangle',
                actionText: 'Retry'
            },
            [this.ERROR_TYPES.AUTH]: {
                title: 'Authentication Error',
                message: 'You are not authorized to perform this action. Please sign in again.',
                icon: 'person-x',
                actionText: 'Sign In'
            },
            [this.ERROR_TYPES.VALIDATION]: {
                title: 'Validation Error',
                message: 'Please check the form for errors and try again.',
                icon: 'exclamation-circle',
                actionText: 'Fix Errors'
            },
            [this.ERROR_TYPES.DATABASE]: {
                title: 'Database Error',
                message: 'An error occurred while accessing the database. Please try again later.',
                icon: 'database-x',
                actionText: 'Retry'
            },
            [this.ERROR_TYPES.TIMEOUT]: {
                title: 'Request Timeout',
                message: 'The request took too long to complete. Please try again later.',
                icon: 'hourglass',
                actionText: 'Retry'
            },
            [this.ERROR_TYPES.UNKNOWN]: {
                title: 'Unexpected Error',
                message: 'An unexpected error occurred. Please try again later.',
                icon: 'question-circle',
                actionText: 'Retry'
            }
        };
    }
    
    /**
     * Get error type based on the error object
     * @param {Error|Object} error - The error object
     * @returns {string} - Error type
     */
    getErrorType(error) {
        if (!error) return this.ERROR_TYPES.UNKNOWN;
        
        // Network errors
        if (error instanceof TypeError && error.message.includes('NetworkError')) {
            return this.ERROR_TYPES.NETWORK;
        }
        
        if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
            return this.ERROR_TYPES.TIMEOUT;
        }
        
        // API errors
        if (error.status) {
            if (error.status === 401 || error.status === 403) {
                return this.ERROR_TYPES.AUTH;
            }
            if (error.status === 422 || error.status === 400) {
                return this.ERROR_TYPES.VALIDATION;
            }
            if (error.status >= 500) {
                return this.ERROR_TYPES.API;
            }
        }
        
        // Error messages related to database
        if (error.message && (
            error.message.includes('database') || 
            error.message.includes('query') || 
            error.message.includes('SQL')
        )) {
            return this.ERROR_TYPES.DATABASE;
        }
        
        return this.ERROR_TYPES.UNKNOWN;
    }
    
    /**
     * Display error message in the specified container
     * @param {string} containerId - The ID of the container to display the error
     * @param {Error|Object} error - The error object
     * @param {Function} retryFn - Function to call when retry button is clicked
     */
    showError(containerId, error, retryFn = null) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Error container with ID '${containerId}' not found.`);
            return;
        }
        
        // Get error type and template
        const errorType = this.getErrorType(error);
        const template = this.errorTemplates[errorType];
        
        // Create error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message p-4 text-center';
        
        // Get error details for display
        let errorDetails = '';
        if (error) {
            if (error.message) errorDetails += error.message + '\n';
            if (error.stack) errorDetails += error.stack;
            if (error.response && error.response.data) {
                try {
                    errorDetails += JSON.stringify(error.response.data, null, 2);
                } catch (e) {
                    errorDetails += String(error.response.data);
                }
            }
        }
        
        // Create error content
        errorMessage.innerHTML = `
            <div class="error-icon mb-3">
                <i class="bi bi-${template.icon} text-danger" style="font-size: 3rem;"></i>
            </div>
            <h4 class="error-title mb-2">${template.title}</h4>
            <p class="error-message text-muted mb-3">${template.message}</p>
        `;
        
        // Add technical details if available
        if (errorDetails) {
            const detailsId = `error-details-${containerId}`;
            const detailsSection = document.createElement('div');
            detailsSection.className = 'error-details mb-4';
            detailsSection.innerHTML = `
                <div class="d-grid gap-2 col-md-6 mx-auto">
                    <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="collapse" 
                           data-bs-target="#${detailsId}" aria-expanded="false">
                        Show Technical Details
                    </button>
                </div>
                <div class="collapse mt-2" id="${detailsId}">
                    <div class="card card-body text-start bg-dark">
                        <pre class="mb-0 text-danger"><code>${errorDetails}</code></pre>
                    </div>
                </div>
            `;
            errorMessage.appendChild(detailsSection);
        }
        
        // Add retry button if retry function provided
        if (retryFn && typeof retryFn === 'function') {
            const retryButton = document.createElement('button');
            retryButton.type = 'button';
            retryButton.className = 'btn btn-primary retry-button';
            retryButton.textContent = template.actionText;
            retryButton.addEventListener('click', retryFn);
            errorMessage.appendChild(retryButton);
        }
        
        // Clear container and append error message
        container.innerHTML = '';
        container.appendChild(errorMessage);
        
        // Store error in map
        this.errorMap.set(containerId, {
            error,
            timestamp: new Date(),
            type: errorType
        });
        
        // Log error to console
        console.error(`[${errorType.toUpperCase()}]`, error);
    }
    
    /**
     * Clear error message from the specified container
     * @param {string} containerId - The ID of the container
     */
    clearError(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            const errorMessage = container.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        }
        
        // Remove from error map
        this.errorMap.delete(containerId);
    }
    
    /**
     * Handle fetch request errors
     * @param {Response} response - The fetch Response object
     * @throws {Object} - Throws an error object with status and message
     */
    handleFetchResponse(response) {
        if (!response.ok) {
            const error = new Error(`HTTP error ${response.status}: ${response.statusText}`);
            error.status = response.status;
            throw error;
        }
        return response;
    }
}

// Create global error handler instance
const errorHandler = new ErrorHandler();

/**
 * Fetch wrapper with error handling
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {string} errorContainerId - Container ID for displaying errors
 * @returns {Promise} - Promise resolving to the JSON response
 */
async function fetchWithErrorHandling(url, options = {}, errorContainerId = null) {
    try {
        // Clear any previous error
        if (errorContainerId) {
            errorHandler.clearError(errorContainerId);
        }
        
        // Add default headers
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        // Add timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(url, {
            ...defaultOptions,
            ...options,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Handle HTTP errors
        errorHandler.handleFetchResponse(response);
        
        // Parse JSON response
        return await response.json();
    } catch (error) {
        // Display error if container ID provided
        if (errorContainerId) {
            errorHandler.showError(errorContainerId, error, () => {
                // Retry function
                fetchWithErrorHandling(url, options, errorContainerId)
                    .catch(e => console.error('Error during retry:', e));
            });
        }
        
        // Re-throw the error for caller handling
        throw error;
    }
}

/**
 * Handle form submission errors
 * @param {HTMLFormElement} form - The form element
 * @param {Object} validationErrors - Validation errors object (field -> error message)
 */
function handleFormErrors(form, validationErrors) {
    // Clear previous errors
    form.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
    
    form.querySelectorAll('.invalid-feedback').forEach(el => {
        el.remove();
    });
    
    // Display new errors
    for (const [field, message] of Object.entries(validationErrors)) {
        const input = form.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.add('is-invalid');
            
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = message;
            
            input.parentNode.appendChild(feedback);
        }
    }
}

// Export globals
window.errorHandler = errorHandler;
window.fetchWithErrorHandling = fetchWithErrorHandling;
window.handleFormErrors = handleFormErrors;