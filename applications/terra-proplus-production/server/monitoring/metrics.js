const promClient = require('prom-client');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label to all metrics
register.setDefaultLabels({
  app: 'terrafusion-api'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Create custom metrics for pipelines
const pipelineExecutionCounter = new promClient.Counter({
  name: 'pipeline_executions_total',
  help: 'Total count of pipeline executions',
  labelNames: ['pipeline_name', 'repository', 'branch', 'status']
});

const pipelineExecutionDurationHistogram = new promClient.Histogram({
  name: 'pipeline_execution_duration_seconds',
  help: 'Duration of pipeline executions in seconds',
  labelNames: ['pipeline_name', 'repository', 'branch'],
  buckets: [60, 300, 600, 1800, 3600, 7200] // 1m, 5m, 10m, 30m, 1h, 2h
});

const pipelineStageExecutionDurationHistogram = new promClient.Histogram({
  name: 'pipeline_stage_execution_duration_seconds',
  help: 'Duration of pipeline stage executions in seconds',
  labelNames: ['pipeline_name', 'stage_name', 'status'],
  buckets: [30, 60, 300, 600, 1800, 3600] // 30s, 1m, 5m, 10m, 30m, 1h
});

const pipelineStageStatusGauge = new promClient.Gauge({
  name: 'pipeline_stage_status',
  help: 'Status of pipeline stages (0=not_started, 1=in_progress, 2=completed, 3=failed)',
  labelNames: ['pipeline_name', 'stage_name']
});

// Register the metrics
register.registerMetric(pipelineExecutionCounter);
register.registerMetric(pipelineExecutionDurationHistogram);
register.registerMetric(pipelineStageExecutionDurationHistogram);
register.registerMetric(pipelineStageStatusGauge);

/**
 * Record a pipeline execution
 * 
 * @param {Object} pipelineData - The pipeline data
 * @param {string} pipelineData.name - Name of the pipeline
 * @param {string} pipelineData.repository - Repository URL
 * @param {string} pipelineData.branch - Branch name
 * @param {string} pipelineData.status - Status of the pipeline (completed, failed, in_progress)
 * @param {number} durationSeconds - Duration in seconds
 */
function recordPipelineExecution(pipelineData, durationSeconds) {
  const { name, repository, branch, status } = pipelineData;
  
  pipelineExecutionCounter.inc({
    pipeline_name: name,
    repository,
    branch,
    status
  });
  
  if (status === 'completed' && durationSeconds) {
    pipelineExecutionDurationHistogram.observe(
      {
        pipeline_name: name,
        repository,
        branch
      },
      durationSeconds
    );
  }
}

/**
 * Record a pipeline stage execution
 * 
 * @param {Object} stageData - The stage data
 * @param {string} pipelineName - Name of the parent pipeline
 * @param {string} stageName - Name of the stage
 * @param {string} status - Status of the stage (not_started, in_progress, completed, failed)
 * @param {number} durationSeconds - Duration in seconds
 */
function recordPipelineStageExecution(pipelineName, stageName, status, durationSeconds) {
  // Map status string to numeric value for the gauge
  const statusValue = {
    'not_started': 0,
    'in_progress': 1,
    'completed': 2,
    'failed': 3
  }[status] || 0;

  pipelineStageStatusGauge.set(
    {
      pipeline_name: pipelineName,
      stage_name: stageName
    },
    statusValue
  );
  
  if ((status === 'completed' || status === 'failed') && durationSeconds) {
    pipelineStageExecutionDurationHistogram.observe(
      {
        pipeline_name: pipelineName,
        stage_name: stageName,
        status
      },
      durationSeconds
    );
  }
}

/**
 * Setup metrics endpoint for Express app
 * 
 * @param {Object} app - Express application
 */
function setupMetricsEndpoint(app) {
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      res.status(500).end(err);
    }
  });
}

module.exports = {
  register,
  recordPipelineExecution,
  recordPipelineStageExecution,
  setupMetricsEndpoint
};