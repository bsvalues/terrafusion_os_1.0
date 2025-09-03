const DataValidatePlugin = {
    name: 'Data Validate',
    version: '1.0.0',
    description: 'Provides data validation capabilities',
    author: 'TerraFusion Team',

    async initialize(pluginManager) {
        this.pluginManager = pluginManager;
        this.validators = new Map();
        this.registerDefaultValidators();
    },

    registerDefaultValidators() {
        this.registerValidator('required', {
            name: 'Required',
            description: 'Check if the value is not empty',
            validate: (value) => ({
                valid: value !== null && value !== undefined && value !== '',
                message: 'This field is required'
            })
        });

        this.registerValidator('minLength', {
            name: 'Minimum Length',
            description: 'Check if the value meets the minimum length requirement',
            validate: (value, minLength) => ({
                valid: value.length >= minLength,
                message: `Minimum length is ${minLength} characters`
            })
        });

        this.registerValidator('maxLength', {
            name: 'Maximum Length',
            description: 'Check if the value meets the maximum length requirement',
            validate: (value, maxLength) => ({
                valid: value.length <= maxLength,
                message: `Maximum length is ${maxLength} characters`
            })
        });

        this.registerValidator('pattern', {
            name: 'Pattern Match',
            description: 'Check if the value matches the specified pattern',
            validate: (value, pattern) => ({
                valid: new RegExp(pattern).test(value),
                message: 'Value does not match the required pattern'
            })
        });

        this.registerValidator('email', {
            name: 'Email',
            description: 'Check if the value is a valid email address',
            validate: (value) => ({
                valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                message: 'Invalid email address'
            })
        });

        this.registerValidator('number', {
            name: 'Number',
            description: 'Check if the value is a valid number',
            validate: (value) => ({
                valid: !isNaN(value) && !isNaN(parseFloat(value)),
                message: 'Value must be a number'
            })
        });

        this.registerValidator('integer', {
            name: 'Integer',
            description: 'Check if the value is a valid integer',
            validate: (value) => ({
                valid: Number.isInteger(Number(value)),
                message: 'Value must be an integer'
            })
        });

        this.registerValidator('min', {
            name: 'Minimum Value',
            description: 'Check if the value is greater than or equal to the minimum',
            validate: (value, min) => ({
                valid: Number(value) >= min,
                message: `Value must be greater than or equal to ${min}`
            })
        });

        this.registerValidator('max', {
            name: 'Maximum Value',
            description: 'Check if the value is less than or equal to the maximum',
            validate: (value, max) => ({
                valid: Number(value) <= max,
                message: `Value must be less than or equal to ${max}`
            })
        });
    },

    registerValidator(id, validator) {
        this.validators.set(id, validator);
    },

    async beforeProcess(data) {
        const config = this.pluginManager.getPluginConfig('data-validate');
        if (!config || !config.enabled) return data;

        const validationRules = config.rules || {};
        const errors = [];

        for (const [field, rules] of Object.entries(validationRules)) {
            const value = data[field];
            
            for (const [validatorId, validatorConfig] of Object.entries(rules)) {
                const validator = this.validators.get(validatorId);
                if (!validator) continue;

                const result = validator.validate(value, validatorConfig);
                if (!result.valid) {
                    errors.push({
                        field,
                        validator: validatorId,
                        message: result.message
                    });
                }
            }
        }

        if (errors.length > 0) {
            throw new Error(JSON.stringify({
                type: 'validation_error',
                errors
            }));
        }

        return data;
    },

    getValidators() {
        return Array.from(this.validators.entries()).map(([id, validator]) => ({
            id,
            ...validator
        }));
    },

    async cleanup() {
        this.validators.clear();
    }
};

export default DataValidatePlugin; 