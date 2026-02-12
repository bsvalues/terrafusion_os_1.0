/**
 * TerraFlow Data State Feedback System
 * A consistent way to show loading, error, and empty states
 */

class DataFeedbackManager {
  constructor() {
    this.loadingIndicators = new Map();
    this.errorHandlers = new Map();
    this.screenReaderAnnouncer = null;
    this.initializeAnnouncer();
  }
  
  initializeAnnouncer() {
    // Create screen reader announcer if not exists
    this.screenReaderAnnouncer = document.getElementById('sr-announcer');
    if (!this.screenReaderAnnouncer) {
      this.screenReaderAnnouncer = document.createElement('div');
      this.screenReaderAnnouncer.id = 'sr-announcer';
      this.screenReaderAnnouncer.setAttribute('aria-live', 'polite');
      this.screenReaderAnnouncer.className = 'visually-hidden';
      document.body.appendChild(this.screenReaderAnnouncer);
    }
  }
  
  announce(message) {
    if (this.screenReaderAnnouncer) {
      // Clear existing content and set new message
      this.screenReaderAnnouncer.textContent = '';
      
      // Use setTimeout to ensure screen readers register the change
      setTimeout(() => {
        this.screenReaderAnnouncer.textContent = message;
      }, 50);
    }
  }
  
  /**
   * Shows a loading indicator for a specific container
   * @param {string} containerId - The ID of the container to show loading in
   * @param {object} options - Options for the loading indicator
   * @param {string} options.message - The loading message to display
   * @param {boolean} options.overlay - Whether to show an overlay
   * @param {boolean} options.announce - Whether to announce to screen readers
   */
  showLoading(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const defaults = {
      message: 'Loading data...',
      overlay: true,
      announce: true
    };
    
    const settings = { ...defaults, ...options };
    
    // Check if this container already has a loading indicator
    if (this.loadingIndicators.has(containerId)) {
      // Update existing indicator
      const existing = this.loadingIndicators.get(containerId);
      existing.messageEl.textContent = settings.message;
      return;
    }
    
    // Create loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.className = 'tf-loading-indicator';
    if (settings.overlay) {
      loadingEl.classList.add('tf-loading-overlay');
    }
    
    loadingEl.innerHTML = `
      <div class="tf-loading-content">
        <div class="tf-spinner" role="status" aria-hidden="true">
          <div class="tf-spinner-circle"></div>
        </div>
        <p class="tf-loading-message">${settings.message}</p>
      </div>
    `;
    
    // Store references for future updates
    const indicator = {
      element: loadingEl,
      messageEl: loadingEl.querySelector('.tf-loading-message')
    };
    
    this.loadingIndicators.set(containerId, indicator);
    
    // Add to container
    container.classList.add('tf-loading-container');
    container.appendChild(loadingEl);
    
    // Announce to screen readers
    if (settings.announce) {
      this.announce(`Loading. ${settings.message}`);
    }
    
    return indicator;
  }
  
  /**
   * Hides the loading indicator for a specific container
   * @param {string} containerId - The ID of the container
   */
  hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (this.loadingIndicators.has(containerId)) {
      const indicator = this.loadingIndicators.get(containerId);
      
      // Add fade out class
      indicator.element.classList.add('tf-loading-fade-out');
      
      // Remove after animation
      setTimeout(() => {
        indicator.element.remove();
        container.classList.remove('tf-loading-container');
        this.loadingIndicators.delete(containerId);
      }, 300);
    }
  }
  
  /**
   * Shows an error message in a container
   * @param {string} containerId - The ID of the container
   * @param {object} options - Error display options
   * @param {string} options.message - Error message text
   * @param {string} options.title - Error title text
   * @param {boolean} options.retryButton - Whether to show retry button
   * @param {function} options.onRetry - Callback when retry button is clicked
   * @param {boolean} options.announce - Whether to announce to screen readers
   */
  showError(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Remove any loading indicators first
    this.hideLoading(containerId);
    
    const defaults = {
      message: 'There was a problem loading the data.',
      title: 'Error',
      retryButton: true,
      onRetry: null,
      announce: true
    };
    
    const settings = { ...defaults, ...options };
    
    // Create error element
    const errorEl = document.createElement('div');
    errorEl.className = 'tf-error-container';
    
    const retryButton = settings.retryButton 
      ? `<button type="button" class="btn btn-outline-primary tf-retry-button">Retry</button>` 
      : '';
    
    errorEl.innerHTML = `
      <div class="tf-error-content">
        <div class="tf-error-icon">
          <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
        </div>
        <h3 class="tf-error-title">${settings.title}</h3>
        <p class="tf-error-message">${settings.message}</p>
        ${retryButton}
      </div>
    `;
    
    // Set up retry handler
    if (settings.retryButton && typeof settings.onRetry === 'function') {
      const retryBtn = errorEl.querySelector('.tf-retry-button');
      if (retryBtn) {
        retryBtn.addEventListener('click', settings.onRetry);
      }
    }
    
    // Store error handler for this container
    this.errorHandlers.set(containerId, {
      element: errorEl,
      onRetry: settings.onRetry
    });
    
    // Add to container
    container.appendChild(errorEl);
    
    // Announce to screen readers
    if (settings.announce) {
      this.announce(`Error. ${settings.message}`);
    }
    
    return errorEl;
  }
  
  /**
   * Hides the error message for a specific container
   * @param {string} containerId - The ID of the container
   */
  hideError(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (this.errorHandlers.has(containerId)) {
      const errorInfo = this.errorHandlers.get(containerId);
      errorInfo.element.remove();
      this.errorHandlers.delete(containerId);
    }
  }
  
  /**
   * Shows an empty state message in a container
   * @param {string} containerId - The ID of the container
   * @param {object} options - Empty state display options
   * @param {string} options.message - Empty state message text
   * @param {string} options.title - Empty state title text
   * @param {string} options.icon - FontAwesome icon name (without fa-)
   * @param {boolean} options.announce - Whether to announce to screen readers
   */
  showEmpty(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Remove any loading indicators first
    this.hideLoading(containerId);
    this.hideError(containerId);
    
    const defaults = {
      message: 'No data available.',
      title: 'No Results Found',
      icon: 'search',
      announce: true
    };
    
    const settings = { ...defaults, ...options };
    
    // Create empty state element
    const emptyEl = document.createElement('div');
    emptyEl.className = 'tf-empty-container';
    
    emptyEl.innerHTML = `
      <div class="tf-empty-content">
        <div class="tf-empty-icon">
          <i class="fas fa-${settings.icon}" aria-hidden="true"></i>
        </div>
        <h3 class="tf-empty-title">${settings.title}</h3>
        <p class="tf-empty-message">${settings.message}</p>
      </div>
    `;
    
    // Add to container
    container.appendChild(emptyEl);
    
    // Announce to screen readers
    if (settings.announce) {
      this.announce(`${settings.title}. ${settings.message}`);
    }
    
    return emptyEl;
  }
  
  /**
   * Hides the empty state message for a specific container
   * @param {string} containerId - The ID of the container
   */
  hideEmpty(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const emptyEl = container.querySelector('.tf-empty-container');
    if (emptyEl) {
      emptyEl.remove();
    }
  }
  
  /**
   * Clears all feedback elements (loading, error, empty) from a container
   * @param {string} containerId - The ID of the container
   */
  clearFeedback(containerId) {
    this.hideLoading(containerId);
    this.hideError(containerId);
    this.hideEmpty(containerId);
  }
  
  /**
   * Shows a success message that automatically dismisses
   * @param {string} containerId - The ID of the container
   * @param {object} options - Success display options
   * @param {string} options.message - Success message text
   * @param {boolean} options.announce - Whether to announce to screen readers
   * @param {number} options.duration - How long to show the message (ms)
   */
  showSuccess(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const defaults = {
      message: 'Operation completed successfully.',
      announce: true,
      duration: 3000
    };
    
    const settings = { ...defaults, ...options };
    
    // Create success element
    const successEl = document.createElement('div');
    successEl.className = 'tf-success-container';
    
    successEl.innerHTML = `
      <div class="tf-success-content">
        <div class="tf-success-icon">
          <i class="fas fa-check-circle" aria-hidden="true"></i>
        </div>
        <p class="tf-success-message">${settings.message}</p>
      </div>
    `;
    
    // Add to container
    container.appendChild(successEl);
    
    // Announce to screen readers
    if (settings.announce) {
      this.announce(`Success. ${settings.message}`);
    }
    
    // Auto remove after duration
    setTimeout(() => {
      successEl.classList.add('tf-success-fade-out');
      setTimeout(() => {
        successEl.remove();
      }, 300);
    }, settings.duration);
    
    return successEl;
  }
}

// Create and export a singleton instance
const dataFeedback = new DataFeedbackManager();

// Add to window for global access
window.dataFeedback = dataFeedback;

// Add CSS for feedback elements
document.addEventListener('DOMContentLoaded', function() {
  // Dynamically create styles if they don't exist
  if (!document.getElementById('tf-feedback-styles')) {
    const style = document.createElement('style');
    style.id = 'tf-feedback-styles';
    style.textContent = `
      /* Loading indicator styles */
      .tf-loading-container {
        position: relative;
        min-height: 100px;
      }
      
      .tf-loading-indicator {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: opacity 0.3s ease;
      }
      
      .tf-loading-overlay {
        background-color: rgba(255, 255, 255, 0.8);
      }
      
      .tf-loading-content {
        text-align: center;
        padding: 20px;
      }
      
      .tf-spinner {
        width: 40px;
        height: 40px;
        margin: 0 auto 16px;
        position: relative;
      }
      
      .tf-spinner-circle {
        border: 4px solid rgba(0, 102, 255, 0.2);
        border-top-color: var(--primary-600);
        border-radius: 50%;
        width: 100%;
        height: 100%;
        animation: tf-spin 0.8s linear infinite;
      }
      
      @keyframes tf-spin {
        to { transform: rotate(360deg); }
      }
      
      .tf-loading-message {
        margin: 0;
        font-weight: 500;
        color: var(--neutral-700);
      }
      
      .tf-loading-fade-out {
        opacity: 0;
      }
      
      /* Error styles */
      .tf-error-container {
        padding: 20px;
        text-align: center;
      }
      
      .tf-error-icon {
        font-size: 48px;
        color: var(--danger-500);
        margin-bottom: 16px;
      }
      
      .tf-error-title {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 600;
      }
      
      .tf-error-message {
        margin: 0 0 16px;
        color: var(--neutral-700);
      }
      
      .tf-retry-button {
        min-width: 100px;
      }
      
      /* Empty state styles */
      .tf-empty-container {
        padding: 40px 20px;
        text-align: center;
      }
      
      .tf-empty-icon {
        font-size: 48px;
        color: var(--neutral-400);
        margin-bottom: 16px;
      }
      
      .tf-empty-title {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 600;
      }
      
      .tf-empty-message {
        margin: 0;
        color: var(--neutral-600);
      }
      
      /* Success styles */
      .tf-success-container {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--success-500);
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        z-index: 1010;
        display: flex;
        align-items: center;
        transition: opacity 0.3s ease;
      }
      
      .tf-success-content {
        display: flex;
        align-items: center;
      }
      
      .tf-success-icon {
        margin-right: 12px;
        font-size: 20px;
      }
      
      .tf-success-message {
        margin: 0;
        font-weight: 500;
      }
      
      .tf-success-fade-out {
        opacity: 0;
      }
    `;
    document.head.appendChild(style);
  }
});

// Example usage:
// dataFeedback.showLoading('data-container', { message: 'Loading properties...' });
// dataFeedback.showError('data-container', { message: 'Failed to load properties.', onRetry: loadProperties });
// dataFeedback.showEmpty('data-container', { message: 'No properties match your search criteria.' });
// dataFeedback.showSuccess('data-container', { message: 'Properties loaded successfully.' });