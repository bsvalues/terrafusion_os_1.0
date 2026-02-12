/**
 * TerraFusion Market - Main JavaScript
 * Handles all core functionality for the web application
 */

class TerraFusionMarket {
    constructor() {
        this.isLoading = true;
        this.apiBase = 'https://api.terrafusionmarket.io/v1';
        this.currentDemo = null;
        this.aiAgents = 1008;
        this.quantumProcessing = true;
        
        this.init();
    }

    async init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    async initializeApp() {
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize components
            await this.initializeComponents();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize animations
            this.initializeAnimations();
            
            // Hide loading screen
            setTimeout(() => this.hideLoadingScreen(), 2000);
            
            console.log('🏆 TerraFusion Market initialized successfully');
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.handleError(error);
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            this.isLoading = false;
            
            // Trigger hero animations
            this.animateHeroEntry();
        }
    }

    async initializeComponents() {
        // Initialize navbar
        this.initializeNavbar();
        
        // Initialize forms
        this.initializeForms();
        
        // Initialize demo system
        this.initializeDemoSystem();
        
        // Initialize quantum visualization
        this.initializeQuantumVisualization();
        
        // Initialize real-time metrics
        this.initializeMetrics();
    }

    initializeNavbar() {
        const navbar = document.getElementById('navbar');
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');

        // Scroll behavior
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Mobile menu toggle
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            // Close menu when clicking on links
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Portal login link
        const portalLink = document.querySelector('.nav-link[href="#portal"]');
        if (portalLink) {
            portalLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openPortalModal();
            });
        }
    }

    initializeForms() {
        // Demo form
        const demoForm = document.getElementById('demo-form');
        if (demoForm) {
            demoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleDemoSubmission(e.target);
            });
        }

        // Contact form
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactSubmission(e.target);
            });
        }

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLoginSubmission(e.target);
            });
        }

        // Location detection
        const detectLocationBtn = document.getElementById('detect-location');
        if (detectLocationBtn) {
            detectLocationBtn.addEventListener('click', () => {
                this.detectUserLocation();
            });
        }
    }

    initializeDemoSystem() {
        // Initialize demo data
        this.demoData = {
            yakima: {
                name: 'Yakima County, WA',
                properties: 65000,
                avgProcessingTime: '0.8s',
                accuracy: '99.2%',
                sampleProperty: {
                    address: '123 Championship Way, Yakima, WA 98901',
                    value: 847500,
                    sqft: 2100,
                    bedrooms: 3,
                    bathrooms: 2,
                    yearBuilt: 2018,
                    lotSize: 0.25
                }
            },
            benton: {
                name: 'Benton County, WA',
                properties: 85000,
                avgProcessingTime: '0.6s',
                accuracy: '99.4%',
                sampleProperty: {
                    address: '456 Innovation Drive, Richland, WA 99352',
                    value: 925000,
                    sqft: 2800,
                    bedrooms: 4,
                    bathrooms: 3,
                    yearBuilt: 2020,
                    lotSize: 0.33
                }
            },
            spokane: {
                name: 'Spokane County, WA',
                properties: 215000,
                avgProcessingTime: '0.9s',
                accuracy: '99.1%',
                sampleProperty: {
                    address: '789 Liberty Street, Spokane, WA 99201',
                    value: 675000,
                    sqft: 1950,
                    bedrooms: 3,
                    bathrooms: 2,
                    yearBuilt: 2015,
                    lotSize: 0.22
                }
            },
            clark: {
                name: 'Clark County, WA',
                properties: 205000,
                avgProcessingTime: '0.7s',
                accuracy: '99.3%',
                sampleProperty: {
                    address: '321 Evergreen Plaza, Vancouver, WA 98660',
                    value: 1250000,
                    sqft: 3500,
                    bedrooms: 5,
                    bathrooms: 4,
                    yearBuilt: 2022,
                    lotSize: 0.45
                }
            }
        };
    }

    initializeQuantumVisualization() {
        const quantumViz = document.getElementById('quantum-viz');
        if (quantumViz) {
            this.createQuantumParticles(quantumViz);
        }
    }

    initializeMetrics() {
        // Start real-time metrics updates
        this.metricsInterval = setInterval(() => {
            this.updateRealTimeMetrics();
        }, 3000);
        
        // Initial metrics update
        this.updateRealTimeMetrics();
    }

    setupEventListeners() {
        // Window events
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Button click handlers
        this.setupButtonHandlers();
    }

    setupButtonHandlers() {
        // Start demo button
        const startDemoBtn = document.querySelector('[onclick="startDemo()"]');
        if (startDemoBtn) {
            startDemoBtn.onclick = null;
            startDemoBtn.addEventListener('click', () => this.startDemo());
        }

        // Request quote button
        const requestQuoteBtn = document.querySelector('[onclick="requestQuote()"]');
        if (requestQuoteBtn) {
            requestQuoteBtn.onclick = null;
            requestQuoteBtn.addEventListener('click', () => this.requestQuote());
        }

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close')) {
                this.closeModal();
            }
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    async handleDemoSubmission(form) {
        const formData = new FormData(form);
        const demoData = {
            address: formData.get('property-address'),
            type: formData.get('assessment-type'),
            county: formData.get('county-select')
        };

        if (!demoData.address || !demoData.type || !demoData.county) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            this.showDemoLoading();
            
            // Simulate AI processing
            await this.simulateAIProcessing(demoData);
            
            // Generate and display results
            const results = await this.generateDemoResults(demoData);
            this.displayDemoResults(results);
            
        } catch (error) {
            console.error('Demo submission error:', error);
            this.showNotification('Demo processing failed. Please try again.', 'error');
            this.hideDemoLoading();
        }
    }

    async simulateAIProcessing(demoData) {
        const processingSteps = [
            'Initializing AI Swarm (1,008 agents)',
            'Analyzing property location and characteristics',
            'Processing market data with quantum algorithms',
            'Generating comparative market analysis',
            'Validating results with multiple AI models',
            'Finalizing assessment with 99.7% confidence'
        ];

        for (let i = 0; i < processingSteps.length; i++) {
            await this.delay(300 + Math.random() * 200);
            this.updateProcessingStatus(processingSteps[i], (i + 1) / processingSteps.length);
        }
    }

    async generateDemoResults(demoData) {
        const countyInfo = this.demoData[demoData.county];
        if (!countyInfo) {
            throw new Error('County data not found');
        }

        // Simulate property analysis
        const baseValue = countyInfo.sampleProperty.value;
        const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
        const estimatedValue = Math.round(baseValue * (1 + variation));

        const processingTime = parseFloat(countyInfo.avgProcessingTime) * (0.8 + Math.random() * 0.4);
        const confidence = parseFloat(countyInfo.accuracy.replace('%', '')) + (Math.random() - 0.5) * 2;

        return {
            property: {
                address: demoData.address,
                type: demoData.type,
                county: countyInfo.name
            },
            assessment: {
                estimatedValue: estimatedValue,
                confidence: Math.round(confidence * 10) / 10,
                processingTime: Math.round(processingTime * 1000),
                accuracy: confidence
            },
            metrics: {
                comparablesSample: Math.floor(Math.random() * 50) + 20,
                marketTrend: Math.random() > 0.5 ? 'increasing' : 'stable',
                agentsDeployed: Math.floor(Math.random() * 100) + 50,
                dataPoints: Math.floor(Math.random() * 5000) + 2000
            },
            marketAnalysis: {
                medianPrice: Math.round(estimatedValue * (0.85 + Math.random() * 0.3)),
                pricePerSqft: Math.round((estimatedValue / countyInfo.sampleProperty.sqft) * 100) / 100,
                marketVelocity: Math.round((Math.random() * 30 + 15) * 10) / 10,
                inventoryDays: Math.floor(Math.random() * 60) + 30
            }
        };
    }

    displayDemoResults(results) {
        const demoResults = document.getElementById('demo-results');
        if (!demoResults) return;

        const resultHTML = `
            <div class="demo-result-card animate-fade-in-up">
                <div class="demo-result-header">
                    <h4 class="demo-result-title">Property Assessment Complete</h4>
                    <div class="demo-confidence">${results.assessment.confidence}% Confidence</div>
                </div>
                
                <div class="demo-property-info">
                    <h5>📍 ${results.property.address}</h5>
                    <p>${results.property.type} • ${results.property.county}</p>
                </div>
                
                <div class="demo-metrics">
                    <div class="demo-metric">
                        <span class="demo-metric-value">$${results.assessment.estimatedValue.toLocaleString()}</span>
                        <span class="demo-metric-label">Estimated Value</span>
                    </div>
                    <div class="demo-metric">
                        <span class="demo-metric-value">${results.assessment.processingTime}ms</span>
                        <span class="demo-metric-label">Processing Time</span>
                    </div>
                    <div class="demo-metric">
                        <span class="demo-metric-value">${results.metrics.agentsDeployed}</span>
                        <span class="demo-metric-label">AI Agents</span>
                    </div>
                    <div class="demo-metric">
                        <span class="demo-metric-value">${results.metrics.comparablesSample}</span>
                        <span class="demo-metric-label">Comparables</span>
                    </div>
                </div>
                
                <div class="demo-market-analysis">
                    <h6>Market Analysis</h6>
                    <div class="market-stats">
                        <div class="market-stat">
                            <span>Median Price:</span>
                            <span>$${results.marketAnalysis.medianPrice.toLocaleString()}</span>
                        </div>
                        <div class="market-stat">
                            <span>Price/Sq Ft:</span>
                            <span>$${results.marketAnalysis.pricePerSqft}</span>
                        </div>
                        <div class="market-stat">
                            <span>Market Velocity:</span>
                            <span>${results.marketAnalysis.marketVelocity} days</span>
                        </div>
                        <div class="market-stat">
                            <span>Inventory:</span>
                            <span>${results.marketAnalysis.inventoryDays} days</span>
                        </div>
                    </div>
                </div>
                
                <div class="demo-ai-insights">
                    <h6>🤖 AI Insights</h6>
                    <ul>
                        <li>Property shows strong market position in current conditions</li>
                        <li>Valuation confidence enhanced by ${results.metrics.dataPoints.toLocaleString()} data points</li>
                        <li>Market trend: ${results.metrics.marketTrend === 'increasing' ? '📈 Increasing' : '📊 Stable'}</li>
                        <li>Processing completed in ${results.assessment.processingTime}ms (914x faster than traditional methods)</li>
                    </ul>
                </div>
            </div>
        `;

        demoResults.innerHTML = resultHTML;
        this.hideDemoLoading();
        
        // Scroll to results
        demoResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showDemoLoading() {
        const demoResults = document.getElementById('demo-results');
        if (demoResults) {
            demoResults.innerHTML = `
                <div class="demo-loading active">
                    <div class="demo-spinner"></div>
                    <h4>AI Processing in Progress</h4>
                    <p id="processing-status">Initializing quantum algorithms...</p>
                    <div class="processing-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    hideDemoLoading() {
        const demoLoading = document.querySelector('.demo-loading');
        if (demoLoading) {
            demoLoading.classList.remove('active');
        }
    }

    updateProcessingStatus(status, progress) {
        const statusElement = document.getElementById('processing-status');
        const progressFill = document.getElementById('progress-fill');
        
        if (statusElement) {
            statusElement.textContent = status;
        }
        
        if (progressFill) {
            progressFill.style.width = `${progress * 100}%`;
        }
    }

    async handleContactSubmission(form) {
        const formData = new FormData(form);
        const contactData = {
            firstName: formData.get('first-name'),
            lastName: formData.get('last-name'),
            email: formData.get('email'),
            organization: formData.get('organization'),
            interest: formData.get('interest'),
            message: formData.get('message')
        };

        if (!contactData.firstName || !contactData.lastName || !contactData.email) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Sending...';
            submitBtn.disabled = true;

            // Simulate API call
            await this.delay(2000);

            // Success
            this.showNotification('Thank you! Your message has been sent successfully.', 'success');
            form.reset();
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

        } catch (error) {
            console.error('Contact submission error:', error);
            this.showNotification('Failed to send message. Please try again.', 'error');
            
            // Reset button
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = 'Send Message';
            submitBtn.disabled = false;
        }
    }

    startDemo() {
        const demoSection = document.getElementById('demo');
        if (demoSection) {
            demoSection.scrollIntoView({ behavior: 'smooth' });
            
            // Focus on the address input
            setTimeout(() => {
                const addressInput = document.getElementById('property-address');
                if (addressInput) {
                    addressInput.focus();
                }
            }, 500);
        }
    }

    requestQuote() {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
            
            // Pre-select appropriate interest
            setTimeout(() => {
                const interestSelect = document.getElementById('interest');
                if (interestSelect) {
                    interestSelect.value = 'property-assessment';
                }
            }, 500);
        }
    }

    openPortalModal() {
        const modal = document.getElementById('portal-modal');
        if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex';
        }
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    }

    createQuantumParticles(container) {
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'quantum-particle-viz';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 8 + 4}px;
                height: ${Math.random() * 8 + 4}px;
                background: rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2});
                border-radius: 50%;
                animation: quantumFloat ${Math.random() * 10 + 10}s infinite linear;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
            `;
            
            container.appendChild(particle);
        }
        
        // Add quantum float animation
        if (!document.getElementById('quantum-styles')) {
            const style = document.createElement('style');
            style.id = 'quantum-styles';
            style.textContent = `
                @keyframes quantumFloat {
                    0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) rotate(360deg); opacity: 0; }
                }
                .progress-bar {
                    width: 100%;
                    height: 4px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 2px;
                    overflow: hidden;
                    margin-top: 1rem;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4fd1c7, #81e6d9);
                    transition: width 0.3s ease;
                    width: 0%;
                }
                .market-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }
                .market-stat {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem;
                    background: rgba(255,255,255,0.05);
                    border-radius: 0.25rem;
                    font-size: 0.875rem;
                }
                .demo-ai-insights ul {
                    list-style: none;
                    padding: 0;
                    margin-top: 1rem;
                }
                .demo-ai-insights li {
                    padding: 0.5rem 0;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    font-size: 0.875rem;
                }
            `;
            document.head.appendChild(style);
        }
    }

    updateRealTimeMetrics() {
        // Update hero stats with slight variations
        const stats = document.querySelectorAll('.stat-number');
        stats.forEach((stat, index) => {
            const currentText = stat.textContent;
            if (index === 0 && currentText.includes('914x')) {
                // Slight variation in performance multiplier
                const variation = 914 + (Math.random() - 0.5) * 2;
                stat.textContent = `${Math.round(variation)}x`;
            } else if (index === 1 && currentText.includes('99.97%')) {
                // Slight variation in accuracy
                const accuracy = 99.97 + (Math.random() - 0.5) * 0.06;
                stat.textContent = `${accuracy.toFixed(2)}%`;
            } else if (index === 2 && currentText.includes('1,008')) {
                // Agent count variations
                const agents = 1008 + Math.floor((Math.random() - 0.5) * 10);
                stat.textContent = agents.toString();
            }
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#4299e1'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            z-index: 10000;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
            max-width: 400px;
            word-wrap: break-word;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }

    animateHeroEntry() {
        const heroContent = document.querySelector('.hero-content');
        const heroVisual = document.querySelector('.hero-visual');
        
        if (heroContent) {
            heroContent.classList.add('animate-fade-in-left');
        }
        
        if (heroVisual) {
            heroVisual.classList.add('animate-fade-in-right');
        }
    }

    initializeAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                }
            });
        }, observerOptions);

        // Observe elements with data-aos attribute
        document.querySelectorAll('[data-aos]').forEach(el => {
            observer.observe(el);
        });
    }

    handleResize() {
        // Handle responsive adjustments
        if (window.innerWidth <= 768) {
            // Mobile adjustments
            const navMenu = document.getElementById('nav-menu');
            const hamburger = document.getElementById('hamburger');
            
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        }
    }

    handleError(error) {
        console.error('Application error:', error);
        this.showNotification('An error occurred. Please refresh the page.', 'error');
    }

    cleanup() {
        // Clear intervals
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global functions for legacy onclick handlers
window.startDemo = function() {
    if (window.terraFusionApp) {
        window.terraFusionApp.startDemo();
    }
};

window.requestQuote = function() {
    if (window.terraFusionApp) {
        window.terraFusionApp.requestQuote();
    }
};

window.closeModal = function() {
    if (window.terraFusionApp) {
        window.terraFusionApp.closeModal();
    }
};

// Initialize application
window.terraFusionApp = new TerraFusionMarket();