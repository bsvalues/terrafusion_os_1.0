/**
 * Terrafusion Market - Main JavaScript
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

      console.log('🏆 Terrafusion Market initialized successfully');
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
      anchor.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      });
    });

    // Portal login link
    const portalLink = document.querySelector('.nav-link[href="#portal"]');
    if (portalLink) {
      portalLink.addEventListener('click', e => {
        e.preventDefault();
        this.openPortalModal();
      });
    }
  }

  initializeForms() {
    // Demo form
    const demoForm = document.getElementById('demo-form');
    if (demoForm) {
      demoForm.addEventListener('submit', e => {
        e.preventDefault();
        this.handleDemoSubmission(e.target);
      });
    }

    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', e => {
        e.preventDefault();
        this.handleContactSubmission(e.target);
      });
    }

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', e => {
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
          lotSize: 0.25,
        },
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
          lotSize: 0.33,
        },
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
          lotSize: 0.22,
        },
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
          lotSize: 0.45,
        },
      },
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
    document.addEventListener('click', e => {
      if (e.target.classList.contains('modal-close')) {
        this.closeModal();
      }
      if (e.target.classList.contains('modal')) {
        this.closeModal();
      }
    });

    // Escape key to close modal
    document.addEventListener('keydown', e => {
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
      county: formData.get('county-select'),
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
      'Finalizing assessment with 99.7% confidence',
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
        county: countyInfo.name,
      },
      assessment: {
        estimatedValue: estimatedValue,
        confidence: Math.round(confidence * 10) / 10,
        processingTime: Math.round(processingTime * 1000),
        accuracy: confidence,
      },
      metrics: {
        comparablesSample: Math.floor(Math.random() * 50) + 20,
        marketTrend: Math.random() > 0.5 ? 'increasing' : 'stable',
        agentsDeployed: Math.floor(Math.random() * 100) + 50,
        dataPoints: Math.floor(Math.random() * 5000) + 2000,
      },
      marketAnalysis: {
        medianPrice: Math.round(estimatedValue * (0.85 + Math.random() * 0.3)),
        pricePerSqft: Math.round((estimatedValue / countyInfo.sampleProperty.sqft) * 100) / 100,
        marketVelocity: Math.round((Math.random() * 30 + 15) * 10) / 10,
        inventoryDays: Math.floor(Math.random() * 60) + 30,
      },
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
      message: formData.get('message'),
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
    stats.forEach((stat /* , index */) => {
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
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver(entries => {
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
window.startDemo = function () {
  if (window.terraFusionApp) {
    window.terraFusionApp.startDemo();
  }
};

window.requestQuote = function () {
  if (window.terraFusionApp) {
    window.terraFusionApp.requestQuote();
  }
};

window.closeModal = function () {
  if (window.terraFusionApp) {
    window.terraFusionApp.closeModal();
  }
};

// Initialize application
window.terraFusionApp = new TerraFusionMarket();
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
        confidence: 99.7,
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
        confidence: 98.9,
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
        confidence: 97.8,
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
        confidence: 96.5,
      },
    ];

    this.marketFactors = {
      economic: { weight: 0.25, current: 0.85 },
      location: { weight: 0.3, current: 0.92 },
      condition: { weight: 0.2, current: 0.88 },
      market_demand: { weight: 0.15, current: 0.91 },
      comparable_sales: { weight: 0.1, current: 0.87 },
    };

    this.aiAgentTypes = [
      { name: 'Market Analysis Agent', icon: '📊', specialty: 'trend_analysis' },
      { name: 'Valuation Agent', icon: '💰', specialty: 'pricing' },
      { name: 'Compliance Agent', icon: '📋', specialty: 'regulations' },
      { name: 'Risk Assessment Agent', icon: '🛡️', specialty: 'risk_analysis' },
      { name: 'Comparison Agent', icon: '🔍', specialty: 'comparables' },
      { name: 'Geographic Agent', icon: '🗺️', specialty: 'location_data' },
      { name: 'Quantum Processing Agent', icon: '⚛️', specialty: 'computation' },
      { name: 'Predictive Agent', icon: '🔮', specialty: 'forecasting' },
    ];
  }

  /**
   * Initialize demo event handlers
   */
  initializeDemoHandlers() {
    // Demo form submission
    const demoForm = document.getElementById('demo-form');
    if (demoForm) {
      demoForm.addEventListener('submit', e => {
        e.preventDefault();
        this.runPropertyAssessment();
      });
    }

    // Property type change
    const assessmentType = document.getElementById('assessment-type');
    if (assessmentType) {
      assessmentType.addEventListener('change', e => {
        this.updateDemoForType(e.target.value);
      });
    }

    // County change
    const countySelect = document.getElementById('county-select');
    if (countySelect) {
      countySelect.addEventListener('change', e => {
        this.updateMarketDataForCounty(e.target.value);
      });
    }

    // Auto-complete for address
    const addressInput = document.getElementById('property-address');
    if (addressInput) {
      addressInput.addEventListener('input', e => {
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
      county: document.getElementById('county-select')?.value || '',
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
                    ${this.aiAgentTypes
                      .map(
                        (agent /* , index */) => `
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
                    `
                      )
                      .join('')}
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
    statusElement.textContent = 'Orchestrating clarity...';
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
    return new Promise(resolve => {
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
    let property = this.demoProperties.find(
      p => p.type === formData.type && p.county === formData.county
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
        confidence: 95 + Math.random() * 5,
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
      description: this.getFactorDescription(name),
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
        percentage: Math.random() * 10 + 2,
      },
      factors,
      comparables: this.generateComparables(property),
      riskFactors: this.generateRiskFactors(property),
      recommendations: this.generateRecommendations(property),
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
                ${factors
                  .map(
                    factor => `
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
                `
                  )
                  .join('')}
            </div>
        `;
  }

  /**
   * Render comparables panel
   */
  renderComparablesPanel(comparables) {
    return `
            <div class="comparables-list">
                ${comparables
                  .map(
                    comp => `
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
                `
                  )
                  .join('')}
            </div>
        `;
  }

  /**
   * Render risk panel
   */
  renderRiskPanel(riskFactors) {
    return `
            <div class="risk-factors">
                ${riskFactors
                  .map(
                    risk => `
                    <div class="risk-item risk-${risk.level}">
                        <div class="risk-header">
                            <span class="risk-icon">${risk.icon}</span>
                            <span class="risk-name">${risk.name}</span>
                            <span class="risk-level">${risk.level.toUpperCase()}</span>
                        </div>
                        <div class="risk-description">${risk.description}</div>
                        <div class="risk-impact">Impact: ${risk.impact}</div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        `;
  }

  /**
   * Render recommendations panel
   */
  renderRecommendationsPanel(recommendations) {
    return `
            <div class="recommendations-list">
                ${recommendations
                  .map(
                    rec => `
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
                `
                  )
                  .join('')}
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
      agricultural: 600000 + Math.random() * 400000,
    };

    return Math.round(baseValues[formData.type] || 500000);
  }

  estimateSquareFootage(type) {
    const ranges = {
      residential: [1500, 4000],
      commercial: [3000, 15000],
      industrial: [8000, 25000],
      agricultural: [2000, 8000],
    };

    const range = ranges[type] || [2000, 5000];
    return Math.floor(Math.random() * (range[1] - range[0]) + range[0]);
  }

  estimateLotSize(type) {
    const ranges = {
      residential: [0.1, 1.0],
      commercial: [0.5, 3.0],
      industrial: [1.0, 10.0],
      agricultural: [5.0, 50.0],
    };

    const range = ranges[type] || [0.2, 2.0];
    return +(Math.random() * (range[1] - range[0]) + range[0]).toFixed(1);
  }

  generateFeatures(type) {
    const featureOptions = {
      residential: ['garage', 'fireplace', 'updated_kitchen', 'hardwood_floors', 'deck', 'pool'],
      commercial: ['parking', 'elevator', 'conference_rooms', 'loading_dock', 'security_system'],
      industrial: ['crane', 'rail_access', 'high_ceiling', 'truck_dock', 'industrial_power'],
      agricultural: ['irrigation', 'barn', 'equipment_shed', 'fencing', 'water_rights'],
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
        similarity: Math.round(70 + Math.random() * 25),
      });
    }

    return comparables.sort((a, b) => b.similarity - a.similarity);
  }

  generateRiskFactors(property) {
    const riskTypes = [
      {
        name: 'Market Volatility',
        icon: '📈',
        level: 'low',
        description: 'Property values in this area are stable with low volatility.',
        impact: 'Minimal risk to valuation accuracy',
      },
      {
        name: 'Environmental Factors',
        icon: '🌍',
        level: 'low',
        description: 'No significant environmental concerns identified.',
        impact: 'No expected impact on property value',
      },
      {
        name: 'Economic Conditions',
        icon: '💼',
        level: 'medium',
        description: 'Regional economic indicators show moderate growth.',
        impact: 'Potential 2-5% variation in market values',
      },
    ];

    return riskTypes.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  generateRecommendations(property) {
    const recommendations = [
      {
        icon: '🔄',
        title: 'Schedule Re-assessment',
        description: 'Consider reassessment in 6 months to capture market changes.',
        impact: 'Maintain accuracy',
      },
      {
        icon: '📋',
        title: 'Verify Property Details',
        description: 'Confirm square footage and recent improvements.',
        impact: 'Increase confidence by 2-3%',
      },
      {
        icon: '🏘️',
        title: 'Monitor Comparables',
        description: 'Track similar property sales in the area.',
        impact: 'Enhanced market tracking',
      },
    ];

    return recommendations.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  getRandomStreetName() {
    const streets = [
      'Main St',
      'Oak Ave',
      'Pine Rd',
      'Cedar Ln',
      'Elm Dr',
      'Maple Way',
      'River Rd',
      'Hill St',
    ];
    return streets[Math.floor(Math.random() * streets.length)];
  }

  getFactorDescription(factor) {
    const descriptions = {
      economic: 'Regional economic health and employment rates',
      location: 'Proximity to amenities, schools, and transportation',
      condition: 'Physical condition and recent improvements',
      market_demand: 'Current buyer demand and inventory levels',
      comparable_sales: 'Recent sales of similar properties in the area',
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
      maximumFractionDigits: 0,
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
        url: window.location.href,
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
        'Trend analysis updated',
      ];

      const message = activity[Math.floor(Math.random() * activity.length)];
      console.log('🤖 Agent activity:', message);
    }
  }

  updateMarketData() {
    // Simulate real-time market data updates
    Object.keys(this.marketFactors).forEach(factor => {
      this.marketFactors[factor].current += (Math.random() - 0.5) * 0.02;
      this.marketFactors[factor].current = Math.max(
        0.1,
        Math.min(1.0, this.marketFactors[factor].current)
      );
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
/**
 * Terrafusion Market - Advanced Animations Engine
 * Quantum-Inspired Visual Effects and Interactions
 * Squad Alpha Component - Advanced Animations
 */

class TerraFusionAnimations {
  constructor() {
    this.observers = new Map();
    this.runningAnimations = new Set();
    this.rafId = null;
    this.scrollPosition = 0;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    this.initializeIntersectionObserver();
    this.initializeScrollAnimations();
    this.initializeHoverEffects();
    this.initializeLoadingAnimations();
    this.setupAnimationFrame();
    this.initializeQuantumParticles();
  }

  /**
   * Initialize Intersection Observer for scroll-triggered animations
   */
  initializeIntersectionObserver() {
    const observerOptions = {
      threshold: [0, 0.1, 0.5, 0.8, 1.0],
      rootMargin: '-50px 0px -50px 0px',
    };

    this.scrollObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const element = entry.target;
        const animationType = element.dataset.aos || 'fade-up';

        if (entry.isIntersecting) {
          this.triggerAnimation(element, animationType);
        }
      });
    }, observerOptions);

    // Observe all elements with data-aos attribute
    document.querySelectorAll('[data-aos]').forEach(element => {
      this.scrollObserver.observe(element);
    });
  }

  /**
   * Initialize scroll-based animations
   */
  initializeScrollAnimations() {
    let ticking = false;

    const updateScrollPosition = () => {
      this.scrollPosition = window.pageYOffset;
      this.updateParallaxElements();
      this.updateProgressBars();
      this.updateCounterAnimations();
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    });
  }

  /**
   * Initialize hover effects
   */
  initializeHoverEffects() {
    // Card hover effects
    document.querySelectorAll('.feature-card, .pricing-card, .result-card').forEach(card => {
      this.addCardHoverEffect(card);
    });

    // Button hover effects
    document.querySelectorAll('.btn').forEach(button => {
      this.addButtonHoverEffect(button);
    });

    // Logo hover effect
    const logo = document.querySelector('.logo');
    if (logo) {
      this.addLogoHoverEffect(logo);
    }
  }

  /**
   * Initialize loading animations
   */
  initializeLoadingAnimations() {
    // Animate elements on page load
    window.addEventListener('load', () => {
      this.animatePageLoad();
    });

    // Staggered animation for grids
    this.initializeStaggeredAnimations();
  }

  /**
   * Setup animation frame loop
   */
  setupAnimationFrame() {
    const animate = timestamp => {
      this.updateAnimations(timestamp);
      this.rafId = requestAnimationFrame(animate);
    };

    this.rafId = requestAnimationFrame(animate);
  }

  /**
   * Trigger animation based on type
   */
  triggerAnimation(element, type) {
    if (this.isReducedMotion) {
      element.classList.add('aos-animate');
      return;
    }

    const delay = parseInt(element.dataset.aosDelay) || 0;

    setTimeout(() => {
      switch (type) {
        case 'fade-up':
          this.fadeUpAnimation(element);
          break;
        case 'fade-down':
          this.fadeDownAnimation(element);
          break;
        case 'fade-left':
          this.fadeLeftAnimation(element);
          break;
        case 'fade-right':
          this.fadeRightAnimation(element);
          break;
        case 'zoom-in':
          this.zoomInAnimation(element);
          break;
        case 'flip-up':
          this.flipUpAnimation(element);
          break;
        case 'slide-up':
          this.slideUpAnimation(element);
          break;
        default:
          this.fadeUpAnimation(element);
      }
    }, delay);
  }

  /**
   * Animation implementations
   */
  fadeUpAnimation(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
      element.classList.add('aos-animate');
    });
  }

  fadeDownAnimation(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(-30px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
      element.classList.add('aos-animate');
    });
  }

  fadeLeftAnimation(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateX(-30px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateX(0)';
      element.classList.add('aos-animate');
    });
  }

  fadeRightAnimation(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateX(30px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateX(0)';
      element.classList.add('aos-animate');
    });
  }

  zoomInAnimation(element) {
    element.style.opacity = '0';
    element.style.transform = 'scale(0.8)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
      element.classList.add('aos-animate');
    });
  }

  flipUpAnimation(element) {
    element.style.opacity = '0';
    element.style.transform = 'perspective(2500px) rotateX(-100deg)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'perspective(2500px) rotateX(0deg)';
      element.classList.add('aos-animate');
    });
  }

  slideUpAnimation(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(100%)';
    element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
      element.classList.add('aos-animate');
    });
  }

  /**
   * Card hover effects
   */
  addCardHoverEffect(card) {
    if (this.isReducedMotion) return;

    const handleMouseEnter = () => {
      card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
      card.style.transform = 'translateY(-8px) scale(1.02)';
      card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
    };

    const handleMouseLeave = () => {
      card.style.transform = 'translateY(0) scale(1)';
      card.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);
  }

  /**
   * Button hover effects
   */
  addButtonHoverEffect(button) {
    if (this.isReducedMotion) return;

    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    button.appendChild(ripple);

    button.addEventListener('click', e => {
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('animate');

      setTimeout(() => {
        ripple.classList.remove('animate');
      }, 600);
    });
  }

  /**
   * Logo hover effect
   */
  addLogoHoverEffect(logo) {
    if (this.isReducedMotion) return;

    const handleMouseEnter = () => {
      logo.style.transition = 'transform 0.3s ease';
      logo.style.transform = 'rotate(5deg) scale(1.1)';
    };

    const handleMouseLeave = () => {
      logo.style.transform = 'rotate(0deg) scale(1)';
    };

    logo.addEventListener('mouseenter', handleMouseEnter);
    logo.addEventListener('mouseleave', handleMouseLeave);
  }

  /**
   * Page load animations
   */
  animatePageLoad() {
    // Hide loading screen with animation
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.transition = 'opacity 0.5s ease';
      loadingScreen.style.opacity = '0';

      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }

    // Animate navbar
    const navbar = document.getElementById('navbar');
    if (navbar) {
      navbar.style.transform = 'translateY(-100%)';
      navbar.style.transition = 'transform 0.6s ease';

      setTimeout(() => {
        navbar.style.transform = 'translateY(0)';
      }, 200);
    }

    // Animate hero content
    this.animateHeroContent();
  }

  /**
   * Hero content animation
   */
  animateHeroContent() {
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroActions = document.querySelector('.hero-actions');
    const heroStats = document.querySelector('.hero-stats');

    if (heroTitle) {
      heroTitle.style.opacity = '0';
      heroTitle.style.transform = 'translateY(30px)';
      heroTitle.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

      setTimeout(() => {
        heroTitle.style.opacity = '1';
        heroTitle.style.transform = 'translateY(0)';
      }, 400);
    }

    if (heroSubtitle) {
      heroSubtitle.style.opacity = '0';
      heroSubtitle.style.transform = 'translateY(30px)';
      heroSubtitle.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

      setTimeout(() => {
        heroSubtitle.style.opacity = '1';
        heroSubtitle.style.transform = 'translateY(0)';
      }, 600);
    }

    if (heroActions) {
      heroActions.style.opacity = '0';
      heroActions.style.transform = 'translateY(30px)';
      heroActions.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

      setTimeout(() => {
        heroActions.style.opacity = '1';
        heroActions.style.transform = 'translateY(0)';
      }, 800);
    }

    if (heroStats) {
      this.animateStatsCounter(heroStats);
    }
  }

  /**
   * Staggered animations for grids
   */
  initializeStaggeredAnimations() {
    document.querySelectorAll('.features-grid, .pricing-grid').forEach(grid => {
      const items = grid.children;

      Array.from(items).forEach((item /* , index */) => {
        if (!item.dataset.aos) {
          item.dataset.aos = 'fade-up';
          item.dataset.aosDelay = (index * 100).toString();
        }
      });
    });
  }

  /**
   * Counter animations
   */
  animateStatsCounter(statsContainer) {
    const stats = statsContainer.querySelectorAll('.stat-number');

    stats.forEach(stat => {
      const targetText = stat.textContent;
      const targetNumber = parseFloat(targetText.replace(/[^0-9.]/g, ''));
      const suffix = targetText.replace(/[0-9.]/g, '');

      this.animateCounter(stat, 0, targetNumber, 2000, suffix);
    });
  }

  animateCounter(element, start, end, duration, suffix = '') {
    const startTime = performance.now();

    const updateCounter = currentTime => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;

      element.textContent = this.formatCounterValue(current) + suffix;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = this.formatCounterValue(end) + suffix;
      }
    };

    requestAnimationFrame(updateCounter);
  }

  formatCounterValue(value) {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k';
    } else if (value >= 100) {
      return Math.round(value);
    } else {
      return value.toFixed(1);
    }
  }

  /**
   * Parallax effects
   */
  updateParallaxElements() {
    document.querySelectorAll('[data-parallax]').forEach(element => {
      const speed = parseFloat(element.dataset.parallax) || 0.5;
      const yPos = -(this.scrollPosition * speed);
      element.style.transform = `translateY(${yPos}px)`;
    });
  }

  /**
   * Progress bar animations
   */
  updateProgressBars() {
    document.querySelectorAll('.progress-bar').forEach(bar => {
      const rect = bar.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top < windowHeight && rect.bottom > 0) {
        const progress = bar.dataset.progress || '0';
        const fill = bar.querySelector('.progress-fill');

        if (fill && !fill.classList.contains('animated')) {
          fill.style.width = progress + '%';
          fill.classList.add('animated');
        }
      }
    });
  }

  updateCounterAnimations() {
    document.querySelectorAll('[data-counter]').forEach(counter => {
      const rect = counter.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top < windowHeight && rect.bottom > 0 && !counter.classList.contains('counted')) {
        const target = parseInt(counter.dataset.counter);
        this.animateCounter(counter, 0, target, 2000);
        counter.classList.add('counted');
      }
    });
  }

  /**
   * Quantum particle initialization
   */
  initializeQuantumParticles() {
    const quantumContainers = document.querySelectorAll('.quantum-visualization');

    quantumContainers.forEach(container => {
      this.createQuantumParticles(container);
    });
  }

  createQuantumParticles(container) {
    const particleCount = 50;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('quantum-particle');
      particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: radial-gradient(circle, #68d391, #38b2ac);
                border-radius: 50%;
                pointer-events: none;
                opacity: ${Math.random() * 0.8 + 0.2};
            `;

      particles.push({
        element: particle,
        x: Math.random() * container.offsetWidth,
        y: Math.random() * container.offsetHeight,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: Math.random() * 1000 + 500,
      });

      container.appendChild(particle);
    }

    this.animateQuantumParticles(container, particles);
  }

  animateQuantumParticles(container, particles) {
    const animate = () => {
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;

        // Bounce off edges
        if (particle.x <= 0 || particle.x >= container.offsetWidth) {
          particle.vx *= -1;
        }
        if (particle.y <= 0 || particle.y >= container.offsetHeight) {
          particle.vy *= -1;
        }

        // Update position
        particle.element.style.left = particle.x + 'px';
        particle.element.style.top = particle.y + 'px';

        // Fade out over time
        const opacity = particle.life / 1000;
        particle.element.style.opacity = Math.max(0, opacity);

        // Reset particle when life ends
        if (particle.life <= 0) {
          particle.x = Math.random() * container.offsetWidth;
          particle.y = Math.random() * container.offsetHeight;
          particle.vx = (Math.random() - 0.5) * 2;
          particle.vy = (Math.random() - 0.5) * 2;
          particle.life = Math.random() * 1000 + 500;
        }
      });

      if (!this.isReducedMotion) {
        requestAnimationFrame(animate);
      }
    };

    if (!this.isReducedMotion) {
      animate();
    }
  }

  /**
   * Update all animations
   */
  updateAnimations(timestamp) {
    // Update any time-based animations here
    this.updateFloatingElements(timestamp);
    this.updateGlowEffects(timestamp);
  }

  updateFloatingElements(timestamp) {
    document.querySelectorAll('.floating-element').forEach((element /* , index */) => {
      const speed = 0.001 + index * 0.0002;
      const amplitude = 10 + index * 2;
      const offset = (index * Math.PI) / 4;

      const y = Math.sin(timestamp * speed + offset) * amplitude;
      element.style.transform = `translateY(${y}px)`;
    });
  }

  updateGlowEffects(timestamp) {
    document.querySelectorAll('.glow-effect').forEach((element /* , index */) => {
      const speed = 0.002 + index * 0.0003;
      const intensity = 0.5 + Math.sin(timestamp * speed) * 0.3;

      element.style.filter = `drop-shadow(0 0 20px rgba(104, 211, 145, ${intensity}))`;
    });
  }

  /**
   * Morphing text animation
   */
  morphText(element, texts, duration = 3000) {
    let currentIndex = 0;

    const morph = () => {
      const currentText = texts[currentIndex];
      const nextText = texts[(currentIndex + 1) % texts.length];

      // Animate text morphing
      element.textContent = currentText;
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';

      setTimeout(() => {
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, 100);

      currentIndex = (currentIndex + 1) % texts.length;
    };

    morph();
    setInterval(morph, duration);
  }

  /**
   * Cleanup animations
   */
  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }

    this.runningAnimations.clear();
    this.observers.clear();
  }

  /**
   * Public API methods
   */
  startAnimation(element, type, options = {}) {
    this.triggerAnimation(element, type);
  }

  pauseAnimations() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resumeAnimations() {
    if (!this.rafId) {
      this.setupAnimationFrame();
    }
  }

  setReducedMotion(enabled) {
    this.isReducedMotion = enabled;

    if (enabled) {
      this.pauseAnimations();
      // Add reduced motion styles
      document.body.classList.add('reduced-motion');
    } else {
      this.resumeAnimations();
      document.body.classList.remove('reduced-motion');
    }
  }
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.terrafusionAnimations = new TerraFusionAnimations();
});

// Handle visibility change to pause/resume animations
document.addEventListener('visibilitychange', () => {
  if (window.terrafusionAnimations) {
    if (document.hidden) {
      window.terrafusionAnimations.pauseAnimations();
    } else {
      window.terrafusionAnimations.resumeAnimations();
    }
  }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TerraFusionAnimations;
}
/**
 * Terrafusion Market - Quantum Visualization Engine
 * Advanced Quantum-Inspired Visual Effects
 * Squad Alpha Component - Quantum Visualizations
 */

class QuantumVisualization {
  constructor(container) {
    this.container = typeof container === 'string' ? document.getElementById(container) : container;
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    this.particles = [];
    this.connections = [];
    this.fields = [];
    this.time = 0;
    this.isRunning = false;
    this.mousePosition = { x: 0, y: 0 };
    this.config = {
      particleCount: 100,
      connectionDistance: 150,
      fieldStrength: 0.5,
      colors: {
        particles: ['#68d391', '#38b2ac', '#4fd1c7', '#81e6d9'],
        connections: 'rgba(104, 211, 145, 0.3)',
        fields: 'rgba(56, 178, 172, 0.1)',
      },
      physics: {
        gravity: 0.001,
        friction: 0.99,
        attraction: 0.002,
        repulsion: 0.005,
      },
    };

    this.init();
  }

  init() {
    this.createCanvas();
    this.setupEventListeners();
    this.generateParticles();
    this.generateFields();
    this.start();
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;

    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    this.resizeCanvas();
  }

  resizeCanvas() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());

    this.container.addEventListener('mousemove', e => {
      const rect = this.container.getBoundingClientRect();
      this.mousePosition.x = e.clientX - rect.left;
      this.mousePosition.y = e.clientY - rect.top;
    });

    this.container.addEventListener('mouseleave', () => {
      this.mousePosition.x = this.canvas.width / 2;
      this.mousePosition.y = this.canvas.height / 2;
    });
  }

  generateParticles() {
    this.particles = [];

    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(
        new QuantumParticle({
          x: (Math.random() * this.canvas.width) / window.devicePixelRatio,
          y: (Math.random() * this.canvas.height) / window.devicePixelRatio,
          color:
            this.config.colors.particles[
              Math.floor(Math.random() * this.config.colors.particles.length)
            ],
          mass: Math.random() * 2 + 1,
          charge: Math.random() > 0.5 ? 1 : -1,
          spin: Math.random() * Math.PI * 2,
        })
      );
    }
  }

  generateFields() {
    this.fields = [];

    // Create quantum fields
    for (let i = 0; i < 5; i++) {
      this.fields.push(
        new QuantumField({
          x: (Math.random() * this.canvas.width) / window.devicePixelRatio,
          y: (Math.random() * this.canvas.height) / window.devicePixelRatio,
          strength: (Math.random() - 0.5) * this.config.fieldStrength,
          radius: Math.random() * 100 + 50,
          frequency: Math.random() * 0.02 + 0.01,
        })
      );
    }
  }

  updateParticles() {
    this.particles.forEach((particle /* , index */) => {
      // Apply quantum field effects
      this.fields.forEach(field => {
        const distance = Math.hypot(particle.x - field.x, particle.y - field.y);
        if (distance < field.radius) {
          const force = field.getForceAt(particle.x, particle.y, this.time);
          particle.applyForce(force);
        }
      });

      // Apply mouse interaction
      const mouseDist = Math.hypot(
        particle.x - this.mousePosition.x,
        particle.y - this.mousePosition.y
      );
      if (mouseDist < 200) {
        const angle = Math.atan2(
          this.mousePosition.y - particle.y,
          this.mousePosition.x - particle.x
        );
        const force = ((200 - mouseDist) / 200) * 0.5;
        particle.vx += Math.cos(angle) * force * particle.charge;
        particle.vy += Math.sin(angle) * force * particle.charge;
      }

      // Particle interactions
      this.particles.forEach((otherParticle, otherIndex) => {
        if (index !== otherIndex) {
          const distance = Math.hypot(particle.x - otherParticle.x, particle.y - otherParticle.y);

          if (distance < this.config.connectionDistance) {
            // Create connection
            this.connections.push({
              from: particle,
              to: otherParticle,
              strength:
                (this.config.connectionDistance - distance) / this.config.connectionDistance,
            });

            // Apply forces
            if (distance > 0) {
              const angle = Math.atan2(otherParticle.y - particle.y, otherParticle.x - particle.x);
              const force =
                (particle.charge * otherParticle.charge * this.config.physics.attraction) /
                (distance * distance);

              particle.vx -= Math.cos(angle) * force;
              particle.vy -= Math.sin(angle) * force;
            }
          }
        }
      });

      // Update particle physics
      particle.update(
        this.canvas.width / window.devicePixelRatio,
        this.canvas.height / window.devicePixelRatio
      );
    });
  }

  updateFields() {
    this.fields.forEach(field => {
      field.update(this.time);
    });
  }

  drawParticles() {
    this.particles.forEach(particle => {
      particle.draw(this.ctx);
    });
  }

  drawConnections() {
    this.ctx.strokeStyle = this.config.colors.connections;
    this.ctx.lineWidth = 1;

    this.connections.forEach(connection => {
      this.ctx.globalAlpha = connection.strength * 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(connection.from.x, connection.from.y);
      this.ctx.lineTo(connection.to.x, connection.to.y);
      this.ctx.stroke();
    });

    this.ctx.globalAlpha = 1;
    this.connections = []; // Clear connections for next frame
  }

  drawFields() {
    this.fields.forEach(field => {
      field.draw(this.ctx, this.config.colors.fields);
    });
  }

  drawQuantumEffects() {
    // Draw quantum tunneling effect
    this.drawQuantumTunneling();

    // Draw wave interference
    this.drawWaveInterference();

    // Draw energy levels
    this.drawEnergyLevels();
  }

  drawQuantumTunneling() {
    // Create tunneling effect between distant particles
    this.particles.forEach((particle /* , index */) => {
      this.particles.slice(index + 1).forEach(otherParticle => {
        const distance = Math.hypot(particle.x - otherParticle.x, particle.y - otherParticle.y);

        if (
          distance > this.config.connectionDistance &&
          distance < this.config.connectionDistance * 2
        ) {
          // Probability of tunneling decreases with distance
          const tunnelingProbability = Math.exp(-distance / 100) * 0.1;

          if (Math.random() < tunnelingProbability) {
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${tunnelingProbability})`;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 10]);

            this.ctx.beginPath();
            this.ctx.moveTo(particle.x, particle.y);
            this.ctx.lineTo(otherParticle.x, otherParticle.y);
            this.ctx.stroke();

            this.ctx.setLineDash([]);
          }
        }
      });
    });
  }

  drawWaveInterference() {
    // Draw wave patterns
    const centerX = this.canvas.width / window.devicePixelRatio / 2;
    const centerY = this.canvas.height / window.devicePixelRatio / 2;

    this.ctx.strokeStyle = 'rgba(104, 211, 145, 0.1)';
    this.ctx.lineWidth = 1;

    for (let i = 0; i < 10; i++) {
      const radius = 50 + i * 30 + Math.sin(this.time * 0.01 + i) * 10;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  drawEnergyLevels() {
    // Draw energy level indicators
    const levels = [0.2, 0.4, 0.6, 0.8];
    const height = this.canvas.height / window.devicePixelRatio;

    this.ctx.strokeStyle = 'rgba(56, 178, 172, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([10, 5]);

    levels.forEach(level => {
      const y = height * level;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width / window.devicePixelRatio, y);
      this.ctx.stroke();
    });

    this.ctx.setLineDash([]);
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update physics
    this.updateParticles();
    this.updateFields();

    // Draw elements
    this.drawFields();
    this.drawConnections();
    this.drawQuantumEffects();
    this.drawParticles();

    // Update time
    this.time += 1;
  }

  animate() {
    if (this.isRunning) {
      this.render();
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  destroy() {
    this.stop();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }

  // Public API
  addParticle(options = {}) {
    this.particles.push(
      new QuantumParticle({
        x: options.x || (Math.random() * this.canvas.width) / window.devicePixelRatio,
        y: options.y || (Math.random() * this.canvas.height) / window.devicePixelRatio,
        color: options.color || this.config.colors.particles[0],
        mass: options.mass || 1,
        charge: options.charge || 1,
        spin: options.spin || 0,
      })
    );
  }

  addField(options = {}) {
    this.fields.push(
      new QuantumField({
        x: options.x || (Math.random() * this.canvas.width) / window.devicePixelRatio,
        y: options.y || (Math.random() * this.canvas.height) / window.devicePixelRatio,
        strength: options.strength || this.config.fieldStrength,
        radius: options.radius || 100,
        frequency: options.frequency || 0.01,
      })
    );
  }

  setMouseInteraction(enabled) {
    this.mouseInteraction = enabled;
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }
}

class QuantumParticle {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.vx = options.vx || (Math.random() - 0.5) * 2;
    this.vy = options.vy || (Math.random() - 0.5) * 2;
    this.mass = options.mass || 1;
    this.charge = options.charge || 1;
    this.spin = options.spin || 0;
    this.color = options.color || '#68d391';
    this.radius = Math.sqrt(this.mass) * 3;
    this.energy = (this.mass * (this.vx * this.vx + this.vy * this.vy)) / 2;
    this.phase = Math.random() * Math.PI * 2;
    this.frequency = 0.02 + Math.random() * 0.03;
  }

  applyForce(force) {
    this.vx += force.x / this.mass;
    this.vy += force.y / this.mass;
  }

  update(canvasWidth, canvasHeight) {
    // Apply quantum effects
    this.phase += this.frequency;
    this.spin += 0.01;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Apply friction
    this.vx *= 0.99;
    this.vy *= 0.99;

    // Boundary conditions with quantum tunneling
    if (this.x < 0 || this.x > canvasWidth) {
      if (Math.random() < 0.1) {
        // Quantum tunneling - appear on other side
        this.x = this.x < 0 ? canvasWidth : 0;
      } else {
        this.vx *= -0.8;
        this.x = Math.max(0, Math.min(canvasWidth, this.x));
      }
    }

    if (this.y < 0 || this.y > canvasHeight) {
      if (Math.random() < 0.1) {
        // Quantum tunneling - appear on other side
        this.y = this.y < 0 ? canvasHeight : 0;
      } else {
        this.vy *= -0.8;
        this.y = Math.max(0, Math.min(canvasHeight, this.y));
      }
    }

    // Update energy
    this.energy = (this.mass * (this.vx * this.vx + this.vy * this.vy)) / 2;
  }

  draw(ctx) {
    ctx.save();

    // Quantum wave function visualization
    const waveAmplitude = Math.sin(this.phase) * 0.3;
    const currentRadius = this.radius * (1 + waveAmplitude);

    // Particle probability cloud
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, currentRadius * 2);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.5, this.color.replace('rgb', 'rgba').replace(')', ', 0.5)'));
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Core particle
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // Spin indicator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius * 1.2, this.spin, this.spin + Math.PI / 4);
    ctx.stroke();

    // Energy level indicator
    const energyColor = this.energy > 5 ? '#ff6b6b' : this.energy > 2 ? '#feca57' : '#48cae4';
    ctx.strokeStyle = energyColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius * 1.5, 0, (this.energy / 10) * Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

class QuantumField {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.strength = options.strength || 1;
    this.radius = options.radius || 100;
    this.frequency = options.frequency || 0.01;
    this.phase = Math.random() * Math.PI * 2;
    this.type = options.type || 'attractive'; // 'attractive', 'repulsive', 'oscillating'
  }

  update(time) {
    this.phase += this.frequency;

    // Field oscillation
    if (this.type === 'oscillating') {
      this.strength = Math.sin(time * this.frequency) * 0.5;
    }
  }

  getForceAt(x, y, time) {
    const distance = Math.hypot(x - this.x, y - this.y);

    if (distance > this.radius) {
      return { x: 0, y: 0 };
    }

    const angle = Math.atan2(y - this.y, x - this.x);
    const fieldStrength = this.strength * Math.cos(time * this.frequency + this.phase);
    const force = fieldStrength * (1 - distance / this.radius);

    return {
      x: Math.cos(angle) * force,
      y: Math.sin(angle) * force,
    };
  }

  draw(ctx, color) {
    ctx.save();

    // Field visualization
    const fieldIntensity = Math.abs(this.strength);
    const alpha = fieldIntensity * 0.3;

    ctx.fillStyle = color.replace('0.1', alpha.toString());
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Field lines
    ctx.strokeStyle = color.replace('0.1', (alpha * 0.5).toString());
    ctx.lineWidth = 1;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const startX = this.x + Math.cos(angle) * this.radius * 0.3;
      const startY = this.y + Math.sin(angle) * this.radius * 0.3;
      const endX = this.x + Math.cos(angle) * this.radius * 0.9;
      const endY = this.y + Math.sin(angle) * this.radius * 0.9;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Arrow heads
      const arrowSize = 5;
      const arrowAngle = this.strength > 0 ? angle : angle + Math.PI;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
      );
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Initialize quantum visualizations
document.addEventListener('DOMContentLoaded', () => {
  const quantumContainers = document.querySelectorAll('.quantum-visualization');

  quantumContainers.forEach(container => {
    if (container.children.length === 0) {
      // Only initialize if empty
      new QuantumVisualization(container);
    }
  });
});

// Global function for external initialization
window.initQuantumVisualization = (containerId, config = {}) => {
  return new QuantumVisualization(containerId, config);
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuantumVisualization, QuantumParticle, QuantumField };
}
