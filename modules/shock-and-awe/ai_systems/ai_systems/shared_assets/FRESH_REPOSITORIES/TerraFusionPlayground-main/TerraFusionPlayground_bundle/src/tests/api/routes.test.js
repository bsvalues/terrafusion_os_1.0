const request = require('supertest');
const express = require('express');
const routes = require('../../api/routes');
const { AIModel } = require('../../core/ai/model');
const { SecurityManager } = require('../../core/engine/securityManager');
const { PerformanceMonitor } = require('../../core/engine/performanceMonitor');

jest.mock('../../core/ai/model');
jest.mock('../../core/engine/securityManager');
jest.mock('../../core/engine/performanceMonitor');

describe('API Routes', () => {
  let app;
  let mockAIModel;
  let mockSecurityManager;
  let mockPerformanceMonitor;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', routes);

    mockAIModel = new AIModel();
    mockSecurityManager = new SecurityManager();
    mockPerformanceMonitor = new PerformanceMonitor();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/process', () => {
    it('should process data successfully', async () => {
      const testData = { data: [1, 2, 3] };
      const expectedResult = {
        result: [0.1, 0.2, 0.7],
        processingTime: 100,
        confidence: 0.7
      };

      mockAIModel.process.mockResolvedValue(expectedResult);
      mockSecurityManager.validateRequest.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/process')
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedResult);
    });

    it('should handle unauthorized requests', async () => {
      mockSecurityManager.validateRequest.mockRejectedValue(new Error('Unauthorized'));

      const response = await request(app)
        .post('/api/process')
        .send({ data: [1, 2, 3] });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });

    it('should handle processing errors', async () => {
      mockSecurityManager.validateRequest.mockResolvedValue(true);
      mockAIModel.process.mockRejectedValue(new Error('Processing failed'));

      const response = await request(app)
        .post('/api/process')
        .send({ data: [1, 2, 3] });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Processing failed' });
    });
  });

  describe('GET /api/status', () => {
    it('should return system status', async () => {
      const expectedStatus = {
        model: 'ready',
        performance: { cpu: 50, memory: 1024 },
        security: { authenticated: true }
      };

      mockAIModel.isInitialized = true;
      mockPerformanceMonitor.getMetrics.mockResolvedValue(expectedStatus.performance);
      mockSecurityManager.getStatus.mockResolvedValue(expectedStatus.security);
      mockSecurityManager.validateRequest.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/status');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedStatus);
    });
  });

  describe('POST /api/initialize', () => {
    it('should initialize the model', async () => {
      mockSecurityManager.validateRequest.mockResolvedValue(true);
      mockAIModel.initialize.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/initialize');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'initialized' });
    });
  });

  describe('POST /api/cleanup', () => {
    it('should cleanup resources', async () => {
      mockSecurityManager.validateRequest.mockResolvedValue(true);
      mockAIModel.cleanup.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/cleanup');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'cleaned_up' });
    });
  });
}); 