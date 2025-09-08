const AIModel = require('../../core/ai/model');
const { ModelManager } = require('../../core/engine/modelManager');
const { PerformanceMonitor } = require('../../core/engine/performanceMonitor');
const { SecurityManager } = require('../../core/engine/securityManager');

jest.mock('../../core/engine/modelManager');
jest.mock('../../core/engine/performanceMonitor');
jest.mock('../../core/engine/securityManager');

describe('AIModel', () => {
  let aiModel;
  let mockModelManager;
  let mockPerformanceMonitor;
  let mockSecurityManager;

  beforeEach(() => {
    mockModelManager = new ModelManager();
    mockPerformanceMonitor = new PerformanceMonitor();
    mockSecurityManager = new SecurityManager();

    aiModel = new AIModel();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should successfully initialize the model', async () => {
      mockSecurityManager.validateEnvironment.mockResolvedValue(true);
      mockPerformanceMonitor.startMonitoring.mockResolvedValue(true);
      mockModelManager.loadModel.mockResolvedValue({ predict: jest.fn() });

      await expect(aiModel.initialize()).resolves.toBe(true);
      expect(mockSecurityManager.validateEnvironment).toHaveBeenCalled();
      expect(mockPerformanceMonitor.startMonitoring).toHaveBeenCalled();
      expect(mockModelManager.loadModel).toHaveBeenCalled();
      expect(aiModel.isInitialized).toBe(true);
    });

    it('should handle initialization failure', async () => {
      mockSecurityManager.validateEnvironment.mockRejectedValue(new Error('Validation failed'));

      await expect(aiModel.initialize()).rejects.toThrow('Model initialization failed: Validation failed');
      expect(aiModel.isInitialized).toBe(false);
    });
  });

  describe('process', () => {
    beforeEach(async () => {
      mockSecurityManager.validateEnvironment.mockResolvedValue(true);
      mockPerformanceMonitor.startMonitoring.mockResolvedValue(true);
      mockModelManager.loadModel.mockResolvedValue({
        predict: jest.fn().mockResolvedValue({
          array: jest.fn().mockResolvedValue([0.1, 0.2, 0.7])
        })
      });
      await aiModel.initialize();
    });

    it('should process input data successfully', async () => {
      const input = [1, 2, 3];
      mockSecurityManager.validateInput.mockResolvedValue(true);

      const result = await aiModel.process(input);

      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('processingTime');
      expect(result).toHaveProperty('confidence');
      expect(mockSecurityManager.validateInput).toHaveBeenCalledWith(input);
    });

    it('should throw error if model is not initialized', async () => {
      aiModel.isInitialized = false;
      await expect(aiModel.process([1, 2, 3])).rejects.toThrow('Model not initialized');
    });

    it('should handle processing errors', async () => {
      mockSecurityManager.validateInput.mockRejectedValue(new Error('Invalid input'));

      await expect(aiModel.process([1, 2, 3])).rejects.toThrow('Processing failed: Invalid input');
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      aiModel.model = { dispose: jest.fn() };
      mockPerformanceMonitor.stopMonitoring.mockResolvedValue(true);

      await aiModel.cleanup();

      expect(aiModel.model.dispose).toHaveBeenCalled();
      expect(mockPerformanceMonitor.stopMonitoring).toHaveBeenCalled();
    });
  });
}); 