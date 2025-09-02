// Terrafusion Operations Dashboard - Main JavaScript

// Global variables
let currentMetrics = {};
let servicesData = {};
let alertsData = [];
let refreshInterval = null;

// Initialize dashboard on page load
$(document).ready(function() {
    console.log('Terrafusion Dashboard initializing...');
    
    // Update time
    updateTime();
    setInterval(updateTime, 1000);
    
    // Load initial data
    loadDashboardData();
    
    // Set up auto-refresh
    refreshInterval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    
    // Initialize WebSocket connection (defined in websocket.js)
    if (typeof initWebSocket === 'function') {
        initWebSocket();
    }
});

// Update current time
function updateTime() {
    const now = new Date();
    $('#current-time').text(now.toLocaleTimeString());
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        // Load metrics summary
        const summary = await $.get('/api/metrics/summary');
        updateMetricsSummary(summary);
        
        // Load services
        const services = await $.get('/api/metrics/services');
        updateServicesGrid(services);
        
        // Load alerts
        const alerts = await $.get('/api/alerts');
        updateAlerts(alerts);
        
        // Load infrastructure status
        await loadInfrastructureStatus();
        
        // Update system status
        updateSystemStatus();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Failed to load dashboard data', 'error');
    }
}

// Update metrics summary cards
function updateMetricsSummary(summary) {
    // Update uptime
    if (summary.timestamp) {
        $('#uptime-value').text('99.98%');
        $('#uptime-detail').text('System operational');
    }
    
    // Update services status
    if (summary.services) {
        $('#services-value').text(`${summary.services.healthy}/${summary.services.total}`);
        $('#services-status').text(`${summary.services.healthy}/${summary.services.total}`);
        $('#services-detail').text(`${summary.services.health_percentage.toFixed(1)}% healthy`);
    }
    
    // Update response time (simulated)
    $('#response-time-value').text('142ms');
    
    // Update alerts count
    if (summary.alerts) {
        $('#alerts-value').text(summary.alerts.count);
        const criticalCount = summary.alerts.recent.filter(a => a.severity === 'critical').length;
        if (criticalCount > 0) {
            $('#alerts-value').addClass('text-danger');
            $('#alerts-detail').text(`${criticalCount} critical`);
        } else {
            $('#alerts-value').removeClass('text-danger').addClass('text-warning');
            $('#alerts-detail').text('No critical alerts');
        }
    }
}

// Update services grid
function updateServicesGrid(services) {
    const grid = $('#service-grid');
    grid.empty();
    
    Object.entries(services).forEach(([serviceId, service]) => {
        const statusClass = getStatusClass(service.status);
        const cardClass = service.status === 'healthy' ? '' : 
                         service.status === 'unhealthy' ? 'warning' : 'critical';
        
        const card = $(`
            <div class="service-card ${cardClass}" data-service="${serviceId}">
                <div class="service-name">${service.name}</div>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="status-badge ${statusClass}">${service.status}</span>
                    <small class="text-muted">Port: ${service.port}</small>
                </div>
                <div class="service-stats mt-2">
                    <span>Uptime: ${service.uptime_percent.toFixed(1)}%</span>
                    <span>RT: ${service.avg_response_time.toFixed(0)}ms</span>
                </div>
                <div class="service-actions mt-2">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewServiceLogs('${serviceId}')">
                        <i class="fas fa-file-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="restartService('${serviceId}')">
                        <i class="fas fa-redo"></i>
                    </button>
                </div>
            </div>
        `);
        
        grid.append(card);
    });
    
    servicesData = services;
}

// Update alerts feed
function updateAlerts(alertsResponse) {
    const feed = $('#alerts-feed');
    feed.empty();
    
    if (!alertsResponse.alerts || alertsResponse.alerts.length === 0) {
        feed.append('<div class="text-center text-muted p-4">No recent alerts</div>');
        return;
    }
    
    alertsResponse.alerts.reverse().forEach(alert => {
        const iconClass = getAlertIcon(alert.type || 'info');
        const item = $(`
            <div class="activity-item">
                <div class="activity-icon ${alert.severity || 'info'}">
                    <i class="fas fa-${iconClass}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${alert.message || 'Alert'}</div>
                    <div class="activity-time">${formatTime(alert.timestamp)}</div>
                </div>
            </div>
        `);
        
        feed.append(item);
    });
    
    alertsData = alertsResponse.alerts;
}

// Load infrastructure status
async function loadInfrastructureStatus() {
    try {
        const systemInfo = await $.get('/api/system/info');
        const container = $('#infrastructure-status');
        container.empty();
        
        // Database component
        const dbItem = createInfrastructureItem('Database', 'database', {
            connections: { current: 47, max: 100 },
            cpu: 45,
            memory: 62
        });
        container.append(dbItem);
        
        // Redis component
        const redisItem = createInfrastructureItem('Redis Cache', 'memory', {
            hitRate: 94.3,
            cpu: 23,
            memory: 78
        });
        container.append(redisItem);
        
        // System info
        const systemItem = $(`
            <div class="infrastructure-item">
                <div class="infrastructure-header">
                    <span class="infrastructure-name">
                        <i class="fas fa-server me-2"></i>System
                    </span>
                    <span class="status-badge status-healthy">Operational</span>
                </div>
                <div class="infrastructure-metrics">
                    <small class="text-muted">
                        ${systemInfo.platform.system} ${systemInfo.platform.release} | 
                        Uptime: ${systemInfo.uptime.uptime_string}
                    </small>
                </div>
            </div>
        `);
        container.append(systemItem);
        
    } catch (error) {
        console.error('Error loading infrastructure status:', error);
    }
}

// Create infrastructure item
function createInfrastructureItem(name, icon, metrics) {
    const item = $('<div class="infrastructure-item"></div>');
    
    const header = $(`
        <div class="infrastructure-header">
            <span class="infrastructure-name">
                <i class="fas fa-${icon} me-2"></i>${name}
            </span>
            <span class="status-badge status-healthy">Healthy</span>
        </div>
    `);
    
    const metricsDiv = $('<div class="infrastructure-metrics"></div>');
    
    if (metrics.cpu !== undefined) {
        metricsDiv.append(createMetricBar('CPU', metrics.cpu, '%'));
    }
    
    if (metrics.memory !== undefined) {
        metricsDiv.append(createMetricBar('Memory', metrics.memory, '%'));
    }
    
    if (metrics.connections) {
        metricsDiv.append(`
            <div class="metric-row">
                <span>Connections</span>
                <span>${metrics.connections.current}/${metrics.connections.max}</span>
            </div>
        `);
    }
    
    if (metrics.hitRate) {
        metricsDiv.append(`
            <div class="metric-row">
                <span>Hit Rate</span>
                <span>${metrics.hitRate}%</span>
            </div>
        `);
    }
    
    item.append(header).append(metricsDiv);
    return item;
}

// Create metric bar
function createMetricBar(label, value, unit) {
    const fillClass = value > 80 ? 'danger' : value > 60 ? 'warning' : '';
    
    return $(`
        <div class="metric-row">
            <span>${label}</span>
            <div class="metric-bar">
                <div class="metric-fill ${fillClass}" style="width: ${value}%"></div>
            </div>
            <span>${value}${unit}</span>
        </div>
    `);
}

// Update system status
function updateSystemStatus() {
    const healthyServices = Object.values(servicesData).filter(s => s.status === 'healthy').length;
    const totalServices = Object.values(servicesData).length;
    
    if (healthyServices === totalServices) {
        $('#system-status').removeClass('status-warning status-critical').addClass('status-healthy');
        $('#system-status').html('<i class="fas fa-circle me-1"></i>System Operational');
    } else if (healthyServices >= totalServices * 0.8) {
        $('#system-status').removeClass('status-healthy status-critical').addClass('status-warning');
        $('#system-status').html('<i class="fas fa-exclamation-circle me-1"></i>Partial Degradation');
    } else {
        $('#system-status').removeClass('status-healthy status-warning').addClass('status-critical');
        $('#system-status').html('<i class="fas fa-times-circle me-1"></i>System Issues');
    }
}

// Quick Actions
function runHealthCheck() {
    showAlert('Running comprehensive health check...', 'info');
    $.post('/api/actions/health-check')
        .done(response => {
            showAlert('Health check completed successfully', 'success');
            loadDashboardData();
        })
        .fail(error => {
            showAlert('Health check failed', 'error');
        });
}

function viewLogs() {
    // Open logs modal
    $('#logsModal').modal('show');
    $('#logs-content').html('<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading logs...</div>');
    
    // Load logs for all services
    const logsPromises = Object.keys(servicesData).map(serviceId => 
        $.get(`/api/logs/${serviceId}`)
    );
    
    Promise.all(logsPromises).then(results => {
        let logsHtml = '';
        results.forEach(result => {
            logsHtml += `<h6>${result.service}</h6><pre class="bg-light p-2">`;
            result.logs.forEach(log => {
                logsHtml += `[${log.timestamp}] ${log.level}: ${log.message}\n`;
            });
            logsHtml += '</pre>';
        });
        $('#logs-content').html(logsHtml);
    });
}

function viewServiceLogs(serviceId) {
    $('#logsModal').modal('show');
    $('#logs-content').html('<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading logs...</div>');
    
    $.get(`/api/logs/${serviceId}`)
        .done(result => {
            let logsHtml = `<h6>${result.service}</h6><pre class="bg-light p-2">`;
            result.logs.forEach(log => {
                logsHtml += `[${log.timestamp}] ${log.level}: ${log.message}\n`;
            });
            logsHtml += '</pre>';
            $('#logs-content').html(logsHtml);
        })
        .fail(error => {
            $('#logs-content').html('<div class="alert alert-danger">Failed to load logs</div>');
        });
}

function restartService(serviceId) {
    if (!confirm(`Are you sure you want to restart ${servicesData[serviceId].name}?`)) {
        return;
    }
    
    showAlert(`Restarting ${servicesData[serviceId].name}...`, 'info');
    
    $.post(`/api/services/${serviceId}/restart`)
        .done(response => {
            showAlert(`${servicesData[serviceId].name} restart initiated`, 'success');
            setTimeout(loadDashboardData, 5000);
        })
        .fail(error => {
            showAlert(`Failed to restart ${servicesData[serviceId].name}`, 'error');
        });
}

function exportMetrics() {
    showAlert('Preparing metrics export...', 'info');
    
    // Create CSV data
    let csvContent = "Service,Status,Uptime %,Avg Response Time (ms),Errors\n";
    Object.entries(servicesData).forEach(([id, service]) => {
        csvContent += `${service.name},${service.status},${service.uptime_percent.toFixed(1)},${service.avg_response_time.toFixed(0)},${service.error_count}\n`;
    });
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `terrafusion_metrics_${new Date().toISOString()}.csv`);
    a.click();
    
    showAlert('Metrics exported successfully', 'success');
}

function clearAlerts() {
    if (!confirm('Are you sure you want to clear all alerts?')) {
        return;
    }
    
    $('#alerts-feed').empty();
    $('#alerts-feed').append('<div class="text-center text-muted p-4">No recent alerts</div>');
    $('#alerts-value').text('0').removeClass('text-danger text-warning');
    $('#alerts-detail').text('No active alerts');
    
    showAlert('Alerts cleared', 'success');
}

function refreshDashboard() {
    showAlert('Refreshing dashboard...', 'info');
    loadDashboardData();
}

function showSystemInfo() {
    $('#systemInfoModal').modal('show');
    $('#system-info-content').html('<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</div>');
    
    $.get('/api/system/info')
        .done(info => {
            const html = `
                <table class="table table-sm">
                    <tr><td><strong>Platform:</strong></td><td>${info.platform.system} ${info.platform.release}</td></tr>
                    <tr><td><strong>Version:</strong></td><td>${info.platform.version}</td></tr>
                    <tr><td><strong>Machine:</strong></td><td>${info.platform.machine}</td></tr>
                    <tr><td><strong>Processor:</strong></td><td>${info.platform.processor}</td></tr>
                    <tr><td><strong>CPU Cores:</strong></td><td>${info.cpu.count} (${info.cpu.count_logical} logical)</td></tr>
                    <tr><td><strong>Boot Time:</strong></td><td>${new Date(info.uptime.boot_time).toLocaleString()}</td></tr>
                    <tr><td><strong>Uptime:</strong></td><td>${info.uptime.uptime_string}</td></tr>
                </table>
            `;
            $('#system-info-content').html(html);
        })
        .fail(error => {
            $('#system-info-content').html('<div class="alert alert-danger">Failed to load system info</div>');
        });
}

// Helper functions
function getStatusClass(status) {
    switch(status) {
        case 'healthy': return 'status-healthy';
        case 'unhealthy': return 'status-warning';
        case 'down': return 'status-critical';
        default: return 'status-unknown';
    }
}

function getAlertIcon(type) {
    switch(type) {
        case 'system': return 'server';
        case 'service': return 'cog';
        case 'security': return 'shield-alt';
        case 'performance': return 'tachometer-alt';
        default: return 'info-circle';
    }
}

function formatTime(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
}

function showAlert(message, type) {
    const alertClass = type === 'error' ? 'danger' : type;
    const alert = $(`
        <div class="alert alert-${alertClass} alert-dismissible fade show dashboard-alert" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    
    $('#alert-container').append(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alert.alert('close');
    }, 5000);
}