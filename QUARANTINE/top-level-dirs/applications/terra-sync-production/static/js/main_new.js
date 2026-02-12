/**
 * Terrafusion SyncService
 * Updated JavaScript for the modern UI
 */

// Initialize application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Bootstrap components
  initializeBootstrapComponents();
  
  // Set up real-time data updates
  setupRealTimeUpdates();
  
  // Initialize log console
  initializeLogConsole();
  
  // Check service status immediately and then periodically
  checkServiceStatus();
  setInterval(checkServiceStatus, 30000); // Every 30 seconds
  
  // Update last sync time display
  updateLastSyncTime();
});

/**
 * Initialize Bootstrap components like tooltips, popovers, toasts
 */
function initializeBootstrapComponents() {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Initialize popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.map(function(popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });
}

/**
 * Set up real-time updates for metrics and system health
 */
function setupRealTimeUpdates() {
  // Update system metrics every 10 seconds
  setInterval(function() {
    fetchSystemMetrics();
  }, 10000);
}

/**
 * Fetch and update system metrics
 */
function fetchSystemMetrics() {
  fetch('/api/metrics')
    .then(response => response.json())
    .then(data => {
      // Update CPU, memory and other resource usage displays
      updateResourceUsage(data);
      
      // Update system health indicator
      updateSystemHealth(data);
    })
    .catch(error => {
      console.error('Error fetching metrics:', error);
    });
}

/**
 * Update resource usage displays (CPU, memory, etc.)
 */
function updateResourceUsage(data) {
  // If there are elements to update
  const cpuUsageEl = document.getElementById('cpu-usage');
  const memoryUsageEl = document.getElementById('memory-usage');
  const diskUsageEl = document.getElementById('disk-usage');
  
  if (cpuUsageEl && data.cpu_usage !== undefined) {
    updateProgressBar(cpuUsageEl, data.cpu_usage);
  }
  
  if (memoryUsageEl && data.memory_usage !== undefined) {
    updateProgressBar(memoryUsageEl, data.memory_usage);
  }
  
  if (diskUsageEl && data.disk_usage !== undefined) {
    updateProgressBar(diskUsageEl, data.disk_usage);
  }
}

/**
 * Update a progress bar with the given value
 */
function updateProgressBar(element, value) {
  // Ensure value is between 0 and 100
  const safeValue = Math.min(Math.max(value, 0), 100);
  
  // Update width and text
  element.style.width = `${safeValue}%`;
  element.textContent = `${Math.round(safeValue)}%`;
  element.setAttribute('aria-valuenow', safeValue);
  
  // Update color based on value
  if (safeValue > 80) {
    element.className = 'progress-bar bg-danger';
  } else if (safeValue > 60) {
    element.className = 'progress-bar bg-warning';
  } else {
    element.className = 'progress-bar bg-success';
  }
}

/**
 * Update the system health indicator
 */
function updateSystemHealth(data) {
  const healthBadge = document.getElementById('systemHealthBadge');
  
  if (!healthBadge) return;
  
  // Calculate overall health based on metrics
  let overallHealth = 'Good';
  let badgeClass = 'good';
  
  // Example health calculation logic (customize as needed)
  if (data.cpu_usage > 90 || data.memory_usage > 90 || data.error_count > 10) {
    overallHealth = 'Critical';
    badgeClass = 'critical';
  } else if (data.cpu_usage > 70 || data.memory_usage > 70 || data.error_count > 5) {
    overallHealth = 'Warning';
    badgeClass = 'warning';
  }
  
  healthBadge.textContent = overallHealth;
  healthBadge.className = `status-badge ${badgeClass}`;
}

/**
 * Initialize the log console
 */
function initializeLogConsole() {
  // Set up WebSocket connection for real-time logs if needed
  // For now, we'll fetch logs periodically
  fetchLatestLogs();
  setInterval(fetchLatestLogs, 15000); // Every 15 seconds
}

/**
 * Fetch the latest logs from the server
 */
function fetchLatestLogs() {
  fetch('/api/logs?limit=10')
    .then(response => response.json())
    .catch(error => {
      console.error('Error fetching logs:', error);
    });
  
  // This is a placeholder - in a real implementation we would
  // update the log console with the fetched logs
}

/**
 * Add a new log entry to the console
 */
function addLogEntry(level, message) {
  const logConsole = document.querySelector('.log-console');
  if (!logConsole) return;
  
  // Create current time string
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  
  // Create a new log entry element
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${level.toLowerCase()}`;
  
  logEntry.innerHTML = `
    <span class="log-time">${timeStr}</span>
    <span class="log-level">${level.toUpperCase()}</span>
    <span class="log-message">${message}</span>
  `;
  
  // Add to the top of the console
  logConsole.prepend(logEntry);
  
  // Remove old entries if there are too many
  const entries = logConsole.querySelectorAll('.log-entry');
  if (entries.length > 100) {
    entries[entries.length - 1].remove();
  }
}

/**
 * Check the service status
 */
function checkServiceStatus() {
  fetch('/api/status')
    .then(response => response.json())
    .then(data => {
      // Update service status indicators
      updateServiceStatus(data);
      
      // Add a log entry about the status check
      if (data.status === 'healthy') {
        addLogEntry('info', 'Service health check: All systems operational');
      } else if (data.status === 'degraded') {
        addLogEntry('warning', 'Service health check: Degraded performance');
      } else {
        addLogEntry('error', 'Service health check: Service is experiencing issues');
      }
    })
    .catch(error => {
      console.error('Error checking service status:', error);
      addLogEntry('error', 'Failed to check service status');
    });
}

/**
 * Update the service status indicators
 */
function updateServiceStatus(data) {
  // This implementation depends on your specific UI layout
  // For example, update status badges for different components
}

/**
 * Show a toast notification
 */
function showToast(title, message, type = 'info') {
  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) return;
  
  // Create toast element
  const toastEl = document.createElement('div');
  toastEl.className = `toast ${type} show`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  
  // Set toast content
  toastEl.innerHTML = `
    <div class="toast-header">
      <strong class="me-auto">${title}</strong>
      <small>Just now</small>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;
  
  // Add to container
  toastContainer.appendChild(toastEl);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    toastEl.remove();
  }, 5000);
  
  // Add click handler for close button
  const closeBtn = toastEl.querySelector('.btn-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      toastEl.remove();
    });
  }
}

/**
 * Update the last sync time display
 */
function updateLastSyncTime() {
  fetch('/api/sync-operations?limit=1')
    .then(response => response.json())
    .then(data => {
      const lastSyncTimeEl = document.getElementById('lastSyncTime');
      if (!lastSyncTimeEl) return;
      
      if (data.length > 0 && data[0].completed_at) {
        // Calculate time ago
        const completedAt = new Date(data[0].completed_at);
        const timeAgo = getTimeAgo(completedAt);
        lastSyncTimeEl.textContent = timeAgo;
      } else {
        lastSyncTimeEl.textContent = 'No recent syncs';
      }
    })
    .catch(error => {
      console.error('Error fetching last sync time:', error);
    });
}

/**
 * Calculate a human-readable "time ago" string
 */
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return interval + ' years ago';
  if (interval === 1) return '1 year ago';
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return interval + ' months ago';
  if (interval === 1) return '1 month ago';
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + ' days ago';
  if (interval === 1) return '1 day ago';
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return interval + ' hours ago';
  if (interval === 1) return '1 hour ago';
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) return interval + ' minutes ago';
  if (interval === 1) return '1 minute ago';
  
  if (seconds < 10) return 'just now';
  
  return Math.floor(seconds) + ' seconds ago';
}

/**
 * Wizard navigation functions
 */
function goToWizardStep(stepNumber) {
  const wizardSteps = document.querySelectorAll('.wizard-step');
  const wizardPanels = document.querySelectorAll('.wizard-panel');
  
  // Update step indicators
  wizardSteps.forEach((step /* , index */) => {
    if (index < stepNumber - 1) {
      step.classList.add('completed');
      step.classList.remove('active');
    } else if (index === stepNumber - 1) {
      step.classList.add('active');
      step.classList.remove('completed');
    } else {
      step.classList.remove('active', 'completed');
    }
  });
  
  // Show the appropriate panel
  wizardPanels.forEach((panel /* , index */) => {
    if (index === stepNumber - 1) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });
}

/**
 * Architecture visualization functions
 * Note: This would typically use D3.js or another visualization library
 */
function initializeArchitectureVisualization() {
  // This is a placeholder for architecture visualization initialization
  // In a real implementation, this would set up D3.js or similar
  console.log('Architecture visualization initialized');
}