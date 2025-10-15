/**
 * Terrafusion Market - Interactive Demo Engine
 * Real-time Property Assessment Demonstration
 * Squad Alpha Component - Interactive Demos
 */

class TerraFusionDemo {
    constructor() {
        this.demoData = new Map();
        this.simulationRunning = false;
        this.assessmentHistory = [];
        this.currentAssessment = null;
        this.realTimeUpdates = true;
        
        this.init();
    }

    init() {
        this.setupDemoData();
        this.initializeDemoHandlers();
        this.setupRealTimeSimulation();
    }

    /**
     * Setup demo data for realistic simulations
     */
    setupDemoData() {
        this.demoProperties = [
            {
                id: 'demo-1',
                address: '123 Government Way, Yakima, WA',
                type: 'residential',
                county: 'yakima',
                baseValue: 485000,
                sqft: 2400,
                yearBuilt: 2015,
                lotSize: 0.25,
                features: ['garage', 'fireplace', 'updated_kitchen'],
                marketTrend: 'up',
                confidence: 99.7
            },
            {
                id: 'demo-2', 
                address: '456 Commerce Street, Benton City, WA',
                type: 'commercial',
                county: 'benton',
                baseValue: 1250000,
                sqft: 8500,
                yearBuilt: 2010,
                lotSize: 1.2,
                features: ['parking', 'loading_dock', 'modern_hvac'],
                marketTrend: 'stable',
                confidence: 98.9
            },
            {
                id: 'demo-3',
                address: '789 Industrial Blvd, Spokane, WA',
                type: 'industrial',
                county: 'spokane',
                baseValue: 2100000,
                sqft: 15000,
                yearBuilt: 2008,
                lotSize: 3.5,
                features: ['crane', 'rail_access', 'high_ceiling'],
                marketTrend: 'up',
                confidence: 97.8
            },
            {
                id: 'demo-4',
                address: '321 Farm Road, Clark County, WA',
                type: 'agricultural',
                county: 'clark',
                baseValue: 850000,
                sqft: 45000,
                yearBuilt: 1995,
                lotSize: 25.0,
                features: ['irrigation', 'barn', 'equipment_shed'],
                marketTrend: 'up',
                confidence: 96.5
            }
        ];

        this.marketFactors = {
            economic: { weight: 0.25, current: 0.85 },
            location: { weight: 0.30, current: 0.92 },
            condition: { weight: 0.20, current: 0.88 },
            market_demand: { weight: 0.15, current: 0.91 },
            comparable_sales: { weight: 0.10, current: 0.87 }
        };

        this.aiAgentTypes = [
            { name: 'Market Analysis Agent', icon: '📊', specialty: 'trend_analysis' },
            { name: 'Valuation Agent', icon: '💰', specialty: 'pricing' },
            { name: 'Compliance Agent', icon: '📋', specialty: 'regulations' },
            { name: 'Risk Assessment Agent', icon: '🛡️', specialty: 'risk_analysis' },
            { name: 'Comparison Agent', icon: '🔍', specialty: 'comparables' },
            { name: 'Geographic Agent', icon: '🗺️', specialty: 'location_data' },
            { name: 'Quantum Processing Agent', icon: '⚛️', specialty: 'computation' },
            { name: 'Predictive Agent', icon: '🔮', specialty: 'forecasting' }
        ];
    }

    /**
     * Initialize demo event handlers
     */
    initializeDemoHandlers() {
        // Demo form submission
        const demoForm = document.getElementById('demo-form');
        if (demoForm) {
            demoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.runPropertyAssessment();
            });
        }

        // Property type change
        const assessmentType = document.getElementById('assessment-type');
        if (assessmentType) {
            assessmentType.addEventListener('change', (e) => {
                this.updateDemoForType(e.target.value);
            });
        }

        // County change
        const countySelect = document.getElementById('county-select');
        if (countySelect) {
            countySelect.addEventListener('change', (e) => {
                this.updateMarketDataForCounty(e.target.value);
            });
        }

        // Auto-complete for address
        const addressInput = document.getElementById('property-address');
        if (addressInput) {
            addressInput.addEventListener('input', (e) => {
                this.handleAddressAutoComplete(e.target.value);
            });
        }
    }

    /**
     * Setup real-time simulation
     */
    setupRealTimeSimulation() {
        // Simulate market data updates every 5 seconds
        setInterval(() => {
            if (this.realTimeUpdates) {
                this.updateMarketData();
            }
        }, 5000);

        // Simulate agent activity
        setInterval(() => {
            this.simulateAgentActivity();
        }, 2000);
    }

    /**
     * Run property assessment demo
     */
    async runPropertyAssessment() {
        const formData = this.getDemoFormData();
        
        if (!this.validateDemoInput(formData)) {
            return;
        }

        try {
            this.startAssessmentAnimation();
            const result = await this.simulateAssessment(formData);
            this.displayAssessmentResults(result);
            this.addToHistory(result);
        } catch (error) {
            this.showDemoError(error.message);
        }
    }

    /**
     * Get form data
     */
    getDemoFormData() {
        return {
            address: document.getElementById('property-address')?.value || '',
            type: document.getElementById('assessment-type')?.value || '',
            county: document.getElementById('county-select')?.value || ''
        };
    }

    /**
     * Validate demo input
     */
    validateDemoInput(data) {
        if (!data.address.trim()) {
            this.showValidationError('Please enter a property address');
            return false;
        }

        if (!data.type) {
            this.showValidationError('Please select an assessment type');
            return false;
        }

        if (!data.county) {
            this.showValidationError('Please select a county');
            return false;
        }

        return true;
    }

    /**
     * Start assessment animation
     */
    startAssessmentAnimation() {
        const resultsContainer = document.getElementById('demo-results');
        
        resultsContainer.innerHTML = `
            <div class="assessment-progress">
                <div class="progress-header">
                    <h3>AI Assessment in Progress</h3>
                    <div class="processing-time">
                        <span id="elapsed-time">0.00</span>s
                    </div>
                </div>
                
                <div class="ai-agents-grid">
                    ${this.aiAgentTypes.map((agent /* , index */) => `
                        <div class="ai-agent" id="agent-${index}">
                            <div class="agent-icon">${agent.icon}</div>
                            <div class="agent-name">${agent.name}</div>
                            <div class="agent-status">Initializing...</div>
                            <div class="agent-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="assessment-stages">
                    <div class="stage active" data-stage="data-collection">
                        <div class="stage-icon">📥</div>
                        <div class="stage-text">Data Collection</div>
                    </div>
                    <div class="stage" data-stage="analysis">
                        <div class="stage-icon">🧠</div>
                        <div class="stage-text">AI Analysis</div>
                    </div>
                    <div class="stage" data-stage="quantum-processing">
                        <div class="stage-icon">⚛️</div>
                        <div class="stage-text">Quantum Processing</div>
                    </div>
                    <div class="stage" data-stage="validation">
                        <div class="stage-icon">✅</div>
                        <div class="stage-text">Validation</div>
                    </div>
                </div>
                
                <div class="live-metrics">
                    <div class="metric">
                        <span class="metric-label">Data Points Analyzed:</span>
                        <span class="metric-value" id="data-points">0</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Comparables Found:</span>
                        <span class="metric-value" id="comparables">0</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Confidence Level:</span>
                        <span class="metric-value" id="confidence">0%</span>
                    </div>
                </div>
            </div>
        `;

        this.animateAssessmentProgress();
    }

    /**
     * Animate assessment progress
     */
    animateAssessmentProgress() {
        const startTime = Date.now();
        const duration = 3500; // 3.5 seconds for demo
        
        const updateTimer = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const elapsedElement = document.getElementById('elapsed-time');
            if (elapsedElement) {
                elapsedElement.textContent = elapsed.toFixed(2);
            }
            
            if (elapsed < duration / 1000) {
                requestAnimationFrame(updateTimer);
            }
        };
        updateTimer();

        // Animate agents
        this.aiAgentTypes.forEach((agent /* , index */) => {
            setTimeout(() => {
                this.activateAgent(index);
            }, index * 400);
        });

        // Animate stages
        const stages = ['data-collection', 'analysis', 'quantum-processing', 'validation'];
        stages.forEach((stage /* , index */) => {
            setTimeout(() => {
                this.activateStage(stage);
            }, index * 800);
        });

        // Animate metrics
        this.animateMetrics();
    }

    /**
     * Activate agent animation
     */
    activateAgent(index) {
        const agent = document.getElementById(`agent-${index}`);
        if (!agent) return;

        const statusElement = agent.querySelector('.agent-status');
        const progressFill = agent.querySelector('.progress-fill');

        // Update status
        statusElement.textContent = 'Processing...';
        agent.classList.add('active');

        // Animate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            progressFill.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                statusElement.textContent = 'Complete';
                agent.classList.add('complete');
            }
        }, 100);
    }

    /**
     * Activate stage
     */
    activateStage(stageName) {
        // Deactivate previous stage
        document.querySelectorAll('.stage.active').forEach(stage => {
            stage.classList.remove('active');
            stage.classList.add('complete');
        });

        // Activate current stage
        const stage = document.querySelector(`[data-stage="${stageName}"]`);
        if (stage) {
            stage.classList.add('active');
        }
    }

    /**
     * Animate metrics
     */
    animateMetrics() {
        const animateCounter = (elementId, targetValue, suffix = '') => {
            const element = document.getElementById(elementId);
            if (!element) return;

            let current = 0;
            const increment = targetValue / 50;
            
            const counter = setInterval(() => {
                current += increment;
                if (current >= targetValue) {
                    current = targetValue;
                    clearInterval(counter);
                }
                element.textContent = Math.floor(current) + suffix;
            }, 50);
        };

        setTimeout(() => animateCounter('data-points', 1247), 500);
        setTimeout(() => animateCounter('comparables', 23), 1000);
        setTimeout(() => animateCounter('confidence', 99.7, '%'), 1500);
    }

    /**
     * Simulate assessment process
     */
    async simulateAssessment(formData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const property = this.generatePropertyData(formData);
                const assessment = this.calculateAssessment(property);
                resolve(assessment);
            }, 3500);
        });
    }

    /**
     * Generate property data
     */
    generatePropertyData(formData) {
        // Find matching demo property or create new one
        let property = this.demoProperties.find(p => 
            p.type === formData.type && p.county === formData.county
        );

        if (!property) {
            property = {
                id: `demo-${Date.now()}`,
                address: formData.address,
                type: formData.type,
                county: formData.county,
                baseValue: this.estimateBaseValue(formData),
                sqft: this.estimateSquareFootage(formData.type),
                yearBuilt: 2000 + Math.floor(Math.random() * 20),
                lotSize: this.estimateLotSize(formData.type),
                features: this.generateFeatures(formData.type),
                marketTrend: Math.random() > 0.6 ? 'up' : 'stable',
                confidence: 95 + Math.random() * 5
            };
        }

        return { ...property, address: formData.address };
    }

    /**
     * Calculate assessment
     */
    calculateAssessment(property) {
        const baseValue = property.baseValue;
        const marketMultiplier = this.calculateMarketMultiplier(property);
        const finalValue = Math.round(baseValue * marketMultiplier);
        
        const factors = Object.entries(this.marketFactors).map(([name, data]) => ({
            name: name.replace('_', ' ').toUpperCase(),
            weight: Math.round(data.weight * 100),
            impact: data.current,
            description: this.getFactorDescription(name)
        }));

        return {
            id: `assessment-${Date.now()}`,
            property,
            estimatedValue: finalValue,
            confidence: property.confidence,
            processingTime: 847, // Simulated processing time in ms
            agentsUsed: Math.floor(Math.random() * 50) + 950,
            trend: {
                direction: property.marketTrend,
                percentage: Math.random() * 10 + 2
            },
            factors,
            comparables: this.generateComparables(property),
            riskFactors: this.generateRiskFactors(property),
            recommendations: this.generateRecommendations(property)
        };
    }

    /**
     * Display assessment results
     */
    displayAssessmentResults(assessment) {
        const resultsContainer = document.getElementById('demo-results');
        
        resultsContainer.innerHTML = `
            <div class="assessment-results">
                <div class="results-header">
                    <h3>Assessment Complete</h3>
                    <div class="assessment-id">ID: ${assessment.id}</div>
                    <div class="confidence-badge confidence-${this.getConfidenceLevel(assessment.confidence)}">
                        ${assessment.confidence.toFixed(1)}% Confidence
                    </div>
                </div>
                
                <div class="primary-result">
                    <div class="result-label">Estimated Market Value</div>
                    <div class="result-value">${this.formatCurrency(assessment.estimatedValue)}</div>
                    <div class="result-trend ${assessment.trend.direction}">
                        ${assessment.trend.direction === 'up' ? '↗' : '→'} 
                        ${assessment.trend.percentage.toFixed(1)}% vs. last quarter
                    </div>
                </div>
                
                <div class="results-grid">
                    <div class="result-card">
                        <div class="card-icon">⚡</div>
                        <div class="card-label">Processing Time</div>
                        <div class="card-value">${assessment.processingTime}ms</div>
                    </div>
                    
                    <div class="result-card">
                        <div class="card-icon">🤖</div>
                        <div class="card-label">AI Agents</div>
                        <div class="card-value">${assessment.agentsUsed}</div>
                    </div>
                    
                    <div class="result-card">
                        <div class="card-icon">📊</div>
                        <div class="card-label">Data Points</div>
                        <div class="card-value">1,247</div>
                    </div>
                    
                    <div class="result-card">
                        <div class="card-icon">🏘️</div>
                        <div class="card-label">Comparables</div>
                        <div class="card-value">${assessment.comparables.length}</div>
                    </div>
                </div>
                
                <div class="assessment-tabs">
                    <div class="tab-nav">
                        <button class="tab-button active" data-tab="factors">Value Factors</button>
                        <button class="tab-button" data-tab="comparables">Comparables</button>
                        <button class="tab-button" data-tab="risk">Risk Analysis</button>
                        <button class="tab-button" data-tab="recommendations">Recommendations</button>
                    </div>
                    
                    <div class="tab-content">
                        <div class="tab-panel active" id="factors-panel">
                            ${this.renderFactorsPanel(assessment.factors)}
                        </div>
                        
                        <div class="tab-panel" id="comparables-panel">
                            ${this.renderComparablesPanel(assessment.comparables)}
                        </div>
                        
                        <div class="tab-panel" id="risk-panel">
                            ${this.renderRiskPanel(assessment.riskFactors)}
                        </div>
                        
                        <div class="tab-panel" id="recommendations-panel">
                            ${this.renderRecommendationsPanel(assessment.recommendations)}
                        </div>
                    </div>
                </div>
                
                <div class="results-actions">
                    <button class="btn btn-primary" onclick="demo.downloadReport('${assessment.id}')">
                        <i class="icon-download"></i>
                        Download Full Report
                    </button>
                    <button class="btn btn-secondary" onclick="demo.scheduleConsultation()">
                        <i class="icon-calendar"></i>
                        Schedule Consultation
                    </button>
                    <button class="btn btn-outline" onclick="demo.shareResults('${assessment.id}')">
                        <i class="icon-share"></i>
                        Share Results
                    </button>
                </div>
            </div>
        `;

        this.initializeResultsTabs();
        this.animateResults();
    }

    /**
     * Render factors panel
     */
    renderFactorsPanel(factors) {
        return `
            <div class="factors-list">
                ${factors.map(factor => `
                    <div class="factor-item">
                        <div class="factor-header">
                            <span class="factor-name">${factor.name}</span>
                            <span class="factor-weight">${factor.weight}%</span>
                        </div>
                        <div class="factor-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${factor.impact * 100}%"></div>
                            </div>
                            <span class="impact-score">${(factor.impact * 100).toFixed(1)}%</span>
                        </div>
                        <div class="factor-description">${factor.description}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render comparables panel
     */
    renderComparablesPanel(comparables) {
        return `
            <div class="comparables-list">
                ${comparables.map(comp => `
                    <div class="comparable-item">
                        <div class="comparable-header">
                            <div class="comparable-address">${comp.address}</div>
                            <div class="comparable-price">${this.formatCurrency(comp.soldPrice)}</div>
                        </div>
                        <div class="comparable-details">
                            <span>${comp.sqft} sq ft</span>
                            <span>${comp.beds} bed, ${comp.baths} bath</span>
                            <span>Sold ${comp.daysAgo} days ago</span>
                        </div>
                        <div class="comparable-similarity">
                            Similarity: ${comp.similarity}%
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render risk panel
     */
    renderRiskPanel(riskFactors) {
        return `
            <div class="risk-factors">
                ${riskFactors.map(risk => `
                    <div class="risk-item risk-${risk.level}">
                        <div class="risk-header">
                            <span class="risk-icon">${risk.icon}</span>
                            <span class="risk-name">${risk.name}</span>
                            <span class="risk-level">${risk.level.toUpperCase()}</span>
                        </div>
                        <div class="risk-description">${risk.description}</div>
                        <div class="risk-impact">Impact: ${risk.impact}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render recommendations panel
     */
    renderRecommendationsPanel(recommendations) {
        return `
            <div class="recommendations-list">
                ${recommendations.map(rec => `
                    <div class="recommendation-item">
                        <div class="recommendation-header">
                            <span class="rec-icon">${rec.icon}</span>
                            <span class="rec-title">${rec.title}</span>
                        </div>
                        <div class="rec-description">${rec.description}</div>
                        <div class="rec-impact">
                            Expected Impact: <strong>${rec.impact}</strong>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Initialize results tabs
     */
    initializeResultsTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    /**
     * Switch tab
     */
    switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-panel`).classList.add('active');
    }

    /**
     * Animate results display
     */
    animateResults() {
        const elements = document.querySelectorAll('.assessment-results > *');
        elements.forEach((element /* , index */) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    /**
     * Helper methods
     */
    calculateMarketMultiplier(property) {
        let multiplier = 1.0;
        
        Object.values(this.marketFactors).forEach(factor => {
            multiplier += (factor.current - 0.5) * factor.weight;
        });
        
        return Math.max(0.7, Math.min(1.3, multiplier));
    }

    estimateBaseValue(formData) {
        const baseValues = {
            residential: 400000 + Math.random() * 200000,
            commercial: 800000 + Math.random() * 800000,
            industrial: 1200000 + Math.random() * 1500000,
            agricultural: 600000 + Math.random() * 400000
        };
        
        return Math.round(baseValues[formData.type] || 500000);
    }

    estimateSquareFootage(type) {
        const ranges = {
            residential: [1500, 4000],
            commercial: [3000, 15000],
            industrial: [8000, 25000],
            agricultural: [2000, 8000]
        };
        
        const range = ranges[type] || [2000, 5000];
        return Math.floor(Math.random() * (range[1] - range[0]) + range[0]);
    }

    estimateLotSize(type) {
        const ranges = {
            residential: [0.1, 1.0],
            commercial: [0.5, 3.0],
            industrial: [1.0, 10.0],
            agricultural: [5.0, 50.0]
        };
        
        const range = ranges[type] || [0.2, 2.0];
        return +(Math.random() * (range[1] - range[0]) + range[0]).toFixed(1);
    }

    generateFeatures(type) {
        const featureOptions = {
            residential: ['garage', 'fireplace', 'updated_kitchen', 'hardwood_floors', 'deck', 'pool'],
            commercial: ['parking', 'elevator', 'conference_rooms', 'loading_dock', 'security_system'],
            industrial: ['crane', 'rail_access', 'high_ceiling', 'truck_dock', 'industrial_power'],
            agricultural: ['irrigation', 'barn', 'equipment_shed', 'fencing', 'water_rights']
        };
        
        const options = featureOptions[type] || [];
        const count = Math.floor(Math.random() * 3) + 2;
        return options.sort(() => 0.5 - Math.random()).slice(0, count);
    }

    generateComparables(property) {
        const count = Math.floor(Math.random() * 5) + 3;
        const comparables = [];
        
        for (let i = 0; i < count; i++) {
            const variation = 0.8 + Math.random() * 0.4;
            comparables.push({
                address: `${Math.floor(Math.random() * 9999)} ${this.getRandomStreetName()}, ${property.county.toUpperCase()}, WA`,
                soldPrice: Math.round(property.baseValue * variation),
                sqft: Math.round(property.sqft * (0.8 + Math.random() * 0.4)),
                beds: Math.floor(Math.random() * 3) + 2,
                baths: Math.floor(Math.random() * 2) + 1,
                daysAgo: Math.floor(Math.random() * 90) + 1,
                similarity: Math.round(70 + Math.random() * 25)
            });
        }
        
        return comparables.sort((a, b) => b.similarity - a.similarity);
    }

    generateRiskFactors(property) {
        const riskTypes = [
            { name: 'Market Volatility', icon: '📈', level: 'low', description: 'Property values in this area are stable with low volatility.', impact: 'Minimal risk to valuation accuracy' },
            { name: 'Environmental Factors', icon: '🌍', level: 'low', description: 'No significant environmental concerns identified.', impact: 'No expected impact on property value' },
            { name: 'Economic Conditions', icon: '💼', level: 'medium', description: 'Regional economic indicators show moderate growth.', impact: 'Potential 2-5% variation in market values' }
        ];
        
        return riskTypes.slice(0, Math.floor(Math.random() * 3) + 1);
    }

    generateRecommendations(property) {
        const recommendations = [
            { icon: '🔄', title: 'Schedule Re-assessment', description: 'Consider reassessment in 6 months to capture market changes.', impact: 'Maintain accuracy' },
            { icon: '📋', title: 'Verify Property Details', description: 'Confirm square footage and recent improvements.', impact: 'Increase confidence by 2-3%' },
            { icon: '🏘️', title: 'Monitor Comparables', description: 'Track similar property sales in the area.', impact: 'Enhanced market tracking' }
        ];
        
        return recommendations.slice(0, Math.floor(Math.random() * 3) + 1);
    }

    getRandomStreetName() {
        const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Cedar Ln', 'Elm Dr', 'Maple Way', 'River Rd', 'Hill St'];
        return streets[Math.floor(Math.random() * streets.length)];
    }

    getFactorDescription(factor) {
        const descriptions = {
            economic: 'Regional economic health and employment rates',
            location: 'Proximity to amenities, schools, and transportation',
            condition: 'Physical condition and recent improvements',
            market_demand: 'Current buyer demand and inventory levels',
            comparable_sales: 'Recent sales of similar properties in the area'
        };
        
        return descriptions[factor] || 'Market factor analysis';
    }

    getConfidenceLevel(confidence) {
        if (confidence >= 95) return 'high';
        if (confidence >= 85) return 'medium';
        return 'low';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Public methods for UI interactions
    downloadReport(assessmentId) {
        console.log('📄 Downloading report for:', assessmentId);
        window.app?.showNotification('Report download started', 'success');
    }

    scheduleConsultation() {
        window.app?.smoothScrollTo('#contact');
        window.app?.showNotification('Contact form opened for consultation scheduling', 'info');
    }

    shareResults(assessmentId) {
        if (navigator.share) {
            navigator.share({
                title: 'Terrafusion Property Assessment',
                text: 'Check out this AI-powered property assessment result',
                url: window.location.href
            });
        } else {
            console.log('📤 Sharing results for:', assessmentId);
            window.app?.showNotification('Results sharing feature available in production', 'info');
        }
    }

    updateDemoForType(type) {
        // Update form based on property type
        console.log('🏠 Updated demo for type:', type);
    }

    updateMarketDataForCounty(county) {
        // Update market data based on county
        console.log('🗺️ Updated market data for county:', county);
    }

    handleAddressAutoComplete(address) {
        // Implement address autocomplete
        if (address.length > 3) {
            console.log('🔍 Auto-completing address:', address);
        }
    }

    simulateAgentActivity() {
        // Simulate background agent activity
        if (Math.random() > 0.7) {
            const activity = [
                'Market data updated',
                'New comparable found',
                'Risk analysis complete',
                'Trend analysis updated'
            ];
            
            const message = activity[Math.floor(Math.random() * activity.length)];
            console.log('🤖 Agent activity:', message);
        }
    }

    updateMarketData() {
        // Simulate real-time market data updates
        Object.keys(this.marketFactors).forEach(factor => {
            this.marketFactors[factor].current += (Math.random() - 0.5) * 0.02;
            this.marketFactors[factor].current = Math.max(0.1, Math.min(1.0, this.marketFactors[factor].current));
        });
    }

    addToHistory(assessment) {
        this.assessmentHistory.unshift(assessment);
        if (this.assessmentHistory.length > 10) {
            this.assessmentHistory.pop();
        }
    }

    showValidationError(message) {
        window.app?.showErrorMessage(message);
    }

    showDemoError(message) {
        const resultsContainer = document.getElementById('demo-results');
        resultsContainer.innerHTML = `
            <div class="demo-error">
                <div class="error-icon">⚠️</div>
                <h3>Assessment Error</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="demo.resetDemo()">
                    Try Again
                </button>
            </div>
        `;
    }

    resetDemo() {
        const resultsContainer = document.getElementById('demo-results');
        resultsContainer.innerHTML = `
            <div class="demo-placeholder">
                <i class="icon-search"></i>
                <p>Enter property details to see AI-powered assessment</p>
            </div>
        `;
    }
}

// Initialize demo engine
document.addEventListener('DOMContentLoaded', () => {
    window.demo = new TerraFusionDemo();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerraFusionDemo;
}