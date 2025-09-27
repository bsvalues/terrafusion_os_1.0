/**
 * BS Army Agent Manager
 * Integrated BCBSDataEngine BS Army agent capabilities for Terrafusion OS
 *
 * Features:
 * - BCBS Bootstrap Commander
 * - BCBS Cascade Operator
 * - BCBS TDD Validator
 * - Real-time agent monitoring
 * - Performance metrics tracking
 * - Autonomous agent coordination
 */
import { EventEmitter } from 'events';
export interface BSAgent {
    id: string;
    name: string;
    type: 'bootstrap_commander' | 'cascade_operator' | 'tdd_validator' | 'revenue_hunter' | 'compliance_monitor';
    status: 'idle' | 'active' | 'busy' | 'error' | 'offline';
    priority: 'low' | 'medium' | 'high' | 'critical';
    capabilities: string[];
    currentTask?: string;
    performance: {
        tasksCompleted: number;
        successRate: number;
        averageTaskTime: number;
        lastTaskTime?: Date;
        errors: number;
        warnings: number;
    };
    resources: {
        cpuUsage: number;
        memoryUsage: number;
        networkUsage: number;
    };
    createdAt: Date;
    lastPingAt: Date;
}
export interface AgentTask {
    id: string;
    agentId: string;
    type: string;
    description: string;
    parameters: Record<string, any>;
    status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
    retryCount: number;
    maxRetries: number;
}
export interface AgentSwarmConfig {
    maxAgents: number;
    autoScale: boolean;
    loadBalancing: 'round_robin' | 'least_busy' | 'priority_based';
    healthCheckInterval: number;
    taskTimeout: number;
    retryPolicy: {
        maxRetries: number;
        backoffMultiplier: number;
        maxBackoffTime: number;
    };
}
export declare class BSArmyAgentManager extends EventEmitter {
    private agents;
    private taskQueue;
    private config;
    private isInitialized;
    private healthCheckTimer?;
    private taskProcessingTimer?;
    constructor(config?: Partial<AgentSwarmConfig>);
    /**
     * Initialize the BS Army Agent Manager
     */
    initialize(): Promise<void>;
    /**
     * Initialize manager components
     */
    private initializeManager;
    /**
     * Deploy core BS agents
     */
    private deployCoreAgents;
    /**
     * Deploy specialized agents for various tasks
     */
    private deploySpecializedAgents;
    /**
     * Deploy a new agent
     */
    private deployAgent;
    /**
     * Initialize individual agent
     */
    private initializeAgent;
    /**
     * Initialize Bootstrap Commander
     */
    private initializeBootstrapCommander;
    /**
     * Initialize Cascade Operator
     */
    private initializeCascadeOperator;
    /**
     * Initialize TDD Validator
     */
    private initializeTDDValidator;
    /**
     * Initialize Revenue Hunter
     */
    private initializeRevenueHunter;
    /**
     * Initialize Compliance Monitor
     */
    private initializeComplianceMonitor;
    /**
     * Assign task to specific agent
     */
    assignTask(agentId: string, taskConfig: {
        type: string;
        description: string;
        parameters: Record<string, any>;
        priority: AgentTask['priority'];
    }): Promise<string>;
    /**
     * Create and assign task using load balancing
     */
    createTask(taskConfig: {
        type: string;
        description: string;
        parameters: Record<string, any>;
        priority: AgentTask['priority'];
        requiredCapabilities?: string[];
    }): Promise<string>;
    /**
     * Find suitable agent based on capabilities and load
     */
    private findSuitableAgent;
    /**
     * Calculate agent load score
     */
    private calculateAgentLoad;
    /**
     * Start health monitoring
     */
    private startHealthMonitoring;
    /**
     * Perform health checks on all agents
     */
    private performHealthChecks;
    /**
     * Check individual agent health
     */
    private checkAgentHealth;
    /**
     * Start task processing
     */
    private startTaskProcessing;
    /**
     * Process queued tasks
     */
    private processTasks;
    /**
     * Execute task on agent
     */
    private executeTask;
    /**
     * Calculate task execution time based on task complexity and agent capabilities
     */
    private calculateTaskExecutionTime;
    /**
     * Check if agent is specialized for task
     */
    private isAgentSpecializedForTask;
    /**
     * Simulate task execution and generate results
     */
    private simulateTaskExecution;
    /**
     * Simulate system health check results
     */
    private simulateSystemHealthCheck;
    /**
     * Simulate data pipeline check results
     */
    private simulateDataPipelineCheck;
    /**
     * Simulate test suite validation results
     */
    private simulateTestSuiteValidation;
    /**
     * Simulate revenue scan results
     */
    private simulateRevenueScan;
    /**
     * Simulate compliance audit results
     */
    private simulateComplianceAudit;
    /**
     * Update average task time
     */
    private updateAverageTaskTime;
    /**
     * Initialize performance tracking
     */
    private initializePerformanceTracking;
    /**
     * Collect performance metrics
     */
    private collectPerformanceMetrics;
    /**
     * Calculate average resource usage
     */
    private calculateAverageResourceUsage;
    /**
     * Handle agent error
     */
    private handleAgentError;
    /**
     * Handle task completion
     */
    private handleTaskCompleted;
    /**
     * Handle agent going offline
     */
    private handleAgentOffline;
    /**
     * Attempt agent recovery
     */
    private attemptAgentRecovery;
    /**
     * Reassign tasks from failed agent to other agents
     */
    private reassignAgentTasks;
    /**
     * Get BS Army status
     */
    getStatus(): {
        initialized: boolean;
        totalAgents: number;
        activeJobs: number;
        config: AgentSwarmConfig;
        healthyAgents: number;
    };
    /**
     * Get all agents
     */
    getAgents(): BSAgent[];
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): BSAgent | undefined;
    /**
     * Get all tasks
     */
    getTasks(): AgentTask[];
    /**
     * Get tasks for specific agent
     */
    getAgentTasks(agentId: string): AgentTask[];
    /**
     * Shutdown BS Army
     */
    shutdown(): Promise<void>;
}
export declare const bsArmyAgentManager: BSArmyAgentManager;
//# sourceMappingURL=BSArmyAgentManager.d.ts.map