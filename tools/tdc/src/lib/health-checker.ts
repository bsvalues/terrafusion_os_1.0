import axios from 'axios';

export interface HealthResult {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  error?: string;
}

interface HealthCheckerOptions {
  timeout?: number;
  retries?: number;
}

const DEFAULT_SERVICES = [
  { name: 'api', url: 'http://localhost:5000' },
  { name: 'consciousness', url: 'http://localhost:3004' },
  { name: 'experiments', url: 'http://localhost:5010' },
];

/**
 * Checks health of TerraFusion backend services via HTTP.
 */
export class HealthChecker {
  private timeout: number;
  private retries: number;

  constructor(options?: HealthCheckerOptions) {
    this.timeout = options?.timeout ?? 5000;
    this.retries = options?.retries ?? 3;
  }

  async checkService(name: string, url: string): Promise<HealthResult> {
    const start = performance.now();

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        await axios.get(url, { timeout: this.timeout });
        return {
          name,
          status: 'healthy',
          responseTime: Math.max(performance.now() - start, 0.01),
        };
      } catch (err: unknown) {
        if (attempt === this.retries) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          return {
            name,
            status: 'unhealthy',
            responseTime: performance.now() - start,
            error: message,
          };
        }
      }
    }

    // Unreachable, but satisfies TypeScript
    return { name, status: 'unhealthy', responseTime: performance.now() - start };
  }

  async checkAllServices(): Promise<HealthResult[]> {
    return Promise.all(
      DEFAULT_SERVICES.map(svc => this.checkService(svc.name, svc.url)),
    );
  }
}
