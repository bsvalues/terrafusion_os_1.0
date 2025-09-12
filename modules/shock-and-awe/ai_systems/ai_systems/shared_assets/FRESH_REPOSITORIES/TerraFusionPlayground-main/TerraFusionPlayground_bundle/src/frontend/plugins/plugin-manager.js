class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.hooks = new Map();
        this.settings = {
            enabledPlugins: new Set(),
            pluginConfigs: new Map()
        };
        this.loadPluginSettings();
    }

    async loadPlugin(pluginId, pluginModule) {
        try {
            if (this.plugins.has(pluginId)) {
                console.warn(`Plugin ${pluginId} already loaded`);
                return;
            }

            const plugin = {
                id: pluginId,
                module: pluginModule,
                hooks: new Set(),
                state: {}
            };

            if (typeof pluginModule.initialize === 'function') {
                await pluginModule.initialize(this);
            }

            this.plugins.set(pluginId, plugin);
            this.registerPluginHooks(plugin);
            this.savePluginSettings();

            return plugin;
        } catch (error) {
            console.error(`Failed to load plugin ${pluginId}:`, error);
            throw error;
        }
    }

    registerPluginHooks(plugin) {
        const hooks = ['beforeProcess', 'afterProcess', 'transformData', 'visualizeData'];
        hooks.forEach(hookName => {
            if (typeof plugin.module[hookName] === 'function') {
                this.registerHook(hookName, plugin.module[hookName].bind(plugin.module));
                plugin.hooks.add(hookName);
            }
        });
    }

    registerHook(hookName, callback) {
        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, new Set());
        }
        this.hooks.get(hookName).add(callback);
    }

    async executeHook(hookName, ...args) {
        if (!this.hooks.has(hookName)) return args[0];

        const callbacks = Array.from(this.hooks.get(hookName));
        let result = args[0];

        for (const callback of callbacks) {
            try {
                result = await callback(result, ...args.slice(1));
            } catch (error) {
                console.error(`Hook ${hookName} execution failed:`, error);
            }
        }

        return result;
    }

    enablePlugin(pluginId) {
        this.settings.enabledPlugins.add(pluginId);
        this.savePluginSettings();
    }

    disablePlugin(pluginId) {
        this.settings.enabledPlugins.delete(pluginId);
        this.savePluginSettings();
    }

    isPluginEnabled(pluginId) {
        return this.settings.enabledPlugins.has(pluginId);
    }

    getPluginConfig(pluginId) {
        return this.settings.pluginConfigs.get(pluginId) || {};
    }

    setPluginConfig(pluginId, config) {
        this.settings.pluginConfigs.set(pluginId, config);
        this.savePluginSettings();
    }

    loadPluginSettings() {
        try {
            const savedSettings = localStorage.getItem('pluginSettings');
            if (savedSettings) {
                const { enabledPlugins, pluginConfigs } = JSON.parse(savedSettings);
                this.settings.enabledPlugins = new Set(enabledPlugins);
                this.settings.pluginConfigs = new Map(Object.entries(pluginConfigs));
            }
        } catch (error) {
            console.error('Failed to load plugin settings:', error);
        }
    }

    savePluginSettings() {
        try {
            const settings = {
                enabledPlugins: Array.from(this.settings.enabledPlugins),
                pluginConfigs: Object.fromEntries(this.settings.pluginConfigs)
            };
            localStorage.setItem('pluginSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save plugin settings:', error);
        }
    }

    async unloadPlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return;

        try {
            if (typeof plugin.module.cleanup === 'function') {
                await plugin.module.cleanup();
            }

            plugin.hooks.forEach(hookName => {
                const callbacks = this.hooks.get(hookName);
                if (callbacks) {
                    callbacks.delete(plugin.module[hookName]);
                }
            });

            this.plugins.delete(pluginId);
            this.savePluginSettings();
        } catch (error) {
            console.error(`Failed to unload plugin ${pluginId}:`, error);
            throw error;
        }
    }

    getPluginMetadata(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return null;

        return {
            id: plugin.id,
            name: plugin.module.name || plugin.id,
            version: plugin.module.version || '1.0.0',
            description: plugin.module.description || '',
            author: plugin.module.author || 'Unknown',
            enabled: this.isPluginEnabled(pluginId),
            hooks: Array.from(plugin.hooks)
        };
    }

    getAllPlugins() {
        return Array.from(this.plugins.keys()).map(id => this.getPluginMetadata(id));
    }
}

// Export the plugin manager
window.PluginManager = PluginManager; 