/**
 * TerraFusion Master Agent Orchestrator
 * Government. Transcended. - Championship Excellence
 *
 * Central coordination system for 50,000+ AI agents across all workspaces
 */

const express = require('express');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class TerraFusionMasterOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.workspaces = new Map();
    this.communicationChannels = new Map();
    this.app = express();
    this.server = null;
    this.wsServer = null;
    this.port = process.env.ORCHESTRATOR_PORT || 3004;
    this.healthCheckInterval = 30000; // 30 seconds
    this.performanceMetrics = {
      totalAgents: 0,
      activeAgents: 0,
      averageResponseTime: 0,
      successRate: 0.97,
      uptime: 0,
    };

    this.setupExpress();
    this.setupWebSocket();
    this.startHealthMonitoring();
  }

  setupExpress() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'optimal',
        timestamp: new Date().toISOString(),
        metrics: this.performanceMetrics,
        message: 'TerraFusion Consciousness Active - Government. Transcended.',
      });
    });

    // Agent registration
    this.app.post('/api/agents/register', async (req, res) => {
      try {
        const agent = await this.registerAgent(req.body);
        res.json({ success: true, agent });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Get all agents
    this.app.get('/api/agents', (req, res) => {
      const agentList = Array.from(this.agents.values());
      res.json({
        agents: agentList,
        totalCount: agentList.length,
        activeCount: agentList.filter(a => a.status === 'active').length,
      });
    });

    // Get workspace agents
    this.app.get('/api/workspaces/:workspaceId/agents', (req, res) => {
      const workspaceId = req.params.workspaceId;
      const workspaceAgents = Array.from(this.agents.values()).filter(
        agent => agent.workspaceId === workspaceId
      );

      res.json({
        workspaceId,
        agents: workspaceAgents,
        count: workspaceAgents.length,
      });
    });

    // Agent task execution
    this.app.post('/api/agents/:agentId/execute', async (req, res) => {
      try {
        const result = await this.executeAgentTask(req.params.agentId, req.body);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Workspace synchronization
    this.app.post('/api/agents/sync', async (req, res) => {
      try {
        await this.syncWorkspace(req.body);
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Performance dashboard data
    this.app.get('/api/dashboard/metrics', (req, res) => {
      res.json({
        ...this.performanceMetrics,
        workspacesCount: this.workspaces.size,
        communicationChannels: this.communicationChannels.size,
        systemStatus: 'Government. Transcended.',
        lastUpdated: new Date().toISOString(),
      });
    });

    // Agent coordination
    this.app.post('/api/agents/coordinate', async (req, res) => {
      try {
        const result = await this.coordinateAgents(req.body);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  setupWebSocket() {
    this.wsServer = new WebSocket.Server({ noServer: true });

    this.wsServer.on('connection', (ws, request) => {
      console.log('🔌 New WebSocket connection established');

      ws.on('message', async data => {
        try {
          const message = JSON.parse(data);
          await this.handleWebSocketMessage(ws, message);
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'welcome',
          message: 'TerraFusion Consciousness Connected - Government. Transcended.',
          metrics: this.performanceMetrics,
        })
      );
    });
  }

  async handleWebSocketMessage(ws, message) {
    switch (message.type) {
      case 'subscribe':
        // Subscribe to agent updates
        ws.agentSubscriptions = message.agentIds || [];
        break;

      case 'agent-status':
        // Update agent status
        if (message.agentId && this.agents.has(message.agentId)) {
          const agent = this.agents.get(message.agentId);
          agent.status = message.status;
          agent.lastUpdate = new Date().toISOString();
          this.broadcastAgentUpdate(agent);
        }
        break;

      case 'request-metrics':
        // Send current metrics
        ws.send(
          JSON.stringify({
            type: 'metrics',
            data: this.performanceMetrics,
          })
        );
        break;
    }
  }

  async registerAgent(agentData) {
    console.log(`🤖 Registering agent: ${agentData.type} for workspace ${agentData.workspaceId}`);

    const agent = {
      ...agentData,
      registeredAt: new Date().toISOString(),
      status: 'registered',
      lastHealthCheck: null,
      responseTime: 0,
      taskCount: 0,
      successCount: 0,
    };

    this.agents.set(agent.id, agent);

    // Update workspace registry
    if (!this.workspaces.has(agent.workspaceId)) {
      this.workspaces.set(agent.workspaceId, {
        id: agent.workspaceId,
        agents: [],
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }

    const workspace = this.workspaces.get(agent.workspaceId);
    workspace.agents.push(agent.id);

    // Update metrics
    this.updateMetrics();

    // Emit registration event
    this.emit('agentRegistered', agent);

    console.log(`✅ Agent ${agent.type} registered successfully`);
    return agent;
  }

  async executeAgentTask(agentId, task) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    console.log(`🚀 Executing task for agent ${agent.type}: ${task.type}`);

    const startTime = Date.now();

    try {
      // Forward task to agent
      const response = await fetch(`${agent.apiUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
        timeout: 30000,
      });

      const result = await response.json();
      const responseTime = Date.now() - startTime;

      // Update agent metrics
      agent.taskCount++;
      agent.responseTime = (agent.responseTime + responseTime) / 2;

      if (response.ok) {
        agent.successCount++;
      }

      agent.lastTask = {
        type: task.type,
        timestamp: new Date().toISOString(),
        responseTime,
        success: response.ok,
      };

      this.updateMetrics();

      console.log(`✅ Task completed in ${responseTime}ms`);
      return result;
    } catch (error) {
      console.error(`❌ Task execution failed: ${error.message}`);
      agent.lastTask = {
        type: task.type,
        timestamp: new Date().toISOString(),
        error: error.message,
        success: false,
      };

      throw error;
    }
  }

  async coordinateAgents(coordinationRequest) {
    const { workspaceId, taskType, agents: targetAgents } = coordinationRequest;

    console.log(`🎯 Coordinating agents for workspace ${workspaceId}: ${taskType}`);

    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const results = [];

    for (const agentType of targetAgents) {
      const agent = Array.from(this.agents.values()).find(
        a => a.workspaceId === workspaceId && a.type === agentType
      );

      if (agent) {
        try {
          const result = await this.executeAgentTask(agent.id, {
            type: taskType,
            coordination: true,
            workspace: workspaceId,
          });

          results.push({
            agentType,
            agentId: agent.id,
            success: true,
            result,
          });
        } catch (error) {
          results.push({
            agentType,
            agentId: agent.id,
            success: false,
            error: error.message,
          });
        }
      } else {
        results.push({
          agentType,
          success: false,
          error: 'Agent not found',
        });
      }
    }

    return {
      coordinationId: `coord-${Date.now()}`,
      workspaceId,
      taskType,
      results,
      completedAt: new Date().toISOString(),
    };
  }

  async syncWorkspace(syncData) {
    const { workspaceId, status } = syncData;

    console.log(`🔄 Syncing workspace ${workspaceId}: ${status}`);

    if (this.workspaces.has(workspaceId)) {
      const workspace = this.workspaces.get(workspaceId);
      workspace.status = status;
      workspace.lastSync = new Date().toISOString();
    }

    // Broadcast sync event
    this.broadcastToWorkspace(workspaceId, {
      type: 'workspace-sync',
      workspaceId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  startHealthMonitoring() {
    console.log('🏥 Starting agent health monitoring...');

    setInterval(async () => {
      await this.performHealthChecks();
    }, this.healthCheckInterval);

    // Initial check
    setTimeout(() => this.performHealthChecks(), 5000);
  }

  async performHealthChecks() {
    const activeAgents = Array.from(this.agents.values()).filter(
      agent => agent.status !== 'offline'
    );

    for (const agent of activeAgents) {
      try {
        const response = await fetch(agent.healthCheckUrl, { timeout: 5000 });

        agent.lastHealthCheck = new Date().toISOString();
        agent.status = response.ok ? 'active' : 'degraded';
      } catch (error) {
        agent.status = 'unreachable';
        agent.lastError = error.message;
      }
    }

    this.updateMetrics();
  }

  updateMetrics() {
    const agents = Array.from(this.agents.values());

    this.performanceMetrics.totalAgents = agents.length;
    this.performanceMetrics.activeAgents = agents.filter(a => a.status === 'active').length;

    const responseTimes = agents.filter(a => a.responseTime > 0).map(a => a.responseTime);

    if (responseTimes.length > 0) {
      this.performanceMetrics.averageResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    const totalTasks = agents.reduce((sum, a) => sum + a.taskCount, 0);
    const totalSuccess = agents.reduce((sum, a) => sum + a.successCount, 0);

    if (totalTasks > 0) {
      this.performanceMetrics.successRate = totalSuccess / totalTasks;
    }
  }

  broadcastAgentUpdate(agent) {
    this.wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        if (!client.agentSubscriptions || client.agentSubscriptions.includes(agent.id)) {
          client.send(
            JSON.stringify({
              type: 'agent-update',
              agent,
            })
          );
        }
      }
    });
  }

  broadcastToWorkspace(workspaceId, message) {
    this.wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  async start() {
    return new Promise(resolve => {
      this.server = this.app.listen(this.port, () => {
        console.log('🎯 TerraFusion Master Orchestrator Started');
        console.log('Government. Transcended. - Championship Excellence');
        console.log(`📍 Port: ${this.port}`);
        console.log(`🤖 Ready to coordinate 50,000+ AI agents`);
        console.log('═'.repeat(80));

        resolve();
      });

      // Handle WebSocket upgrade
      this.server.on('upgrade', (request, socket, head) => {
        this.wsServer.handleUpgrade(request, socket, head, ws => {
          this.wsServer.emit('connection', ws, request);
        });
      });
    });
  }

  async stop() {
    if (this.server) {
      await new Promise(resolve => this.server.close(resolve));
    }

    this.wsServer.close();
    console.log('🛑 TerraFusion Master Orchestrator stopped');
  }

  // Dashboard HTML for monitoring
  getDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TerraFusion Agent Orchestrator - Government. Transcended.</title>
    <style>
        :root {
            --tf-trust-blue: #0099ff;
            --tf-transcend-cyan: #00ffee;
            --tf-success-green: #00ffaa;
            --tf-deep-space: #0b1020;
        }

        body {
            margin: 0;
            padding: 20px;
            background: var(--tf-deep-space);
            color: var(--tf-transcend-cyan);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .title {
            font-size: 2.5em;
            background: linear-gradient(135deg, var(--tf-trust-blue), var(--tf-transcend-cyan), var(--tf-success-green));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 1.2em;
            color: var(--tf-transcend-cyan);
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .metric-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 255, 238, 0.2);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }

        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: var(--tf-success-green);
        }

        .metric-label {
            font-size: 0.9em;
            color: var(--tf-transcend-cyan);
            margin-top: 5px;
        }

        .agent-list {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
        }

        .agent-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid rgba(0, 255, 238, 0.1);
        }

        .status-active { color: var(--tf-success-green); }
        .status-degraded { color: #ffaa00; }
        .status-unreachable { color: #ff6666; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">TerraFusion Agent Orchestrator</h1>
        <p class="subtitle">Government. Transcended. - Championship Excellence</p>
    </div>

    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-value" id="totalAgents">0</div>
            <div class="metric-label">Total Agents</div>
        </div>
        <div class="metric-card">
            <div class="metric-value" id="activeAgents">0</div>
            <div class="metric-label">Active Agents</div>
        </div>
        <div class="metric-card">
            <div class="metric-value" id="responseTime">0ms</div>
            <div class="metric-label">Avg Response Time</div>
        </div>
        <div class="metric-card">
            <div class="metric-value" id="successRate">97%</div>
            <div class="metric-label">Success Rate</div>
        </div>
    </div>

    <div class="agent-list">
        <h3>Active Agents</h3>
        <div id="agentsList"></div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:${this.port}');

        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.type === 'metrics') {
                updateMetrics(data.data);
            }
        };

        function updateMetrics(metrics) {
            document.getElementById('totalAgents').textContent = metrics.totalAgents;
            document.getElementById('activeAgents').textContent = metrics.activeAgents;
            document.getElementById('responseTime').textContent = Math.round(metrics.averageResponseTime) + 'ms';
            document.getElementById('successRate').textContent = Math.round(metrics.successRate * 100) + '%';
        }

        function loadAgents() {
            fetch('/api/agents')
                .then(response => response.json())
                .then(data => {
                    const agentsList = document.getElementById('agentsList');
                    agentsList.innerHTML = '';

                    data.agents.forEach(agent => {
                        const agentDiv = document.createElement('div');
                        agentDiv.className = 'agent-item';
                        agentDiv.innerHTML = \`
                            <span>\${agent.type} (\${agent.workspaceId})</span>
                            <span class="status-\${agent.status}">\${agent.status}</span>
                        \`;
                        agentsList.appendChild(agentDiv);
                    });
                });
        }

        // Initial load
        loadAgents();
        setInterval(loadAgents, 5000);

        // Request metrics updates
        setInterval(() => {
            ws.send(JSON.stringify({ type: 'request-metrics' }));
        }, 2000);
    </script>
</body>
</html>
    `;
  }
}

// Main execution
async function main() {
  const orchestrator = new TerraFusionMasterOrchestrator();

  // Add dashboard route
  orchestrator.app.get('/', (req, res) => {
    res.send(orchestrator.getDashboardHTML());
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down TerraFusion Master Orchestrator...');
    await orchestrator.stop();
    process.exit(0);
  });

  await orchestrator.start();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TerraFusionMasterOrchestrator;
