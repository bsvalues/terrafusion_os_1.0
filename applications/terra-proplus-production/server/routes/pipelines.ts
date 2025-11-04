import express from 'express';
import { Request, Response } from 'express';
import { z } from 'zod';
import { broadcastMessage } from '../index';
const { recordPipelineExecution, recordPipelineStageExecution } = require('../monitoring');

const router = express.Router();

// Pipeline data validation schema
const pipelineSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  repository: z.string().min(1),
  branch: z.string().default('main'),
  type: z.enum(['build', 'deployment', 'test']),
});

// Pipeline stage transition schema
const stageTransitionSchema = z.object({
  pipelineId: z.string(),
  stageName: z.string(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'failed']),
  details: z.record(z.any()).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional()
});

// Mock data for pipelines (will be replaced with database storage)
let pipelines = [
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

// GET all pipelines with optional filtering
router.get('/', (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error getting pipelines:', error);
    res.status(500).json({ error: 'Failed to get pipelines' });
  }
});

// GET a specific pipeline
router.get('/:id', (req: Request<{id: string}>, res: Response) => {
  try {
    const pipeline = pipelines.find(p => p.id === req.params.id);
    
    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    res.json(pipeline);
  } catch (error) {
    console.error('Error getting pipeline:', error);
    res.status(500).json({ error: 'Failed to get pipeline' });
  }
});

// POST create a new pipeline
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = pipelineSchema.parse(req.body);
    
    // Create new pipeline
    const newPipeline = {
      id: (pipelines.length + 1).toString(),
      ...validatedData,
      status: 'created',
      stages: [],
      lastRun: null,
      averageDuration: null,
      successRate: null
    };
    
    pipelines.push(newPipeline);
    
    // Record metric
    recordPipelineExecution({
      name: newPipeline.name,
      repository: newPipeline.repository,
      branch: newPipeline.branch,
      status: 'created'
    }, 0);
    
    // Broadcast event via WebSocket
    broadcastMessage('PIPELINE_CREATED', {
      pipeline: newPipeline,
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json(newPipeline);
  } catch (error) {
    console.error('Error creating pipeline:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create pipeline' });
  }
});

// POST trigger a pipeline
router.post('/:id/trigger', async (req: Request<{id: string}>, res: Response) => {
  try {
    const pipelineIndex = pipelines.findIndex(p => p.id === req.params.id);
    
    if (pipelineIndex === -1) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    const pipeline = pipelines[pipelineIndex];
    
    // Set pipeline to in_progress
    pipeline.status = 'in_progress';
    pipeline.lastRun = new Date().toISOString();
    
    // Reset stages
    pipeline.stages.forEach((stage /* , index */) => {
      if (index === 0) {
        stage.status = 'in_progress';
        stage.startTime = new Date().toISOString();
        stage.endTime = null;
        
        // Record metric for stage transition
        recordPipelineStageExecution(
          pipeline.name,
          stage.name,
          'in_progress',
          0
        );
        
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
    
    // Record metric
    recordPipelineExecution({
      name: pipeline.name,
      repository: pipeline.repository,
      branch: pipeline.branch,
      status: 'in_progress'
    }, 0);
    
    // Broadcast event via WebSocket
    broadcastMessage('PIPELINE_TRIGGERED', {
      pipeline: pipeline,
      timestamp: new Date().toISOString()
    });
    
    // Replace the pipeline in the array
    pipelines[pipelineIndex] = pipeline;
    
    res.json(pipeline);
    
    // Simulate pipeline execution in the background
    simulatePipelineExecution(pipeline.id);
  } catch (error) {
    console.error('Error triggering pipeline:', error);
    res.status(500).json({ error: 'Failed to trigger pipeline' });
  }
});

// POST update stage status
router.post('/stages/transition', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const transitionData = stageTransitionSchema.parse(req.body);
    
    const pipelineIndex = pipelines.findIndex(p => p.id === transitionData.pipelineId);
    
    if (pipelineIndex === -1) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    const pipeline = pipelines[pipelineIndex];
    const stageIndex = pipeline.stages.findIndex(s => s.name === transitionData.stageName);
    
    if (stageIndex === -1) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    
    const stage = pipeline.stages[stageIndex];
    const previousStatus = stage.status;
    stage.status = transitionData.status;
    
    // Update timestamps based on status
    if (transitionData.status === 'in_progress' && !stage.startTime) {
      stage.startTime = transitionData.startTime || new Date().toISOString();
    }
    
    if (['completed', 'failed'].includes(transitionData.status) && !stage.endTime) {
      stage.endTime = transitionData.endTime || new Date().toISOString();
      
      // Calculate duration
      if (stage.startTime && stage.endTime) {
        const start = new Date(stage.startTime).getTime();
        const end = new Date(stage.endTime).getTime();
        const durationSecs = (end - start) / 1000;
        
        // Record metric
        recordPipelineStageExecution(
          pipeline.name,
          stage.name,
          transitionData.status,
          durationSecs
        );
        
        // Format duration for display
        const mins = Math.floor(durationSecs / 60);
        const secs = Math.floor(durationSecs % 60);
        stage.duration = `${mins}m ${secs}s`;
      }
    }
    
    // Update pipeline overall status if appropriate
    updatePipelineStatus(pipeline);
    
    // Replace the stage in the pipeline
    pipeline.stages[stageIndex] = stage;
    
    // Replace the pipeline in the array
    pipelines[pipelineIndex] = pipeline;
    
    // Broadcast event via WebSocket
    broadcastMessage('PIPELINE_STAGE_CHANGED', {
      pipelineId: pipeline.id,
      stageName: stage.name,
      previousStatus,
      newStatus: stage.status,
      timestamp: new Date().toISOString()
    });
    
    res.json(stage);
  } catch (error) {
    console.error('Error updating stage status:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to update stage status' });
  }
});

// GET pipeline metrics summary
router.get('/metrics/summary', (req: Request, res: Response) => {
  try {
    // Calculate metrics based on pipeline data
    const totalPipelines = pipelines.length;
    const activePipelines = pipelines.filter(p => p.status === 'in_progress').length;
    const successfulPipelines = pipelines.filter(p => p.status === 'completed').length;
    const failedPipelines = pipelines.filter(p => p.status === 'failed').length;
    
    // Calculate average success rate
    const successRates = pipelines.map(p => p.successRate).filter(rate => rate !== null) as number[];
    const avgSuccessRate = successRates.length > 0
      ? successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length
      : 0;
    
    // Calculate average duration
    const durations = pipelines
      .map(p => {
        if (!p.averageDuration) return null;
        const match = p.averageDuration.match(/(\d+)m/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(duration => duration !== null) as number[];
    
    const avgDuration = durations.length > 0
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : 0;
    
    const metrics = {
      totalPipelines,
      activePipelines,
      successfulPipelines,
      failedPipelines,
      avgSuccessRate: Math.round(avgSuccessRate),
      avgDuration: `${Math.round(avgDuration)}m`,
      recentRuns: pipelines
        .filter(p => p.lastRun !== null)
        .map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          lastRun: p.lastRun
        }))
        .sort((a, b) => {
          if (!a.lastRun) return 1;
          if (!b.lastRun) return -1;
          return new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime();
        })
        .slice(0, 5)
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Error getting pipeline metrics:', error);
    res.status(500).json({ error: 'Failed to get pipeline metrics' });
  }
});

// Helper function to update overall pipeline status based on stages
function updatePipelineStatus(pipeline: any) {
  // If any stage is failed, the pipeline is failed
  if (pipeline.stages.some((s: any) => s.status === 'failed')) {
    pipeline.status = 'failed';
    
    // Record metric for completed pipeline
    if (pipeline.stages[0].startTime) {
      const startTime = new Date(pipeline.stages[0].startTime).getTime();
      const endTime = new Date().getTime();
      const durationSecs = (endTime - startTime) / 1000;
      
      recordPipelineExecution({
        name: pipeline.name,
        repository: pipeline.repository,
        branch: pipeline.branch,
        status: 'failed'
      }, durationSecs);
    }
    
    return;
  }
  
  // If any stage is in_progress, the pipeline is in_progress
  if (pipeline.stages.some((s: any) => s.status === 'in_progress')) {
    pipeline.status = 'in_progress';
    return;
  }
  
  // If all stages are completed, the pipeline is completed
  if (pipeline.stages.every((s: any) => s.status === 'completed')) {
    pipeline.status = 'completed';
    
    // Record metric for completed pipeline
    if (pipeline.stages[0].startTime) {
      const startTime = new Date(pipeline.stages[0].startTime).getTime();
      const endTime = new Date().getTime();
      const durationSecs = (endTime - startTime) / 1000;
      
      recordPipelineExecution({
        name: pipeline.name,
        repository: pipeline.repository,
        branch: pipeline.branch,
        status: 'completed'
      }, durationSecs);
    }
    
    // Update success rate for the pipeline (simple simulation)
    pipeline.successRate = Math.floor(Math.random() * 15) + 85; // 85-100%
    
    return;
  }
  
  // Default: created or not_started
  if (pipeline.stages.every((s: any) => s.status === 'not_started')) {
    pipeline.status = 'created';
  }
}

// Helper function to simulate pipeline execution
async function simulatePipelineExecution(pipelineId: string) {
  // Find the pipeline
  const pipeline = pipelines.find(p => p.id === pipelineId);
  if (!pipeline) return;
  
  // Process each stage sequentially
  for (const stage of pipeline.stages) {
    // Skip stages that are already completed
    if (stage.status === 'completed') continue;
    
    // Execute each stage
    await executeStage(pipelineId, stage);
    
    // If stage failed, stop the pipeline
    if (stage.status === 'failed') break;
  }
}

// Helper function to simulate stage execution
async function executeStage(pipelineId: string, stage: any) {
  // Skip if stage is already completed or failed
  if (['completed', 'failed'].includes(stage.status)) return;
  
  // Set stage to in_progress
  await updateStageStatus(pipelineId, stage.name, 'in_progress');
  
  // Process each step sequentially if the stage has steps
  if (stage.steps) {
    for (const step of stage.steps) {
      // Skip steps that are already completed
      if (step.status === 'completed') continue;
      
      // Set step to in_progress
      step.status = 'in_progress';
      
      // Simulate step execution
      await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));
      
      // Random success/failure (90% success rate)
      const success = Math.random() > 0.1;
      
      // Update step status
      step.status = success ? 'completed' : 'failed';
      
      // Set duration
      const durationSecs = Math.floor(Math.random() * 180 + 10);
      const mins = Math.floor(durationSecs / 60);
      const secs = durationSecs % 60;
      step.duration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      
      // If step failed, fail the stage
      if (!success) {
        step.error = 'Execution failed';
        await updateStageStatus(pipelineId, stage.name, 'failed');
        return;
      }
    }
  } else {
    // If no steps, just simulate a delay for the stage
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));
  }
  
  // Complete the stage
  await updateStageStatus(pipelineId, stage.name, 'completed');
}

// Helper function to update stage status
async function updateStageStatus(pipelineId: string, stageName: string, status: string) {
  try {
    // Find the pipeline
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (!pipeline) return;
    
    // Find the stage
    const stage = pipeline.stages.find(s => s.name === stageName);
    if (!stage) return;
    
    // Update status
    const previousStatus = stage.status;
    stage.status = status;
    
    // Update timestamps
    if (status === 'in_progress' && !stage.startTime) {
      stage.startTime = new Date().toISOString();
    }
    
    if (['completed', 'failed'].includes(status) && !stage.endTime) {
      stage.endTime = new Date().toISOString();
      
      // Calculate duration
      if (stage.startTime && stage.endTime) {
        const start = new Date(stage.startTime).getTime();
        const end = new Date(stage.endTime).getTime();
        const durationSecs = (end - start) / 1000;
        
        // Record metric
        recordPipelineStageExecution(
          pipeline.name,
          stage.name,
          status,
          durationSecs
        );
        
        // Format duration for display
        const mins = Math.floor(durationSecs / 60);
        const secs = Math.floor(durationSecs % 60);
        stage.duration = `${mins}m ${secs}s`;
      }
    }
    
    // Update overall pipeline status
    updatePipelineStatus(pipeline);
    
    // Broadcast event via WebSocket
    broadcastMessage('PIPELINE_STAGE_CHANGED', {
      pipelineId: pipeline.id,
      stageName: stage.name,
      previousStatus,
      newStatus: stage.status,
      timestamp: new Date().toISOString()
    });
    
    // Simulate a delay before processing the next stage
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Error updating stage status:', error);
  }
}

export default router;