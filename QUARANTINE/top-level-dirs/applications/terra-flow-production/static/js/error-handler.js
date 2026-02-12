/**
 * Terrafusion Error Handling System
 * Provides a consistent approach to displaying and managing errors across the application
 */

class ErrorHandlingSystem {
  constructor() {
    this.errorContainers = new Map();
    this.globalErrorContainer = null;
    this.defaultOptions = {
      showIcon: true,
      showTitle: true,
      showDetails: true,
      showRetry: true,
      showDismiss: true,
      title: 'Error',
      detailsCollapsible: true,
      autoScrollToError: true,
      persistentErrors: false
    };
  }
  
  /**
   * Initialize error handling
   * @param {string} globalContainerId - The ID of the global error container (optional)
   */
  init(globalContainerId = null) {
    // Set up global error container if provided
    if (globalContainerId) {
      this.globalErrorContainer = document.getElementById(globalContainerId);
      if (!this.globalErrorContainer) {
        console.warn(`Global error container with ID ${globalContainerId} not found, creating one`);
        this.globalErrorContainer = this.createGlobalErrorContainer();
        document.body.prepend(this.globalErrorContainer);
      }
    }
    
    // Set up global error handling
    this.setupGlobalErrorHandling();
    
    // Listen for custom error events
    document.addEventListener('tf:error', (event) => {
      this.handleCustomErrorEvent(event);
    });
  }
  
  /**
   * Create a global error container
   * @returns {HTMLElement} - The created container
   */
  createGlobalErrorContainer() {
    const container = document.createElement('div');
    container.id = 'tf-global-error-container';
    container.className = 'tf-global-error-container';
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'assertive');
    return container;
  }
  
  /**
   * Set up global error handling for unhandled errors
   */
  setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      const message = error.message || 'An unexpected error occurred';
      
      // Show error in global container if available, otherwise use notifications
      if (this.globalErrorContainer) {
        this.showError(this.globalErrorContainer.id, message, {
          details: error.stack || 'No additional details available',
          source: 'Unhandled Promise Rejection'
        });
      } else if (window.terraFusionNotifications) {
        window.terraFusionNotifications.error(`Unhandled Error: ${message}`);
      }
      
      // Log error to console
      console.error('Unhandled Promise Rejection:', error);
    });
    
    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      const error = event.error;
      const message = error?.message || event.message || 'An unexpected error occurred';
      
      // Show error in global container if available, otherwise use notifications
      if (this.globalErrorContainer) {
        this.showError(this.globalErrorContainer.id, message, {
          details: `${error?.stack || 'No stack trace available'}\nFile: ${event.filename}, Line: ${event.lineno}, Column: ${event.colno}`,
          source: 'JavaScript Error'
        });
      } else if (window.terraFusionNotifications) {
        window.terraFusionNotifications.error(`JavaScript Error: ${message}`);
      }
      
      // Log error to console
      console.error('Global Error:', error || event);
    });
    
    // Handle AJAX errors if jQuery is available
    if (window.jQuery) {
      jQuery(document).ajaxError((event, jqXHR, settings, thrownError) => {
        const status = jqXHR.status;
        const responseText = jqXHR.responseText || '';
        let message = thrownError || jqXHR.statusText || 'Network Error';
        let details = `Status: ${status}\nURL: ${settings.url}\nType: ${settings.type}`;
        
        // Try to parse JSON response for more details
        try {
          const response = JSON.parse(responseText);
          if (response.error || response.message) {
            message = response.error || response.message;
          }
          if (response.details) {
            details += `\nDetails: ${response.details}`;
          }
        } catch (e) {
          // Not JSON or couldn't parse
          if (responseText) {
            details += `\nResponse: ${responseText.substring(0, 500)}`;
            if (responseText.length > 500) {
              details += '... (truncated)';
            }
          }
        }
        
        // Show error in global container if available, otherwise use notifications
        if (this.globalErrorContainer) {
          this.showError(this.globalErrorContainer.id, message, {
            details,
            source: 'AJAX Error'
          });
        } else if (window.terraFusionNotifications) {
          window.terraFusionNotifications.error(`AJAX Error: ${message}`);
        }
        
        // Log error to console
        console.error('AJAX Error:', {
          status,
          message,
          details,
          jqXHR,
          settings,
          thrownError
        });
      });
    }
    
    // Handle fetch API errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Check if response is not ok (status outside 200-299 range)
        if (!response.ok) {
          const url = args[0].url || args[0];
          let message = `HTTP ${response.status}: ${response.statusText}`;
          let details = `URL: ${url}\nMethod: ${args[1]?.method || 'GET'}`;
          
          // Try to get more error details from response
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.clone().json();
              if (errorData.error || errorData.message) {
                message = errorData.error || errorData.message;
              }
              if (errorData.details) {
                details += `\nDetails: ${errorData.details}`;
              }
            } else {
              const text = await response.clone().text();
              details += `\nResponse: ${text.substring(0, 500)}`;
              if (text.length > 500) {
                details += '... (truncated)';
              }
            }
          } catch (e) {
            // Couldn't parse response
            details += '\nCould not parse response body';
          }
          
          // Dispatch a custom error event
          const errorEvent = new CustomEvent('tf:error', {
            detail: {
              message,
              details,
              source: 'Fetch API',
              response
            }
          });
          document.dispatchEvent(errorEvent);
        }
        
        return response;
      } catch (error) {
        // Network error or other fetch failure
        const url = args[0].url || args[0];
        const message = error.message || 'Network Error';
        const details = `URL: ${url}\nMethod: ${args[1]?.method || 'GET'}\n${error.stack || ''}`;
        
        // Dispatch a custom error event
        const errorEvent = new CustomEvent('tf:error', {
          detail: {
            message,
            details,
            source: 'Fetch API',
            error
          }
        });
        document.dispatchEvent(errorEvent);
        
        throw error;
      }
    };
  }
  
  /**
   * Handle custom error events
   * @param {CustomEvent} event - The error event
   */
  handleCustomErrorEvent(event) {
    const { message, details, source, containerId } = event.detail;
    
    if (containerId) {
      // Show in specified container
      this.showError(containerId, message, {
        details,
        source
      });
    } else if (this.globalErrorContainer) {
      // Show in global container
      this.showError(this.globalErrorContainer.id, message, {
        details,
        source
      });
    } else if (window.terraFusionNotifications) {
      // Fall back to notifications
      window.terraFusionNotifications.error(`${source || 'Error'}: ${message}`);
    }
    
    // Log to console
    console.error(`${source || 'Error'}:`, message, details);
  }
  
  /**
   * Show an error in a container
   * @param {string} containerId - The ID of the container to show the error in
   * @param {string} message - The error message
   * @param {object} options - Additional options
   * @param {string} options.details - Additional error details
   * @param {string} options.source - The source of the error
   * @param {function} options.onRetry - Callback for retry button
   * @param {function} options.onDismiss - Callback for dismiss button
   * @returns {string} - The ID of the error element
   */
  showError(containerId, message, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Error container with ID ${containerId} not found`);
      return null;
    }
    
    const settings = {...this.defaultOptions, ...options};
    const errorId = `error-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.id = errorId;
    errorElement.className = 'tf-error-container alert alert-danger';
    errorElement.setAttribute('role', 'alert');
    
    let errorContent = `
      <div class="d-flex align-items-start">
        ${settings.showIcon ? '<div class="tf-error-icon me-3"><i class="fas fa-exclamation-circle fa-2x"></i></div>' : ''}
        <div class="tf-error-content flex-grow-1">
          ${settings.showTitle ? `<h5 class="tf-error-title">${settings.title}</h5>` : ''}
          <div class="tf-error-message">${message}</div>
    `;
    
    if (settings.showDetails && settings.details) {
      if (settings.detailsCollapsible) {
        errorContent += `
          <div class="tf-error-details-container mt-2">
            <button class="btn btn-sm btn-outline-danger tf-error-details-toggle" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#${errorId}-details" 
                    aria-expanded="false" 
                    aria-controls="${errorId}-details">
              Show Details
            </button>
            <div class="collapse mt-2" id="${errorId}-details">
              <div class="tf-error-details card card-body bg-danger bg-opacity-10">
                <pre class="mb-0 text-danger">${settings.details}</pre>
              </div>
            </div>
          </div>
        `;
      } else {
        errorContent += `
          <div class="tf-error-details-container mt-2">
            <div class="tf-error-details card card-body bg-danger bg-opacity-10">
              <pre class="mb-0 text-danger">${settings.details}</pre>
            </div>
          </div>
        `;
      }
    }
    
    errorContent += `
        </div>
        ${settings.showDismiss ? '<button type="button" class="btn-close tf-error-dismiss" aria-label="Close"></button>' : ''}
      </div>
    `;
    
    if (settings.showRetry && settings.onRetry) {
      errorContent += `
        <div class="tf-error-actions mt-3 text-end">
          <button class="btn btn-sm btn-danger tf-error-retry">
            <i class="fas fa-sync-alt me-1"></i> Retry
          </button>
        </div>
      `;
    }
    
    errorElement.innerHTML = errorContent;
    
    // Set up event listeners
    const setupEventListeners = () => {
      const dismissBtn = errorElement.querySelector('.tf-error-dismiss');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          this.hideError(errorId);
          if (typeof settings.onDismiss === 'function') {
            settings.onDismiss();
          }
        });
      }
      
      const retryBtn = errorElement.querySelector('.tf-error-retry');
      if (retryBtn && typeof settings.onRetry === 'function') {
        retryBtn.addEventListener('click', () => {
          if (!settings.persistentErrors) {
            this.hideError(errorId);
          }
          settings.onRetry();
        });
      }
    };
    
    // Clear existing errors if not persistent
    if (!settings.persistentErrors) {
      this.clearErrors(containerId);
    }
    
    // Add to container
    container.appendChild(errorElement);
    setupEventListeners();
    
    // Store for later reference
    this.errorContainers.set(errorId, {
      containerId,
      element: errorElement,
      settings
    });
    
    // Announce to screen readers
    if (window.terraFusionNotifications) {
      window.terraFusionNotifications.announce(`Error: ${message}`);
    }
    
    // Scroll to error if needed
    if (settings.autoScrollToError) {
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    return errorId;
  }
  
  /**
   * Hide an error
   * @param {string} errorId - The ID of the error to hide
   */
  hideError(errorId) {
    const errorInfo = this.errorContainers.get(errorId);
    if (!errorInfo) return;
    
    const { element } = errorInfo;
    
    // Fade out and remove
    element.style.transition = 'opacity 0.3s ease';
    element.style.opacity = '0';
    
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.errorContainers.delete(errorId);
    }, 300);
  }
  
  /**
   * Clear all errors in a container
   * @param {string} containerId - The ID of the container to clear errors from
   */
  clearErrors(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Find all error IDs for this container
    const errorIds = [];
    this.errorContainers.forEach((value, key) => {
      if (value.containerId === containerId) {
        errorIds.push(key);
      }
    });
    
    // Hide each error
    errorIds.forEach(id => this.hideError(id));
  }
  
  /**
   * Clear all errors
   */
  clearAllErrors() {
    const errorIds = Array.from(this.errorContainers.keys());
    errorIds.forEach(id => this.hideError(id));
  }
  
  /**
   * Show an API error from a failed request
   * @param {string} containerId - The ID of the container to show the error in
   * @param {Response|Error|Object} error - The error object
   * @param {object} options - Additional options
   * @returns {string} - The ID of the error element
   */
  async showApiError(containerId, error, options = {}) {
    let message = 'An unexpected error occurred';
    let details = '';
    
    if (error instanceof Response) {
      message = `HTTP ${error.status}: ${error.statusText}`;
      
      try {
        const contentType = error.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await error.clone().json();
          if (errorData.error || errorData.message) {
            message = errorData.error || errorData.message;
          }
          details = JSON.stringify(errorData, null, 2);
        } else {
          details = await error.clone().text();
        }
      } catch (e) {
        details = 'Could not parse error response';
      }
    } else if (error instanceof Error) {
      message = error.message || 'Network Error';
      details = error.stack || '';
    } else if (typeof error === 'object') {
      message = error.message || error.error || 'API Error';
      details = JSON.stringify(error, null, 2);
    } else if (typeof error === 'string') {
      message = error;
    }
    
    return this.showError(containerId, message, {
      details,
      source: 'API Error',
      ...options
    });
  }
  
  /**
   * Create a standard error message for a 404 Not Found
   * @param {string} containerId - The ID of the container to show the error in
   * @param {string} resourceType - The type of resource not found (e.g., 'User', 'Project')
   * @param {string} resourceId - The ID of the resource not found
   * @param {object} options - Additional options
   * @returns {string} - The ID of the error element
   */
  showNotFoundError(containerId, resourceType, resourceId, options = {}) {
    const message = `${resourceType} not found: ${resourceId}`;
    const details = `The requested ${resourceType.toLowerCase()} with ID ${resourceId} could not be found. It may have been deleted or you may not have permission to access it.`;
    
    return this.showError(containerId, message, {
      details,
      source: '404 Not Found',
      ...options
    });
  }
  
  /**
   * Create a standard error message for a validation error
   * @param {string} containerId - The ID of the container to show the error in
   * @param {object|string} validationErrors - The validation errors
   * @param {object} options - Additional options
   * @returns {string} - The ID of the error element
   */
  showValidationError(containerId, validationErrors, options = {}) {
    let message = 'Validation Error';
    let details = '';
    
    if (typeof validationErrors === 'string') {
      message = validationErrors;
    } else if (typeof validationErrors === 'object') {
      const errorCount = Object.keys(validationErrors).length;
      message = `Validation Error${errorCount > 1 ? 's' : ''} (${errorCount})`;
      
      // Format validation errors
      details = 'The following errors were found:\n\n';
      for (const [field, error] of Object.entries(validationErrors)) {
        details += `${field}: ${error}\n`;
      }
    }
    
    return this.showError(containerId, message, {
      details,
      source: 'Validation Error',
      ...options
    });
  }
  
  /**
   * Create a standard error message for an authorization error
   * @param {string} containerId - The ID of the container to show the error in
   * @param {string} message - The error message
   * @param {object} options - Additional options
   * @returns {string} - The ID of the error element
   */
  showAuthorizationError(containerId, message = 'You do not have permission to perform this action', options = {}) {
    return this.showError(containerId, message, {
      source: 'Authorization Error',
      ...options
    });
  }
}

// Create global instance
const terraFusionErrors = new ErrorHandlingSystem();

// Add to window for global access
window.terraFusionErrors = terraFusionErrors;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize with global error container if it exists
  terraFusionErrors.init('global-error-container');
});