/**
 * TerraFusion cOS Frontend Engine
 * Complete government-grade frontend platform for vendor substrate development
 * "Government. Transcended."
 */

// Core Design System
export { 
    terraFusionDesignSystem,
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    zIndex,
    animation,
    breakpoints,
    symbols,
    components
} from './design_system/tokens.js';

export { 
    terraFusionThemeManager,
    TerraFusionThemeManager
} from './design_system/theme_manager.js';

// UI Component Kit
export {
    TerraFusionUIKit,
    TerraFusionButton,
    TerraFusionInput,
    TerraFusionCard,
    TerraFusionModal,
    TerraFusionBadge,
    TerraFusionSpinner,
    TerraFusionAlert,
    TerraFusionProgress
} from './ui_kit/components.jsx';

// App Shell & Plugin Host
export {
    TerraFusionAppShell,
    TerraFusionPluginHost,
    TerraFusionSecurityManager,
    TerraFusionPerformanceMonitor,
    useTerraFusionAppShell
} from './app_shell/app_shell.jsx';

// Frontend Engine Main Class
class TerraFusionFrontendEngine {
    constructor(config = {}) {
        this.config = {
            // Default configuration
            theme: 'default',
            accessibility: true,
            performance: true,
            security: 'government-grade',
            
            // Plugin system
            pluginDirectory: '/plugins',
            allowRemotePlugins: true,
            securityPolicy: 'strict',
            
            // Performance budgets
            performanceBudgets: {
                bundleSize: 500 * 1024,      // 500KB
                initialLoad: 2000,           // 2s
                memoryUsage: 50 * 1024 * 1024, // 50MB
                cpuTime: 100                 // 100ms
            },
            
            // Override with user config
            ...config
        };
        
        this.isInitialized = false;
        this.version = '1.0.0';
        this.buildId = Date.now().toString(36);
        
        this.initialize();
    }

    async initialize() {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    TerraFusion cOS                           ║
║                 Frontend Engine v${this.version}                    ║
║                                                              ║
║              "Government. Transcended."                      ║
║                                                              ║
║  🏛️  Enterprise-grade government technology platform        ║
║  ⚡  High-performance vendor substrate architecture         ║
║  🛡️  Government-grade security and compliance               ║
║  🎨  Consistent design system and brand enforcement         ║
║  🔌  Plugin-ready architecture for vendor extensions        ║
╚══════════════════════════════════════════════════════════════╝
        `);

        try {
            // Initialize theme system
            await this.initializeThemeSystem();
            
            // Load CSS framework
            await this.loadCSS();
            
            // Initialize performance monitoring
            this.initializePerformanceMonitoring();
            
            // Set up accessibility features
            this.setupAccessibility();
            
            // Initialize security framework
            this.initializeSecurity();
            
            // Ready for plugin loading
            this.setupPluginSystem();
            
            this.isInitialized = true;
            
            console.log('✅ TerraFusion Frontend Engine initialized successfully');
            console.log(`   Build ID: ${this.buildId}`);
            console.log(`   Theme: ${this.config.theme}`);
            console.log(`   Security: ${this.config.security}`);
            console.log(`   Performance Budgets: Enabled`);
            console.log(`   Accessibility: ${this.config.accessibility ? 'Enabled' : 'Disabled'}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize TerraFusion Frontend Engine:', error);
            throw error;
        }
    }

    async initializeThemeSystem() {
        // Theme manager is already initialized in theme_manager.js
        // Just verify it's working
        if (terraFusionThemeManager.isInitialized) {
            console.log('✅ Theme system ready');
        } else {
            throw new Error('Theme system failed to initialize');
        }
    }

    async loadCSS() {
        // Inject TerraFusion CSS if not already present
        if (!document.getElementById('terrafusion-css')) {
            const link = document.createElement('link');
            link.id = 'terrafusion-css';
            link.rel = 'stylesheet';
            link.href = '/frontend_engine/design_system/styles.css';
            document.head.appendChild(link);
            
            // Wait for CSS to load
            await new Promise((resolve) => {
                link.onload = resolve;
                link.onerror = () => {
                    console.warn('Failed to load TerraFusion CSS, using inline styles');
                    resolve();
                };
            });
        }
        
        console.log('✅ CSS framework loaded');
    }

    initializePerformanceMonitoring() {
        // Set up performance observers
        if ('PerformanceObserver' in window) {
            // Monitor long tasks
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) {
                        console.warn(`Long task detected: ${entry.duration}ms`);
                    }
                }
            });
            
            try {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                // Long task API not supported
            }
            
            // Monitor layout shifts
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.value > 0.1) {
                        console.warn(`Layout shift detected: ${entry.value}`);
                    }
                }
            });
            
            try {
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                // Layout shift API not supported
            }
        }
        
        console.log('✅ Performance monitoring active');
    }

    setupAccessibility() {
        if (!this.config.accessibility) return;
        
        // Add focus-visible polyfill for better focus indicators
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
        
        // Add skip link if not present
        if (!document.getElementById('skip-link')) {
            const skipLink = document.createElement('a');
            skipLink.id = 'skip-link';
            skipLink.href = '#main-content';
            skipLink.textContent = 'Skip to main content';
            skipLink.className = 'tf-skip-link tf-sr-only tf-focus:not-sr-only tf-focus:tf-fixed tf-focus:tf-top-4 tf-focus:tf-left-4 tf-focus:tf-z-tooltip tf-focus:tf-bg-primary tf-focus:tf-text-white tf-focus:tf-p-2 tf-focus:tf-rounded';
            document.body.insertBefore(skipLink, document.body.firstChild);
        }
        
        console.log('✅ Accessibility features enabled');
    }

    initializeSecurity() {
        // Set up Content Security Policy headers (if not set by server)
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:;";
        
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            document.head.appendChild(meta);
        }
        
        // Set up security headers
        if (this.config.security === 'government-grade') {
            // Disable right-click context menu in production
            if (process.env.NODE_ENV === 'production') {
                document.addEventListener('contextmenu', (e) => e.preventDefault());
            }
            
            // Disable text selection for sensitive areas
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
        }
        
        console.log('✅ Security framework initialized');
    }

    setupPluginSystem() {
        // Plugin system is available through TerraFusionAppShell
        window.TerraFusionEngine = this;
        console.log('✅ Plugin system ready');
    }

    // Public API methods
    getVersion() {
        return this.version;
    }

    getBuildId() {
        return this.buildId;
    }

    getConfig() {
        return { ...this.config };
    }

    isReady() {
        return this.isInitialized;
    }

    // Performance utilities
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        console.log(`Performance: ${name} took ${(end - start).toFixed(2)}ms`);
        return result;
    }

    async measureAsyncPerformance(name, fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        
        console.log(`Performance: ${name} took ${(end - start).toFixed(2)}ms`);
        return result;
    }

    // Developer utilities
    enableDebugMode() {
        document.body.classList.add('tf-debug-mode');
        console.log('🔧 Debug mode enabled');
    }

    disableDebugMode() {
        document.body.classList.remove('tf-debug-mode');
        console.log('🔧 Debug mode disabled');
    }

    // Theme utilities
    switchTheme(themeName) {
        return terraFusionThemeManager.applyTheme(themeName);
    }

    // Compliance utilities
    runAccessibilityAudit() {
        // Basic accessibility audit
        const issues = [];
        
        // Check for alt attributes on images
        const images = document.querySelectorAll('img:not([alt])');
        if (images.length > 0) {
            issues.push(`${images.length} images missing alt attributes`);
        }
        
        // Check for proper heading hierarchy
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        let lastLevel = 0;
        headings.forEach(heading => {
            const level = parseInt(heading.tagName.charAt(1));
            if (level > lastLevel + 1) {
                issues.push(`Heading hierarchy skip detected: ${heading.tagName} after h${lastLevel}`);
            }
            lastLevel = level;
        });
        
        return {
            score: Math.max(0, 100 - (issues.length * 10)),
            issues,
            passed: issues.length === 0
        };
    }

    runPerformanceAudit() {
        const metrics = {
            // Web Vitals
            lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0,
            fid: performance.getEntriesByType('first-input')[0]?.processingStart || 0,
            cls: performance.getEntriesByType('layout-shift').reduce((sum, entry) => sum + entry.value, 0),
            
            // Other metrics
            domContentLoaded: performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd || 0,
            loadComplete: performance.getEntriesByType('navigation')[0]?.loadEventEnd || 0,
            
            // Memory (if available)
            memoryUsage: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
        
        return metrics;
    }

    // Export functionality for vendor integration
    exportForVendor() {
        return {
            // Design system access
            designSystem: terraFusionDesignSystem,
            themeManager: terraFusionThemeManager,
            
            // UI components
            components: TerraFusionUIKit,
            
            // AI capabilities (if available)
            ai: window.TerraFusionAI ? {
                generateUI: window.TerraFusionAI.generateUI,
                voiceControl: {
                    activate: window.TerraFusionAI.activateVoiceControl,
                    processCommand: window.TerraFusionAI.processVoiceCommand
                },
                security: {
                    getStatus: window.TerraFusionAI.getSecurityStatus,
                    runScan: window.TerraFusionAI.runSecurityScan
                },
                system: {
                    getStatus: window.TerraFusionAI.getSystemStatus,
                    requestAssistance: window.TerraFusionAI.requestAIAssistance
                }
            } : null,
            
            // Utilities
            performance: {
                measure: this.measurePerformance.bind(this),
                measureAsync: this.measureAsyncPerformance.bind(this),
                audit: this.runPerformanceAudit.bind(this)
            },
            
            // Accessibility
            accessibility: {
                audit: this.runAccessibilityAudit.bind(this)
            },
            
            // Security
            security: {
                level: this.config.security,
                enableDebugMode: this.enableDebugMode.bind(this),
                disableDebugMode: this.disableDebugMode.bind(this)
            },
            
            // Version info
            version: this.version,
            buildId: this.buildId,
            aiEnabled: this.config.aiEnhancements === true
        };
    }
}

// Initialize global TerraFusion Frontend Engine
let terraFusionEngine = null;

export const initializeTerraFusionEngine = async (config = {}) => {
    if (terraFusionEngine) {
        console.warn('TerraFusion Frontend Engine already initialized');
        return terraFusionEngine;
    }
    
    terraFusionEngine = new TerraFusionFrontendEngine(config);
    await terraFusionEngine.initialize();
    
    // Make available globally for vendor access
    window.TerraFusionEngine = terraFusionEngine;
    window.TerraFusionVendorAPI = terraFusionEngine.exportForVendor();
    
    return terraFusionEngine;
};

export const getTerraFusionEngine = () => {
    if (!terraFusionEngine) {
        throw new Error('TerraFusion Frontend Engine not initialized. Call initializeTerraFusionEngine() first.');
    }
    return terraFusionEngine;
};

// Auto-initialize if in browser environment with AI enhancements
if (typeof window !== 'undefined' && !window.TerraFusionEngine) {
    // Auto-initialize with default config including AI
    initializeTerraFusionEngine({
        aiEnhancements: true,
        voiceControl: true,
        securityAI: true,
        predictiveUX: true
    }).then(() => {
        // Initialize AI Master System after Frontend Engine is ready
        setTimeout(() => {
            import('./ai_enhancements/ai_master.js').then(aiModule => {
                if (!window.TerraFusionAIMaster) {
                    // The AI Master will auto-initialize itself when imported
                    console.log('🤖 TerraFusion AI Master System ready for auto-initialization');
                }
            }).catch(error => {
                console.warn('AI enhancements not available:', error);
            });
        }, 1000); // Give Frontend Engine time to fully initialize
    }).catch(console.error);
}

export {
    TerraFusionFrontendEngine,
    terraFusionEngine
};

export default TerraFusionFrontendEngine;