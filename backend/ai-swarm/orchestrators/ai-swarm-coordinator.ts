import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { Logger } from '../utils/logger';
import { WorkflowExecutionEngine, WorkflowContext, WorkflowResult } from '../services/WorkflowExecutionEngine';
import { IDEPlaybookRegistry, WorkflowPlaybook, IDEDomain } from '../services/PlaybookRegistry';
import { AgentCommunicationHub } from '../communication/AgentCommunicationProtocol';
import AgentClient from '../communication/AgentClient';

/**
 * AI Swarm Coordinator - Enhanced orchestration for 1,008 agent system
 * Manages hierarchical agent distribution across command brain, swarm, and advanced modules
 */
export interface AgentConfiguration {
  id: string;
  tier: AgentTier;
  module: string;
  capabilities: string[];
  specialization: string;
  status: AgentStatus;
  performance: AgentPerformance;
  networkConnections: string[];
  lastActivity: Date;
}

export interface SwarmMetrics {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  busyAgents: number;
  averagePerformance: number;
  coherenceScore: number;
  tasksCompleted: number;
  tasksInProgress: number;
  errorRate: number;
}

export interface TaskAllocation {
  taskId: string;
  requiredCapabilities: string[];
  priority: TaskPriority;
  estimatedDuration: number;
  assignedAgents: string[];
  status: TaskStatus;
}

export enum AgentTier {
  CommandBrain = 'COMMAND_BRAIN',
  SwarmCoordinator = 'SWARM_COORDINATOR',
  AdvancedProcessor = 'ADVANCED_PROCESSOR',
  SpecialistWorker = 'SPECIALIST_WORKER',
  MicroOptimizer = 'MICRO_OPTIMIZER',
}

export enum AgentStatus {
  Active = 'ACTIVE',
  Idle = 'IDLE',
  Busy = 'BUSY',
  Offline = 'OFFLINE',
  Error = 'ERROR',
}

export enum TaskPriority {
  Critical = 'CRITICAL',
  High = 'HIGH',
  Normal = 'NORMAL',
  Low = 'LOW',
}

export enum TaskStatus {
  Pending = 'PENDING',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
}

export interface AgentPerformance {
  tasksCompleted: number;
  averageExecutionTime: number;
  successRate: number;
  errorCount: number;
  lastBenchmark: Date;
}

/**
 * AI Swarm Coordinator - PhD-level agent orchestration system
 * Manages 1,008 agents across 33 modules with hierarchical distribution
 */
export class AISwarmCoordinator extends EventEmitter {
  private agents: Map<string, AgentConfiguration> = new Map();
  private modules: Map<string, string[]> = new Map();
  private taskQueue: TaskAllocation[] = [];
  private metrics: SwarmMetrics;
  private logger: Logger;
  private evolutionLoop: NodeJS.Timer | null = null;
  private metricsLoop: NodeJS.Timer | null = null;

  // ENHANCEMENT #1: Workflow Integration
  private workflowEngine: WorkflowExecutionEngine;
  private playbookRegistry: IDEPlaybookRegistry;
  private activeWorkflows: Map<string, WorkflowResult> = new Map();

  // ENHANCEMENT #2: Real-Time Communication
  private communicationHub: AgentCommunicationHub;
  private agentClients: Map<string, AgentClient> = new Map();

  // Target agent distribution (1,008 total)
  private readonly AGENT_DISTRIBUTION = {
    [AgentTier.CommandBrain]: 8, // 8 command agents
    [AgentTier.SwarmCoordinator]: 32, // 32 coordinators
    [AgentTier.AdvancedProcessor]: 168, // 168 advanced processors
    [AgentTier.SpecialistWorker]: 500, // 500 specialist workers
    [AgentTier.MicroOptimizer]: 300, // 300 micro optimizers
  };

  // Module allocation (33 modules)
  private readonly MODULE_PRIORITY = {
    'ai-command-brain': 100, // Highest priority
    'government-edition': 95,
    'ai-swarm': 90,
    'marketplace-champion': 85,
    'costforge-ai-champion': 80,
    'terra-fusion-sync': 85, // Critical data hub
    'unified-system': 90, // System integration
    'terra-miner': 75, // Large component count
    'commercial-suite': 70,
    // ... additional modules
  };

  constructor() {
    super();
    this.logger = new Logger('AISwarmCoordinator');
    this.metrics = {
      totalAgents: 0,
      activeAgents: 0,
      idleAgents: 0,
      busyAgents: 0,
      averagePerformance: 0,
      coherenceScore: 0,
      tasksCompleted: 0,
      tasksInProgress: 0,
      errorRate: 0,
    };

    // ENHANCEMENT #1: Initialize workflow components
    this.workflowEngine = new WorkflowExecutionEngine(this);
    this.playbookRegistry = new IDEPlaybookRegistry();

    // ENHANCEMENT #2: Initialize communication system
    this.communicationHub = new AgentCommunicationHub(8080);
    this.setupCommunicationHandlers();
  }

  /**
   * Initialize the 1,008 agent swarm with hierarchical distribution
   */
  public async initializeSwarm(): Promise<boolean> {
    this.logger.info('🧬 Initializing 1,008 Agent Swarm System');
    this.logger.info('📊 Target Distribution:', this.AGENT_DISTRIBUTION);

    try {
      // Phase 1: Create agent hierarchy
      await this.createAgentHierarchy();

      // Phase 2: Distribute agents across modules
      await this.distributeAgentsToModules();

      // Phase 3: Establish inter-agent networks
      await this.establishAgentNetworks();

      // Phase 4: Initialize performance monitoring
      await this.initializeMonitoring();

      // Phase 5: Start evolutionary optimization
      this.startEvolutionaryOptimization();

      // ENHANCEMENT #1: Initialize workflow system
      await this.initializeWorkflowSystem();

      // ENHANCEMENT #2: Initialize communication system
      await this.initializeCommunicationSystem();

      this.logger.info('✅ AI Swarm Successfully Initialized');
      this.logger.info(`📈 Total Agents: ${this.agents.size}/1008`);
      this.logger.info(`🏗️ Module Coverage: ${this.modules.size}/33`);

      return true;
    } catch (error) {
      this.logger.error('❌ Failed to initialize AI swarm:', error);
      return false;
    }
  }

  /**
   * Create hierarchical agent structure with specialized capabilities
   */
  private async createAgentHierarchy(): Promise<void> {
    this.logger.info('🏗️ Creating agent hierarchy...');

    for (const [tier, count] of Object.entries(this.AGENT_DISTRIBUTION)) {
      this.logger.info(`Creating ${count} ${tier} agents...`);

      for (let i = 0; i < count; i++) {
        const agentId = `${tier}_${i.toString().padStart(3, '0')}`;
        const agent: AgentConfiguration = {
          id: agentId,
          tier: tier as AgentTier,
          module: '', // Will be assigned later
          capabilities: this.generateCapabilities(tier as AgentTier),
          specialization: this.generateSpecialization(tier as AgentTier),
          status: AgentStatus.Idle,
          performance: {
            tasksCompleted: 0,
            averageExecutionTime: 0,
            successRate: 1.0,
            errorCount: 0,
            lastBenchmark: new Date(),
          },
          networkConnections: [],
          lastActivity: new Date(),
        };

        this.agents.set(agentId, agent);
      }

      this.logger.info(`✅ Created ${count} ${tier} agents`);
    }

    this.logger.info(`🧬 Agent hierarchy complete: ${this.agents.size} agents`);
  }

  /**
   * Distribute agents across 33 modules based on module priority and requirements
   */
  private async distributeAgentsToModules(): Promise<void> {
    this.logger.info('📋 Distributing agents to 33 modules...');

    // Get sorted modules by priority
    const sortedModules = Object.entries(this.MODULE_PRIORITY).sort(([, a], [, b]) => b - a);

    // Distribute agents based on tier and module requirements
    const agentsByTier = this.groupAgentsByTier();

    for (const [moduleName, priority] of sortedModules) {
      const requiredAgents = this.calculateModuleAgentRequirement(moduleName, priority);
      const moduleAgents: string[] = [];

      // Allocate agents from each tier
      for (const [tier, agents] of Object.entries(agentsByTier)) {
        const tierAllocation = Math.ceil(requiredAgents[tier as AgentTier] || 0);
        const availableAgents = agents.filter(a => !a.module);

        for (let i = 0; i < Math.min(tierAllocation, availableAgents.length); i++) {
          const agent = availableAgents[i];
          agent.module = moduleName;
          moduleAgents.push(agent.id);
        }
      }

      this.modules.set(moduleName, moduleAgents);
      this.logger.info(`📦 ${moduleName}: ${moduleAgents.length} agents assigned`);
    }

    this.logger.info(`📋 Module distribution complete: ${this.modules.size} modules`);
  }

  /**
   * Establish network connections between agents for optimal communication
   */
  private async establishAgentNetworks(): Promise<void> {
    this.logger.info('🕸️ Establishing agent networks...');

    for (const agent of this.agents.values()) {
      // Connect to agents in same module
      const moduleAgents = this.modules.get(agent.module) || [];
      agent.networkConnections = moduleAgents
        .filter(id => id !== agent.id)
        .slice(0, this.getOptimalConnectionCount(agent.tier));

      // Add cross-tier connections for command agents
      if (agent.tier === AgentTier.CommandBrain) {
        const coordinators = Array.from(this.agents.values())
          .filter(a => a.tier === AgentTier.SwarmCoordinator)
          .map(a => a.id)
          .slice(0, 8);
        agent.networkConnections.push(...coordinators);
      }
    }

    this.logger.info('🕸️ Agent networks established');
  }

  /**
   * Initialize performance monitoring and metrics collection
   */
  private async initializeMonitoring(): Promise<void> {
    this.logger.info('📊 Initializing performance monitoring...');

    // Start metrics collection loop
    this.metricsLoop = setInterval(() => {
      this.updateSwarmMetrics();
    }, 5000); // Update every 5 seconds

    // Initial metrics calculation
    this.updateSwarmMetrics();

    this.logger.info('📊 Performance monitoring active');
  }

  /**
   * Start evolutionary optimization process
   */
  private startEvolutionaryOptimization(): void {
    this.logger.info('🧬 Starting evolutionary optimization...');

    this.evolutionLoop = setInterval(() => {
      this.performEvolutionCycle();
    }, 30000); // Evolution cycle every 30 seconds
  }

  /**
   * Perform evolutionary optimization cycle
   */
  private performEvolutionCycle(): void {
    // Identify top and bottom performers
    const agents = Array.from(this.agents.values());
    const topPerformers = agents
      .sort((a, b) => b.performance.successRate - a.performance.successRate)
      .slice(0, Math.floor(agents.length * 0.1)); // Top 10%

    const bottomPerformers = agents
      .sort((a, b) => a.performance.successRate - b.performance.successRate)
      .slice(0, Math.floor(agents.length * 0.05)); // Bottom 5%

    // Apply optimization strategies
    this.optimizeTopPerformers(topPerformers);
    this.rehabilitateBottomPerformers(bottomPerformers);

    // Update coherence score
    this.calculateSwarmCoherence();
  }

  /**
   * Allocate task to optimal agents based on capabilities and availability
   */
  public async allocateTask(task: Partial<TaskAllocation>): Promise<string[]> {
    const taskId = task.taskId || this.generateTaskId();
    const requiredCapabilities = task.requiredCapabilities || [];
    const priority = task.priority || TaskPriority.Normal;

    // Find optimal agents for task
    const candidateAgents = this.findOptimalAgents(requiredCapabilities, priority);

    if (candidateAgents.length === 0) {
      this.logger.warn(`⚠️ No suitable agents found for task ${taskId}`);
      return [];
    }

    // Assign agents to task
    const assignedAgents = candidateAgents.slice(
      0,
      task.estimatedDuration ? Math.ceil(task.estimatedDuration / 1000) : 1
    );

    // Update agent status
    assignedAgents.forEach(agentId => {
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.status = AgentStatus.Busy;
        agent.lastActivity = new Date();
      }
    });

    // Add to task queue
    this.taskQueue.push({
      taskId,
      requiredCapabilities,
      priority,
      estimatedDuration: task.estimatedDuration || 5000,
      assignedAgents,
      status: TaskStatus.InProgress,
    });

    this.logger.info(`✅ Task ${taskId} allocated to ${assignedAgents.length} agents`);
    return assignedAgents;
  }

  /**
   * Get current swarm metrics
   */
  public getSwarmMetrics(): SwarmMetrics {
    return { ...this.metrics };
  }

  /**
   * Get agent details by ID
   */
  public getAgent(agentId: string): AgentConfiguration | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get agents by module
   */
  public getModuleAgents(moduleName: string): AgentConfiguration[] {
    const agentIds = this.modules.get(moduleName) || [];
    return agentIds.map(id => this.agents.get(id)!).filter(Boolean);
  }

  /**
   * Shutdown swarm coordinator
   */
  public shutdown(): void {
    this.logger.info('🔄 Shutting down AI Swarm Coordinator...');

    if (this.evolutionLoop) {
      clearInterval(this.evolutionLoop);
    }

    if (this.metricsLoop) {
      clearInterval(this.metricsLoop);
    }

    this.logger.info('✅ AI Swarm Coordinator shutdown complete');
  }

  // Helper methods

  private generateCapabilities(tier: AgentTier): string[] {
    const baseCapabilities = {
      [AgentTier.CommandBrain]: [
        'strategic-planning',
        'decision-making',
        'resource-allocation',
        'system-optimization',
        'multi-module-coordination',
      ],
      [AgentTier.SwarmCoordinator]: [
        'task-coordination',
        'agent-management',
        'load-balancing',
        'performance-monitoring',
        'conflict-resolution',
      ],
      [AgentTier.AdvancedProcessor]: [
        'complex-analysis',
        'pattern-recognition',
        'data-processing',
        'algorithm-execution',
        'quality-assurance',
      ],
      [AgentTier.SpecialistWorker]: [
        'domain-expertise',
        'task-execution',
        'data-validation',
        'report-generation',
        'user-interaction',
      ],
      [AgentTier.MicroOptimizer]: [
        'fine-tuning',
        'performance-optimization',
        'error-correction',
        'detail-analysis',
        'efficiency-improvement',
      ],
    };

    return baseCapabilities[tier] || [];
  }

  private generateSpecialization(tier: AgentTier): string {
    const specializations = {
      [AgentTier.CommandBrain]: 'Strategic Intelligence',
      [AgentTier.SwarmCoordinator]: 'Coordination Excellence',
      [AgentTier.AdvancedProcessor]: 'Advanced Analytics',
      [AgentTier.SpecialistWorker]: 'Domain Mastery',
      [AgentTier.MicroOptimizer]: 'Precision Optimization',
    };

    return specializations[tier] || 'General Purpose';
  }

  private groupAgentsByTier(): Record<string, AgentConfiguration[]> {
    const grouped: Record<string, AgentConfiguration[]> = {};

    for (const agent of this.agents.values()) {
      if (!grouped[agent.tier]) {
        grouped[agent.tier] = [];
      }
      grouped[agent.tier].push(agent);
    }

    return grouped;
  }

  private calculateModuleAgentRequirement(
    moduleName: string,
    priority: number
  ): Record<AgentTier, number> {
    const baseAllocation = Math.floor(1008 / 33); // ~30 agents per module
    const priorityMultiplier = priority / 100;
    const totalForModule = Math.floor(baseAllocation * priorityMultiplier);

    return {
      [AgentTier.CommandBrain]: Math.max(1, Math.floor(totalForModule * 0.05)),
      [AgentTier.SwarmCoordinator]: Math.max(1, Math.floor(totalForModule * 0.1)),
      [AgentTier.AdvancedProcessor]: Math.floor(totalForModule * 0.2),
      [AgentTier.SpecialistWorker]: Math.floor(totalForModule * 0.45),
      [AgentTier.MicroOptimizer]: Math.floor(totalForModule * 0.2),
    };
  }

  private getOptimalConnectionCount(tier: AgentTier): number {
    const connectionCounts = {
      [AgentTier.CommandBrain]: 15,
      [AgentTier.SwarmCoordinator]: 10,
      [AgentTier.AdvancedProcessor]: 8,
      [AgentTier.SpecialistWorker]: 5,
      [AgentTier.MicroOptimizer]: 3,
    };

    return connectionCounts[tier] || 3;
  }

  private findOptimalAgents(capabilities: string[], priority: TaskPriority): string[] {
    const priorityWeights = {
      [TaskPriority.Critical]: 1.0,
      [TaskPriority.High]: 0.8,
      [TaskPriority.Normal]: 0.6,
      [TaskPriority.Low]: 0.4,
    };

    return Array.from(this.agents.values())
      .filter(
        agent =>
          agent.status === AgentStatus.Idle &&
          capabilities.some(cap => agent.capabilities.includes(cap))
      )
      .sort(
        (a, b) =>
          b.performance.successRate * priorityWeights[priority] -
          a.performance.successRate * priorityWeights[priority]
      )
      .map(agent => agent.id);
  }

  private updateSwarmMetrics(): void {
    const agents = Array.from(this.agents.values());

    this.metrics = {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status !== AgentStatus.Offline).length,
      idleAgents: agents.filter(a => a.status === AgentStatus.Idle).length,
      busyAgents: agents.filter(a => a.status === AgentStatus.Busy).length,
      averagePerformance:
        agents.reduce((sum, a) => sum + a.performance.successRate, 0) / agents.length,
      coherenceScore: this.calculateSwarmCoherence(),
      tasksCompleted: agents.reduce((sum, a) => sum + a.performance.tasksCompleted, 0),
      tasksInProgress: this.taskQueue.filter(t => t.status === TaskStatus.InProgress).length,
      errorRate:
        agents.reduce((sum, a) => sum + a.performance.errorCount, 0) /
        Math.max(
          1,
          agents.reduce((sum, a) => sum + a.performance.tasksCompleted, 0)
        ),
    };
  }

  private calculateSwarmCoherence(): number {
    const agents = Array.from(this.agents.values());
    const avgPerformance =
      agents.reduce((sum, a) => sum + a.performance.successRate, 0) / agents.length;
    const performanceVariance =
      agents.reduce((sum, a) => sum + Math.pow(a.performance.successRate - avgPerformance, 2), 0) /
      agents.length;

    // Higher coherence when performance is consistent across agents
    return Math.max(0, 1 - Math.sqrt(performanceVariance));
  }

  private optimizeTopPerformers(performers: AgentConfiguration[]): void {
    performers.forEach(agent => {
      // Reward top performers with capability expansion
      if (agent.capabilities.length < 8) {
        const newCapability = this.generateAdditionalCapability(agent.tier);
        if (newCapability && !agent.capabilities.includes(newCapability)) {
          agent.capabilities.push(newCapability);
        }
      }
    });
  }

  private rehabilitateBottomPerformers(performers: AgentConfiguration[]): void {
    performers.forEach(agent => {
      // Reset performance metrics and provide retraining
      agent.performance.successRate = Math.max(0.5, agent.performance.successRate * 1.1);
      agent.performance.errorCount = Math.floor(agent.performance.errorCount * 0.8);
    });
  }

  private generateAdditionalCapability(tier: AgentTier): string | null {
    const additionalCapabilities = {
      [AgentTier.CommandBrain]: ['crisis-management', 'predictive-analysis'],
      [AgentTier.SwarmCoordinator]: ['resource-optimization', 'workflow-design'],
      [AgentTier.AdvancedProcessor]: ['machine-learning', 'statistical-analysis'],
      [AgentTier.SpecialistWorker]: ['automation', 'integration-services'],
      [AgentTier.MicroOptimizer]: ['memory-optimization', 'cache-management'],
    };

    const options = additionalCapabilities[tier] || [];
    return options[Math.floor(Math.random() * options.length)] || null;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==========================================
  // ENHANCEMENT #1: WORKFLOW CODIFICATION ENGINE
  // ==========================================

  /**
   * Initialize the workflow system with IDE-specific playbooks
   */
  private async initializeWorkflowSystem(): Promise<void> {
    this.logger.info('🔧 Initializing Workflow Codification Engine...');

    try {
      // Load default IDE playbooks
      await this.playbookRegistry.loadDefaultPlaybooks();

      // Validate agent capabilities match workflow requirements
      await this.validateWorkflowCapabilities();

      this.logger.info('✅ Workflow system initialized successfully');
      this.logger.info(`📚 Available playbooks: ${this.playbookRegistry.getAvailablePlaybooks().length}`);

    } catch (error) {
      this.logger.error('❌ Failed to initialize workflow system:', error);
      throw error;
    }
  }

  /**
   * Execute a specific IDE workflow playbook
   */
  public async executeWorkflowPlaybook(
    playbookId: string,
    context: Partial<WorkflowContext> = {}
  ): Promise<WorkflowResult> {
    this.logger.info(`🚀 Executing workflow playbook: ${playbookId}`);

    try {
      // Get the playbook
      const playbook = this.playbookRegistry.getPlaybook(playbookId);
      if (!playbook) {
        throw new Error(`Playbook not found: ${playbookId}`);
      }

      // Create execution context
      const executionContext: WorkflowContext = {
        workflowId: `${playbookId}_${Date.now()}`,
        playbookId: playbookId,
        userId: 'ai-swarm-system',
        projectPath: context.parameters?.projectPath || '/current/project',
        environment: 'DEVELOPMENT' as any, // ExecutionEnvironment enum
        parameters: context.parameters || {},
        metadata: {
          startTime: new Date(),
          priority: 1, // WorkflowPriority.NORMAL
          tags: ['ai-swarm', 'ide', playbookId],
          requestSource: 'INTERNAL' as any // RequestSource enum
        },
        ...context
      };

      // Execute the workflow
      const result = await this.workflowEngine.executeWorkflow(playbook, executionContext);

      // Store the result
      this.activeWorkflows.set(executionContext.workflowId, result);

      this.logger.info(`✅ Workflow completed: ${playbookId} (${result.success ? 'SUCCESS' : 'FAILED'})`);

      return result;

    } catch (error) {
      this.logger.error(`❌ Workflow execution failed: ${playbookId}`, error);
      throw error;
    }
  }

  /**
   * Get available workflows by domain
   */
  public getWorkflowsByDomain(domain: IDEDomain): WorkflowPlaybook[] {
    return this.playbookRegistry.getPlaybooksByDomain(domain);
  }

  /**
   * Get all available workflow playbooks
   */
  public getAvailableWorkflows(): WorkflowPlaybook[] {
    return this.playbookRegistry.getAvailablePlaybooks();
  }

  /**
   * Get active workflow results
   */
  public getActiveWorkflows(): Map<string, WorkflowResult> {
    return new Map(this.activeWorkflows);
  }

  /**
   * Validate that current agent capabilities support workflow requirements
   */
  private async validateWorkflowCapabilities(): Promise<void> {
    const playbooks = this.playbookRegistry.getAvailablePlaybooks();
    const agentCapabilities = new Set<string>();

    // Collect all agent capabilities
    this.agents.forEach(agent => {
      agent.capabilities.forEach(cap => agentCapabilities.add(cap));
    });

    // Validate each playbook
    for (const playbook of playbooks) {
      const requiredCapabilities = playbook.requiredCapabilities || [];
      const missingCapabilities = requiredCapabilities.filter(
        cap => !agentCapabilities.has(cap)
      );

      if (missingCapabilities.length > 0) {
        this.logger.warn(
          `⚠️ Playbook ${playbook.id} missing capabilities: ${missingCapabilities.join(', ')}`
        );
      }
    }
  }

  /**
   * Get agents available for workflow execution
   */
  private getAvailableAgents(): AgentConfiguration[] {
    return Array.from(this.agents.values()).filter(
      agent => agent.status === AgentStatus.Active || agent.status === AgentStatus.Idle
    );
  }

  /**
   * Execute a quick development workflow (common IDE operations)
   */
  public async executeQuickWorkflow(operation: string, projectPath?: string): Promise<WorkflowResult> {
    const context: Partial<WorkflowContext> = {
      parameters: {
        projectPath: projectPath || '/current/project',
        operation
      }
    };

    // Map common operations to playbook IDs
    const operationMap: Record<string, string> = {
      'analyze': 'code_quality_analysis',
      'build': 'intelligent_build_v1',
      'test': 'comprehensive_test_v1',
      'review': 'automated_review_v1',
      'refactor': 'intelligent_refactor_v1',
      'document': 'documentation_generation_v1'
    };

    const playbookId = operationMap[operation];
    if (!playbookId) {
      throw new Error(`Unknown operation: ${operation}`);
    }

    return this.executeWorkflowPlaybook(playbookId, context);
  }

  // ==========================================
  // ENHANCEMENT #2: REAL-TIME COMMUNICATION
  // ==========================================

  /**
   * Setup communication event handlers
   */
  private setupCommunicationHandlers(): void {
    this.communicationHub.on('agent_connected', ({ agentId, agentNode }) => {
      this.logger.info(`🔗 Agent ${agentId} connected to communication hub`);
      this.handleAgentConnection(agentId, agentNode);
    });

    this.communicationHub.on('agent_disconnected', ({ agentId }) => {
      this.logger.warn(`🔌 Agent ${agentId} disconnected from communication hub`);
      this.handleAgentDisconnection(agentId);
    });

    this.communicationHub.on('task_result', ({ agentId, result }) => {
      this.logger.debug(`📊 Task result received from agent ${agentId}`);
      this.handleTaskResult(agentId, result);
    });

    this.communicationHub.on('connection_error', ({ agentId, error }) => {
      this.logger.error(`❌ Connection error for agent ${agentId}:`, error);
      this.handleConnectionError(agentId, error);
    });

    this.communicationHub.on('network_metrics_updated', (metrics) => {
      this.updateSwarmMetricsFromNetwork(metrics);
    });
  }

  /**
   * Connect agent to communication hub
   */
  private async connectAgentToCommunicationHub(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      this.logger.error(`Cannot connect unknown agent: ${agentId}`);
      return;
    }

    try {
      const agentClient = new AgentClient(agentId, agent.capabilities, 'ws://localhost:8080');

      // Setup agent-specific event handlers
      agentClient.on('connected', (data) => {
        this.logger.info(`✅ Agent ${agentId} connected to communication hub`);
        agent.status = AgentStatus.Active;
      });

      agentClient.on('disconnected', ({ code, reason }) => {
        this.logger.warn(`🔌 Agent ${agentId} disconnected: ${reason}`);
        agent.status = AgentStatus.Offline;
      });

      agentClient.on('task_assigned', ({ workflowId, stepId, task }) => {
        this.logger.debug(`📋 Task assigned to agent ${agentId}: ${stepId}`);
        // Handle task assignment in agent
      });

      agentClient.on('message', (message) => {
        this.logger.debug(`📨 Agent ${agentId} received message: ${message.type}`);
      });

      // Connect to hub
      await agentClient.connect();
      this.agentClients.set(agentId, agentClient);

      this.logger.info(`🌐 Agent ${agentId} successfully connected to communication hub`);

    } catch (error) {
      this.logger.error(`Failed to connect agent ${agentId} to communication hub:`, error);
    }
  }

  /**
   * Initialize communication for all agents
   */
  private async initializeCommunicationSystem(): Promise<void> {
    this.logger.info('🌐 Initializing agent communication system...');

    // Connect all agents to communication hub
    const connectionPromises = Array.from(this.agents.keys()).map(agentId =>
      this.connectAgentToCommunicationHub(agentId)
    );

    await Promise.all(connectionPromises);

    this.logger.info(`✅ Communication system initialized for ${this.agents.size} agents`);
  }

  /**
   * Handle agent connection to hub
   */
  private handleAgentConnection(agentId: string, agentNode: any): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = AgentStatus.Active;
      agent.networkConnections = agentNode.neighbors || [];
      agent.lastActivity = new Date();
    }

    this.emit('agent_connected', { agentId, agent });
  }

  /**
   * Handle agent disconnection from hub
   */
  private handleAgentDisconnection(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = AgentStatus.Offline;
      agent.lastActivity = new Date();
    }

    this.emit('agent_disconnected', { agentId, agent });
  }

  /**
   * Handle task result from agent
   */
  private handleTaskResult(agentId: string, result: any): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.performance.tasksCompleted++;
      agent.performance.successRate = result.success ?
        (agent.performance.successRate * 0.9 + 0.1) :
        (agent.performance.successRate * 0.9);
      agent.lastActivity = new Date();
    }

    // Forward to workflow engine
    this.emit('task_result', { agentId, result });
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(agentId: string, error: Error): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = AgentStatus.Error;
      agent.performance.errorCount++;
    }

    this.emit('connection_error', { agentId, error });
  }

  /**
   * Update swarm metrics from network metrics
   */
  private updateSwarmMetricsFromNetwork(networkMetrics: any): void {
    this.metrics.activeAgents = networkMetrics.totalAgents;
    this.metrics.coherenceScore = networkMetrics.networkHealth / 100;

    // Update individual agent metrics
    this.agents.forEach(agent => {
      if (agent.status === AgentStatus.Active) {
        agent.lastActivity = new Date();
      }
    });

    this.emit('network_metrics_updated', networkMetrics);
  }

  /**
   * Broadcast message to all agents
   */
  public broadcastToAllAgents(messageType: string, payload: any, priority: string = 'NORMAL'): void {
    this.communicationHub.sendMessage({
      type: messageType as any,
      recipient: 'broadcast',
      payload,
      priority: priority as any
    });
  }

  /**
   * Send message to specific agent tier
   */
  public sendMessageToTier(tier: string, messageType: string, payload: any): void {
    this.communicationHub.sendMessage({
      type: messageType as any,
      recipient: 'tier',
      payload: {
        ...payload,
        targetTier: tier
      }
    });
  }

  /**
   * Send direct message to agent
   */
  public sendDirectMessage(agentId: string, messageType: string, payload: any): void {
    this.communicationHub.sendMessage({
      type: messageType as any,
      recipient: agentId,
      payload
    });
  }

  /**
   * Get communication hub metrics
   */
  public getCommunicationMetrics(): any {
    return this.communicationHub.getMetrics();
  }

  /**
   * Get network topology
   */
  public getNetworkTopology(): any {
    return this.communicationHub.getTopology();
  }

  /**
   * Get connected agents
   */
  public getConnectedAgents(): string[] {
    return Array.from(this.agentClients.keys());
  }
}

// Export singleton instance
export const swarmCoordinator = new AISwarmCoordinator();
