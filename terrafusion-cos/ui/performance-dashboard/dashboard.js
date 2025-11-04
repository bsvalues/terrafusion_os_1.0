/**
 * TerraFusion cOS - Championship Performance Monitor Dashboard
 * Real-time performance monitoring and visualization
 */

const API_BASE_URL = 'http://localhost:8090/api';
const REFRESH_INTERVAL = 5000; // 5 seconds
const MAX_ACTIVITY_ITEMS = 50;

// Dashboard state
let dashboard = {
  performanceData: null,
  alerts: [],
  activityFeed: [],
  refreshTimer: null,
  currentAlertFilter: 'all',
};

/**
 * Initialize the dashboard
 */
async function initializeDashboard() {
  console.log('🚀 Initializing Championship Performance Monitor Dashboard...');

  // Initial data load
  await refreshDashboard();

  // Set up periodic refresh
  dashboard.refreshTimer = setInterval(refreshDashboard, REFRESH_INTERVAL);

  // Set up event listeners
  setupEventListeners();

  console.log('✅ Dashboard initialized successfully');
}

/**
 * Refresh all dashboard data
 */
async function refreshDashboard() {
  try {
    // Fetch performance status
    const statusResponse = await fetch(`${API_BASE_URL}/performance/status`);
    if (statusResponse.ok) {
      dashboard.performanceData = await statusResponse.json();
      updatePerformanceMetrics();
      updateServiceCards();
    }

    // Fetch alerts
    const alertsResponse = await fetch(`${API_BASE_URL}/performance/alerts`);
    if (alertsResponse.ok) {
      const alertsData = await alertsResponse.json();
      dashboard.alerts = alertsData.alerts || [];
      updateAlertsSection();
    }

    // Update last updated timestamp
    updateLastUpdatedTime();
  } catch (error) {
    console.error('Error refreshing dashboard:', error);
    showToast('Error refreshing dashboard data', 'error');
  }
}

/**
 * Update performance metrics display
 */
function updatePerformanceMetrics() {
  const data = dashboard.performanceData;
  if (!data) return;

  // Update system status
  const systemStatus = document.getElementById('systemStatus');
  const statusClass = getPerformanceLevelClass(data.performance_level);
  systemStatus.className = `status-indicator ${statusClass}`;
  systemStatus.querySelector('.status-text').textContent = data.performance_level;

  // Update P95 Latency
  const p95Value = data.p95_latency_ms || 0;
  document.getElementById('p95Latency').textContent = p95Value.toFixed(2);

  const p95Status = document.getElementById('p95Status');
  const p95Class = p95Value < 10 ? 'championship' : p95Value < 50 ? 'elite' : 'warning';
  p95Status.className = `metric-status ${p95Class}`;
  p95Status.querySelector('.status-label').textContent =
    p95Value < 10 ? 'Championship' : p95Value < 50 ? 'Elite' : 'Warning';

  // Update Uptime
  const uptimePercent = data.uptime_percentage || 100;
  document.getElementById('uptimeValue').textContent = uptimePercent.toFixed(3);
  document.getElementById('uptimeBarFill').style.width = `${uptimePercent}%`;

  const uptimeStatus = document.getElementById('uptimeStatus');
  const uptimeClass =
    uptimePercent >= 99.999 ? 'championship' : uptimePercent >= 99.9 ? 'elite' : 'warning';
  uptimeStatus.className = `metric-status ${uptimeClass}`;
  uptimeStatus.querySelector('.status-label').textContent =
    uptimePercent >= 99.999 ? 'Championship' : uptimePercent >= 99.9 ? 'Elite' : 'Warning';

  // Calculate uptime/downtime hours
  const totalMinutes = data.total_operations || 0;
  const uptimeHours = Math.floor((totalMinutes * (uptimePercent / 100)) / 60);
  const downtimeMinutes = Math.floor(totalMinutes * (1 - uptimePercent / 100));
  document.getElementById('uptimeHours').textContent = `${uptimeHours}h`;
  document.getElementById('downtimeMinutes').textContent = `${downtimeMinutes}m`;

  // Update Error Rate
  const errorRate = data.error_rate || 0;
  document.getElementById('errorRate').textContent = errorRate.toFixed(3);

  const errorStatus = document.getElementById('errorStatus');
  const errorClass = errorRate < 0.1 ? 'excellent' : errorRate < 1 ? 'warning' : 'degraded';
  errorStatus.className = `metric-status ${errorClass}`;
  errorStatus.querySelector('.status-label').textContent =
    errorRate < 0.1 ? 'Excellent' : errorRate < 1 ? 'Warning' : 'Degraded';

  const successCount = data.successful_operations || 0;
  const failureCount = data.failed_operations || 0;
  document.getElementById('successCount').textContent = successCount.toLocaleString();
  document.getElementById('failureCount').textContent = failureCount.toLocaleString();

  // Update Response Times
  document.getElementById('p50Latency').textContent = `${(data.p50_latency_ms || 0).toFixed(2)}ms`;
  document.getElementById('p95Latency2').textContent = `${(data.p95_latency_ms || 0).toFixed(2)}ms`;
  document.getElementById('p99Latency').textContent = `${(data.p99_latency_ms || 0).toFixed(2)}ms`;
  document.getElementById('maxLatency').textContent = `${(data.max_latency_ms || 0).toFixed(2)}ms`;
}

/**
 * Update service health cards
 */
function updateServiceCards() {
  const data = dashboard.performanceData;
  if (!data || !data.service_stats) return;

  const servicesGrid = document.getElementById('servicesGrid');
  servicesGrid.innerHTML = '';

  for (const [serviceName, stats] of Object.entries(data.service_stats)) {
    const serviceCard = createServiceCard(serviceName, stats);
    servicesGrid.appendChild(serviceCard);
  }
}

/**
 * Create a service health card
 */
function createServiceCard(serviceName, stats) {
  const card = document.createElement('div');
  card.className = `service-card ${stats.status === 'degraded' ? 'degraded' : ''}`;

  const statusBadge = stats.status === 'running' ? 'running' : 'degraded';
  const statusText = stats.status || 'UNKNOWN';

  card.innerHTML = `
        <div class="service-header">
            <div class="service-name">${serviceName}</div>
            <span class="service-status-badge ${statusBadge}">${statusText}</span>
        </div>
        <div class="service-metrics">
            <div class="service-metric">
                <span>Operations:</span>
                <strong>${(stats.operation_count || 0).toLocaleString()}</strong>
            </div>
            <div class="service-metric">
                <span>Avg Latency:</span>
                <strong>${(stats.avg_latency_ms || 0).toFixed(2)}ms</strong>
            </div>
            <div class="service-metric">
                <span>P95 Latency:</span>
                <strong>${(stats.p95_latency_ms || 0).toFixed(2)}ms</strong>
            </div>
            <div class="service-metric">
                <span>Error Rate:</span>
                <strong>${(stats.error_rate || 0).toFixed(2)}%</strong>
            </div>
        </div>
    `;

  return card;
}

/**
 * Update alerts section
 */
function updateAlertsSection() {
  const alertsContainer = document.getElementById('alertsContainer');

  // Filter alerts based on current filter
  let filteredAlerts = dashboard.alerts;
  if (dashboard.currentAlertFilter !== 'all') {
    filteredAlerts = dashboard.alerts.filter(
      alert => alert.severity.toLowerCase() === dashboard.currentAlertFilter
    );
  }

  if (filteredAlerts.length === 0) {
    alertsContainer.innerHTML = `
            <div class="no-alerts">
                <span class="success-icon">✅</span>
                <p>No active alerts - System running optimally!</p>
            </div>
        `;
    return;
  }

  alertsContainer.innerHTML = '';
  filteredAlerts.forEach(alert => {
    const alertItem = createAlertItem(alert);
    alertsContainer.appendChild(alertItem);
  });
}

/**
 * Create an alert item element
 */
function createAlertItem(alert) {
  const item = document.createElement('div');
  item.className = `alert-item ${alert.severity.toLowerCase()}`;

  const timestamp = new Date(alert.timestamp).toLocaleTimeString();

  item.innerHTML = `
        <div class="alert-header">
            <span class="alert-severity">${alert.severity}</span>
            <span class="alert-time">${timestamp}</span>
        </div>
        <div class="alert-message">${alert.message}</div>
        <div class="alert-details">
            Service: ${alert.service} | Metric: ${alert.metric_name} |
            Value: ${alert.current_value} | Threshold: ${alert.threshold}
        </div>
    `;

  return item;
}

/**
 * Get CSS class for performance level
 */
function getPerformanceLevelClass(level) {
  const levelMap = {
    CHAMPIONSHIP: 'championship',
    ELITE: 'elite',
    EXCELLENT: 'excellent',
    GOOD: 'warning',
    DEGRADED: 'degraded',
  };
  return levelMap[level] || 'warning';
}

/**
 * Update last updated timestamp
 */
function updateLastUpdatedTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  document.getElementById('lastUpdated').textContent = timeString;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Alert filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(b => b.classList.remove('active'));

      // Add active class to clicked button
      btn.classList.add('active');

      // Update filter and refresh alerts
      dashboard.currentAlertFilter = btn.dataset.severity;
      updateAlertsSection();
    });
  });
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-message">${message}</div>`;

  toastContainer.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/**
 * Add activity to feed
 */
function addActivityItem(service, action) {
  const now = new Date();
  const timeString = now.toLocaleTimeString();

  const activity = {
    timestamp: now,
    service: service,
    action: action,
  };

  dashboard.activityFeed.unshift(activity);

  // Keep only last MAX_ACTIVITY_ITEMS
  if (dashboard.activityFeed.length > MAX_ACTIVITY_ITEMS) {
    dashboard.activityFeed = dashboard.activityFeed.slice(0, MAX_ACTIVITY_ITEMS);
  }

  updateActivityFeed();
}

/**
 * Update activity feed display
 */
function updateActivityFeed() {
  const activityFeed = document.getElementById('activityFeed');

  if (dashboard.activityFeed.length === 0) {
    activityFeed.innerHTML = '<div class="no-alerts"><p>No recent activity</p></div>';
    return;
  }

  activityFeed.innerHTML = '';
  dashboard.activityFeed.slice(0, 20).forEach(activity => {
    const item = document.createElement('div');
    item.className = 'activity-item';

    const timeString = activity.timestamp.toLocaleTimeString();

    item.innerHTML = `
            <span class="activity-time">${timeString}</span>
            <span class="activity-service">${activity.service}</span>
            ${activity.action}
        `;

    activityFeed.appendChild(item);
  });
}

/**
 * Handle page unload
 */
window.addEventListener('beforeunload', () => {
  if (dashboard.refreshTimer) {
    clearInterval(dashboard.refreshTimer);
  }
});

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', initializeDashboard);
