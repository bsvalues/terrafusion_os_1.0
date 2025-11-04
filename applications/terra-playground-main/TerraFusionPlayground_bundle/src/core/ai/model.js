const tf = require('@tensorflow/tfjs-node');
const { ModelManager } = require('../engine/modelManager');
const { PerformanceMonitor } = require('../engine/performanceMonitor');
const { SecurityManager } = require('../engine/securityManager');

class AIModel {
  constructor() {
    this.modelManager = new ModelManager();
    this.performanceMonitor = new PerformanceMonitor();
    this.securityManager = new SecurityManager();
    this.model = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await this.securityManager.validateEnvironment();
      await this.performanceMonitor.startMonitoring();
      
      this.model = await this.modelManager.loadModel();
      this.isInitialized = true;
      
      await this.performanceMonitor.recordMetric('model_initialization', 'success');
      return true;
    } catch (error) {
      await this.performanceMonitor.recordMetric('model_initialization', 'error');
      throw new Error(`Model initialization failed: ${error.message}`);
    }
  }

  async process(input) {
    if (!this.isInitialized) {
      throw new Error('Model not initialized');
    }

    try {
      await this.securityManager.validateInput(input);
      const startTime = Date.now();

      const tensor = tf.tensor(input);
      const prediction = await this.model.predict(tensor);
      const result = await prediction.array();

      const processingTime = Date.now() - startTime;
      await this.performanceMonitor.recordMetric('processing_time', processingTime);

      return {
        result,
        processingTime,
        confidence: this.calculateConfidence(result)
      };
    } catch (error) {
      await this.performanceMonitor.recordMetric('processing_error', 1);
      throw new Error(`Processing failed: ${error.message}`);
    }
  }

  calculateConfidence(result) {
    return Math.max(...result) / result.reduce((a, b) => a + b, 0);
  }

  async cleanup() {
    if (this.model) {
      await this.model.dispose();
    }
    await this.performanceMonitor.stopMonitoring();
  }
}

module.exports = AIModel; 