const metrics = require('./metrics');
const { metricsMiddleware } = require('./middleware');
const HealthController = require('./health');

/**
 * Initialize monitoring for the application
 * @param {Object} app - Express application
 */
function initializeMonitoring(app) {
  // Setup metrics middleware to track HTTP requests
  app.use(metricsMiddleware);

  // Setup metrics endpoint
  metrics.setupMetricsEndpoint(app);

  // Setup health check routes
  HealthController.setupRoutes(app);

  // Log successful initialization
  console.log('Monitoring and health check endpoints initialized');
}

module.exports = {
  initializeMonitoring,
  recordPipelineExecution: metrics.recordPipelineExecution,
  recordPipelineStageExecution: metrics.recordPipelineStageExecution
};