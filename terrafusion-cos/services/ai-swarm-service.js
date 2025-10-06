/**
 * AI Swarm Service Wrapper for Electron
 * Starts Supreme Commander Claude and manages communication
 */

const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const EventEmitter = require('events');

class AISwarmService extends EventEmitter {
  constructor() {
    super();
    this.process = null;
    this.isReady = false;
    this.port = 3000;
    this.baseUrl = `http://localhost:${this.port}`;
    this.retryAttempts = 0;
    this.maxRetries = 10;
  }

  async start() {
    console.log('🚀 Starting AI Swarm Supreme Commander...');

    const supremeCommanderPath = path.join(__dirname, '..', '..', 'ai-swarm-supreme-commander', 'dist', 'supreme-commander.js');

    this.process = spawn('node', [supremeCommanderPath], {
      cwd: path.dirname(supremeCommanderPath),
      env: {
        ...process.env,
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        PORT: this.port.toString()
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdout.on('data', (data) => {
      const message = data.toString();
      console.log(`[AI Swarm] ${message}`);
      
      if (message.includes('operational')) {
        this.isReady = true;
        this.emit('ready');
      }
    });

    this.process.stderr.on('data', (data) => {
      console.error(`[AI Swarm Error] ${data.toString()}`);
    });

    this.process.on('exit', (code) => {
      console.log(`[AI Swarm] Process exited with code ${code}`);
      this.isReady = false;
      this.emit('exit', code);
    });

    // Wait for service to be ready
    await this.waitForReady();
    return this.getStatus();
  }

  async waitForReady(timeout = 30000) {
    const startTime = Date.now();
    
    while (!this.isReady && (Date.now() - startTime) < timeout) {
      try {
        const response = await axios.get(`${this.baseUrl}/health`, { timeout: 1000 });
        if (response.data.status === 'operational') {
          this.isReady = true;
          console.log('✅ AI Swarm Supreme Commander ready');
          return true;
        }
      } catch (error) {
        // Service not ready yet, wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!this.isReady) {
      throw new Error('AI Swarm failed to start within timeout period');
    }

    return true;
  }

  async getStatus() {
    if (!this.isReady) {
      return { status: 'offline', agents: 0 };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      console.error('Failed to get AI Swarm status:', error.message);
      return { status: 'error', error: error.message };
    }
  }

  async getAgents() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/agents`);
      return response.data;
    } catch (error) {
      console.error('Failed to get agents:', error.message);
      return { totalAgents: 0, agents: [] };
    }
  }

  /**
   * Generate dynamic UI based on user context
   */
  async generateUI(context) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/ai/generate-ui`, {
        userRole: context.role || 'assessor',
        countyId: context.countyId || 'BENTON',
        workflowContext: context.workflow || 'property_assessment',
        modules: context.modules || ['TerraFusion Sync', 'TerraFlow', 'CostForge AI'],
        complianceLevel: context.complianceLevel || 'GREEN',
        accessibility: context.accessibility || 'WCAG_AA',
        uiOptimization: true,
        governmentGrade: true
      });

      return response.data;
    } catch (error) {
      console.error('Failed to generate UI:', error.message);
      
      // Fallback to basic UI structure
      return this.getFallbackUI(context);
    }
  }

  getFallbackUI(context) {
    return {
      layout: 'desktop-os',
      components: [
        {
          type: 'desktop',
          icons: context.modules || ['TerraFusion Sync', 'TerraFlow', 'CostForge AI', 'Settings']
        },
        {
          type: 'taskbar',
          items: ['start', 'apps', 'system', 'user']
        },
        {
          type: 'start-menu',
          apps: context.modules || []
        }
      ],
      theme: 'terrafusion-government',
      accessibility: 'WCAG_AA'
    };
  }

  async executeCodeCompletion(code, language, context = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/ai/completion`, {
        code,
        language,
        context: context.userIntent || 'Code completion',
        projectType: context.projectType || 'government-module',
        governmentCompliance: true,
        securityClearance: context.complianceLevel || 'GREEN'
      });

      return response.data;
    } catch (error) {
      console.error('Code completion failed:', error.message);
      return { suggestions: [], confidence: 0 };
    }
  }

  async validateCompliance(code, language, standards = []) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/compliance/validate`, {
        code,
        language,
        projectType: 'government-module',
        standards: standards.length > 0 ? standards : ['FISMA', 'NIST', 'Section508'],
        governmentGrade: true,
        auditRequired: true
      });

      return response.data;
    } catch (error) {
      console.error('Compliance validation failed:', error.message);
      return { isCompliant: false, violations: [], score: 0 };
    }
  }

  stop() {
    if (this.process) {
      console.log('Stopping AI Swarm Supreme Commander...');
      this.process.kill();
      this.process = null;
      this.isReady = false;
    }
  }
}

module.exports = AISwarmService;

