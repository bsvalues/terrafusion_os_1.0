// Terrafusion Operations Dashboard - Charts Module

let systemChart = null;
let resourceChart = null;

// Initialize charts when document is ready
$(document).ready(function() {
    initializeCharts();
    loadChartData();
    
    // Update charts periodically
    setInterval(updateCharts, 30000); // Update every 30 seconds
});

// Initialize Chart.js charts
function initializeCharts() {
    // System Metrics Chart
    const systemCtx = document.getElementById('systemChart').getContext('2d');
    systemChart = new Chart(systemCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'CPU %',
                    data: [],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'Memory %',
                    data: [],
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'Disk %',
                    data: [],
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    min: 0,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
    
    // Resource Usage Chart
    const resourceCtx = document.getElementById('resourceChart').getContext('2d');
    resourceChart = new Chart(resourceCtx, {
        type: 'doughnut',
        data: {
            labels: ['CPU', 'Memory', 'Storage', 'Available'],
            datasets: [{
                data: [0, 0, 0, 100],
                backgroundColor: [
                    '#3498db',
                    '#2ecc71',
                    '#f39c12',
                    '#ecf0f1'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return label + ': ' + value.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Load chart data from API
async function loadChartData() {
    try {
        // Load system metrics
        const systemMetrics = await $.get('/api/metrics/system?limit=20');
        updateSystemChart(systemMetrics.metrics);
        
        // Load current resource usage
        const summary = await $.get('/api/metrics/summary');
        updateResourceChart(summary.system);
        
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

// Update system metrics chart
function updateSystemChart(metrics) {
    if (!systemChart || !metrics || metrics.length === 0) return;
    
    // Prepare data
    const labels = [];
    const cpuData = [];
    const memoryData = [];
    const diskData = [];
    
    metrics.forEach(metric => {
        const time = new Date(metric.timestamp);
        labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        cpuData.push(metric.cpu_percent || 0);
        memoryData.push(metric.memory_percent || 0);
        diskData.push(metric.disk_percent || 0);
    });
    
    // Update chart
    systemChart.data.labels = labels;
    systemChart.data.datasets[0].data = cpuData;
    systemChart.data.datasets[1].data = memoryData;
    systemChart.data.datasets[2].data = diskData;
    systemChart.update('none'); // Update without animation for performance
}

// Update resource usage chart
function updateResourceChart(systemData) {
    if (!resourceChart || !systemData) return;
    
    const cpu = systemData.cpu || 0;
    const memory = systemData.memory || 0;
    const disk = systemData.disk || 0;
    const available = Math.max(0, 100 - cpu - memory - disk);
    
    resourceChart.data.datasets[0].data = [cpu, memory, disk, available];
    resourceChart.update('none');
}

// Update charts with new data
async function updateCharts() {
    try {
        // Get latest system metrics
        const systemMetrics = await $.get('/api/metrics/system?limit=1');
        if (systemMetrics.metrics.length > 0) {
            addSystemMetricPoint(systemMetrics.metrics[0]);
        }
        
        // Update resource chart
        const summary = await $.get('/api/metrics/summary');
        updateResourceChart(summary.system);
        
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Add a single point to the system chart
function addSystemMetricPoint(metric) {
    if (!systemChart) return;
    
    const time = new Date(metric.timestamp);
    const label = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add new data point
    systemChart.data.labels.push(label);
    systemChart.data.datasets[0].data.push(metric.cpu_percent || 0);
    systemChart.data.datasets[1].data.push(metric.memory_percent || 0);
    systemChart.data.datasets[2].data.push(metric.disk_percent || 0);
    
    // Keep only last 20 points
    if (systemChart.data.labels.length > 20) {
        systemChart.data.labels.shift();
        systemChart.data.datasets.forEach(dataset => {
            dataset.data.shift();
        });
    }
    
    systemChart.update('none');
}

// Handle real-time updates from WebSocket
window.addEventListener('metricsUpdate', function(event) {
    if (event.detail && event.detail.system) {
        // Add new system metric point
        const metric = {
            timestamp: event.detail.timestamp,
            cpu_percent: event.detail.system.cpu,
            memory_percent: event.detail.system.memory,
            disk_percent: event.detail.system.disk
        };
        addSystemMetricPoint(metric);
        
        // Update resource chart
        updateResourceChart(event.detail.system);
    }
});

// Resize charts when window resizes
window.addEventListener('resize', function() {
    if (systemChart) systemChart.resize();
    if (resourceChart) resourceChart.resize();
});