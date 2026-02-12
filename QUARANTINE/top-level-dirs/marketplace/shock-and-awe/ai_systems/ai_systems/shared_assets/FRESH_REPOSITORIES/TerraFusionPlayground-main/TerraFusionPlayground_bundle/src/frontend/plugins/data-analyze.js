const DataAnalyzePlugin = {
    name: 'Data Analyze',
    version: '1.0.0',
    description: 'Provides data analysis capabilities',
    author: 'TerraFusion Team',

    async initialize(pluginManager) {
        this.pluginManager = pluginManager;
        this.analyzers = new Map();
        this.registerDefaultAnalyzers();
    },

    registerDefaultAnalyzers() {
        this.registerAnalyzer('basic', {
            name: 'Basic Statistics',
            description: 'Calculate basic statistical measures',
            analyze: (data) => {
                const numbers = this.extractNumbers(data);
                return {
                    count: numbers.length,
                    sum: numbers.reduce((a, b) => a + b, 0),
                    mean: numbers.reduce((a, b) => a + b, 0) / numbers.length,
                    median: this.calculateMedian(numbers),
                    min: Math.min(...numbers),
                    max: Math.max(...numbers),
                    range: Math.max(...numbers) - Math.min(...numbers),
                    variance: this.calculateVariance(numbers),
                    standardDeviation: Math.sqrt(this.calculateVariance(numbers))
                };
            }
        });

        this.registerAnalyzer('frequency', {
            name: 'Frequency Analysis',
            description: 'Analyze frequency of values',
            analyze: (data) => {
                const frequencies = new Map();
                data.forEach(value => {
                    frequencies.set(value, (frequencies.get(value) || 0) + 1);
                });
                return Array.from(frequencies.entries()).map(([value, count]) => ({
                    value,
                    count,
                    percentage: (count / data.length) * 100
                }));
            }
        });

        this.registerAnalyzer('correlation', {
            name: 'Correlation Analysis',
            description: 'Calculate correlation between variables',
            analyze: (data) => {
                const variables = Object.keys(data[0]);
                const correlations = {};

                for (let i = 0; i < variables.length; i++) {
                    for (let j = i + 1; j < variables.length; j++) {
                        const var1 = variables[i];
                        const var2 = variables[j];
                        correlations[`${var1}-${var2}`] = this.calculateCorrelation(
                            data.map(d => d[var1]),
                            data.map(d => d[var2])
                        );
                    }
                }

                return correlations;
            }
        });

        this.registerAnalyzer('trend', {
            name: 'Trend Analysis',
            description: 'Analyze trends in time series data',
            analyze: (data) => {
                const values = data.map(d => d.value);
                const timestamps = data.map(d => new Date(d.timestamp).getTime());
                
                const slope = this.calculateSlope(timestamps, values);
                const intercept = this.calculateIntercept(timestamps, values, slope);
                
                return {
                    slope,
                    intercept,
                    trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
                    prediction: this.predictNextValue(timestamps, values, slope, intercept)
                };
            }
        });

        this.registerAnalyzer('outliers', {
            name: 'Outlier Detection',
            description: 'Detect outliers in the data',
            analyze: (data) => {
                const values = this.extractNumbers(data);
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const stdDev = Math.sqrt(this.calculateVariance(values));
                const threshold = 2; // Number of standard deviations

                return values.map((value, index) => ({
                    value,
                    index,
                    isOutlier: Math.abs(value - mean) > threshold * stdDev,
                    deviation: (value - mean) / stdDev
                })).filter(result => result.isOutlier);
            }
        });
    },

    registerAnalyzer(id, analyzer) {
        this.analyzers.set(id, analyzer);
    },

    async afterProcess(result) {
        const config = this.pluginManager.getPluginConfig('data-analyze');
        if (!config || !config.enabled) return result;

        const analysisResults = {};
        for (const [id, analyzer] of this.analyzers) {
            if (config.analyzers && config.analyzers.includes(id)) {
                try {
                    analysisResults[id] = analyzer.analyze(result.data);
                } catch (error) {
                    console.error(`Analysis ${id} failed:`, error);
                }
            }
        }

        result.analysis = analysisResults;
        return result;
    },

    extractNumbers(data) {
        if (Array.isArray(data)) {
            return data.filter(value => !isNaN(value)).map(Number);
        } else if (typeof data === 'object') {
            return Object.values(data)
                .filter(value => !isNaN(value))
                .map(Number);
        }
        return [];
    },

    calculateMedian(numbers) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        return sorted[middle];
    },

    calculateVariance(numbers) {
        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        return numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
    },

    calculateCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumX2 = x.reduce((a, b) => a + b * b, 0);
        const sumY2 = y.reduce((a, b) => a + b * b, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    },

    calculateSlope(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumX2 = x.reduce((a, b) => a + b * b, 0);

        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    },

    calculateIntercept(x, y, slope) {
        const meanX = x.reduce((a, b) => a + b, 0) / x.length;
        const meanY = y.reduce((a, b) => a + b, 0) / y.length;
        return meanY - slope * meanX;
    },

    predictNextValue(x, y, slope, intercept) {
        const lastX = x[x.length - 1];
        const nextX = lastX + (x[1] - x[0]); // Assume regular intervals
        return slope * nextX + intercept;
    },

    getAnalyzers() {
        return Array.from(this.analyzers.entries()).map(([id, analyzer]) => ({
            id,
            ...analyzer
        }));
    },

    async cleanup() {
        this.analyzers.clear();
    }
};

export default DataAnalyzePlugin; 