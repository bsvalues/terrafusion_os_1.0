// TerraFusion cOS Desktop Application
// Professional Government Operating System

const { ipcRenderer } = require('electron');

class TerraFusionCOSApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.systemStatus = null;
        this.charts = {};
        this.init();
    }

    async init() {
        console.log('🏛️ Initializing TerraFusion cOS Desktop...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize navigation
        this.initializeNavigation();
        
        // Load system status
        await this.loadSystemStatus();
        
        // Initialize charts
        this.initializeCharts();
        
        // Setup real-time updates
        this.setupRealTimeUpdates();
        
        // Hide loading overlay
        this.hideLoadingOverlay();
        
        console.log('✅ TerraFusion cOS Desktop initialized successfully');
    }

    setupEventListeners() {
        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Chart period buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.currentTarget.dataset.period;
                this.updateChartPeriod(period);
            });
        });

        // CostForge valuation form
        const valuationForm = document.getElementById('valuationForm');
        if (valuationForm) {
            valuationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateValuation();
            });
        }

        // AI Swarm controls
        document.querySelectorAll('.swarm-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.classList[1]; // emergency, scale-up, etc.
                this.handleSwarmAction(action);
            });
        });

        // TerraFlow controls
        document.querySelectorAll('.workflow-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.classList[1]; // create, monitor, etc.
                this.handleWorkflowAction(action);
            });
        });

        // TerraFusion Sync controls
        document.querySelectorAll('.sync-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.classList[1]; // full-sync, incremental, etc.
                this.handleSyncAction(action);
            });
        });

        // Listen for IPC messages
        ipcRenderer.on('navigate-to', (event, section) => {
            this.navigateToSection(section);
        });
    }

    initializeNavigation() {
        // Set initial active state
        this.navigateToSection('dashboard');
    }

    navigateToSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navItem = document.querySelector(`[data-section="${section}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const contentSection = document.getElementById(section);
        if (contentSection) {
            contentSection.classList.add('active');
        }

        this.currentSection = section;
        console.log(`📱 Navigated to ${section} section`);
    }

    async loadSystemStatus() {
        try {
            const response = await ipcRenderer.invoke('get-system-status');
            if (response.success) {
                this.systemStatus = response.data;
                this.updateSystemStatus();
            }
        } catch (error) {
            console.error('Failed to load system status:', error);
        }
    }

    updateSystemStatus() {
        if (!this.systemStatus) return;

        // Update AI Swarm metrics
        const aiAgents = document.getElementById('ai-agents');
        const aiSuccess = document.getElementById('ai-success');
        if (aiAgents) aiAgents.textContent = `${this.systemStatus.aiSwarm.agents.toLocaleString()}+`;
        if (aiSuccess) aiSuccess.textContent = this.systemStatus.aiSwarm.successRate;

        // Update CostForge metrics
        const cfIntegrations = document.getElementById('cf-integrations');
        const cfValuations = document.getElementById('cf-valuations');
        if (cfIntegrations) cfIntegrations.textContent = this.systemStatus.costforge.integrations;
        if (cfValuations) cfValuations.textContent = '1,247'; // Mock data

        // Update Security metrics
        const securityLevel = document.getElementById('security-level');
        const threatLevel = document.getElementById('threat-level');
        if (securityLevel) securityLevel.textContent = this.systemStatus.security.level;
        if (threatLevel) threatLevel.textContent = this.systemStatus.security.threats;

        // Update Sync metrics
        const syncSystems = document.getElementById('sync-systems');
        const syncEntities = document.getElementById('sync-entities');
        if (syncSystems) syncSystems.textContent = '12'; // Mock data
        if (syncEntities) syncEntities.textContent = '45,892'; // Mock data
    }

    initializeCharts() {
        this.initializePerformanceChart();
        this.initializeAIActivityChart();
    }

    initializePerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(24),
                datasets: [
                    {
                        label: 'CPU Usage (%)',
                        data: this.generateRandomData(24, 30, 80),
                        borderColor: '#0099ff',
                        backgroundColor: 'rgba(0, 153, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Memory Usage (%)',
                        data: this.generateRandomData(24, 40, 70),
                        borderColor: '#00ffaa',
                        backgroundColor: 'rgba(0, 255, 170, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Response Time (ms)',
                        data: this.generateRandomData(24, 1, 5),
                        borderColor: '#00ffee',
                        backgroundColor: 'rgba(0, 255, 238, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white',
                            font: {
                                family: 'Inter'
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                family: 'Inter'
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                family: 'Inter'
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                family: 'Inter'
                            }
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });

        this.charts.performance = chart;
    }

    initializeAIActivityChart() {
        const ctx = document.getElementById('aiActivityChart');
        if (!ctx) return;

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Active Tasks', 'Completed', 'Queued', 'Failed'],
                datasets: [{
                    data: [1847, 12943, 234, 12],
                    backgroundColor: [
                        '#0099ff',
                        '#00ffaa',
                        '#ffaa00',
                        '#ff4444'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'white',
                            font: {
                                family: 'Inter'
                            }
                        }
                    }
                }
            }
        });

        this.charts.aiActivity = chart;
    }

    generateTimeLabels(hours) {
        const labels = [];
        const now = new Date();
        for (let i = hours - 1; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
            labels.push(time.getHours().toString().padStart(2, '0') + ':00');
        }
        return labels;
    }

    generateRandomData(count, min, max) {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push(Math.random() * (max - min) + min);
        }
        return data;
    }

    updateChartPeriod(period) {
        // Update chart period buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-period="${period}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Update chart data based on period
        if (this.charts.performance) {
            let labels, data;
            switch (period) {
                case '24h':
                    labels = this.generateTimeLabels(24);
                    data = this.generateRandomData(24, 30, 80);
                    break;
                case '7d':
                    labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    data = this.generateRandomData(7, 30, 80);
                    break;
                case '30d':
                    labels = Array.from({length: 30}, (_, i) => `Day ${i + 1}`);
                    data = this.generateRandomData(30, 30, 80);
                    break;
            }
            
            this.charts.performance.data.labels = labels;
            this.charts.performance.data.datasets[0].data = data;
            this.charts.performance.update();
        }
    }

    setupRealTimeUpdates() {
        // Update activity feed
        this.updateActivityFeed();
        
        // Update metrics every 30 seconds
        setInterval(() => {
            this.updateMetrics();
        }, 30000);
    }

    updateActivityFeed() {
        const feed = document.getElementById('activityFeed');
        if (!feed) return;

        const activities = [
            { icon: '✅', title: 'Vendor Module Deployed', desc: 'Woolpert GIS Suite v2.1', time: '2 minutes ago' },
            { icon: '🔄', title: 'System Sync Complete', desc: 'County Database synchronized', time: '5 minutes ago' },
            { icon: '🛡️', title: 'Security Scan Passed', desc: 'All 50,000 agents verified', time: '10 minutes ago' },
            { icon: '⚡', title: 'Workflow Automated', desc: 'Permit processing optimized', time: '15 minutes ago' },
            { icon: '🏢', title: 'New Vendor Registered', desc: 'AECOM Infrastructure Tools', time: '1 hour ago' },
            { icon: '💰', title: 'CostForge Analysis Complete', desc: 'Property valuation batch processed', time: '1 hour ago' },
            { icon: '📊', title: 'Performance Report Generated', desc: 'Monthly analytics ready', time: '2 hours ago' },
            { icon: '🔒', title: 'Security Audit Completed', desc: 'Government compliance verified', time: '3 hours ago' }
        ];

        feed.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.desc}</div>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');
    }

    updateMetrics() {
        // Simulate real-time metric updates
        const aiAgents = document.getElementById('ai-agents');
        if (aiAgents) {
            const current = parseInt(aiAgents.textContent.replace(/,/g, ''));
            const variation = Math.floor(Math.random() * 100) - 50;
            aiAgents.textContent = `${(current + variation).toLocaleString()}+`;
        }
    }

    async generateValuation() {
        const form = document.getElementById('valuationForm');
        const formData = new FormData(form);
        
        const propertyData = {
            address: document.getElementById('propertyAddress').value,
            squareFootage: document.getElementById('squareFootage').value,
            bedrooms: document.getElementById('bedrooms').value,
            bathrooms: document.getElementById('bathrooms').value,
            yearBuilt: document.getElementById('yearBuilt').value,
            type: document.getElementById('propertyType').value
        };

        if (!propertyData.address) {
            this.showNotification('Please enter at least the property address', 'warning');
            return;
        }

        try {
            const response = await ipcRenderer.invoke('costforge-valuation', propertyData);
            if (response.success) {
                this.displayValuationResults(response.data);
                this.showNotification('Property valuation completed successfully!', 'success');
            } else {
                this.showNotification('Valuation failed: ' + response.error, 'error');
            }
        } catch (error) {
            this.showNotification('Valuation failed: ' + error.message, 'error');
        }
    }

    displayValuationResults(data) {
        const resultsContainer = document.getElementById('valuationResults');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <div class="valuation-result">
                <div class="result-header">
                    <h4>Property Valuation Report</h4>
                    <div class="result-date">${new Date(data.analysisDate).toLocaleString()}</div>
                </div>
                <div class="result-content">
                    <div class="result-item">
                        <span class="result-label">Property Address:</span>
                        <span class="result-value">${data.propertyData.address}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Estimated Value:</span>
                        <span class="result-value highlight">${data.estimatedValue}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Confidence Score:</span>
                        <span class="result-value">${data.confidenceScore}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Market Trend:</span>
                        <span class="result-value">${data.marketTrend}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Comparables Found:</span>
                        <span class="result-value">${data.comparablesFound}</span>
                    </div>
                </div>
                <div class="result-footer">
                    <div class="ai-badge">✅ Generated by CostForge AI</div>
                </div>
            </div>
        `;
    }

    async runMarketAnalysis() {
        const marketArea = document.getElementById('marketArea').value;
        if (!marketArea) {
            this.showNotification('Please enter a market area', 'warning');
            return;
        }

        // Simulate market analysis
        const analysisData = {
            area: marketArea,
            avgPrice: '$425,000',
            priceTrend: '+3.2%',
            inventoryLevel: 'Low',
            daysOnMarket: '28',
            analysisDate: new Date().toISOString()
        };

        this.displayMarketResults(analysisData);
        this.showNotification('Market analysis completed successfully!', 'success');
    }

    displayMarketResults(data) {
        const resultsContainer = document.getElementById('marketResults');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <div class="market-result">
                <div class="result-header">
                    <h4>Market Analysis Report</h4>
                    <div class="result-date">${new Date(data.analysisDate).toLocaleString()}</div>
                </div>
                <div class="result-content">
                    <div class="result-item">
                        <span class="result-label">Market Area:</span>
                        <span class="result-value">${data.area}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Average Price:</span>
                        <span class="result-value highlight">${data.avgPrice}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Price Trend:</span>
                        <span class="result-value">${data.priceTrend}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Inventory Level:</span>
                        <span class="result-value">${data.inventoryLevel}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Days on Market:</span>
                        <span class="result-value">${data.daysOnMarket}</span>
                    </div>
                </div>
                <div class="result-footer">
                    <div class="ai-badge">✅ Generated by CostForge AI</div>
                </div>
            </div>
        `;
    }

    handleSwarmAction(action) {
        const messages = {
            emergency: '🚨 Emergency response protocol activated!\nAll available agents deployed.',
            'scale-up': '📈 Agent scaling initiated. Additional agents deploying...',
            'scale-down': '📉 Agent scaling reduced. Optimizing resource allocation...',
            redistribute: '🔄 Load redistribution in progress. System optimizing...'
        };

        this.showNotification(messages[action] || 'Action executed', 'info');
    }

    handleWorkflowAction(action) {
        const messages = {
            create: '➕ Creating new workflow...\nOpening workflow builder.',
            monitor: '📊 Opening workflow monitoring dashboard.\nReal-time execution tracking active.',
            optimize: '⚡ Analyzing workflow performance...\nOptimization recommendations generated.',
            templates: '📋 Loading workflow templates...\nBrowse government process templates.'
        };

        this.showNotification(messages[action] || 'Workflow action executed', 'info');
    }

    handleSyncAction(action) {
        const messages = {
            'full-sync': '🔄 Initiating full synchronization...\nAll systems syncing with Harris PACS, Tyler, Aumentum, Vision.',
            incremental: '⚡ Starting incremental sync...\nProcessing recent changes only.',
            'resolve-conflicts': '🔧 Analyzing sync conflicts...\nResolution strategies applied.',
            audit: '📋 Opening audit log...\nComprehensive sync history displayed.'
        };

        this.showNotification(messages[action] || 'Sync action executed', 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '60px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            maxWidth: '300px',
            wordWrap: 'break-word',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        // Set background color based on type
        const colors = {
            success: '#00ffaa',
            warning: '#ffaa00',
            error: '#ff4444',
            info: '#0099ff'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to DOM
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.terrafusionApp = new TerraFusionCOSApp();
});

// Window control functions
function minimizeWindow() {
    const { remote } = require('electron');
    remote.getCurrentWindow().minimize();
}

function maximizeWindow() {
    const { remote } = require('electron');
    const win = remote.getCurrentWindow();
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
}

function closeWindow() {
    const { remote } = require('electron');
    remote.getCurrentWindow().close();
}

// Refresh activity function
function refreshActivity() {
    if (window.terrafusionApp) {
        window.terrafusionApp.updateActivityFeed();
        window.terrafusionApp.showNotification('Activity feed refreshed', 'success');
    }
}
