/**
 * Terra-Levy - AI Tax Optimization Engine
 * Advanced property tax analysis and optimization
 */

class TerraLevy {
    constructor() {
        this.currentAnalysis = null;
        this.optimizationResults = [];
        this.taxScenarios = [];
        this.isOptimizing = false;
        this.aiAgents = 88; // Dedicated tax optimization agents
        
        this.init();
    }

    init() {
        this.createTerraLevyInterface();
        this.bindEvents();
        this.initializeTaxEngines();
    }

    createTerraLevyInterface() {
        const levyContainer = document.createElement('div');
        levyContainer.id = 'terra-levy';
        levyContainer.className = 'terra-levy-container tf-fullscreen-app';
        levyContainer.innerHTML = `
            <div class="levy-backdrop tf-cosmic-bg" id="levy-backdrop">
                <div class="levy-modal tf-fullscreen-modal">
                    <div class="levy-header tf-app-header">
                        <div class="levy-title tf-hero-title">
                            <div class="levy-logo tf-logo-container">
                                <svg class="levy-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 9.739s9-4.189 9-9.739V7l-10-5z"/>
                                    <path d="M9 12l2 2 4-4"/>
                                </svg>
                                <span class="tf-gradient-text tf-mega-title">Terra-Levy AI</span>
                            </div>
                            <div class="levy-subtitle tf-subtitle">Tax Optimization Engine</div>
                            <button class="levy-close tf-close-btn" id="levy-close">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <div class="levy-tabs tf-tabs">
                            <button class="tab-btn active" data-tab="analyzer">
                                📊 Tax Analyzer
                            </button>
                            <button class="tab-btn" data-tab="optimizer">
                                ⚡ Optimizer
                            </button>
                            <button class="tab-btn" data-tab="scenarios">
                                📈 Scenarios
                            </button>
                            <button class="tab-btn" data-tab="insights">
                                🤖 AI Insights
                            </button>
                        </div>
                    </div>

                    <div class="levy-content tf-main-content">
                        <!-- Tax Analyzer Tab -->
                        <div class="levy-tab active tf-tab-content" data-tab="analyzer">
                            <div class="analyzer-grid">
                                <div class="input-section">
                                    <h3>Property Information</h3>
                                    <div class="form-grid">
                                        <div class="form-group">
                                            <label for="assessed-value">Assessed Value</label>
                                            <input type="number" id="assessed-value" placeholder="$425,000" />
                                        </div>
                                        <div class="form-group">
                                            <label for="market-value">Market Value</label>
                                            <input type="number" id="market-value" placeholder="$450,000" />
                                        </div>
                                        <div class="form-group">
                                            <label for="property-county">County</label>
                                            <select id="property-county">
                                                <option value="benton">Benton County</option>
                                                <option value="yakima">Yakima County</option>
                                                <option value="clark">Clark County</option>
                                                <option value="king">King County</option>
                                                <option value="spokane">Spokane County</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label for="property-class">Property Class</label>
                                            <select id="property-class">
                                                <option value="residential">Residential</option>
                                                <option value="commercial">Commercial</option>
                                                <option value="industrial">Industrial</option>
                                                <option value="agricultural">Agricultural</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label for="exemptions">Current Exemptions</label>
                                            <div class="exemptions-list">
                                                <label><input type="checkbox" id="homestead"> Homestead</label>
                                                <label><input type="checkbox" id="senior"> Senior Citizen</label>
                                                <label><input type="checkbox" id="disabled"> Disabled Person</label>
                                                <label><input type="checkbox" id="veteran"> Veteran</label>
                                            </div>
                                        </div>
                                    </div>
                                    <button class="analyze-btn" id="analyze-taxes">
                                        🤖 Analyze Tax Burden
                                    </button>
                                </div>

                                <div class="results-section">
                                    <h3>Tax Analysis Results</h3>
                                    <div class="tax-summary" id="tax-summary">
                                        <div class="summary-card">
                                            <div class="card-header">Current Annual Tax</div>
                                            <div class="card-value" id="current-tax">$0</div>
                                            <div class="card-details">Based on current assessment</div>
                                        </div>
                                        <div class="summary-card">
                                            <div class="card-header">Effective Tax Rate</div>
                                            <div class="card-value" id="tax-rate">0.00%</div>
                                            <div class="card-details">County average: 1.23%</div>
                                        </div>
                                        <div class="summary-card optimization">
                                            <div class="card-header">Potential Savings</div>
                                            <div class="card-value" id="potential-savings">$0</div>
                                            <div class="card-details">Through optimization</div>
                                        </div>
                                    </div>

                                    <div class="tax-breakdown" id="tax-breakdown">
                                        <h4>Tax Levy Breakdown</h4>
                                        <div class="breakdown-chart">
                                            <div class="chart-item">
                                                <span class="chart-label">School District</span>
                                                <div class="chart-bar">
                                                    <div class="chart-fill" style="width: 45%; background: #3b82f6;"></div>
                                                </div>
                                                <span class="chart-value">$1,890</span>
                                            </div>
                                            <div class="chart-item">
                                                <span class="chart-label">County General</span>
                                                <div class="chart-bar">
                                                    <div class="chart-fill" style="width: 25%; background: #10b981;"></div>
                                                </div>
                                                <span class="chart-value">$1,050</span>
                                            </div>
                                            <div class="chart-item">
                                                <span class="chart-label">City/Municipality</span>
                                                <div class="chart-bar">
                                                    <div class="chart-fill" style="width: 20%; background: #f59e0b;"></div>
                                                </div>
                                                <span class="chart-value">$840</span>
                                            </div>
                                            <div class="chart-item">
                                                <span class="chart-label">Special Districts</span>
                                                <div class="chart-bar">
                                                    <div class="chart-fill" style="width: 10%; background: #8b5cf6;"></div>
                                                </div>
                                                <span class="chart-value">$420</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Optimizer Tab -->
                        <div class="levy-tab tf-tab-content" data-tab="optimizer">
                            <div class="optimizer-content">
                                <div class="optimization-header">
                                    <h3>AI Tax Optimization</h3>
                                    <div class="ai-status">
                                        <span class="agents-count">88 AI Agents</span>
                                        <span class="status-indicator active">Active</span>
                                    </div>
                                </div>

                                <div class="optimization-options">
                                    <h4>Optimization Strategies</h4>
                                    <div class="strategy-grid">
                                        <div class="strategy-card" data-strategy="assessment">
                                            <div class="strategy-icon">🏠</div>
                                            <h5>Assessment Appeal</h5>
                                            <p>Challenge overvalued assessments</p>
                                            <div class="potential-impact">Potential: $500-2,000/year</div>
                                        </div>
                                        <div class="strategy-card" data-strategy="exemptions">
                                            <div class="strategy-icon">🎯</div>
                                            <h5>Maximize Exemptions</h5>
                                            <p>Identify missed exemptions</p>
                                            <div class="potential-impact">Potential: $200-1,500/year</div>
                                        </div>
                                        <div class="strategy-card" data-strategy="timing">
                                            <div class="strategy-icon">⏰</div>
                                            <h5>Strategic Timing</h5>
                                            <p>Optimize improvement timing</p>
                                            <div class="potential-impact">Potential: $300-1,000/year</div>
                                        </div>
                                        <div class="strategy-card" data-strategy="classification">
                                            <div class="strategy-icon">📋</div>
                                            <h5>Property Classification</h5>
                                            <p>Ensure proper classification</p>
                                            <div class="potential-impact">Potential: $400-2,500/year</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="optimization-controls">
                                    <button class="optimize-btn" id="run-optimization">
                                        ⚡ Run AI Optimization
                                    </button>
                                    <div class="optimization-settings">
                                        <label>
                                            <input type="checkbox" checked> Include assessment appeals
                                        </label>
                                        <label>
                                            <input type="checkbox" checked> Analyze exemption eligibility
                                        </label>
                                        <label>
                                            <input type="checkbox"> Consider property modifications
                                        </label>
                                    </div>
                                </div>

                                <div class="optimization-results" id="optimization-results" style="display: none;">
                                    <h4>Optimization Results</h4>
                                    <div class="results-summary">
                                        <div class="result-metric">
                                            <span class="metric-label">Total Annual Savings</span>
                                            <span class="metric-value" id="total-savings">$0</span>
                                        </div>
                                        <div class="result-metric">
                                            <span class="metric-label">Optimization Score</span>
                                            <span class="metric-value" id="optimization-score">0/100</span>
                                        </div>
                                        <div class="result-metric">
                                            <span class="metric-label">Implementation Time</span>
                                            <span class="metric-value" id="implementation-time">0 weeks</span>
                                        </div>
                                    </div>

                                    <div class="recommended-actions" id="recommended-actions">
                                        <!-- AI-generated recommendations will appear here -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Scenarios Tab -->
                        <div class="levy-tab tf-tab-content" data-tab="scenarios">
                            <div class="scenarios-content">
                                <h3>Tax Impact Scenarios</h3>
                                <div class="scenario-builder">
                                    <h4>Create New Scenario</h4>
                                    <div class="scenario-inputs">
                                        <div class="input-group">
                                            <label>Scenario Name</label>
                                            <input type="text" id="scenario-name" placeholder="Property Improvement Analysis">
                                        </div>
                                        <div class="input-group">
                                            <label>Change Type</label>
                                            <select id="change-type">
                                                <option value="improvement">Property Improvement</option>
                                                <option value="appeal">Assessment Appeal</option>
                                                <option value="exemption">New Exemption</option>
                                                <option value="reclassification">Reclassification</option>
                                            </select>
                                        </div>
                                        <div class="input-group">
                                            <label>Value Impact</label>
                                            <input type="number" id="value-impact" placeholder="$50,000">
                                        </div>
                                        <button class="create-scenario-btn" id="create-scenario">
                                            + Create Scenario
                                        </button>
                                    </div>
                                </div>

                                <div class="scenarios-list" id="scenarios-list">
                                    <div class="scenario-item">
                                        <div class="scenario-header">
                                            <h5>Kitchen Renovation ($35,000)</h5>
                                            <span class="scenario-impact">+$426/year</span>
                                        </div>
                                        <div class="scenario-details">
                                            <span>Tax increase due to improved assessment</span>
                                        </div>
                                    </div>
                                    <div class="scenario-item positive">
                                        <div class="scenario-header">
                                            <h5>Assessment Appeal (Overvaluation)</h5>
                                            <span class="scenario-impact">-$890/year</span>
                                        </div>
                                        <div class="scenario-details">
                                            <span>Potential savings from successful appeal</span>
                                        </div>
                                    </div>
                                    <div class="scenario-item">
                                        <div class="scenario-header">
                                            <h5>Solar Panel Installation ($25,000)</h5>
                                            <span class="scenario-impact">+$180/year</span>
                                        </div>
                                        <div class="scenario-details">
                                            <span>Net impact after renewable energy exemption</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- AI Insights Tab -->
                        <div class="levy-tab tf-tab-content" data-tab="insights">
                            <div class="insights-content">
                                <h3>AI Tax Insights</h3>
                                <div class="insights-grid">
                                    <div class="insight-card priority-high">
                                        <div class="insight-header">
                                            <span class="insight-icon">🚨</span>
                                            <span class="insight-priority">High Priority</span>
                                        </div>
                                        <h4>Assessment Discrepancy Detected</h4>
                                        <p>Your property is assessed 18% above similar properties in your neighborhood. An appeal could save $1,240 annually.</p>
                                        <button class="action-btn">File Appeal</button>
                                    </div>

                                    <div class="insight-card priority-medium">
                                        <div class="insight-header">
                                            <span class="insight-icon">💡</span>
                                            <span class="insight-priority">Medium Priority</span>
                                        </div>
                                        <h4>Missed Exemption Opportunity</h4>
                                        <p>You may qualify for a disabled veteran exemption based on available records. Potential savings: $680/year.</p>
                                        <button class="action-btn">Check Eligibility</button>
                                    </div>

                                    <div class="insight-card priority-low">
                                        <div class="insight-header">
                                            <span class="insight-icon">📊</span>
                                            <span class="insight-priority">Information</span>
                                        </div>
                                        <h4>Market Trend Analysis</h4>
                                        <p>Property values in your area are trending 12% above state average. Consider timing for major improvements.</p>
                                        <button class="action-btn">View Analysis</button>
                                    </div>

                                    <div class="insight-card priority-low">
                                        <div class="insight-header">
                                            <span class="insight-icon">⚡</span>
                                            <span class="insight-priority">Optimization</span>
                                        </div>
                                        <h4>Energy Efficiency Credits</h4>
                                        <p>Installing qualified energy improvements could provide tax credits offsetting 30% of installation costs.</p>
                                        <button class="action-btn">Learn More</button>
                                    </div>
                                </div>

                                <div class="ai-recommendations">
                                    <h4>AI Recommendations</h4>
                                    <div class="recommendation-timeline">
                                        <div class="timeline-item">
                                            <div class="timeline-date">This Month</div>
                                            <div class="timeline-content">
                                                <h5>File Assessment Appeal</h5>
                                                <p>Deadline approaching for 2024 tax year appeals</p>
                                            </div>
                                        </div>
                                        <div class="timeline-item">
                                            <div class="timeline-date">Next Quarter</div>
                                            <div class="timeline-content">
                                                <h5>Apply for Additional Exemptions</h5>
                                                <p>Research and apply for all eligible exemptions</p>
                                            </div>
                                        </div>
                                        <div class="timeline-item">
                                            <div class="timeline-date">2025</div>
                                            <div class="timeline-content">
                                                <h5>Strategic Property Improvements</h5>
                                                <p>Plan improvements to maximize value while minimizing tax impact</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="levy-footer tf-app-footer">
                        <div class="footer-info">
                            <span class="disclaimer">*Estimates based on current tax rates and AI analysis</span>
                        </div>
                        <div class="footer-actions">
                            <button class="btn btn-secondary" id="export-analysis">Export Report</button>
                            <button class="btn btn-primary" id="schedule-consultation">Schedule Consultation</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(levyContainer);
    }

    bindEvents() {
        // Close Terra-Levy
        document.getElementById('levy-close').addEventListener('click', () => this.close());
        document.getElementById('levy-backdrop').addEventListener('click', (e) => {
            if (e.target.id === 'levy-backdrop') this.close();
        });

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn));
        });

        // Analysis
        document.getElementById('analyze-taxes').addEventListener('click', () => this.analyzeTaxes());

        // Optimization
        document.getElementById('run-optimization').addEventListener('click', () => this.runOptimization());

        // Strategy cards
        document.querySelectorAll('.strategy-card').forEach(card => {
            card.addEventListener('click', () => this.selectStrategy(card));
        });

        // Scenario creation
        document.getElementById('create-scenario').addEventListener('click', () => this.createScenario());

        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleAction(btn));
        });

        // Form inputs
        ['assessed-value', 'market-value', 'property-county', 'property-class'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.updateAnalysis());
            }
        });

        // Export and consultation
        document.getElementById('export-analysis').addEventListener('click', () => this.exportAnalysis());
        document.getElementById('schedule-consultation').addEventListener('click', () => this.scheduleConsultation());
    }

    initializeTaxEngines() {
        console.log('🏛️ Initializing Terra-Levy AI Tax Engines...');
        console.log('📊 Loading 88 specialized tax optimization agents...');
        console.log('⚖️ Activating assessment analysis algorithms...');
        console.log('💰 Loading exemption eligibility matrices...');
        console.log('✅ Terra-Levy AI ready for tax optimization');
    }

    show() {
        const container = document.getElementById('terra-levy');
        container.style.display = 'flex';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.zIndex = '9999';
        document.body.style.overflow = 'hidden';
        this.animateIn();
    }

    close() {
        const container = document.getElementById('terra-levy');
        container.style.opacity = '0';
        container.style.transform = 'scale(0.95)';
        setTimeout(() => {
            container.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }

    animateIn() {
        const container = document.getElementById('terra-levy');
        const modal = document.querySelector('.levy-modal');
        
        container.style.opacity = '0';
        container.style.transform = 'scale(0.95)';
        modal.style.transform = 'translateY(50px)';
        
        setTimeout(() => {
            container.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
            modal.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            modal.style.transform = 'translateY(0)';
        }, 50);
    }

    switchTab(btn) {
        const tabId = btn.dataset.tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.levy-tab').forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    async analyzeTaxes() {
        console.log('🤖 Running tax burden analysis...');
        
        const assessedValue = parseInt(document.getElementById('assessed-value').value) || 425000;
        const county = document.getElementById('property-county').value;
        
        // Show loading animation
        const analyzeBtn = document.getElementById('analyze-taxes');
        const originalText = analyzeBtn.textContent;
        analyzeBtn.textContent = '🔄 Analyzing...';
        analyzeBtn.disabled = true;
        
        // Simulate AI analysis
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Calculate tax estimates
        const taxRates = {
            benton: 0.0123,
            yakima: 0.0118,
            clark: 0.0135,
            king: 0.0098,
            spokane: 0.0127
        };
        
        const taxRate = taxRates[county] || 0.0123;
        const annualTax = assessedValue * taxRate;
        const potentialSavings = annualTax * 0.15; // Potential 15% savings
        
        // Update UI
        document.getElementById('current-tax').textContent = `$${Math.round(annualTax).toLocaleString()}`;
        document.getElementById('tax-rate').textContent = `${(taxRate * 100).toFixed(2)}%`;
        document.getElementById('potential-savings').textContent = `$${Math.round(potentialSavings).toLocaleString()}`;
        
        // Reset button
        analyzeBtn.textContent = originalText;
        analyzeBtn.disabled = false;
        
        this.currentAnalysis = {
            assessedValue,
            county,
            taxRate,
            annualTax,
            potentialSavings
        };
    }

    async runOptimization() {
        console.log('⚡ Running AI tax optimization...');
        this.isOptimizing = true;
        
        const optimizeBtn = document.getElementById('run-optimization');
        optimizeBtn.textContent = '🔄 Optimizing...';
        optimizeBtn.disabled = true;
        
        // Simulate optimization process
        const steps = [
            'Analyzing current assessment...',
            'Comparing with market data...',
            'Identifying exemption opportunities...',
            'Calculating optimization potential...',
            'Generating recommendations...'
        ];
        
        for (const step of steps) {
            console.log(`🤖 ${step}`);
            await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        // Generate optimization results
        const totalSavings = Math.round(1200 + Math.random() * 1500);
        const optimizationScore = Math.round(75 + Math.random() * 20);
        const implementationTime = Math.round(2 + Math.random() * 6);
        
        // Show results
        document.getElementById('optimization-results').style.display = 'block';
        document.getElementById('total-savings').textContent = `$${totalSavings.toLocaleString()}`;
        document.getElementById('optimization-score').textContent = `${optimizationScore}/100`;
        document.getElementById('implementation-time').textContent = `${implementationTime} weeks`;
        
        // Generate recommendations
        this.generateRecommendations();
        
        // Reset button
        optimizeBtn.textContent = '⚡ Run AI Optimization';
        optimizeBtn.disabled = false;
        this.isOptimizing = false;
    }

    generateRecommendations() {
        const recommendations = [
            {
                title: 'File Assessment Appeal',
                description: 'Property appears overvalued by 12% compared to recent sales',
                potential: '$890/year',
                priority: 'High',
                timeframe: '2-4 weeks'
            },
            {
                title: 'Apply for Senior Exemption',
                description: 'May qualify for additional senior citizen exemption',
                potential: '$340/year',
                priority: 'Medium',
                timeframe: '1-2 weeks'
            },
            {
                title: 'Strategic Improvement Timing',
                description: 'Delay major improvements until after assessment cycle',
                potential: '$450/year',
                priority: 'Medium',
                timeframe: 'Ongoing'
            }
        ];
        
        const container = document.getElementById('recommended-actions');
        container.innerHTML = '<h5>Recommended Actions</h5>';
        
        recommendations.forEach(rec => {
            const actionDiv = document.createElement('div');
            actionDiv.className = 'recommended-action';
            actionDiv.innerHTML = `
                <div class="action-header">
                    <h6>${rec.title}</h6>
                    <span class="action-potential">${rec.potential}</span>
                </div>
                <p>${rec.description}</p>
                <div class="action-meta">
                    <span class="action-priority priority-${rec.priority.toLowerCase()}">${rec.priority} Priority</span>
                    <span class="action-timeframe">${rec.timeframe}</span>
                </div>
            `;
            container.appendChild(actionDiv);
        });
    }

    selectStrategy(card) {
        document.querySelectorAll('.strategy-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        const strategy = card.dataset.strategy;
        console.log(`📋 Selected strategy: ${strategy}`);
    }

    createScenario() {
        const name = document.getElementById('scenario-name').value;
        const changeType = document.getElementById('change-type').value;
        const valueImpact = parseInt(document.getElementById('value-impact').value) || 0;
        
        if (!name || !valueImpact) {
            this.showNotification('Please fill in scenario details');
            return;
        }
        
        // Calculate tax impact
        const currentTaxRate = this.currentAnalysis?.taxRate || 0.0123;
        const annualImpact = valueImpact * currentTaxRate;
        const sign = changeType === 'appeal' ? '-' : '+';
        
        // Add scenario to list
        const scenariosList = document.getElementById('scenarios-list');
        const scenarioDiv = document.createElement('div');
        scenarioDiv.className = `scenario-item ${changeType === 'appeal' ? 'positive' : ''}`;
        scenarioDiv.innerHTML = `
            <div class="scenario-header">
                <h5>${name}</h5>
                <span class="scenario-impact">${sign}$${Math.round(Math.abs(annualImpact)).toLocaleString()}/year</span>
            </div>
            <div class="scenario-details">
                <span>${changeType.charAt(0).toUpperCase() + changeType.slice(1)} impact on tax burden</span>
            </div>
        `;
        
        scenariosList.appendChild(scenarioDiv);
        
        // Clear form
        document.getElementById('scenario-name').value = '';
        document.getElementById('value-impact').value = '';
        
        this.showNotification('Scenario added successfully');
    }

    handleAction(btn) {
        const action = btn.textContent;
        console.log(`📋 Action requested: ${action}`);
        
        switch (action) {
            case 'File Appeal':
                this.showNotification('Assessment appeal process initiated');
                break;
            case 'Check Eligibility':
                this.showNotification('Exemption eligibility check started');
                break;
            case 'View Analysis':
                this.showNotification('Detailed market analysis opened');
                break;
            case 'Learn More':
                this.showNotification('Energy efficiency information displayed');
                break;
        }
    }

    updateAnalysis() {
        // Auto-update analysis when form values change
        if (this.currentAnalysis) {
            this.analyzeTaxes();
        }
    }

    exportAnalysis() {
        console.log('📄 Exporting tax analysis report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            analysis: this.currentAnalysis,
            optimizationResults: this.optimizationResults,
            scenarios: this.taxScenarios
        };
        
        // Simulate report generation
        setTimeout(() => {
            this.showNotification('Tax optimization report exported successfully');
            console.log('📋 Export data:', report);
        }, 1500);
    }

    scheduleConsultation() {
        console.log('📅 Scheduling tax consultation...');
        
        // Show consultation scheduler
        const dialog = document.createElement('div');
        dialog.className = 'consultation-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Schedule Tax Consultation</h3>
                <p>Connect with a certified tax professional to review your optimization plan.</p>
                <div class="consultation-options">
                    <button class="consultation-btn">📞 Phone Consultation</button>
                    <button class="consultation-btn">💻 Video Conference</button>
                    <button class="consultation-btn">🏢 In-Person Meeting</button>
                </div>
                <button class="dialog-close">Close</button>
            </div>
        `;
        
        document.querySelector('.levy-content').appendChild(dialog);
        
        // Auto-remove dialog
        setTimeout(() => {
            dialog.remove();
        }, 5000);
        
        dialog.querySelector('.dialog-close').addEventListener('click', () => {
            dialog.remove();
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'levy-notification';
        notification.textContent = message;
        
        document.querySelector('.levy-content').appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Export for use in main application
window.TerraLevy = TerraLevy;