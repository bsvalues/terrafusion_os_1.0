/**
 * Terrafusion Platform - Real-Time Status Updates
 * 
 * This module provides real-time status updates for operations
 * such as sync jobs, exports, and system health metrics.
 */

class TerraFusionRealTimeUpdates {
  constructor(options = {}) {
    this.options = {
      pollingInterval: 5000, // 5 seconds
      enableToasts: true,
      statusIndicatorSelector: '.tf-status-indicator',
      ...options
    };
    
    this.activePollers = {};
    this.prevStatus = {};
    this.isInitialized = false;
    
    this.init();
  }
  
  init() {
    if (this.isInitialized) return;
    
    // Initialize status indicators
    this.updateAllStatusIndicators();
    
    // Set up global listeners
    window.addEventListener('visibilitychange', () => {
      // Pause polling when tab is not visible, resume when visible
      if (document.hidden) {
        this.pauseAllPollers();
      } else {
        this.resumeAllPollers();
      }
    });
    
    this.isInitialized = true;
  }
  
  /**
   * Update all status indicators on the page
   */
  updateAllStatusIndicators() {
    const indicators = document.querySelectorAll(this.options.statusIndicatorSelector);
    
    indicators.forEach(indicator => {
      const type = indicator.getAttribute('data-status-type');
      const id = indicator.getAttribute('data-status-id');
      
      if (type && id) {
        this.startPolling(type, id, (status) => {
          this.updateStatusIndicator(indicator, status);
        });
      }
    });
  }
  
  /**
   * Update a single status indicator
   */
  updateStatusIndicator(indicator, status) {
    // Get the current status class
    const currentClass = Array.from(indicator.classList)
      .find(cls => cls.startsWith('tf-status-'));
    
    // Remove the current status class
    if (currentClass) {
      indicator.classList.remove(currentClass);
    }
    
    // Add the new status class
    const newClass = this.getStatusClass(status);
    indicator.classList.add(newClass);
    
    // Update the text content
    if (indicator.tagName === 'BUTTON' || indicator.tagName === 'A') {
      // For buttons and links, find or create a span for the status
      let statusSpan = indicator.querySelector('.tf-status-text');
      if (!statusSpan) {
        statusSpan = document.createElement('span');
        statusSpan.className = 'tf-status-text';
        indicator.appendChild(statusSpan);
      }
      statusSpan.textContent = status;
    } else {
      // For other elements, just update the text
      indicator.textContent = status;
    }
    
    // Update aria attributes for accessibility
    indicator.setAttribute('aria-label', `Status: ${status}`);
  }
  
  /**
   * Get the appropriate CSS class for a status
   */
  getStatusClass(status) {
    const normalizedStatus = status.toUpperCase();
    
    switch (normalizedStatus) {
      case 'ONLINE':
      case 'CONNECTED':
      case 'SUCCESS':
      case 'COMPLETED':
      case 'UP':
        return 'tf-status-success';
        
      case 'WARNING':
      case 'PENDING':
      case 'WAITING':
        return 'tf-status-warning';
        
      case 'ERROR':
      case 'FAILED':
      case 'DOWN':
      case 'DISCONNECTED':
        return 'tf-status-error';
        
      case 'RUNNING':
      case 'PROCESSING':
      case 'IN PROGRESS':
        return 'tf-status-info';
        
      default:
        return 'tf-status-neutral';
    }
  }
  
  /**
   * Start polling for status updates
   */
  startPolling(type, id, callback) {
    const key = `${type}:${id}`;
    
    // If already polling, update the callback but keep the interval
    if (this.activePollers[key]) {
      this.activePollers[key].callback = callback;
      return;
    }
    
    // Create a new poller
    const updateFunc = () => {
      this.fetchStatus(type, id)
        .then(status => {
          // Call the callback with the status
          callback(status);
          
          // Show toast notification if status changed
          if (this.options.enableToasts && 
              window.Terrafusion && 
              window.Terrafusion.notifications &&
              this.prevStatus[key] && 
              this.prevStatus[key] !== status) {
            this.showStatusChangeNotification(type, id, this.prevStatus[key], status);
          }
          
          // Update previous status
          this.prevStatus[key] = status;
        })
        .catch(error => {
          console.error(`Error fetching status for ${type}:${id}:`, error);
        });
    };
    
    // Run immediately
    updateFunc();
    
    // Set up interval
    const intervalId = setInterval(updateFunc, this.options.pollingInterval);
    
    // Store the poller
    this.activePollers[key] = {
      type,
      id,
      callback,
      intervalId,
      isPaused: false
    };
  }
  
  /**
   * Stop polling for status updates
   */
  stopPolling(type, id) {
    const key = `${type}:${id}`;
    
    if (this.activePollers[key]) {
      clearInterval(this.activePollers[key].intervalId);
      delete this.activePollers[key];
      delete this.prevStatus[key];
    }
  }
  
  /**
   * Pause polling for status updates
   */
  pausePolling(type, id) {
    const key = `${type}:${id}`;
    
    if (this.activePollers[key] && !this.activePollers[key].isPaused) {
      clearInterval(this.activePollers[key].intervalId);
      this.activePollers[key].isPaused = true;
    }
  }
  
  /**
   * Resume polling for status updates
   */
  resumePolling(type, id) {
    const key = `${type}:${id}`;
    
    if (this.activePollers[key] && this.activePollers[key].isPaused) {
      const updateFunc = () => {
        this.fetchStatus(type, id)
          .then(status => {
            this.activePollers[key].callback(status);
            
            if (this.options.enableToasts && 
                window.Terrafusion && 
                window.Terrafusion.notifications &&
                this.prevStatus[key] && 
                this.prevStatus[key] !== status) {
              this.showStatusChangeNotification(type, id, this.prevStatus[key], status);
            }
            
            this.prevStatus[key] = status;
          })
          .catch(error => {
            console.error(`Error fetching status for ${type}:${id}:`, error);
          });
      };
      
      // Run immediately
      updateFunc();
      
      // Set up new interval
      this.activePollers[key].intervalId = setInterval(updateFunc, this.options.pollingInterval);
      this.activePollers[key].isPaused = false;
    }
  }
  
  /**
   * Pause all active pollers
   */
  pauseAllPollers() {
    Object.keys(this.activePollers).forEach(key => {
      const poller = this.activePollers[key];
      this.pausePolling(poller.type, poller.id);
    });
  }
  
  /**
   * Resume all paused pollers
   */
  resumeAllPollers() {
    Object.keys(this.activePollers).forEach(key => {
      const poller = this.activePollers[key];
      if (poller.isPaused) {
        this.resumePolling(poller.type, poller.id);
      }
    });
  }
  
  /**
   * Fetch status from the server
   */
  async fetchStatus(type, id) {
    let endpoint;
    
    switch (type) {
      case 'syncjob':
        endpoint = `/api/v1/sync-operations/status/${id}`;
        break;
      case 'gisexport':
        endpoint = `/api/v1/gis-export/status/${id}`;
        break;
      case 'system':
        endpoint = `/api/v1/system/status/${id}`;
        break;
      case 'service':
        endpoint = `/health`;
        break;
      default:
        throw new Error(`Unknown status type: ${type}`);
    }
    
    try {
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract status based on type
      switch (type) {
        case 'syncjob':
          return data.status || 'UNKNOWN';
        case 'gisexport':
          return data.status || 'UNKNOWN';
        case 'system':
          return data.status || 'UNKNOWN';
        case 'service':
          return data.status || 'UP';
        default:
          return 'UNKNOWN';
      }
    } catch (error) {
      console.error(`Error fetching status from ${endpoint}:`, error);
      return 'ERROR';
    }
  }
  
  /**
   * Show a toast notification for status changes
   */
  showStatusChangeNotification(type, id, oldStatus, newStatus) {
    if (!window.Terrafusion || !window.Terrafusion.notifications) {
      return;
    }
    
    const notificationTypes = {
      'syncjob': 'Sync Job',
      'gisexport': 'GIS Export',
      'system': 'System Component',
      'service': 'Service'
    };
    
    const typeName = notificationTypes[type] || type;
    
    let title = `${typeName} Status Changed`;
    let message = `Status changed from ${oldStatus} to ${newStatus}`;
    let notificationType = 'info';
    
    // Customize notification based on new status
    switch (newStatus.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
        title = `${typeName} Completed`;
        message = `${typeName} ID ${id} has completed successfully`;
        notificationType = 'success';
        break;
        
      case 'FAILED':
      case 'ERROR':
        title = `${typeName} Failed`;
        message = `${typeName} ID ${id} has failed`;
        notificationType = 'error';
        break;
        
      case 'RUNNING':
      case 'PROCESSING':
        title = `${typeName} Started`;
        message = `${typeName} ID ${id} is now running`;
        notificationType = 'info';
        break;
    }
    
    // Show the notification
    window.Terrafusion.notifications.show(title, message, notificationType);
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Create global instance
  const realTimeUpdates = new TerraFusionRealTimeUpdates();
  
  // Export to global namespace
  window.Terrafusion = window.Terrafusion || {};
  window.Terrafusion.realTimeUpdates = realTimeUpdates;
});