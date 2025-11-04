/**
 * Terrafusion Unified Notification System
 * Provides a consistent system for displaying toast notifications across the application
 */

class NotificationSystem {
  constructor() {
    this.container = null;
    this.screenReaderAnnouncer = null;
    this.notificationQueue = [];
    this.isProcessing = false;
    this.defaultDuration = 5000; // 5 seconds
    this.maxVisible = 3;
    this.visibleCount = 0;
    
    this.init();
  }
  
  init() {
    // Create container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-notification-container';
      this.container.className = 'toast-container position-fixed top-0 end-0 p-3';
      this.container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.container);
    }
    
    // Create screen reader announcer if not exists
    if (!this.screenReaderAnnouncer) {
      this.screenReaderAnnouncer = document.getElementById('sr-announcer');
      if (!this.screenReaderAnnouncer) {
        this.screenReaderAnnouncer = document.createElement('div');
        this.screenReaderAnnouncer.id = 'sr-announcer';
        this.screenReaderAnnouncer.setAttribute('aria-live', 'polite');
        this.screenReaderAnnouncer.className = 'visually-hidden';
        document.body.appendChild(this.screenReaderAnnouncer);
      }
    }
  }
  
  /**
   * Show a notification
   * @param {object} options - Notification options
   * @param {string} options.message - The message to show
   * @param {string} options.type - Type of notification (success, error, warning, info)
   * @param {number} options.duration - How long to show the notification
   * @param {boolean} options.dismissible - If the notification can be dismissed
   * @param {string} options.icon - Optional icon class
   * @param {function} options.onClose - Callback when notification closes
   */
  show(options) {
    const defaults = {
      message: '',
      type: 'info',
      duration: this.defaultDuration,
      dismissible: true,
      icon: null,
      onClose: null
    };
    
    const settings = {...defaults, ...options};
    
    // Add to queue and process
    this.notificationQueue.push(settings);
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
    
    // Announce to screen readers
    this.announce(settings.type + ': ' + settings.message);
  }
  
  processQueue() {
    if (this.notificationQueue.length === 0 || this.visibleCount >= this.maxVisible) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    
    // Get next notification
    const settings = this.notificationQueue.shift();
    
    // Create the toast element
    const toast = this.createToastElement(settings);
    
    // Add to container
    this.container.appendChild(toast);
    this.visibleCount++;
    
    // Initialize the Bootstrap toast
    const bsToast = new bootstrap.Toast(toast, {
      autohide: settings.duration > 0,
      delay: settings.duration
    });
    
    // Show the toast
    bsToast.show();
    
    // Set up event listeners
    toast.addEventListener('hidden.bs.toast', () => {
      // Remove from DOM after hiding
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      
      // Decrease visible count
      this.visibleCount--;
      
      // Call onClose callback if provided
      if (typeof settings.onClose === 'function') {
        settings.onClose();
      }
      
      // Continue processing queue
      this.processQueue();
    });
  }
  
  createToastElement(settings) {
    const toast = document.createElement('div');
    toast.className = `toast tf-toast tf-toast-${settings.type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    const iconClass = settings.icon || this.getIconClassForType(settings.type);
    
    toast.innerHTML = `
      <div class="toast-header">
        <i class="${iconClass} me-2"></i>
        <strong class="me-auto">${this.getTitleForType(settings.type)}</strong>
        <small>${this.getTimeString()}</small>
        ${settings.dismissible ? '<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>' : ''}
      </div>
      <div class="toast-body">
        ${settings.message}
      </div>
    `;
    
    return toast;
  }
  
  getIconClassForType(type) {
    switch (type) {
      case 'success': return 'fas fa-check-circle text-success';
      case 'error': return 'fas fa-exclamation-circle text-danger';
      case 'warning': return 'fas fa-exclamation-triangle text-warning';
      case 'info': 
      default: return 'fas fa-info-circle text-info';
    }
  }
  
  getTitleForType(type) {
    switch (type) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      case 'info': 
      default: return 'Information';
    }
  }
  
  getTimeString() {
    const now = new Date();
    return now.toLocaleTimeString();
  }
  
  /**
   * Show a success notification
   * @param {string} message - The message to show
   * @param {object} options - Additional options
   */
  success(message, options = {}) {
    this.show({...options, message, type: 'success'});
  }
  
  /**
   * Show an error notification
   * @param {string} message - The message to show
   * @param {object} options - Additional options
   */
  error(message, options = {}) {
    // Set longer duration for errors by default
    const errorOptions = {duration: 8000, ...options};
    this.show({...errorOptions, message, type: 'error'});
  }
  
  /**
   * Show a warning notification
   * @param {string} message - The message to show
   * @param {object} options - Additional options
   */
  warning(message, options = {}) {
    this.show({...options, message, type: 'warning'});
  }
  
  /**
   * Show an info notification
   * @param {string} message - The message to show
   * @param {object} options - Additional options
   */
  info(message, options = {}) {
    this.show({...options, message, type: 'info'});
  }
  
  /**
   * Announce a message to screen readers
   * @param {string} message - The message to announce
   */
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
   * Clear all notifications
   */
  clearAll() {
    // Clear queue
    this.notificationQueue = [];
    
    // Remove all visible toasts
    const toasts = this.container.querySelectorAll('.toast');
    toasts.forEach(toast => {
      const bsToast = bootstrap.Toast.getInstance(toast);
      if (bsToast) {
        bsToast.hide();
      }
    });
    
    this.visibleCount = 0;
    this.isProcessing = false;
  }
}

// Create global instance
const terraFusionNotifications = new NotificationSystem();

// Add to window for global access
window.terraFusionNotifications = terraFusionNotifications;