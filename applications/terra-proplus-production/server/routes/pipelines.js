const express = require('express');
const router = express.Router();

// Mock data for pipelines
const pipelines = [
  {
    id: '1',
    name: 'API Gateway CI/CD',
    description: 'Continuous integration and deployment pipeline for API Gateway service',
    repository: 'github.com/terrafusion/api-gateway',
    branch: 'main',
    type: 'deployment',
    stages: [
      {
        name: 'Build',
        status: 'completed',
        startTime: '2025-05-19T15:00:00Z',
        endTime: '2025-05-19T15:05:00Z',
        duration: '5m',
        steps: [
          { name: 'Checkout', status: 'completed', duration: '10s' },
          { name: 'Test', status: 'completed', duration: '2m' },
          { name: 'Build Image', status: 'completed', duration: '2m 50s' }
        ]
      },
      {
        name: 'Deploy to Staging',
        status: 'completed',
        startTime: '2025-05-19T15:05:00Z',
        endTime: '2025-05-19T15:15:00Z',
        duration: '10m',
        steps: [
          { name: 'Push Image', status: 'completed', duration: '1m' },
          { name: 'Update Manifest', status: 'completed', duration: '30s' },
          { name: 'Apply Changes', status: 'completed', duration: '8m 30s' }
        ]
      },
      {
        name: 'Integration Tests',
        status: 'completed',
        startTime: '2025-05-19T15:15:00Z',
        endTime: '2025-05-19T15:20:00Z',
        duration: '5m',
        steps: [
          { name: 'API Tests', status: 'completed', duration: '3m' },
          { name: 'Performance Check', status: 'completed', duration: '2m' }
        ]
      },
      {
        name: 'Deploy to Production',
        status: 'completed',
        startTime: '2025-05-19T15:30:00Z',
        endTime: '2025-05-19T15:45:00Z',
        duration: '15m',
        steps: [
          { name: 'Approval', status: 'completed', duration: '5m' },
          { name: 'Push Image', status: 'completed', duration: '1m' },
          { name: 'Update Manifest', status: 'completed', duration: '30s' },
          { name: 'Apply Changes', status: 'completed', duration: '8m 30s' }
        ],
        approvers: ['john.admin', 'maria.dev']
      }
    ],
    status: 'completed',
    lastRun: '2025-05-19T15:45:00Z',
    averageDuration: '35m',
    successRate: 92
  },
  {
    id: '2',
    name: 'Payment Processor CI/CD',
    description: 'Continuous integration and deployment pipeline for Payment Processor service',
    repository: 'github.com/terrafusion/payment-processor',
    branch: 'main',
    type: 'deployment',
    stages: [
      {
        name: 'Build',
        status: 'completed',
        startTime: '2025-05-19T13:30:00Z',
        endTime: '2025-05-19T13:35:00Z',
        duration: '5m',
        steps: [
          { name: 'Checkout', status: 'completed', duration: '10s' },
          { name: 'Test', status: 'completed', duration: '2m' },
          { name: 'Build Image', status: 'completed', duration: '2m 50s' }
        ]
      },
      {
        name: 'Deploy to Staging',
        status: 'completed',
        startTime: '2025-05-19T13:35:00Z',
        endTime: '2025-05-19T13:45:00Z',
        duration: '10m',
        steps: [
          { name: 'Push Image', status: 'completed', duration: '1m' },
          { name: 'Update Manifest', status: 'completed', duration: '30s' },
          { name: 'Apply Changes', status: 'completed', duration: '8m 30s' }
        ]
      },
      {
        name: 'Integration Tests',
        status: 'failed',
        startTime: '2025-05-19T13:45:00Z',
        endTime: '2025-05-19T14:00:00Z',
        duration: '15m',
        steps: [
          { name: 'API Tests', status: 'completed', duration: '3m' },
          { name: 'Transaction Tests', status: 'failed', duration: '12m', error: 'Timeout waiting for database response' }
        ]
      },
      {
        name: 'Deploy to Production',
        status: 'not_started'
      }
    ],
    status: 'failed',
    lastRun: '2025-05-19T14:00:00Z',
    averageDuration: '40m',
    successRate: 78
  },
  {
    id: '3',
    name: 'User Service CI/CD',
    description: 'Continuous integration and deployment pipeline for User Service',
    repository: 'github.com/terrafusion/user-service',
    branch: 'main',
    type: 'deployment',
    stages: [
      {
        name: 'Build',
        status: 'completed',
        startTime: '2025-05-19T14:00:00Z',
        endTime: '2025-05-19T14:10:00Z',
        duration: '10m',
        steps: [
          { name: 'Checkout', status: 'completed', duration: '10s' },
          { name: 'Test', status: 'completed', duration: '5m' },
          { name: 'Build Image', status: 'completed', duration: '4m 50s' }
        ]
      },
      {
        name: 'Deploy to Dev',
        status: 'in_progress',
        startTime: '2025-05-19T14:10:00Z',
        steps: [
          { name: 'Push Image', status: 'completed', duration: '1m' },
          { name: 'Update Manifest', status: 'completed', duration: '30s' },
          { name: 'Apply Changes', status: 'in_progress' }
        ]
      },
      {
        name: 'Integration Tests',
        status: 'not_started'
      },
      {
        name: 'Deploy to Staging',
        status: 'not_started'
      }
    ],
    status: 'in_progress',
    lastRun: '2025-05-19T14:00:00Z',
    averageDuration: '45m',
    successRate: 88
  }
];

// GET all pipelines
router.get('/', (req, res) => {
  // Extract query parameters for filtering
  const { status, type } = req.query;
  
  let filteredPipelines = [...pipelines];
  
  // Apply filters if provided
  if (status) {
    filteredPipelines = filteredPipelines.filter(p => p.status === status);
  }
  
  if (type) {
    filteredPipelines = filteredPipelines.filter(p => p.type === type);
  }
  
  res.json(filteredPipelines);
});

// GET a specific pipeline
router.get('/:id', (req, res) => {
  const pipeline = pipelines.find(p => p.id === req.params.id);
  
  if (!pipeline) {
    return res.status(404).json({ message: 'Pipeline not found' });
  }
  
  res.json(pipeline);
});

// POST create a new pipeline
router.post('/', (req, res) => {
  // In a real app, validate request body using schema validation
  const newPipeline = {
    id: (pipelines.length + 1).toString(),
    ...req.body,
    status: 'created',
    stages: req.body.stages || []
  };
  
  pipelines.push(newPipeline);
  res.status(201).json(newPipeline);
});

// PUT update an existing pipeline
router.put('/:id', (req, res) => {
  const pipelineIndex = pipelines.findIndex(p => p.id === req.params.id);
  
  if (pipelineIndex === -1) {
    return res.status(404).json({ message: 'Pipeline not found' });
  }
  
  // Update the pipeline
  pipelines[pipelineIndex] = {
    ...pipelines[pipelineIndex],
    ...req.body
  };
  
  res.json(pipelines[pipelineIndex]);
});

// DELETE a pipeline
router.delete('/:id', (req, res) => {
  const pipelineIndex = pipelines.findIndex(p => p.id === req.params.id);
  
  if (pipelineIndex === -1) {
    return res.status(404).json({ message: 'Pipeline not found' });
  }
  
  // Remove the pipeline
  pipelines.splice(pipelineIndex, 1);
  
  res.status(204).send();
});

// GET pipeline status
router.get('/:id/status', (req, res) => {
  const pipeline = pipelines.find(p => p.id === req.params.id);
  
  if (!pipeline) {
    return res.status(404).json({ message: 'Pipeline not found' });
  }
  
  // Return status summary
  const statusSummary = {
    id: pipeline.id,
    name: pipeline.name,
    status: pipeline.status,
    lastRun: pipeline.lastRun,
    currentStage: pipeline.stages.find(stage => stage.status === 'in_progress')?.name,
    stages: pipeline.stages.map(stage => ({
      name: stage.name,
      status: stage.status
    }))
  };
  
  res.json(statusSummary);
});

// POST trigger a pipeline
router.post('/:id/trigger', (req, res) => {
  const pipeline = pipelines.find(p => p.id === req.params.id);
  
  if (!pipeline) {
    return res.status(404).json({ message: 'Pipeline not found' });
  }
  
  // Set pipeline to in_progress
  pipeline.status = 'in_progress';
  pipeline.lastRun = new Date().toISOString();
  
  // Reset stages
  pipeline.stages.forEach((stage /* , index */) => {
    if (index === 0) {
      stage.status = 'in_progress';
      stage.startTime = new Date().toISOString();
      stage.endTime = null;
      
      // Reset steps
      if (stage.steps) {
        stage.steps.forEach((step, stepIndex) => {
          if (stepIndex === 0) {
            step.status = 'in_progress';
          } else {
            step.status = 'not_started';
          }
          step.duration = null;
        });
      }
    } else {
      stage.status = 'not_started';
      stage.startTime = null;
      stage.endTime = null;
      
      // Reset steps
      if (stage.steps) {
        stage.steps.forEach(step => {
          step.status = 'not_started';
          step.duration = null;
        });
      }
    }
  });
  
  res.json(pipeline);
});

// GET pipeline metrics summary
router.get('/metrics/summary', (req, res) => {
  // Calculate metrics based on pipeline data
  const totalPipelines = pipelines.length;
  const activePipelines = pipelines.filter(p => p.status === 'in_progress').length;
  const successfulPipelines = pipelines.filter(p => p.status === 'completed').length;
  const failedPipelines = pipelines.filter(p => p.status === 'failed').length;
  
  // Calculate average success rate
  const avgSuccessRate = pipelines.reduce((sum, p) => sum + (p.successRate || 0), 0) / totalPipelines;
  
  // Calculate average duration
  const avgDuration = pipelines.reduce((sum, p) => {
    // Parse the duration string (e.g. "35m") to minutes
    const durationMatch = (p.averageDuration || '0m').match(/(\d+)m/);
    return sum + (durationMatch ? parseInt(durationMatch[1]) : 0);
  }, 0) / totalPipelines;
  
  const metrics = {
    totalPipelines,
    activePipelines,
    successfulPipelines,
    failedPipelines,
    avgSuccessRate,
    avgDuration: `${Math.round(avgDuration)}m`,
    recentRuns: pipelines.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      lastRun: p.lastRun
    })).sort((a, b) => new Date(b.lastRun) - new Date(a.lastRun)).slice(0, 5)
  };
  
  res.json(metrics);
});

module.exports = router;