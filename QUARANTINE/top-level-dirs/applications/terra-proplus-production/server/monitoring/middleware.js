const promClient = require('prom-client');

// Create HTTP request metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Register metrics with the registry from metrics.js
const { register } = require('./metrics');
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);

/**
 * Middleware for Express to track HTTP request metrics
 */
function metricsMiddleware(req, res, next) {
  // Record start time
  const start = process.hrtime();
  
  // Add a listener for the response finish event
  res.on('finish', () => {
    // Calculate duration
    const duration = getDurationInSeconds(start);
    
    // Get route path (normalize to prevent high cardinality)
    const route = getRoutePath(req);
    
    // Record metrics
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
}

/**
 * Calculate duration in seconds from hrtime
 * @param {Array} start - Start time from process.hrtime()
 * @returns {number} - Duration in seconds
 */
function getDurationInSeconds(start) {
  const diff = process.hrtime(start);
  return diff[0] + diff[1] / 1e9;
}

/**
 * Get normalized route path to prevent high cardinality in metrics
 * @param {Object} req - Express request object
 * @returns {string} - Normalized route path
 */
function getRoutePath(req) {
  // Get the matched route from Express
  const route = req.route ? req.route.path : '';
  
  // For routes with route params (e.g., /api/users/:id), use the route pattern
  if (route) {
    const baseUrl = req.baseUrl || '';
    return baseUrl + route;
  }
  
  // For unmatched routes or no explicit route, normalize common patterns
  const url = req.originalUrl || req.url;
  
  // Replace UUIDs, IDs, and other high-cardinality parts with placeholders
  return url
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid')
    .replace(/\/[0-9]+/g, '/:id')
    .split('?')[0]; // Remove query parameters
}

module.exports = {
  metricsMiddleware
};