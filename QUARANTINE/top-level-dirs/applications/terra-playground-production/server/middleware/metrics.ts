import { Request, Response, NextFunction } from 'express';
import { Counter, Histogram, Gauge } from 'prom-client';
import { register } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const requestSize = new Histogram({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 5000, 10000, 50000]
});

const responseSize = new Histogram({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route', 'status'],
  buckets: [100, 1000, 5000, 10000, 50000]
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const route = req.route?.path || req.path;
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const status = res.statusCode;
    const method = req.method;
    
    httpRequestDuration
      .labels(method, route, status.toString())
      .observe(duration);
    
    httpRequestsTotal
      .labels(method, route, status.toString())
      .inc();
    
    requestSize
      .labels(method, route)
      .observe(Number(req.headers['content-length']) || 0);
    
    responseSize
      .labels(method, route, status.toString())
      .observe(Number(res.getHeader('content-length')) || 0);
  });
  
  next();
};

export const metricsEndpoint = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

export const updateActiveConnections = (count: number) => {
  activeConnections.set(count);
}; 