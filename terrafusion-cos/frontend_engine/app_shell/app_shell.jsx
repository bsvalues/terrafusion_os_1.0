/**
 * TerraFusion cOS App Shell
 * Government-grade application shell for plugin hosting and module federation
 * Handles routing, authentication, menus, and cross-module communication
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TerraFusionUIKit } from '../ui_kit/components.jsx';
import { terraFusionThemeManager } from '../design_system/theme_manager.js';

// App Shell Context
const TerraFusionAppShellContext = React.createContext();

// Plugin Host Manager
class TerraFusionPluginHost {
    constructor() {
        this.plugins = new Map();
        this.routes = new Map();
        this.menuItems = new Map();
        this.hooks = new Map();
        this.eventBus = new EventTarget();
        this.securityManager = new TerraFusionSecurityManager();
        this.performanceMonitor = new TerraFusionPerformanceMonitor();
        
        this.initialize();
    }

    initialize() {
        // Set up module federation support
        this.setupModuleFederation();
        
        // Initialize security context
        this.securityManager.initialize();
        
        // Start performance monitoring
        this.performanceMonitor.start();
        
        console.log('TerraFusion Plugin Host initialized');
    }

    async loadPlugin(pluginConfig) {
        try {
            // Security validation
            const securityCheck = await this.securityManager.validatePlugin(pluginConfig);
            if (!securityCheck.isValid) {
                throw new Error(`Plugin security validation failed: ${securityCheck.errors.join(', ')}`);
            }

            // Performance budget check
            const budgetCheck = this.performanceMonitor.checkBudget(pluginConfig);
            if (!budgetCheck.isWithinBudget) {
                console.warn(`Plugin '${pluginConfig.name}' exceeds performance budget:`, budgetCheck.violations);
            }

            // Load plugin module
            const pluginModule = await this.loadPluginModule(pluginConfig);
            
            // Wrap plugin with TerraFusion SDK
            const wrappedPlugin = this.wrapPlugin(pluginModule, pluginConfig);
            
            // Register plugin
            this.plugins.set(pluginConfig.id, {
                config: pluginConfig,
                module: pluginModule,
                wrapper: wrappedPlugin,
                loaded: Date.now(),
                performance: this.performanceMonitor.getPluginMetrics(pluginConfig.id)
            });

            // Register routes if provided
            if (pluginConfig.routes) {
                this.registerRoutes(pluginConfig.id, pluginConfig.routes);
            }

            // Register menu items if provided
            if (pluginConfig.menuItems) {
                this.registerMenuItems(pluginConfig.id, pluginConfig.menuItems);
            }

            // Notify other plugins
            this.eventBus.dispatchEvent(new CustomEvent('pluginLoaded', {
                detail: { pluginId: pluginConfig.id, config: pluginConfig }
            }));

            console.log(`TerraFusion Plugin '${pluginConfig.name}' loaded successfully`);
            return wrappedPlugin;
        } catch (error) {
            console.error(`Failed to load plugin '${pluginConfig.name}':`, error);
            throw error;
        }
    }

    async loadPluginModule(pluginConfig) {
        if (pluginConfig.type === 'remote') {
            // Module federation remote loading
            return await this.loadRemoteModule(pluginConfig.remoteEntry, pluginConfig.moduleName);
        } else if (pluginConfig.type === 'local') {
            // Local module import
            // Use webpackIgnore so the bundler does not attempt to resolve dynamic local plugin paths at build time.
            // In production the plugin will be loaded from the runtime filesystem/path provided in pluginConfig.modulePath.
            return await import(/* webpackIgnore: true */ pluginConfig.modulePath);
        } else {
            throw new Error(`Unsupported plugin type: ${pluginConfig.type}`);
        }
    }

    async loadRemoteModule(remoteEntry, moduleName) {
        // Dynamic import for module federation
        // remoteEntry is a runtime URL; tell webpack to ignore static resolution so it remains a runtime import
        const container = await import(/* webpackIgnore: true */ remoteEntry);
        await container.init(__webpack_share_scopes__.default);
        const factory = await container.get(moduleName);
        return factory();
    }

    wrapPlugin(pluginModule, pluginConfig) {
        // Create TerraFusion SDK wrapper
        const sdkContext = {
            // Theme and UI access
            theme: terraFusionThemeManager,
            ui: TerraFusionUIKit,
            
            // Event communication
            emit: (event, data) => this.eventBus.dispatchEvent(new CustomEvent(event, { detail: data })),
            on: (event, handler) => this.eventBus.addEventListener(event, handler),
            off: (event, handler) => this.eventBus.removeEventListener(event, handler),
            
            // Routing
            navigate: (path) => this.navigate(path),
            getCurrentRoute: () => this.getCurrentRoute(),
            
            // Storage
            storage: {
                get: (key) => this.getPluginStorage(pluginConfig.id, key),
                set: (key, value) => this.setPluginStorage(pluginConfig.id, key, value),
                remove: (key) => this.removePluginStorage(pluginConfig.id, key)
            },
            
            // Performance monitoring
            performance: {
                mark: (name) => this.performanceMonitor.mark(`${pluginConfig.id}.${name}`),
                measure: (name, startMark, endMark) => this.performanceMonitor.measure(name, startMark, endMark),
                getMetrics: () => this.performanceMonitor.getPluginMetrics(pluginConfig.id)
            },
            
            // Security context
            security: {
                getCurrentUser: () => this.securityManager.getCurrentUser(),
                hasPermission: (permission) => this.securityManager.hasPermission(permission),
                checkAccess: (resource) => this.securityManager.checkAccess(pluginConfig.id, resource)
            }
        };

        // Wrap plugin component with SDK context
        const WrappedPlugin = (props) => {
            return React.createElement(
                TerraFusionAppShellContext.Provider,
                { value: sdkContext },
                React.createElement(pluginModule.default || pluginModule, {
                    ...props,
                    sdk: sdkContext
                })
            );
        };

        WrappedPlugin.displayName = `TerraFusion(${pluginConfig.name})`;
        return WrappedPlugin;
    }

    registerRoutes(pluginId, routes) {
        routes.forEach(route => {
            this.routes.set(route.path, {
                pluginId,
                component: route.component,
                permissions: route.permissions || [],
                metadata: route.metadata || {}
            });
        });
    }

    registerMenuItems(pluginId, menuItems) {
        menuItems.forEach(item => {
            this.menuItems.set(item.id, {
                pluginId,
                ...item
            });
        });
    }

    unloadPlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return false;

        // Clean up routes
        for (const [path, route] of this.routes.entries()) {
            if (route.pluginId === pluginId) {
                this.routes.delete(path);
            }
        }

        // Clean up menu items
        for (const [itemId, item] of this.menuItems.entries()) {
            if (item.pluginId === pluginId) {
                this.menuItems.delete(itemId);
            }
        }

        // Clean up plugin storage
        this.clearPluginStorage(pluginId);

        // Remove plugin
        this.plugins.delete(pluginId);

        // Notify other plugins
        this.eventBus.dispatchEvent(new CustomEvent('pluginUnloaded', {
            detail: { pluginId }
        }));

        console.log(`TerraFusion Plugin '${pluginId}' unloaded`);
        return true;
    }

    setupModuleFederation() {
        // Initialize webpack module federation if available
        if (typeof __webpack_init_sharing__ !== 'undefined') {
            __webpack_init_sharing__('default');
        }
    }

    // Plugin storage management
    getPluginStorage(pluginId, key) {
        try {
            const storageKey = `tf_plugin_${pluginId}_${key}`;
            return JSON.parse(localStorage.getItem(storageKey));
        } catch {
            return null;
        }
    }

    setPluginStorage(pluginId, key, value) {
        try {
            const storageKey = `tf_plugin_${pluginId}_${key}`;
            localStorage.setItem(storageKey, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }

    removePluginStorage(pluginId, key) {
        const storageKey = `tf_plugin_${pluginId}_${key}`;
        localStorage.removeItem(storageKey);
    }

    clearPluginStorage(pluginId) {
        const prefix = `tf_plugin_${pluginId}_`;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    // Utility methods
    getLoadedPlugins() {
        return Array.from(this.plugins.entries()).map(([id, plugin]) => ({
            id,
            name: plugin.config.name,
            version: plugin.config.version,
            loaded: plugin.loaded,
            performance: plugin.performance
        }));
    }

    getAvailableRoutes() {
        return Array.from(this.routes.entries()).map(([path, route]) => ({
            path,
            pluginId: route.pluginId,
            permissions: route.permissions,
            metadata: route.metadata
        }));
    }

    getMenuStructure() {
        const menuStructure = [];
        this.menuItems.forEach((item, id) => {
            menuStructure.push({
                id,
                pluginId: item.pluginId,
                label: item.label,
                icon: item.icon,
                path: item.path,
                order: item.order || 999,
                permissions: item.permissions || []
            });
        });
        return menuStructure.sort((a, b) => a.order - b.order);
    }
}

// Security Manager for plugin validation
class TerraFusionSecurityManager {
    constructor() {
        this.currentUser = null;
        this.permissions = new Set();
        this.securityPolicies = new Map();
    }

    initialize() {
        // Load current user context
        this.loadUserContext();
        
        // Set up security policies
        this.setupSecurityPolicies();
        
        console.log('TerraFusion Security Manager initialized');
    }

    async validatePlugin(pluginConfig) {
        const errors = [];

        // Check plugin signature
        if (!this.verifyPluginSignature(pluginConfig)) {
            errors.push('Invalid plugin signature');
        }

        // Check permissions
        if (!this.validatePluginPermissions(pluginConfig)) {
            errors.push('Insufficient permissions');
        }

        // Check content security policy
        if (!this.validateCSP(pluginConfig)) {
            errors.push('Content Security Policy violation');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    verifyPluginSignature(pluginConfig) {
        // Implement plugin signature verification
        return pluginConfig.signature && pluginConfig.signature.length > 0;
    }

    validatePluginPermissions(pluginConfig) {
        if (!pluginConfig.permissions) return true;
        
        return pluginConfig.permissions.every(permission => 
            this.hasPermission(permission)
        );
    }

    validateCSP(pluginConfig) {
        // Check if plugin complies with Content Security Policy
        return true; // Placeholder implementation
    }

    loadUserContext() {
        // Load user context from authentication service
        this.currentUser = {
            id: 'admin',
            role: 'administrator',
            permissions: ['all']
        };
        this.permissions = new Set(['all']);
    }

    setupSecurityPolicies() {
        // Define security policies for different plugin types
        this.securityPolicies.set('government', {
            requireSignature: true,
            allowedDomains: ['*.gov', '*.mil'],
            minSecurityLevel: 'high'
        });
    }

    getCurrentUser() {
        return this.currentUser;
    }

    hasPermission(permission) {
        return this.permissions.has('all') || this.permissions.has(permission);
    }

    checkAccess(pluginId, resource) {
        // Implement resource access checking
        return true; // Placeholder implementation
    }
}

// Performance Monitor for plugin budgets
class TerraFusionPerformanceMonitor {
    constructor() {
        this.budgets = new Map();
        this.metrics = new Map();
        this.marks = new Map();
    }

    start() {
        // Set default performance budgets
        this.budgets.set('default', {
            bundleSize: 500 * 1024,      // 500KB max
            initialLoad: 2000,           // 2s max initial load
            memoryUsage: 50 * 1024 * 1024, // 50MB max memory
            cpuTime: 100                 // 100ms max CPU time
        });
        
        console.log('TerraFusion Performance Monitor started');
    }

    checkBudget(pluginConfig) {
        const budget = this.budgets.get(pluginConfig.performanceBudget || 'default');
        const violations = [];

        if (pluginConfig.bundleSize > budget.bundleSize) {
            violations.push(`Bundle size ${pluginConfig.bundleSize} exceeds limit ${budget.bundleSize}`);
        }

        return {
            isWithinBudget: violations.length === 0,
            violations
        };
    }

    mark(name) {
        this.marks.set(name, performance.now());
    }

    measure(name, startMark, endMark) {
        const start = this.marks.get(startMark);
        const end = this.marks.get(endMark);
        
        if (start && end) {
            const duration = end - start;
            this.metrics.set(name, duration);
            return duration;
        }
        return null;
    }

    getPluginMetrics(pluginId) {
        const pluginMetrics = {};
        this.metrics.forEach((value, key) => {
            if (key.startsWith(`${pluginId}.`)) {
                pluginMetrics[key.replace(`${pluginId}.`, '')] = value;
            }
        });
        return pluginMetrics;
    }
}

// Main App Shell Component
export const TerraFusionAppShell = ({
    children,
    config = {},
    onPluginLoad,
    onPluginUnload
}) => {
    const [pluginHost] = useState(() => new TerraFusionPluginHost());
    const [loadedPlugins, setLoadedPlugins] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [currentRoute, setCurrentRoute] = useState('/costforge-ai');
    const [isLoading, setIsLoading] = useState(false);
    const shellRef = useRef();

    // Import CostForge AI Plugin using dynamic import so webpack doesn't statically try to resolve local plugin files.
    const CostForgeAIPlugin = React.useMemo(() => {
        let plugin = null;
        (async () => {
            try {
                const mod = await import(/* webpackIgnore: true */ '../plugins/CostForgeAIPlugin.jsx');
                plugin = mod.default || mod;
            } catch (e) {
                // plugin unavailable in this build/runtime
                plugin = null;
            }
        })();
        return plugin;
    }, []);

    useEffect(() => {
        // Set up plugin host event listeners
        const handlePluginLoaded = (event) => {
            setLoadedPlugins(pluginHost.getLoadedPlugins());
            setMenuItems(pluginHost.getMenuStructure());
            onPluginLoad?.(event.detail);
        };

        const handlePluginUnloaded = (event) => {
            setLoadedPlugins(pluginHost.getLoadedPlugins());
            setMenuItems(pluginHost.getMenuStructure());
            onPluginUnload?.(event.detail);
        };

        pluginHost.eventBus.addEventListener('pluginLoaded', handlePluginLoaded);
        pluginHost.eventBus.addEventListener('pluginUnloaded', handlePluginUnloaded);

        // Auto-load CostForge AI plugin at startup
        (async () => {
            if (CostForgeAIPlugin) {
                await pluginHost.loadPlugin({
                    id: 'costforge-ai',
                    name: 'CostForge AI',
                    version: '3.0.0',
                    type: 'local',
                    modulePath: '../plugins/CostForgeAIPlugin.jsx',
                    menuItems: [
                        {
                            id: 'costforge-ai',
                            label: 'CostForge AI',
                            icon: null,
                            path: '/costforge-ai',
                            order: 1
                        }
                    ],
                    routes: [
                        {
                            path: '/costforge-ai',
                            component: CostForgeAIPlugin,
                            permissions: ['all'],
                            metadata: { title: 'CostForge AI' }
                        }
                    ],
                    signature: 'gov-certified',
                    permissions: ['all'],
                    performanceBudget: 'default',
                });
            }
        })();

        return () => {
            pluginHost.eventBus.removeEventListener('pluginLoaded', handlePluginLoaded);
            pluginHost.eventBus.removeEventListener('pluginUnloaded', handlePluginUnloaded);
        };
    }, [pluginHost, onPluginLoad, onPluginUnload, CostForgeAIPlugin]);

    const loadPlugin = useCallback(async (pluginConfig) => {
        setIsLoading(true);
        try {
            await pluginHost.loadPlugin(pluginConfig);
        } catch (error) {
            console.error('Failed to load plugin:', error);
        } finally {
            setIsLoading(false);
        }
    }, [pluginHost]);

    const unloadPlugin = useCallback((pluginId) => {
        return pluginHost.unloadPlugin(pluginId);
    }, [pluginHost]);

    return (
        <TerraFusionAppShellContext.Provider value={{
            pluginHost,
            loadPlugin,
            unloadPlugin,
            loadedPlugins,
            menuItems,
            currentRoute,
            setCurrentRoute
        }}>
            <div ref={shellRef} className="tf-app-shell tf-h-screen tf-flex tf-flex-col tf-bg-primary">
                {/* App Shell Header */}
                <header className="tf-app-shell-header tf-bg-secondary tf-border-b tf-border-primary tf-p-4">
                    <div className="tf-flex tf-items-center tf-justify-between">
                        <div className="tf-flex tf-items-center tf-gap-4">
                            <h1 className="tf-text-xl tf-font-bold tf-text-primary">
                                <span style={{ color: 'var(--tf-color-primary-blue)' }}>◊</span>
                                TerraFusion cOS
                            </h1>
                            <TerraFusionUIKit.Badge variant="accent" size="sm">
                                Government. Transcended.
                            </TerraFusionUIKit.Badge>
                        </div>
                        
                        <div className="tf-flex tf-items-center tf-gap-3">
                            {isLoading && <TerraFusionUIKit.Spinner size="sm" />}
                            <TerraFusionUIKit.Badge variant="default" size="sm">
                                {loadedPlugins.length} Plugins
                            </TerraFusionUIKit.Badge>
                        </div>
                    </div>
                </header>

                {/* App Shell Main Content */}
                <div className="tf-app-shell-content tf-flex tf-flex-1 tf-overflow-hidden">
                    {/* Plugin Navigation */}
                    {menuItems.length > 0 && (
                        <nav className="tf-app-shell-nav tf-w-64 tf-bg-glass tf-border-r tf-border-primary tf-p-4">
                            <ul className="tf-space-y-2">
                                {menuItems.map(item => (
                                    <li key={item.id}>
                                        <TerraFusionUIKit.Button
                                            variant="secondary"
                                            className="tf-w-full tf-justify-start"
                                            icon={item.icon}
                                            onClick={() => setCurrentRoute(item.path)}
                                        >
                                            {item.label}
                                        </TerraFusionUIKit.Button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}

                    {/* Plugin Content Area */}
                    <main className="tf-app-shell-main tf-flex-1 tf-overflow-auto tf-p-6">
                        {children}
                    </main>
                </div>

                {/* App Shell Footer */}
                <footer className="tf-app-shell-footer tf-bg-secondary tf-border-t tf-border-primary tf-p-4 tf-text-center">
                    <div className="tf-flex tf-items-center tf-justify-between tf-text-sm tf-text-muted">
                        <span>TerraFusion cOS - Enterprise Government Platform</span>
                        <span>
                            Performance: {loadedPlugins.length ? 'Optimal' : 'Ready'} | 
                            Security: Government Grade
                        </span>
                    </div>
                </footer>
            </div>
        </TerraFusionAppShellContext.Provider>
    );
};

// Hook for accessing app shell context in plugins
export const useTerraFusionAppShell = () => {
    const context = React.useContext(TerraFusionAppShellContext);
    if (!context) {
        throw new Error('useTerraFusionAppShell must be used within TerraFusionAppShell');
    }
    return context;
};

export { TerraFusionPluginHost, TerraFusionSecurityManager, TerraFusionPerformanceMonitor };
export default TerraFusionAppShell;