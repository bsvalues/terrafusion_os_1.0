/**
 * TerraFusion cOS Theme Manager
 * Government-grade theme management with dynamic token injection
 * Handles theme switching, validation, and runtime customization
 */

import { terraFusionDesignSystem } from './tokens.js';

class TerraFusionThemeManager {
    constructor() {
        this.currentTheme = null;
        this.customThemes = new Map();
        this.observers = new Set();
        this.isInitialized = false;
        
        // Government-grade accessibility features
        this.accessibilityMode = false;
        this.highContrastMode = false;
        this.reducedMotionMode = false;
        
        this.initialize();
    }

    async initialize() {
        // Load default TerraFusion theme
        await this.loadTheme('default', terraFusionDesignSystem);
        
        // Check for system preferences
        this.detectSystemPreferences();
        
        // Apply stored user preferences
        this.loadUserPreferences();
        
        // Set up theme persistence
        this.setupThemePersistence();
        
        this.isInitialized = true;
        console.log('TerraFusion Theme Manager initialized with government-grade theming');
    }

    async loadTheme(themeName, themeConfig) {
        try {
            // Validate theme configuration
            const validation = terraFusionDesignSystem.validateTheme(themeConfig);
            if (!validation.isValid) {
                throw new Error(`Invalid theme: ${validation.errors.join(', ')}`);
            }

            // Store theme configuration
            this.customThemes.set(themeName, themeConfig);
            
            // Apply theme if it's the current one
            if (this.currentTheme === themeName || !this.currentTheme) {
                await this.applyTheme(themeName);
            }

            console.log(`TerraFusion Theme '${themeName}' loaded successfully`);
            return true;
        } catch (error) {
            console.error(`Failed to load theme '${themeName}':`, error);
            return false;
        }
    }

    async applyTheme(themeName) {
        const theme = this.customThemes.get(themeName);
        if (!theme) {
            console.error(`Theme '${themeName}' not found`);
            return false;
        }

        try {
            // Generate CSS custom properties
            const cssVars = theme.getCSSCustomProperties();
            
            // Apply accessibility modifications if needed
            if (this.accessibilityMode) {
                this.applyAccessibilityEnhancements(cssVars);
            }
            
            if (this.highContrastMode) {
                this.applyHighContrastMode(cssVars);
            }
            
            if (this.reducedMotionMode) {
                this.applyReducedMotionMode(cssVars);
            }

            // Inject CSS variables into document
            this.injectCSSVariables(cssVars);
            
            // Update current theme
            this.currentTheme = themeName;
            
            // Notify observers
            this.notifyThemeChange(themeName, theme);
            
            // Persist user preference
            this.saveUserPreferences();
            
            console.log(`TerraFusion Theme '${themeName}' applied successfully`);
            return true;
        } catch (error) {
            console.error(`Failed to apply theme '${themeName}':`, error);
            return false;
        }
    }

    injectCSSVariables(cssVars) {
        const root = document.documentElement;
        
        // Remove old TerraFusion variables
        this.removeTerraFusionVariables();
        
        // Apply new variables
        Object.entries(cssVars).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
        
        // Add theme class to body for CSS selectors
        document.body.className = document.body.className.replace(/tf-theme-\w+/g, '');
        document.body.classList.add(`tf-theme-${this.currentTheme}`);
    }

    removeTerraFusionVariables() {
        const root = document.documentElement;
        const computedStyles = getComputedStyle(root);
        
        // Remove all CSS variables that start with --tf-
        Array.from(computedStyles).forEach(property => {
            if (property.startsWith('--tf-')) {
                root.style.removeProperty(property);
            }
        });
    }

    detectSystemPreferences() {
        // Detect reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.reducedMotionMode = prefersReducedMotion.matches;
        
        prefersReducedMotion.addEventListener('change', (e) => {
            this.reducedMotionMode = e.matches;
            this.applyTheme(this.currentTheme);
        });

        // Detect high contrast preference
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
        this.highContrastMode = prefersHighContrast.matches;
        
        prefersHighContrast.addEventListener('change', (e) => {
            this.highContrastMode = e.matches;
            this.applyTheme(this.currentTheme);
        });
    }

    applyAccessibilityEnhancements(cssVars) {
        // Increase text contrast ratios for government accessibility compliance
        cssVars['--tf-text-secondary'] = '#e2e8f0';  // Lighter secondary text
        cssVars['--tf-text-tertiary'] = '#cbd5e1';   // Lighter tertiary text
        
        // Increase focus indicator visibility
        cssVars['--tf-glow-primary'] = '0 0 0 3px rgba(0, 153, 255, 0.5)';
        
        // Ensure minimum touch target sizes (44px)
        cssVars['--tf-button-min-height'] = '2.75rem';
    }

    applyHighContrastMode(cssVars) {
        // Government-grade high contrast adjustments
        cssVars['--tf-text-primary'] = '#ffffff';
        cssVars['--tf-text-secondary'] = '#ffffff';
        cssVars['--tf-bg-primary'] = '#000000';
        cssVars['--tf-bg-secondary'] = '#1a1a1a';
        cssVars['--tf-border-primary'] = '#ffffff';
        cssVars['--tf-color-primary-blue'] = '#66b3ff';  // Lighter for better contrast
    }

    applyReducedMotionMode(cssVars) {
        // Disable animations for users who prefer reduced motion
        cssVars['--tf-duration-fast'] = '0ms';
        cssVars['--tf-duration-normal'] = '0ms';
        cssVars['--tf-duration-slow'] = '0ms';
    }

    setupThemePersistence() {
        // Save theme preference to localStorage
        window.addEventListener('beforeunload', () => {
            this.saveUserPreferences();
        });
    }

    saveUserPreferences() {
        const preferences = {
            theme: this.currentTheme,
            accessibilityMode: this.accessibilityMode,
            highContrastMode: this.highContrastMode,
            reducedMotionMode: this.reducedMotionMode,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('terraFusionThemePreferences', JSON.stringify(preferences));
        } catch (error) {
            console.warn('Failed to save theme preferences:', error);
        }
    }

    loadUserPreferences() {
        try {
            const stored = localStorage.getItem('terraFusionThemePreferences');
            if (stored) {
                const preferences = JSON.parse(stored);
                
                // Apply stored accessibility preferences
                this.accessibilityMode = preferences.accessibilityMode || false;
                this.highContrastMode = preferences.highContrastMode || false;
                this.reducedMotionMode = preferences.reducedMotionMode || false;
                
                // Apply stored theme
                if (preferences.theme && this.customThemes.has(preferences.theme)) {
                    this.applyTheme(preferences.theme);
                }
            }
        } catch (error) {
            console.warn('Failed to load theme preferences:', error);
        }
    }

    // Theme customization API for vendors
    customizeTheme(customizations) {
        if (!this.currentTheme) {
            console.error('No active theme to customize');
            return false;
        }

        const currentThemeConfig = this.customThemes.get(this.currentTheme);
        const customizedTheme = this.deepMerge(currentThemeConfig, customizations);
        
        // Create new theme with customizations
        const customThemeName = `${this.currentTheme}-custom-${Date.now()}`;
        this.customThemes.set(customThemeName, customizedTheme);
        
        return this.applyTheme(customThemeName);
    }

    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    // Observer pattern for theme changes
    subscribe(callback) {
        this.observers.add(callback);
        return () => this.observers.delete(callback);
    }

    notifyThemeChange(themeName, themeConfig) {
        this.observers.forEach(callback => {
            try {
                callback({ themeName, themeConfig, manager: this });
            } catch (error) {
                console.error('Theme observer error:', error);
            }
        });
    }

    // Accessibility API
    toggleAccessibilityMode() {
        this.accessibilityMode = !this.accessibilityMode;
        this.applyTheme(this.currentTheme);
        return this.accessibilityMode;
    }

    toggleHighContrastMode() {
        this.highContrastMode = !this.highContrastMode;
        this.applyTheme(this.currentTheme);
        return this.highContrastMode;
    }

    toggleReducedMotionMode() {
        this.reducedMotionMode = !this.reducedMotionMode;
        this.applyTheme(this.currentTheme);
        return this.reducedMotionMode;
    }

    // Utility methods
    getCurrentTheme() {
        return this.currentTheme;
    }

    getAvailableThemes() {
        return Array.from(this.customThemes.keys());
    }

    getThemeConfig(themeName) {
        return this.customThemes.get(themeName);
    }

    // CSS utility generation for components
    generateUtilityCSS() {
        if (!this.currentTheme) return '';
        
        const theme = this.customThemes.get(this.currentTheme);
        const cssVars = theme.getCSSCustomProperties();
        
        let css = ':root {\n';
        Object.entries(cssVars).forEach(([property, value]) => {
            css += `  ${property}: ${value};\n`;
        });
        css += '}\n';
        
        return css;
    }

    // Runtime color manipulation
    adjustColor(colorVar, adjustment) {
        const root = document.documentElement;
        const currentValue = getComputedStyle(root).getPropertyValue(colorVar).trim();
        
        // Simple brightness adjustment (could be enhanced with proper color manipulation)
        const adjustedValue = this.adjustColorBrightness(currentValue, adjustment);
        root.style.setProperty(colorVar, adjustedValue);
        
        return adjustedValue;
    }

    adjustColorBrightness(color, adjustment) {
        // Basic color adjustment - could be enhanced with a proper color library
        if (color.startsWith('#')) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * adjustment);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            
            return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
        }
        return color;
    }

    // Performance monitoring
    getThemePerformanceMetrics() {
        return {
            currentTheme: this.currentTheme,
            themesLoaded: this.customThemes.size,
            observersCount: this.observers.size,
            accessibilityMode: this.accessibilityMode,
            highContrastMode: this.highContrastMode,
            reducedMotionMode: this.reducedMotionMode,
            isInitialized: this.isInitialized
        };
    }

    // Cleanup
    destroy() {
        // Remove all observers
        this.observers.clear();
        
        // Remove theme classes
        document.body.className = document.body.className.replace(/tf-theme-\w+/g, '');
        
        // Remove CSS variables
        this.removeTerraFusionVariables();
        
        // Clear themes
        this.customThemes.clear();
        this.currentTheme = null;
        
        console.log('TerraFusion Theme Manager destroyed');
    }
}

// Export theme manager instance
export const terraFusionThemeManager = new TerraFusionThemeManager();
// Provide named export for the class to satisfy re-exports elsewhere in the codebase
export { TerraFusionThemeManager };
export default TerraFusionThemeManager;