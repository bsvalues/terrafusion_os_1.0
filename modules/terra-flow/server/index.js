/**
 * Terra-Flow Champion - Express Backend Service
 *
 * Enterprise workflow orchestration service with AI integration
 * Hybrid Architecture: Tauri (frontend) + Express (backend services)
 */
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import postgres from 'postgres';

// Simple CORS middleware
const cors = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const sql = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'terrafusion',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
});

// Workflow Orchestration Engine
class WorkflowOrchestrator {
  constructor() {
    this.activeWorkflows = new Map();
    this.templates = new Map();
    this.initializeTemplates();
  }

  initializeTemplates() {
    // Property Assessment Workflow
    this.templates.set('property-assessment', {
      id: 'property-assessment',
      name: 'Property Assessment Workflow',
      steps: [
        { id: 'data-collection', name: 'Data Collection', type: 'parallel' },
        { id: 'validation', name: 'Data Validation', type: 'sequential' },
        { id: 'ai-analysis', name: 'AI Analysis', type: 'ai-service' },
        { id: 'review', name: 'Human Review', type: 'manual' },
        { id: 'finalize', name: 'Finalize Assessment', type: 'sequential' },
      ],
      triggers: ['property-created', 'assessment-requested'],
      conditions: ['property-data-complete', 'assessor-available'],
    });

    // Government Compliance Workflow
    this.templates.set('compliance-check', {
      id: 'compliance-check',
      name: 'Government Compliance Workflow',
      steps: [
        { id: 'policy-check', name: 'Policy Validation', type: 'ai-service' },
        { id: 'document-review', name: 'Document Review', type: 'parallel' },
        { id: 'approval-chain', name: 'Approval Chain', type: 'sequential' },
        { id: 'notification', name: 'Stakeholder Notification', type: 'automated' },
      ],
      triggers: ['policy-change', 'compliance-review'],
      conditions: ['documents-uploaded', 'approvers-available'],
    });

    // Revenue Optimization Workflow
    this.templates.set('revenue-optimization', {
      id: 'revenue-optimization',
      name: 'Revenue Optimization Workflow',
      steps: [
        { id: 'data-mining', name: 'Data Mining Analysis', type: 'ai-service' },
        { id: 'opportunity-identification', name: 'Opportunity ID', type: 'ai-service' },
        { id: 'impact-modeling', name: 'Impact Modeling', type: 'parallel' },
        { id: 'recommendation', name: 'Generate Recommendations', type: 'ai-service' },
        { id: 'implementation', name: 'Implementation Plan', type: 'manual' },
      ],
      triggers: ['revenue-analysis-requested', 'quarterly-review'],
      conditions: ['financial-data-available', 'ai-models-ready'],
    });
  }

  async createWorkflow(templateId, context = {}) {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const workflow = {
      id: workflowId,
      templateId,
      template,
      context,
      status: 'created',
      currentStep: 0,
      steps: template.steps.map(step => ({
        ...step,
        status: 'pending',
        startTime: null,
        endTime: null,
        output: null,
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.activeWorkflows.set(workflowId, workflow);

    // Persist to database
    await sql`
      INSERT INTO workflows (id, template_id, context, status, created_at, updated_at)
      VALUES (${workflowId}, ${templateId}, ${JSON.stringify(context)}, 'created', NOW(), NOW())
    `;

    return workflow;
  }

  async startWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    workflow.status = 'running';
    workflow.updatedAt = new Date();

    await sql`
      UPDATE workflows SET status = 'running', updated_at = NOW() WHERE id = ${workflowId}
    `;

    // Start first step
    await this.executeNextStep(workflowId);
    return workflow;
  }

  async executeNextStep(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return;

    const currentStep = workflow.steps[workflow.currentStep];
    if (!currentStep) {
      workflow.status = 'completed';
      return;
    }

    currentStep.status = 'running';
    currentStep.startTime = new Date();

    // Execute step based on type
    switch (currentStep.type) {
      case 'ai-service':
        await this.executeAIStep(workflow, currentStep);
        break;
      case 'parallel':
        await this.executeParallelStep(workflow, currentStep);
        break;
      case 'sequential':
        await this.executeSequentialStep(workflow, currentStep);
        break;
      case 'manual':
        await this.executeManualStep(workflow, currentStep);
        break;
      case 'automated':
        await this.executeAutomatedStep(workflow, currentStep);
        break;
    }

    // Broadcast workflow update via WebSocket
    this.broadcastWorkflowUpdate(workflow);
  }

  async executeAIStep(workflow, step) {
    // AI service integration placeholder
    // In production, this would integrate with Anthropic/OpenAI APIs
    step.output = {
      service: 'ai-analysis',
      result: 'Analysis completed successfully',
      confidence: 0.92,
      timestamp: new Date(),
    };

    step.status = 'completed';
    step.endTime = new Date();
    workflow.currentStep++;

    // Continue to next step
    setTimeout(() => this.executeNextStep(workflow.id), 1000);
  }

  async executeParallelStep(workflow, step) {
    // Parallel execution simulation
    step.output = {
      tasks: ['task1', 'task2', 'task3'].map(task => ({
        name: task,
        status: 'completed',
        result: `${task} completed successfully`,
      })),
    };

    step.status = 'completed';
    step.endTime = new Date();
    workflow.currentStep++;

    setTimeout(() => this.executeNextStep(workflow.id), 2000);
  }

  async executeSequentialStep(workflow, step) {
    // Sequential execution
    step.output = {
      sequence: ['validate-data', 'process-results', 'generate-output'],
      status: 'all-completed',
    };

    step.status = 'completed';
    step.endTime = new Date();
    workflow.currentStep++;

    setTimeout(() => this.executeNextStep(workflow.id), 1500);
  }

  async executeManualStep(workflow, step) {
    // Manual step - waiting for human intervention
    step.status = 'waiting-for-input';
    step.output = {
      message: 'Waiting for manual review and approval',
      assignedTo: workflow.context.assignedUser || 'system-admin',
    };

    // Manual steps don't auto-advance
    this.broadcastWorkflowUpdate(workflow);
  }

  async executeAutomatedStep(workflow, step) {
    // Automated system tasks
    step.output = {
      notifications: ['email-sent', 'dashboard-updated', 'audit-logged'],
      status: 'all-notifications-sent',
    };

    step.status = 'completed';
    step.endTime = new Date();
    workflow.currentStep++;

    setTimeout(() => this.executeNextStep(workflow.id), 500);
  }

  broadcastWorkflowUpdate(workflow) {
    const message = JSON.stringify({
      type: 'workflow-update',
      workflow: {
        id: workflow.id,
        status: workflow.status,
        currentStep: workflow.currentStep,
        progress: (workflow.currentStep / workflow.steps.length) * 100,
        steps: workflow.steps,
      },
    });

    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  }
}

const orchestrator = new WorkflowOrchestrator();

// API Routes
app.get('/api/workflows', async (req, res) => {
  try {
    const workflows = Array.from(orchestrator.activeWorkflows.values());
    res.json({ workflows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workflows', async (req, res) => {
  try {
    const { templateId, context } = req.body;
    const workflow = await orchestrator.createWorkflow(templateId, context);
    res.json({ workflow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workflows/:id/start', async (req, res) => {
  try {
    const workflow = await orchestrator.startWorkflow(req.params.id);
    res.json({ workflow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/workflows/templates', (req, res) => {
  const templates = Array.from(orchestrator.templates.values());
  res.json({ templates });
});

app.post('/api/workflows/:id/advance', async (req, res) => {
  try {
    const workflow = orchestrator.activeWorkflows.get(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Advance manual steps
    const currentStep = workflow.steps[workflow.currentStep];
    if (currentStep && currentStep.status === 'waiting-for-input') {
      currentStep.status = 'completed';
      currentStep.endTime = new Date();
      currentStep.output = { ...currentStep.output, ...req.body };
      workflow.currentStep++;

      await orchestrator.executeNextStep(workflow.id);
    }

    res.json({ workflow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket connection handling
wss.on('connection', ws => {
  console.log('Client connected to workflow orchestrator');

  ws.on('message', message => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);

      // Handle real-time workflow commands
      if (data.type === 'subscribe-workflow' && data.workflowId) {
        ws.workflowSubscription = data.workflowId;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from workflow orchestrator');
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'terra-flow-champion',
    timestamp: new Date(),
    activeWorkflows: orchestrator.activeWorkflows.size,
    availableTemplates: orchestrator.templates.size,
  });
});

const PORT = process.env.TF_SHELL_PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Terra-Flow Champion Backend running on port ${PORT}`);
  console.log(`📊 Workflow orchestrator ready with ${orchestrator.templates.size} templates`);
});

export { orchestrator };
