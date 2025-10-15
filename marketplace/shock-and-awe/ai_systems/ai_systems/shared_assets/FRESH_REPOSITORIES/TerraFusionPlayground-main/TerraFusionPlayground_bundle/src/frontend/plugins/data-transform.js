const DataTransformPlugin = {
    name: 'Data Transform',
    version: '1.0.0',
    description: 'Provides data transformation capabilities',
    author: 'TerraFusion Team',

    async initialize(pluginManager) {
        this.pluginManager = pluginManager;
        this.transformations = new Map();
        this.registerDefaultTransformations();
    },

    registerDefaultTransformations() {
        this.registerTransformation('uppercase', {
            name: 'Uppercase',
            description: 'Convert text to uppercase',
            transform: (data) => data.toUpperCase()
        });

        this.registerTransformation('lowercase', {
            name: 'Lowercase',
            description: 'Convert text to lowercase',
            transform: (data) => data.toLowerCase()
        });

        this.registerTransformation('capitalize', {
            name: 'Capitalize',
            description: 'Capitalize first letter of each word',
            transform: (data) => data.replace(/\b\w/g, l => l.toUpperCase())
        });

        this.registerTransformation('trim', {
            name: 'Trim',
            description: 'Remove leading and trailing whitespace',
            transform: (data) => data.trim()
        });

        this.registerTransformation('reverse', {
            name: 'Reverse',
            description: 'Reverse the text',
            transform: (data) => data.split('').reverse().join('')
        });
    },

    registerTransformation(id, transformation) {
        this.transformations.set(id, transformation);
    },

    async beforeProcess(data) {
        const config = this.pluginManager.getPluginConfig('data-transform');
        if (!config || !config.enabled) return data;

        let result = data;
        for (const [id, transformation] of this.transformations) {
            if (config.transformations && config.transformations.includes(id)) {
                result = transformation.transform(result);
            }
        }

        return result;
    },

    async afterProcess(result) {
        const config = this.pluginManager.getPluginConfig('data-transform');
        if (!config || !config.enabled) return result;

        if (config.postProcess) {
            result.data = this.transformations.get(config.postProcess).transform(result.data);
        }

        return result;
    },

    getTransformations() {
        return Array.from(this.transformations.entries()).map(([id, transformation]) => ({
            id,
            ...transformation
        }));
    },

    async cleanup() {
        this.transformations.clear();
    }
};

export default DataTransformPlugin; 