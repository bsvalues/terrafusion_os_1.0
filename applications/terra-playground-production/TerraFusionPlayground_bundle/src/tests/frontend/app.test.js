describe('TerraFusionApp', () => {
  let app;
  let mockElements;
  let mockFetch;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="statusIndicator">Not Connected</div>
      <textarea id="inputData"></textarea>
      <button id="processButton">Process</button>
      <div id="predictionResult">-</div>
      <div id="confidenceResult">-</div>
      <div id="processingTimeResult">-</div>
      <div id="modelStatus">-</div>
      <div id="performanceMetrics">-</div>
      <div id="securityStatus">-</div>
    `;

    mockElements = {
      statusIndicator: document.getElementById('statusIndicator'),
      inputData: document.getElementById('inputData'),
      processButton: document.getElementById('processButton'),
      predictionResult: document.getElementById('predictionResult'),
      confidenceResult: document.getElementById('confidenceResult'),
      processingTimeResult: document.getElementById('processingTimeResult'),
      modelStatus: document.getElementById('modelStatus'),
      performanceMetrics: document.getElementById('performanceMetrics'),
      securityStatus: document.getElementById('securityStatus')
    };

    mockFetch = jest.fn();
    global.fetch = mockFetch;

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          model: 'ready',
          performance: { cpu: 50 },
          security: { authenticated: true }
        })
      });

      app = new TerraFusionApp();
      await Promise.resolve();

      expect(mockElements.statusIndicator.textContent).toBe('Connected');
      expect(mockElements.statusIndicator.classList.contains('connected')).toBe(true);
    });

    it('should handle initialization failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      app = new TerraFusionApp();
      await Promise.resolve();

      expect(mockElements.statusIndicator.textContent).toBe('Not Connected');
      expect(mockElements.statusIndicator.classList.contains('connected')).toBe(false);
    });
  });

  describe('data processing', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          model: 'ready',
          performance: { cpu: 50 },
          security: { authenticated: true }
        })
      });

      app = new TerraFusionApp();
      await Promise.resolve();
    });

    it('should process data successfully', async () => {
      const testData = 'test input';
      const expectedResult = {
        result: [0.1, 0.2, 0.7],
        processingTime: 100,
        confidence: 0.7
      };

      mockElements.inputData.value = testData;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(expectedResult)
      });

      mockElements.processButton.click();
      await Promise.resolve();

      expect(mockElements.processButton.disabled).toBe(false);
      expect(mockElements.processButton.textContent).toBe('Process');
      expect(mockElements.predictionResult.textContent).toBe(JSON.stringify(expectedResult.result, null, 2));
      expect(mockElements.confidenceResult.textContent).toBe('70.00%');
      expect(mockElements.processingTimeResult.textContent).toBe('100ms');
    });

    it('should handle processing errors', async () => {
      mockElements.inputData.value = 'test input';
      mockFetch.mockRejectedValueOnce(new Error('Processing failed'));

      mockElements.processButton.click();
      await Promise.resolve();

      expect(mockElements.processButton.disabled).toBe(false);
      expect(mockElements.processButton.textContent).toBe('Process');
    });
  });

  describe('status updates', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          model: 'ready',
          performance: { cpu: 50 },
          security: { authenticated: true }
        })
      });

      app = new TerraFusionApp();
      await Promise.resolve();
    });

    it('should update status periodically', async () => {
      const newStatus = {
        model: 'ready',
        performance: { cpu: 75 },
        security: { authenticated: true }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newStatus)
      });

      jest.advanceTimersByTime(5000);
      await Promise.resolve();

      expect(mockElements.modelStatus.textContent).toBe(newStatus.model);
      expect(mockElements.performanceMetrics.textContent).toBe(JSON.stringify(newStatus.performance, null, 2));
      expect(mockElements.securityStatus.textContent).toBe(JSON.stringify(newStatus.security, null, 2));
    });
  });
}); 