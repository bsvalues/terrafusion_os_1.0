import axios from 'axios';
import { HealthChecker } from '../lib/health-checker';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HealthChecker', () => {
  let healthChecker: HealthChecker;

  beforeEach(() => {
    healthChecker = new HealthChecker({ timeout: 1000, retries: 1 });
    jest.clearAllMocks();
  });

  it('should return healthy status when service responds', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: 'OK',
    });

    const result = await healthChecker.checkService('test-service', 'http://localhost:5000');

    expect(result.status).toBe('healthy');
    expect(result.name).toBe('test-service');
    expect(result.responseTime).toBeGreaterThan(0);
  });

  it('should return unhealthy status when service fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

    const result = await healthChecker.checkService('test-service', 'http://localhost:5000');

    expect(result.status).toBe('unhealthy');
    expect(result.error).toBe('Connection refused');
  });

  it('should check all default services', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({ status: 200 })
      .mockRejectedValueOnce(new Error('Service down'));

    const results = await healthChecker.checkAllServices();

    expect(results).toHaveLength(3);
    expect(results[0].status).toBe('healthy');
    expect(results[1].status).toBe('healthy');
    expect(results[2].status).toBe('unhealthy');
  });
});
