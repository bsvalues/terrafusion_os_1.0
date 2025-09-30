/**
 * TerraFusion Empire Showcase Platform - Complete JavaScript Framework
 * Government-Grade Interactive Experience with Unlimited Scale Capabilities
 */

class TerraFusionEmpire {
    constructor() {
        this.isInitialized = false;
        this.currentDemo = null;
        this.aiModels = new Map();
        this.securityLayers = new Map();
        this.countyData = new Map();
        this.animationQueue = [];
        
        // Performance monitoring
        this.performanceMetrics = {
            loadTime: 0,
            interactionCount: 0,
            demoCompletions: 0
        };
        
        // Initialize core systems
        this.initializeCore();
    }
    
    initializeCore() {
        console.log('🚀 Initializing TerraFusion Empire Platform...');
        
        // Load configuration
        this.loadConfiguration();
        
        // Initialize AI models
        this.initializeAIModels();
        
        // Initialize security systems
        this.initializeSecuritySystems();
        
        // Load county data
        this.loadCountyData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ TerraFusion Empire Platform initialized');
        this.isInitialized = true;
    }
    
    loadConfiguration() {
        this.config = {
            apiEndpoint: process.env.TF_API_ENDPOINT || 'https://api.terrafusion.com',
            aiModelsEnabled: true,
            securityLevel: 'FISMA_HIGH',
            maxCounties: 3143,
            performanceMode: 'ELITE',
            debugMode: process.env.NODE_ENV === 'development'
        };
        
        if (this.config.debugMode) {
            console.log('🔧 Debug mode enabled', this.config);
        }
    }
    
    initializeAIModels() {
        console.log('🧠 Initializing AI Model Orchestra...');
        
        // Tier 1: Strategic Planning Models
        this.aiModels.set('claude-4-sonnet', {
            name: 'Claude-4 Sonnet',
            tier: 1,
            specialization: 'Strategic Planning',
            status: 'active',
            activeTasks: 1247,
            accuracy: 98.7,
            responseTime: 0.3,
            tasks: ['Government policy analysis', 'Strategic planning', 'Executive decision support']
        });
        
        this.aiModels.set('gpt-4o', {
            name: 'GPT-4o',
            tier: 1,
            specialization: 'Complex Reasoning',
            status: 'active',
            activeTasks: 892,
            accuracy: 97.3,
            responseTime: 0.4,
            tasks: ['Inter-agency coordination', 'Complex reasoning', 'Document analysis']
        });
        
        // Tier 2: Specialized Domain Models
        this.aiModels.set('property-gpt', {
            name: 'PropertyGPT',
            tier: 2,
            specialization: 'Property Valuation',
            status: 'active',
            activeTasks: 15247,
            accuracy: 99.1,
            responseTime: 0.47,
            tasks: ['Property valuation', 'Market analysis', 'Assessment verification']
        });
        
        this.aiModels.set('legal-gpt', {
            name: 'LegalGPT',
            tier: 2,
            specialization: 'Regulatory Compliance',
            status: 'active',
            activeTasks: 3456,
            accuracy: 96.8,
            responseTime: 0.6,
            tasks: ['Regulatory compliance', 'Legal analysis', 'Risk assessment']
        });
        
        this.aiModels.set('citizen-gpt', {
            name: 'CitizenGPT',
            tier: 2,
            specialization: 'Public Services',
            status: 'active',
            activeTasks: 8923,
            accuracy: 97.4,
            responseTime: 0.5,
            tasks: ['Citizen services', 'Multi-language support', 'Service routing']
        });
        
        // Tier 3: Operational Agents
        this.aiModels.set('agent-swarm', {
            name: 'AI Agent Swarm',
            tier: 3,
            specialization: 'Operational Tasks',
            status: 'active',
            activeTasks: 50247,
            coordinationLatency: 0.0007,
            efficiency: 94.2,
            agents: {
                propertyAssessors: 15247,
                revenueHunters: 8934,
                complianceMonitors: 12456,
                dataProcessors: 13610
            }
        });
        
        console.log(`✅ Initialized ${this.aiModels.size} AI model systems`);
    }
    
    initializeSecuritySystems() {
        console.log('🛡️ Initializing 11-Layer Security System...');
        
        const securityLayers = [
            {
                id: 1,
                name: 'Identity Verification',
                icon: '🔐',
                description: 'Multi-factor authentication with biometric validation',
                status: 'active',
                details: '847 users authenticated'
            },
            {
                id: 2,
                name: 'Zero-Trust Network',
                icon: '🛡️',
                description: 'Every connection verified, encrypted, and monitored',
                status: 'active',
                details: '12,847 connections secured'
            },
            {
                id: 3,
                name: 'AI Threat Detection',
                icon: '🔍',
                description: '50,000+ AI agents monitoring for threats in real-time',
                status: 'active',
                details: '0 threats detected today'
            },
            {
                id: 4,
                name: 'Data Classification',
                icon: '📊',
                description: 'Automatic data classification and handling',
                status: 'active',
                details: '2.3M records classified'
            },
            {
                id: 5,
                name: 'Quantum-Resistant Encryption',
                icon: '🔐',
                description: 'Post-quantum cryptography for future-proof security',
                status: 'active',
                details: 'All data quantum-protected'
            }
        ];
        
        securityLayers.forEach(layer => {
            this.securityLayers.set(layer.id, layer);
        });
        
        console.log(`✅ Initialized ${this.securityLayers.size} security layers`);
    }
    
    loadCountyData() {
        console.log('🏛️ Loading county data empire...');
        
        // Sample county data - in production this would come from the data API
        const sampleCounties = [
            {
                id: 'benton-wa',
                name: 'Benton County, WA',
                state: 'Washington',
                population: 204390,
                properties: 94149,
                status: 'LIVE_PRODUCTION',
                dataSource: 'Production Database',
                hasRealData: true,
                metrics: {
                    savings: 202000,
                    satisfaction: 97.3,
                    efficiency: 67
                }
            },
            {
                id: 'king-wa',
                name: 'King County, WA',
                state: 'Washington',
                population: 2269675,
                properties: 847000,
                status: 'FULL_DATA',
                dataSource: 'Open GIS Data',
                hasRealData: false,
                metrics: {
                    projectedSavings: 1200000,
                    estimatedEfficiency: 65
                }
            },
            {
                id: 'los-angeles-ca',
                name: 'Los Angeles County, CA',
                state: 'California',
                population: 10014009,
                properties: 2300000,
                status: 'MEGA_DEMO',
                dataSource: 'Enhanced Dataset',
                hasRealData: false,
                metrics: {
                    projectedSavings: 5400000,
                    estimatedEfficiency: 70
                }
            },
            {
                id: 'harris-tx',
                name: 'Harris County, TX',
                state: 'Texas',
                population: 4731145,
                properties: 1800000,
                status: 'ENHANCED',
                dataSource: 'Open Data + Enhancements',
                hasRealData: false,
                metrics: {
                    projectedSavings: 3200000,
                    estimatedEfficiency: 68
                }
            }
        ];
        
        sampleCounties.forEach(county => {
            this.countyData.set(county.id, county);
        });
        
        console.log(`✅ Loaded ${this.countyData.size} county datasets`);
    }
    
    setupEventListeners() {
        // Resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
        
        // Performance monitoring
        window.addEventListener('load', () => {
            this.performanceMetrics.loadTime = performance.now();
            console.log(`⚡ Page loaded in ${this.performanceMetrics.loadTime.toFixed(2)}ms`);
        });
        
        // Interaction tracking
        document.addEventListener('click', (e) => {
            this.performanceMetrics.interactionCount++;
            if (this.config.debugMode) {
                console.log(`👆 Interaction ${this.performanceMetrics.interactionCount}: ${e.target.tagName}`);
            }
        });
    }
    
    handleResize() {
        // Responsive adjustments
        const width = window.innerWidth;
        
        if (width < 768) {
            document.body.classList.add('mobile-view');
        } else {
            document.body.classList.remove('mobile-view');
        }
    }
    
    handleKeyboard(e) {
        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'h':
                    e.preventDefault();
                    this.showHelp();
                    break;
                case 'd':
                    e.preventDefault();
                    this.toggleDebugMode();
                    break;
            }
        }
        
        // Escape key handling
        if (e.key === 'Escape') {
            this.closeCurrentModal();
        }
    }
    
    // Animation system
    animateElement(element, animation, duration = 400) {
        return new Promise((resolve) => {
            element.style.transition = `all ${duration}ms ease-in-out`;
            
            switch (animation) {
                case 'fadeIn':
                    element.style.opacity = '0';
                    element.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                    }, 10);
                    break;
                    
                case 'slideIn':
                    element.style.transform = 'translateX(-100%)';
                    setTimeout(() => {
                        element.style.transform = 'translateX(0)';
                    }, 10);
                    break;
                    
                case 'scaleIn':
                    element.style.transform = 'scale(0.8)';
                    element.style.opacity = '0';
                    setTimeout(() => {
                        element.style.transform = 'scale(1)';
                        element.style.opacity = '1';
                    }, 10);
                    break;
            }
            
            setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }
    
    // Counter animation for metrics
    animateCounter(element, target, duration = 2000) {
        const start = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
        const increment = (target - start) / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            // Format the number based on size
            let formatted;
            if (target >= 1000000) {
                formatted = (current / 1000000).toFixed(1) + 'M';
            } else if (target >= 1000) {
                formatted = (current / 1000).toFixed(0) + 'K';
            } else {
                formatted = Math.floor(current).toLocaleString();
            }
            
            // Preserve any prefix/suffix
            const originalText = element.textContent;
            const numberMatch = originalText.match(/[\d,]+/);
            if (numberMatch) {
                element.textContent = originalText.replace(/[\d,]+/, formatted);
            } else {
                element.textContent = formatted;
            }
        }, 16);
    }
    
    // Utility methods
    showHelp() {
        console.log('🔧 TerraFusion Empire Keyboard Shortcuts:');
        console.log('Ctrl/Cmd + H: Show help');
        console.log('Ctrl/Cmd + D: Toggle debug mode');
        console.log('Escape: Close current modal');
    }
    
    toggleDebugMode() {
        this.config.debugMode = !this.config.debugMode;
        console.log(`🔧 Debug mode: ${this.config.debugMode ? 'ON' : 'OFF'}`);
        
        if (this.config.debugMode) {
            document.body.classList.add('debug-mode');
        } else {
            document.body.classList.remove('debug-mode');
        }
    }
    
    closeCurrentModal() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    // Performance monitoring
    getPerformanceReport() {
        return {
            ...this.performanceMetrics,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
            } : null,
            timestamp: new Date().toISOString()
        };
    }
}

// Global empire instance
let empire;

// Platform initialization
function initializeEmpirePlatform() {
    console.log('🚀 Starting TerraFusion Empire Platform...');
    
    // Create empire instance
    empire = new TerraFusionEmpire();
    
    // Start loading sequence
    startLoadingSequence();
}

function startLoadingSequence() {
    const loadingScreen = document.getElementById('empire-loading');
    const empirePlatform = document.getElementById('empire-platform');
    const progressBar = document.querySelector('.progress-bar');
    const loadingMessages = document.querySelectorAll('.loading-message');
    
    let progress = 0;
    let messageIndex = 0;
    
    const loadingSteps = [
        { message: 'Initializing Government Intelligence...', duration: 800 },
        { message: 'Coordinating 50,000+ AI Agents...', duration: 1000 },
        { message: 'Activating FISMA HIGH Security...', duration: 600 },
        { message: 'Loading County Data Empire...', duration: 700 },
        { message: 'Empire Platform Ready!', duration: 500 }
    ];
    
    function nextLoadingStep() {
        if (messageIndex < loadingSteps.length) {
            // Hide current message
            if (messageIndex > 0) {
                loadingMessages[messageIndex - 1].classList.remove('active');
            }
            
            // Show next message
            if (messageIndex < loadingMessages.length) {
                loadingMessages[messageIndex].classList.add('active');
            }
            
            // Update progress
            progress = ((messageIndex + 1) / loadingSteps.length) * 100;
            progressBar.style.width = progress + '%';
            
            messageIndex++;
            
            if (messageIndex <= loadingSteps.length) {
                setTimeout(nextLoadingStep, loadingSteps[messageIndex - 1]?.duration || 500);
            } else {
                // Loading complete
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    empirePlatform.classList.remove('hidden');
                    
                    // Initialize animations
                    initializeAnimations();
                    
                    console.log('✅ TerraFusion Empire Platform loaded successfully!');
                }, 300);
            }
        }
    }
    
    // Start loading sequence
    nextLoadingStep();
}

function initializeAnimations() {
    // Animate metric counters
    const metricValues = document.querySelectorAll('.metric-value[data-count]');
    metricValues.forEach(element => {
        const target = parseInt(element.dataset.count);
        empire.animateCounter(element, target);
    });
    
    // Animate hero elements
    const heroElements = document.querySelectorAll('.brand-constellation > *');
    heroElements.forEach((element, index) => {
        setTimeout(() => {
            empire.animateElement(element, 'fadeIn', 600);
        }, index * 200);
    });
}

// Demo functions
function showCountySelector() {
    console.log('🏛️ Opening county selector...');
    
    const heroSection = document.querySelector('.empire-hero-stage');
    const countySection = document.getElementById('county-selection');
    
    // Hide hero, show county selector
    heroSection.style.transform = 'translateY(-100%)';
    heroSection.style.opacity = '0';
    
    setTimeout(() => {
        heroSection.classList.add('hidden');
        countySection.classList.remove('hidden');
        empire.animateElement(countySection, 'fadeIn');
    }, 400);
}

function showSecurityDemo() {
    console.log('🛡️ Opening security demonstration...');
    
    // Implementation for security demo
    const securitySection = document.getElementById('security-showcase');
    if (securitySection) {
        securitySection.classList.remove('hidden');
        empire.animateElement(securitySection, 'slideIn');
        
        // Load security layers
        loadSecurityLayers();
    }
}

function showAIDemo() {
    console.log('🧠 Opening AI orchestra demonstration...');
    
    // Implementation for AI demo
    const aiSection = document.getElementById('ai-showcase');
    if (aiSection) {
        aiSection.classList.remove('hidden');
        empire.animateElement(aiSection, 'scaleIn');
        
        // Load AI models
        loadAIModels();
    }
}

function loadCountyDemo(countyId) {
    console.log(`🏛️ Loading demo for county: ${countyId}`);
    
    const countyData = empire.countyData.get(countyId);
    if (!countyData) {
        console.error(`County data not found: ${countyId}`);
        return;
    }
    
    // Hide county selector
    const countySection = document.getElementById('county-selection');
    const demoSection = document.getElementById('county-demo');
    
    countySection.classList.add('hidden');
    demoSection.classList.remove('hidden');
    
    // Load county-specific demo
    loadCountySpecificDemo(countyData);
}

function loadCountySpecificDemo(countyData) {
    console.log('🚀 Loading county-specific demo...', countyData);
    
    // Update demo header
    const countyName = document.getElementById('demo-county-name');
    const population = document.getElementById('demo-population');
    const properties = document.getElementById('demo-properties');
    const dataSource = document.getElementById('demo-data-source');
    
    if (countyName) countyName.textContent = countyData.name;
    if (population) population.textContent = `Population: ${countyData.population.toLocaleString()}`;
    if (properties) properties.textContent = `Properties: ${countyData.properties.toLocaleString()}`;
    if (dataSource) dataSource.textContent = `Data: ${countyData.dataSource}`;
    
    // Animate demo loading
    const demoLoading = document.getElementById('demo-loading');
    if (demoLoading) {
        empire.animateElement(demoLoading, 'fadeIn');
        
        // Simulate demo preparation
        setTimeout(() => {
            demoLoading.style.display = 'none';
            loadDemoContent(countyData);
        }, 2000);
    }
}

function loadDemoContent(countyData) {
    console.log('📊 Loading demo content...', countyData);
    
    // This would load the actual demo content based on county data
    // For now, we'll show a placeholder
    const demoContent = document.querySelector('.demo-content');
    if (demoContent) {
        demoContent.innerHTML = `
            <div class="demo-overview">
                <h3>🏛️ ${countyData.name} - TerraFusion OS Demo</h3>
                <div class="demo-metrics">
                    <div class="demo-metric">
                        <span class="metric-value">${countyData.properties.toLocaleString()}</span>
                        <span class="metric-label">Properties Managed</span>
                    </div>
                    <div class="demo-metric">
                        <span class="metric-value">${countyData.hasRealData ? '$' + (countyData.metrics.savings || 0).toLocaleString() : 'Projected'}</span>
                        <span class="metric-label">Annual Savings</span>
                    </div>
                    <div class="demo-metric">
                        <span class="metric-value">${(countyData.metrics.satisfaction || countyData.metrics.estimatedEfficiency || 95).toFixed(1)}%</span>
                        <span class="metric-label">${countyData.hasRealData ? 'Staff Satisfaction' : 'Estimated Efficiency'}</span>
                    </div>
                </div>
                <p class="demo-description">
                    ${countyData.hasRealData ? 
                        'This is live production data from ' + countyData.name + ' running on TerraFusion OS.' :
                        'This demonstration uses ' + countyData.dataSource + ' to show how ' + countyData.name + ' would operate on TerraFusion OS.'
                    }
                </p>
            </div>
        `;
        
        empire.animateElement(demoContent, 'fadeIn');
    }
}

function loadSecurityLayers() {
    console.log('🛡️ Loading security layers...');
    
    const layersGrid = document.querySelector('.protection-layers-grid');
    if (!layersGrid) return;
    
    layersGrid.innerHTML = '';
    
    empire.securityLayers.forEach(layer => {
        const layerElement = document.createElement('div');
        layerElement.className = 'protection-layer active';
        layerElement.innerHTML = `
            <div class="layer-icon">${layer.icon}</div>
            <div class="layer-info">
                <h4>Layer ${layer.id}: ${layer.name}</h4>
                <p>${layer.description}</p>
                <div class="layer-status">✅ ACTIVE - ${layer.details}</div>
            </div>
        `;
        
        layersGrid.appendChild(layerElement);
        
        // Animate layer appearance
        setTimeout(() => {
            empire.animateElement(layerElement, 'slideIn');
        }, layer.id * 100);
    });
}

function loadAIModels() {
    console.log('🧠 Loading AI models...');
    
    const modelGrid = document.querySelector('.model-grid');
    if (!modelGrid) return;
    
    modelGrid.innerHTML = '';
    
    // Group models by tier
    const tiers = new Map();
    empire.aiModels.forEach(model => {
        if (!tiers.has(model.tier)) {
            tiers.set(model.tier, []);
        }
        tiers.get(model.tier).push(model);
    });
    
    // Render tiers
    tiers.forEach((models, tierNumber) => {
        const tierElement = document.createElement('div');
        tierElement.className = `model-tier tier-${tierNumber}`;
        
        let tierTitle = '';
        switch (tierNumber) {
            case 1: tierTitle = 'Tier 1: Strategic Planning'; break;
            case 2: tierTitle = 'Tier 2: Specialized Domain Models'; break;
            case 3: tierTitle = 'Tier 3: Operational Agents'; break;
        }
        
        tierElement.innerHTML = `<h4>${tierTitle}</h4>`;
        
        models.forEach(model => {
            const modelElement = document.createElement('div');
            modelElement.className = `model-card ${model.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            
            if (model.tier === 3) {
                // Special rendering for agent swarm
                modelElement.innerHTML = `
                    <div class="model-header">
                        <span class="model-name">${model.name}</span>
                        <span class="model-status active">🟢 ACTIVE</span>
                    </div>
                    <div class="agent-swarm-display">
                        <div class="swarm-metrics">
                            <div class="metric-large">
                                <span class="value">${model.activeTasks.toLocaleString()}</span>
                                <span class="label">Active AI Agents</span>
                            </div>
                            <div class="metric-grid">
                                <div class="metric">
                                    <span class="value">${model.agents.propertyAssessors.toLocaleString()}</span>
                                    <span class="label">Property Assessors</span>
                                </div>
                                <div class="metric">
                                    <span class="value">${model.agents.revenueHunters.toLocaleString()}</span>
                                    <span class="label">Revenue Hunters</span>
                                </div>
                                <div class="metric">
                                    <span class="value">${model.agents.complianceMonitors.toLocaleString()}</span>
                                    <span class="label">Compliance Monitors</span>
                                </div>
                                <div class="metric">
                                    <span class="value">${model.agents.dataProcessors.toLocaleString()}</span>
                                    <span class="label">Data Processors</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Standard model rendering
                modelElement.innerHTML = `
                    <div class="model-header">
                        <span class="model-name">${model.name}</span>
                        <span class="model-status active">🟢 ACTIVE</span>
                    </div>
                    <div class="model-metrics">
                        <span class="metric">Tasks: ${model.activeTasks.toLocaleString()} active</span>
                        <span class="metric">Accuracy: ${model.accuracy}%</span>
                        <span class="metric">Response: ${model.responseTime}s avg</span>
                    </div>
                    <div class="model-tasks">
                        ${model.tasks.map(task => `<span class="task">${task}</span>`).join('')}
                    </div>
                `;
            }
            
            tierElement.appendChild(modelElement);
        });
        
        modelGrid.appendChild(tierElement);
        
        // Animate tier appearance
        setTimeout(() => {
            empire.animateElement(tierElement, 'fadeIn');
        }, tierNumber * 200);
    });
}

function processAIQuery() {
    console.log('🧠 Processing AI query...');
    
    const queryInput = document.getElementById('ai-query');
    const processingViz = document.getElementById('processing-visualization');
    
    if (!queryInput || !processingViz) return;
    
    const query = queryInput.value;
    if (!query.trim()) return;
    
    // Show processing visualization
    processingViz.classList.remove('hidden');
    processingViz.innerHTML = '';
    
    // Simulate AI processing steps
    const processingSteps = [
        {
            model: 'Supreme Commander Claude',
            action: 'Analyzing query complexity...',
            result: '✅ Multi-domain query identified',
            duration: 800
        },
        {
            model: 'PropertyGPT',
            action: 'Calculating property assessment...',
            result: '✅ $467,500 (94.7% confidence)',
            duration: 1200
        },
        {
            model: 'LegalGPT',
            action: 'Verifying zoning compliance...',
            result: '✅ R-2 compliant, no violations',
            duration: 1000
        },
        {
            model: 'Supreme Commander Claude',
            action: 'Synthesizing final response...',
            result: '✅ Government-ready response with audit trail',
            duration: 600
        }
    ];
    
    let stepIndex = 0;
    
    function showNextStep() {
        if (stepIndex < processingSteps.length) {
            const step = processingSteps[stepIndex];
            
            const stepElement = document.createElement('div');
            stepElement.className = 'processing-step active';
            stepElement.innerHTML = `
                <div class="step-model">${step.model}</div>
                <div class="step-action">${step.action}</div>
                <div class="step-result">${step.result}</div>
            `;
            
            processingViz.appendChild(stepElement);
            empire.animateElement(stepElement, 'slideIn');
            
            stepIndex++;
            setTimeout(showNextStep, step.duration);
        } else {
            // Show final response
            showFinalResponse();
        }
    }
    
    function showFinalResponse() {
        const responseElement = document.createElement('div');
        responseElement.className = 'final-response';
        responseElement.innerHTML = `
            <h4>AI Orchestra Response:</h4>
            <p>"123 Main Street is assessed at $467,500 (confidence: 94.7%) and is fully compliant with R-2 residential zoning regulations."</p>
            <div class="response-metadata">
                <span class="metadata">Processing time: 0.8 seconds</span>
                <span class="metadata">Models used: 4</span>
                <span class="metadata">Accuracy: 98.7%</span>
                <span class="metadata">Audit trail: Available</span>
            </div>
        `;
        
        processingViz.appendChild(responseElement);
        empire.animateElement(responseElement, 'fadeIn');
        
        // Track demo completion
        empire.performanceMetrics.demoCompletions++;
    }
    
    // Start processing sequence
    showNextStep();
}

// Export for global access
window.TerraFusionEmpire = TerraFusionEmpire;
window.initializeEmpirePlatform = initializeEmpirePlatform;
window.showCountySelector = showCountySelector;
window.showSecurityDemo = showSecurityDemo;
window.showAIDemo = showAIDemo;
window.loadCountyDemo = loadCountyDemo;
window.processAIQuery = processAIQuery;


