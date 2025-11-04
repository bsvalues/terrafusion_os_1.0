#!/usr/bin/env node

/**
 * RAG Drive FTP Hub Performance Dashboard Generator
 * This script generates a real-time performance dashboard for monitoring system health
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Configuration
const REFRESH_INTERVAL = 5000; // 5 seconds
const LOG_FILE = './logs/performance.log';
const OUTPUT_FILE = './performance-dashboard.html';
const METRICS_HISTORY_LENGTH = 60; // Keep 60 data points (5 minutes with 5s interval)

// Initialize metrics storage
const metrics = {
  cpu: Array(METRICS_HISTORY_LENGTH).fill(0),
  memory: Array(METRICS_HISTORY_LENGTH).fill(0),
  requests: Array(METRICS_HISTORY_LENGTH).fill(0),
  responseTime: Array(METRICS_HISTORY_LENGTH).fill(0),
  errors: Array(METRICS_HISTORY_LENGTH).fill(0),
  dbQueries: Array(METRICS_HISTORY_LENGTH).fill(0),
  dbQueryTime: Array(METRICS_HISTORY_LENGTH).fill(0),
  activeUsers: Array(METRICS_HISTORY_LENGTH).fill(0),
  timestamp: Array(METRICS_HISTORY_LENGTH).fill(new Date().toISOString())
};

// Make sure logs directory exists
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

// Create log file stream
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

// Helper to log message to console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

log('Starting Performance Dashboard Generator');

// Helper to collect system metrics
function collectSystemMetrics() {
  // Get CPU usage
  const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
  
  // Get memory usage
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
  
  // Simulate other metrics (in a real system these would come from actual sources)
  const requestsPerSecond = Math.floor(Math.random() * 50);
  const avgResponseTime = 100 + Math.floor(Math.random() * 200);
  const errorRate = Math.floor(Math.random() * 5);
  const dbQueriesPerSecond = Math.floor(Math.random() * 30);
  const avgDbQueryTime = 20 + Math.floor(Math.random() * 50);
  const activeUsers = Math.floor(Math.random() * 100);
  
  // Update metrics (shift to maintain fixed length)
  for (const key of Object.keys(metrics)) {
    if (key !== 'timestamp') {
      metrics[key].shift();
    }
  }
  
  metrics.cpu.push(cpuUsage.toFixed(2));
  metrics.memory.push(memoryUsage.toFixed(2));
  metrics.requests.push(requestsPerSecond);
  metrics.responseTime.push(avgResponseTime);
  metrics.errors.push(errorRate);
  metrics.dbQueries.push(dbQueriesPerSecond);
  metrics.dbQueryTime.push(avgDbQueryTime);
  metrics.activeUsers.push(activeUsers);
  
  metrics.timestamp.shift();
  metrics.timestamp.push(new Date().toISOString());
  
  // Log current metrics
  log(`CPU: ${cpuUsage.toFixed(2)}%, Memory: ${memoryUsage.toFixed(2)}%, Requests: ${requestsPerSecond}/s, Avg Response: ${avgResponseTime}ms`);
  
  return {
    cpu: cpuUsage.toFixed(2),
    memory: memoryUsage.toFixed(2),
    requests: requestsPerSecond,
    responseTime: avgResponseTime,
    errors: errorRate,
    dbQueries: dbQueriesPerSecond,
    dbQueryTime: avgDbQueryTime,
    activeUsers: activeUsers,
    timestamp: new Date().toISOString()
  };
}

// Generate HTML dashboard
function generateDashboard() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RAG Drive FTP Hub Performance Dashboard</title>
    <meta http-equiv="refresh" content="${REFRESH_INTERVAL/1000}">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f8fa;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background-color: #1a202c;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        header h1 {
            margin: 0;
            font-size: 24px;
        }
        .status-overview {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 20px;
        }
        .status-card {
            background-color: white;
            border-radius: 8px;
            padding: 15px;
            flex: 1;
            min-width: 200px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .status-card h2 {
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #4a5568;
        }
        .status-value {
            font-size: 28px;
            font-weight: bold;
        }
        .status-unit {
            font-size: 14px;
            color: #718096;
        }
        .health-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .health-good { background-color: #48bb78; }
        .health-warning { background-color: #ed8936; }
        .health-critical { background-color: #e53e3e; }
        
        .chart-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 20px;
        }
        .chart {
            background-color: white;
            border-radius: 8px;
            padding: 15px;
            flex: 1;
            min-width: 45%;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            height: 300px;
        }
        .chart h2 {
            margin: 0 0 15px 0;
            font-size: 16px;
            color: #4a5568;
        }
        .chart-canvas {
            width: 100%;
            height: 250px;
        }
        
        .log-container {
            background-color: white;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            height: 200px;
            overflow-y: auto;
        }
        .log-entry {
            font-family: monospace;
            margin-bottom: 5px;
            font-size: 13px;
            line-height: 1.5;
        }
        
        footer {
            text-align: center;
            padding: 15px;
            color: #718096;
            font-size: 14px;
        }
        
        @media (max-width: 768px) {
            .status-card {
                min-width: 100%;
            }
            .chart {
                min-width: 100%;
            }
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <header>
            <h1>RAG Drive FTP Hub Performance Dashboard</h1>
            <p>Last updated: ${new Date().toLocaleString()}</p>
        </header>

        <div class="status-overview">
            <div class="status-card">
                <h2>CPU Usage</h2>
                <div class="status-value">
                    <span class="health-indicator ${getHealthIndicator(metrics.cpu[metrics.cpu.length-1], 50, 80)}"></span>
                    ${metrics.cpu[metrics.cpu.length-1]}<span class="status-unit">%</span>
                </div>
            </div>
            <div class="status-card">
                <h2>Memory Usage</h2>
                <div class="status-value">
                    <span class="health-indicator ${getHealthIndicator(metrics.memory[metrics.memory.length-1], 60, 85)}"></span>
                    ${metrics.memory[metrics.memory.length-1]}<span class="status-unit">%</span>
                </div>
            </div>
            <div class="status-card">
                <h2>Requests</h2>
                <div class="status-value">
                    ${metrics.requests[metrics.requests.length-1]}<span class="status-unit">/s</span>
                </div>
            </div>
            <div class="status-card">
                <h2>Response Time</h2>
                <div class="status-value">
                    <span class="health-indicator ${getHealthIndicator(metrics.responseTime[metrics.responseTime.length-1], 200, 500, true)}"></span>
                    ${metrics.responseTime[metrics.responseTime.length-1]}<span class="status-unit">ms</span>
                </div>
            </div>
        </div>

        <div class="chart-container">
            <div class="chart">
                <h2>CPU & Memory Usage</h2>
                <canvas id="systemChart" class="chart-canvas"></canvas>
            </div>
            <div class="chart">
                <h2>Request Performance</h2>
                <canvas id="requestChart" class="chart-canvas"></canvas>
            </div>
        </div>

        <div class="chart-container">
            <div class="chart">
                <h2>Database Performance</h2>
                <canvas id="databaseChart" class="chart-canvas"></canvas>
            </div>
            <div class="chart">
                <h2>User Activity</h2>
                <canvas id="userChart" class="chart-canvas"></canvas>
            </div>
        </div>

        <div class="log-container">
            <h2>Recent Logs</h2>
            <div id="logs">
                ${getRecentLogs()}
            </div>
        </div>

        <footer>
            <p>RAG Drive FTP Hub &copy; 2025 | Performance Dashboard v1.0</p>
        </footer>
    </div>

    <script>
        // Chart.js configuration
        Chart.defaults.color = '#718096';
        Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        
        // System metrics chart
        const systemCtx = document.getElementById('systemChart').getContext('2d');
        const systemChart = new Chart(systemCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(formatTimestamps(metrics.timestamp))},
                datasets: [{
                    label: 'CPU Usage (%)',
                    data: ${JSON.stringify(metrics.cpu)},
                    borderColor: '#4299e1',
                    backgroundColor: 'rgba(66, 153, 225, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }, {
                    label: 'Memory Usage (%)',
                    data: ${JSON.stringify(metrics.memory)},
                    borderColor: '#48bb78',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
        
        // Request performance chart
        const requestCtx = document.getElementById('requestChart').getContext('2d');
        const requestChart = new Chart(requestCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(formatTimestamps(metrics.timestamp))},
                datasets: [{
                    label: 'Requests/s',
                    data: ${JSON.stringify(metrics.requests)},
                    borderColor: '#ed64a6',
                    backgroundColor: 'rgba(237, 100, 166, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                }, {
                    label: 'Response Time (ms)',
                    data: ${JSON.stringify(metrics.responseTime)},
                    borderColor: '#f6ad55',
                    backgroundColor: 'rgba(246, 173, 85, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y1'
                }, {
                    label: 'Errors/s',
                    data: ${JSON.stringify(metrics.errors)},
                    borderColor: '#e53e3e',
                    backgroundColor: 'rgba(229, 62, 62, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left'
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
        
        // Database performance chart
        const dbCtx = document.getElementById('databaseChart').getContext('2d');
        const dbChart = new Chart(dbCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(formatTimestamps(metrics.timestamp))},
                datasets: [{
                    label: 'DB Queries/s',
                    data: ${JSON.stringify(metrics.dbQueries)},
                    borderColor: '#9f7aea',
                    backgroundColor: 'rgba(159, 122, 234, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                }, {
                    label: 'Query Time (ms)',
                    data: ${JSON.stringify(metrics.dbQueryTime)},
                    borderColor: '#4c51bf',
                    backgroundColor: 'rgba(76, 81, 191, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left'
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
        
        // User activity chart
        const userCtx = document.getElementById('userChart').getContext('2d');
        const userChart = new Chart(userCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(formatTimestamps(metrics.timestamp))},
                datasets: [{
                    label: 'Active Users',
                    data: ${JSON.stringify(metrics.activeUsers)},
                    borderColor: '#38b2ac',
                    backgroundColor: 'rgba(56, 178, 172, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    </script>
</body>
</html>
  `;
  
  fs.writeFileSync(OUTPUT_FILE, html);
  log(`Generated dashboard at ${OUTPUT_FILE}`);
}

// Format timestamps for chart display
function formatTimestamps(timestamps) {
  return timestamps.map(ts => {
    const date = new Date(ts);
    return date.toLocaleTimeString();
  });
}

// Get health indicator class based on thresholds
function getHealthIndicator(value, warningThreshold, criticalThreshold, isInverted = false) {
  value = parseFloat(value);
  
  if (isInverted) {
    // For metrics where lower is better (like response time)
    if (value < warningThreshold) return 'health-good';
    if (value < criticalThreshold) return 'health-warning';
    return 'health-critical';
  } else {
    // For metrics where higher is worse (like CPU usage)
    if (value < warningThreshold) return 'health-good';
    if (value < criticalThreshold) return 'health-warning';
    return 'health-critical';
  }
}

// Get recent logs from the file
function getRecentLogs() {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return '<div class="log-entry">No logs available yet.</div>';
    }
    
    // Read the last 10 lines of the log file
    const logContent = execSync(`tail -n 10 ${LOG_FILE}`).toString();
    
    if (!logContent.trim()) {
      return '<div class="log-entry">No logs available yet.</div>';
    }
    
    return logContent.split('\n')
      .filter(line => line.trim())
      .map(line => `<div class="log-entry">${line}</div>`)
      .join('');
  } catch (error) {
    return `<div class="log-entry">Error reading logs: ${error.message}</div>`;
  }
}

// Main function to run the dashboard generator
function startDashboard() {
  log('Initializing performance dashboard...');
  
  // Initial data collection
  collectSystemMetrics();
  generateDashboard();
  
  // Set up interval for continuous updates
  setInterval(() => {
    try {
      collectSystemMetrics();
      generateDashboard();
    } catch (error) {
      log(`Error updating dashboard: ${error.message}`);
    }
  }, REFRESH_INTERVAL);
  
  log(`Dashboard is running and updating every ${REFRESH_INTERVAL/1000} seconds`);
  log(`View the dashboard by opening ${OUTPUT_FILE} in a browser`);
}

// Run the dashboard
startDashboard();