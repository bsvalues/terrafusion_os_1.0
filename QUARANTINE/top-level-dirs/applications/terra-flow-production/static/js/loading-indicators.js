/**
 * Terrafusion Loading Indicators System
 * Provides consistent loading indicators for all data operations
 */

class LoadingIndicatorSystem {
  constructor() {
    this.activeIndicators = new Map();
    this.defaultOptions = {
      overlay: true,
      spinnerSize: 'md', // sm, md, lg
      spinnerType: 'border', // border, grow
      spinnerColor: 'primary', // primary, secondary, success, danger, warning, info
      message: 'Loading...',
      showMessage: true,
      fullscreen: false,
      zIndex: 1040,
      minDuration: 300, // Minimum display time in ms
      fadeIn: true,
      fadeOut: true
    };
  }
  
  /**
   * Show a loading indicator
   * @param {string} targetSelector - CSS selector for target container
   * @param {object} options - Loading indicator options
   * @returns {string} - Unique ID for this loading instance
   */
  show(targetSelector, options = {}) {
    const settings = {...this.defaultOptions, ...options};
    const targetElement = document.querySelector(targetSelector);
    
    if (!targetElement && !settings.fullscreen) {
      console.error(`Loading indicator target not found: ${targetSelector}`);
      return null;
    }
    
    // Generate unique ID
    const id = this.generateId();
    
    // Create loading indicator element
    const indicator = this.createIndicator(id, settings);
    
    // Show fullscreen or container indicator
    if (settings.fullscreen) {
      document.body.appendChild(indicator);
      document.body.classList.add('tf-loading-active');
    } else {
      // Store original position if not static
      const originalPosition = window.getComputedStyle(targetElement).position;
      if (originalPosition === 'static') {
        targetElement.style.position = 'relative';
      }
      
      targetElement.appendChild(indicator);
      targetElement.classList.add('tf-loading-active');
    }
    
    // Store settings and timing information
    this.activeIndicators.set(id, {
      element: indicator,
      targetElement: settings.fullscreen ? document.body : targetElement,
      settings,
      startTime: Date.now(),
      originalPosition: settings.fullscreen ? null : originalPosition
    });
    
    // Announce loading state to screen readers
    if (window.terraFusionNotifications) {
      window.terraFusionNotifications.announce(`Loading ${settings.message}`);
    }
    
    // Trigger fadeIn if enabled
    if (settings.fadeIn) {
      setTimeout(() => {
        indicator.classList.add('tf-loading-visible');
      }, 10);
    } else {
      indicator.classList.add('tf-loading-visible');
    }
    
    return id;
  }
  
  /**
   * Hide a loading indicator
   * @param {string} id - ID of the indicator to hide
   * @param {function} callback - Optional callback after hiding
   */
  hide(id, callback) {
    if (!this.activeIndicators.has(id)) {
      if (callback) callback();
      return;
    }
    
    const { element, targetElement, settings, startTime, originalPosition } = this.activeIndicators.get(id);
    
    // Calculate time displayed so far
    const currentTime = Date.now();
    const displayDuration = currentTime - startTime;
    
    // If displayed for less than minDuration, wait before hiding
    const remainingTime = Math.max(0, settings.minDuration - displayDuration);
    
    setTimeout(() => {
      const performHide = () => {
        // Remove classes
        targetElement.classList.remove('tf-loading-active');
        
        // Restore original position
        if (!settings.fullscreen && originalPosition) {
          targetElement.style.position = originalPosition;
        }
        
        // Remove element
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
        
        // Remove from active indicators
        this.activeIndicators.delete(id);
        
        // Execute callback
        if (callback) callback();
        
        // Announce to screen readers that loading is complete
        if (window.terraFusionNotifications) {
          window.terraFusionNotifications.announce('Loading complete');
        }
      };
      
      // Handle fade out
      if (settings.fadeOut) {
        element.classList.remove('tf-loading-visible');
        setTimeout(performHide, 300); // Match transition duration in CSS
      } else {
        performHide();
      }
    }, remainingTime);
  }
  
  /**
   * Update a loading indicator's message
   * @param {string} id - ID of the indicator to update
   * @param {string} message - New message to display
   */
  updateMessage(id, message) {
    if (!this.activeIndicators.has(id)) return;
    
    const { element } = this.activeIndicators.get(id);
    const messageElement = element.querySelector('.tf-loading-message');
    
    if (messageElement) {
      messageElement.textContent = message;
      
      // Announce update to screen readers
      if (window.terraFusionNotifications) {
        window.terraFusionNotifications.announce(`Loading: ${message}`);
      }
    }
  }
  
  /**
   * Show fullscreen loading indicator
   * @param {object} options - Loading indicator options
   * @returns {string} - Unique ID for this loading instance
   */
  showFullscreen(options = {}) {
    return this.show('body', {...options, fullscreen: true});
  }
  
  /**
   * Create a loading indicator element
   * @param {string} id - Unique ID for this indicator
   * @param {object} settings - Indicator settings
   * @returns {HTMLElement} - The indicator element
   */
  createIndicator(id, settings) {
    const indicator = document.createElement('div');
    indicator.className = `tf-loading-indicator${settings.overlay ? ' tf-loading-overlay' : ''}`;
    indicator.id = `tf-loading-${id}`;
    
    if (settings.zIndex) {
      indicator.style.zIndex = settings.zIndex;
    }
    
    const content = document.createElement('div');
    content.className = 'tf-loading-content';
    
    // Create spinner
    const spinner = document.createElement('div');
    spinner.className = `spinner-${settings.spinnerType} text-${settings.spinnerColor} spinner-${settings.spinnerType}-${settings.spinnerSize}`;
    spinner.setAttribute('role', 'status');
    
    const srText = document.createElement('span');
    srText.className = 'visually-hidden';
    srText.textContent = settings.message || 'Loading...';
    
    spinner.appendChild(srText);
    content.appendChild(spinner);
    
    // Add message if enabled
    if (settings.showMessage && settings.message) {
      const message = document.createElement('div');
      message.className = 'tf-loading-message mt-2';
      message.textContent = settings.message;
      content.appendChild(message);
    }
    
    indicator.appendChild(content);
    return indicator;
  }
  
  /**
   * Generate a unique ID for loading indicators
   * @returns {string} - Unique ID
   */
  generateId() {
    return `loading-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }
  
  /**
   * Hide all active loading indicators
   */
  hideAll() {
    const ids = Array.from(this.activeIndicators.keys());
    ids.forEach(id => this.hide(id));
  }
}

// Create global instance
const terraFusionLoading = new LoadingIndicatorSystem();

// Add to window for global access
window.terraFusionLoading = terraFusionLoading;