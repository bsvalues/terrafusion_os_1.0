/**
 * CostForge AI - Enhanced Interactive Components
 * Advanced UI components for transcendent user experience
 */

// Chart.js configuration for real-time performance monitoring
class PerformanceChart {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.createChartContainer();
        this.initializeChart();
        this.dataPoints = [];
        this.maxDataPoints = 20;
    }

    createChartContainer() {
        this.container.innerHTML = `
            <div class="chart-header">
                <h3 style="color: var(--transcend-cyan); margin-bottom: 16px;">
                    📈 Real-time Performance Analytics
                </h3>
            </div>
            <canvas id="performanceCanvas" width="400" height="200"></canvas>
        `;
    }

    initializeChart() {
        this.canvas = document.getElementById('performanceCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
    }

    setupCanvas() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width - 48; // Account for padding
        this.canvas.height = 200;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    addDataPoint(accuracy, responseTime) {
        const timestamp = new Date().toLocaleTimeString();
        this.dataPoints.push({
            timestamp,
            accuracy,
            responseTime,
            time: Date.now()
        });

        if (this.dataPoints.length > this.maxDataPoints) {
            this.dataPoints.shift();
        }

        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (this.dataPoints.length < 2) return;

        // Set up styling
        ctx.font = '12px "Segoe UI"';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

        // Draw grid
        this.drawGrid(ctx, width, height);

        // Draw accuracy line
        this.drawLine(ctx, this.dataPoints.map(d => d.accuracy), '#00ffaa', 'Accuracy %');

        // Draw response time line (scaled)
        const scaledResponseTimes = this.dataPoints.map(d => d.responseTime / 2); // Scale down for visibility
        this.drawLine(ctx, scaledResponseTimes, '#0099ff', 'Response Time (ms/2)');

        // Draw legend
        this.drawLegend(ctx, width);
    }

    drawGrid(ctx, width, height) {
        ctx.strokeStyle = 'rgba(0, 255, 238, 0.2)';
        ctx.lineWidth = 1;

        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = (height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Vertical grid lines
        for (let i = 0; i <= 10; i++) {
            const x = (width / 10) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    }

    drawLine(ctx, dataValues, color, label) {
        if (dataValues.length < 2) return;

        const width = this.width;
        const height = this.height;
        const maxValue = Math.max(...dataValues, 100);
        const minValue = Math.min(...dataValues, 0);
        const range = maxValue - minValue || 1;

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();

        dataValues.forEach((value, index) => {
            const x = (width / (dataValues.length - 1)) * index;
            const y = height - ((value - minValue) / range) * height;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Add glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawLegend(ctx, width) {
        ctx.font = '10px "Segoe UI"';

        // Accuracy legend
        ctx.fillStyle = '#00ffaa';
        ctx.fillRect(width - 150, 10, 12, 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText('Accuracy %', width - 135, 18);

        // Response time legend
        ctx.fillStyle = '#0099ff';
        ctx.fillRect(width - 150, 25, 12, 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText('Response Time (ms/2)', width - 135, 33);
    }
}

// Interactive Property Map Component
class PropertyMap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.properties = [];
        this.createMapContainer();
        this.initializeMap();
    }

    createMapContainer() {
        this.container.innerHTML = `
            <div class="map-header">
                <h3 style="color: var(--transcend-cyan); margin-bottom: 16px;">
                    🗺️ Property Location Intelligence
                </h3>
            </div>
            <div class="map-container" style="position: relative; width: 100%; height: 300px; background: linear-gradient(135deg, #0b1020 0%, #1a1a2e 100%); border-radius: 12px; overflow: hidden;">
                <canvas id="propertyMapCanvas" style="position: absolute; top: 0; left: 0;"></canvas>
                <div class="map-overlay" style="position: absolute; top: 16px; left: 16px; color: rgba(255,255,255,0.7); font-size: 12px;">
                    <div>Lat: <span id="mapLat">47.6062</span></div>
                    <div>Lng: <span id="mapLng">-122.3321</span></div>
                    <div>Zoom: <span id="mapZoom">12</span></div>
                </div>
            </div>
        `;
    }

    initializeMap() {
        this.canvas = document.getElementById('propertyMapCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.drawMap();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    drawMap() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw map background gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0b1020');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw grid pattern to simulate map
        ctx.strokeStyle = 'rgba(0, 255, 238, 0.1)';
        ctx.lineWidth = 1;

        for (let i = 0; i < width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }

        for (let i = 0; i < height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }

        // Draw property markers
        this.drawPropertyMarkers(ctx);

        // Draw compass
        this.drawCompass(ctx, width - 60, 60);
    }

    drawPropertyMarkers(ctx) {
        // Sample property locations
        const properties = [
            { x: this.width * 0.3, y: this.height * 0.4, value: 750000, active: true },
            { x: this.width * 0.6, y: this.height * 0.3, value: 650000, active: false },
            { x: this.width * 0.5, y: this.height * 0.6, value: 850000, active: false },
            { x: this.width * 0.7, y: this.height * 0.5, value: 920000, active: false }
        ];

        properties.forEach(property => {
            this.drawPropertyMarker(ctx, property.x, property.y, property.value, property.active);
        });
    }

    drawPropertyMarker(ctx, x, y, value, active) {
        const radius = active ? 12 : 8;
        const color = active ? '#00ffaa' : '#0099ff';

        // Draw marker circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        // Add glow for active property
        if (active) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Draw property value
        ctx.font = '10px "Segoe UI"';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(`$${(value / 1000).toFixed(0)}K`, x, y - radius - 5);
    }

    drawCompass(ctx, centerX, centerY) {
        const radius = 25;

        // Draw compass circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 255, 238, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#00ffee';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw north arrow
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius + 5);
        ctx.lineTo(centerX - 5, centerY - 5);
        ctx.lineTo(centerX + 5, centerY - 5);
        ctx.closePath();
        ctx.fillStyle = '#00ffaa';
        ctx.fill();

        // Draw "N" label
        ctx.font = '12px "Segoe UI"';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('N', centerX, centerY + radius + 15);
    }

    updatePropertyLocation(lat, lng) {
        document.getElementById('mapLat').textContent = lat.toFixed(4);
        document.getElementById('mapLng').textContent = lng.toFixed(4);
        this.drawMap(); // Redraw with new active location
    }
}

// Advanced Metrics Widget
class MetricsWidget {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.createWidget();
        this.initializeAnimations();
    }

    createWidget() {
        this.container.innerHTML = `
            <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div class="metric-card glass-card" style="text-align: center; padding: 20px;">
                    <div class="metric-icon" style="font-size: 2rem; margin-bottom: 8px;">⚡</div>
                    <div class="metric-value" style="font-size: 1.8rem; font-weight: 700; color: var(--success-green); margin-bottom: 4px;" id="quantumEfficiency">97.3%</div>
                    <div class="metric-label" style="font-size: 0.8rem; color: rgba(255,255,255,0.7); text-transform: uppercase;">Quantum Efficiency</div>
                    <div class="metric-progress" style="margin-top: 8px;">
                        <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                            <div class="progress-bar" style="width: 97%; height: 100%; background: var(--clarity-gradient); transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                </div>

                <div class="metric-card glass-card" style="text-align: center; padding: 20px;">
                    <div class="metric-icon" style="font-size: 2rem; margin-bottom: 8px;">🎯</div>
                    <div class="metric-value" style="font-size: 1.8rem; font-weight: 700; color: var(--trust-blue); margin-bottom: 4px;" id="predictionAccuracy">99.2%</div>
                    <div class="metric-label" style="font-size: 0.8rem; color: rgba(255,255,255,0.7); text-transform: uppercase;">Prediction Accuracy</div>
                    <div class="metric-progress" style="margin-top: 8px;">
                        <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                            <div class="progress-bar" style="width: 99%; height: 100%; background: linear-gradient(90deg, var(--trust-blue), var(--transcend-cyan)); transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                </div>

                <div class="metric-card glass-card" style="text-align: center; padding: 20px;">
                    <div class="metric-icon" style="font-size: 2rem; margin-bottom: 8px;">🚀</div>
                    <div class="metric-value" style="font-size: 1.8rem; font-weight: 700; color: var(--warning-orange); margin-bottom: 4px;" id="throughputRate">1,247</div>
                    <div class="metric-label" style="font-size: 0.8rem; color: rgba(255,255,255,0.7); text-transform: uppercase;">Calculations/Min</div>
                    <div class="metric-sparkline" style="margin-top: 8px; height: 20px; background: rgba(255,170,0,0.1); border-radius: 4px; position: relative; overflow: hidden;">
                        <div class="sparkline-bar" style="position: absolute; bottom: 0; width: 2px; background: var(--warning-orange); animation: sparkline 2s infinite;"></div>
                    </div>
                </div>

                <div class="metric-card glass-card" style="text-align: center; padding: 20px;">
                    <div class="metric-icon" style="font-size: 2rem; margin-bottom: 8px;">🧠</div>
                    <div class="metric-value" style="font-size: 1.8rem; font-weight: 700; color: var(--transcend-cyan); margin-bottom: 4px;" id="aiLoad">23.7%</div>
                    <div class="metric-label" style="font-size: 0.8rem; color: rgba(255,255,255,0.7); text-transform: uppercase;">AI System Load</div>
                    <div class="metric-gauge" style="margin-top: 8px; position: relative; width: 40px; height: 40px; margin: 0 auto;">
                        <svg width="40" height="40" style="transform: rotate(-90deg);">
                            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
                            <circle cx="20" cy="20" r="16" fill="none" stroke="var(--transcend-cyan)" stroke-width="3"
                                    stroke-dasharray="100" stroke-dashoffset="76" style="transition: stroke-dashoffset 0.3s ease;"/>
                        </svg>
                    </div>
                </div>
            </div>

            <style>
                @keyframes sparkline {
                    0% { left: 0%; height: 20%; }
                    25% { left: 25%; height: 80%; }
                    50% { left: 50%; height: 40%; }
                    75% { left: 75%; height: 90%; }
                    100% { left: 100%; height: 30%; }
                }
            </style>
        `;
    }

    initializeAnimations() {
        // Add pulsing animation to metric values
        setInterval(() => {
            this.updateMetrics();
        }, 3000);
    }

    updateMetrics() {
        // Simulate real-time metric updates
        const efficiency = (97 + Math.random() * 2).toFixed(1);
        const accuracy = (99 + Math.random() * 0.8).toFixed(1);
        const throughput = Math.floor(1200 + Math.random() * 100);
        const aiLoad = (20 + Math.random() * 10).toFixed(1);

        document.getElementById('quantumEfficiency').textContent = `${efficiency}%`;
        document.getElementById('predictionAccuracy').textContent = `${accuracy}%`;
        document.getElementById('throughputRate').textContent = throughput.toLocaleString();
        document.getElementById('aiLoad').textContent = `${aiLoad}%`;

        // Update progress bars
        const progressBars = document.querySelectorAll('.progress-bar');
        progressBars[0].style.width = `${efficiency}%`;
        progressBars[1].style.width = `${accuracy}%`;

        // Update gauge
        const gauge = document.querySelector('circle[stroke="var(--transcend-cyan)"]');
        if (gauge) {
            const dashOffset = 100 - parseFloat(aiLoad);
            gauge.style.strokeDashoffset = dashOffset;
        }
    }
}

// Notification System
class NotificationSystem {
    constructor() {
        this.createNotificationContainer();
        this.notifications = [];
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        const id = Date.now() + Math.random();

        const colors = {
            success: 'var(--success-green)',
            error: 'var(--error-red)',
            warning: 'var(--warning-orange)',
            info: 'var(--trust-blue)'
        };

        notification.style.cssText = `
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid ${colors[type] || colors.info};
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            color: white;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            position: relative;
            overflow: hidden;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 1.2rem;">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <div style="flex: 1; font-size: 0.9rem;">${message}</div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 1.2rem;">×</button>
            </div>
            <div style="position: absolute; bottom: 0; left: 0; height: 3px; background: ${colors[type] || colors.info}; width: 100%; animation: notificationProgress ${duration}ms linear;"></div>
        `;

        // Add animation keyframes
        if (!document.getElementById('notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes notificationProgress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `;
            document.head.appendChild(style);
        }

        document.getElementById('notificationContainer').appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);

        return id;
    }
}

// Initialize enhanced components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create enhanced components containers
    const enhancedContainer = document.createElement('div');
    enhancedContainer.innerHTML = `
        <div class="container" style="margin-top: 32px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
                <div class="glass-card">
                    <div id="performanceChart"></div>
                </div>
                <div class="glass-card">
                    <div id="propertyMap"></div>
                </div>
            </div>
            <div class="glass-card">
                <h2 style="margin-bottom: 24px; color: var(--transcend-cyan);">🎛️ Advanced System Metrics</h2>
                <div id="metricsWidget"></div>
            </div>
        </div>
    `;

    document.body.appendChild(enhancedContainer);

    // Initialize components
    window.performanceChart = new PerformanceChart('performanceChart');
    window.propertyMap = new PropertyMap('propertyMap');
    window.metricsWidget = new MetricsWidget('metricsWidget');
    window.notifications = new NotificationSystem();

    // Show welcome notification
    window.notifications.show('CostForge AI Enhanced UI Components Loaded', 'success');
});

// Export for global access
window.CostForgeComponents = {
    PerformanceChart,
    PropertyMap,
    MetricsWidget,
    NotificationSystem
};
