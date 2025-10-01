"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.bsArmyAgentManager = exports.BSArmyAgentManager = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
class BSArmyAgentManager extends events_1.EventEmitter {
    agents = new Map();
    taskQueue = new Map();
    config;
    isInitialized = false;
    healthCheckTimer;
    taskProcessingTimer;
    constructor(config) {
        super();
        this.config = {
            maxAgents: 50,
            autoScale: true,
            loadBalancing: 'least_busy',
            healthCheckInterval: 30000, // 30 seconds
            taskTimeout: 300000, // 5 minutes
            retryPolicy: {
                maxRetries: 3,
                backoffMultiplier: 2,
                maxBackoffTime: 60000, // 1 minute
            },
            ...config,
        };
        this.initializeManager();
    }
    /**
     * Initialize the BS Army Agent Manager
     */
    async initialize() {
        if (this.isInitialized)
            return;
        console.log('🤖 BS Army Agent Manager initializing...');
        // Deploy core BS agents
        await this.deployCoreAgents();
        // Start health monitoring
        this.startHealthMonitoring();
        // Start task processing
        this.startTaskProcessing();
        // Initialize performance tracking
        this.initializePerformanceTracking();
        this.isInitialized = true;
        console.log('✅ BS Army Agent Manager ready with specialized agents');
        this.emit('initialized');
    }
    /**
     * Initialize manager components
     */
    initializeManager() {
        // Set up event handlers
        this.on('agent-error', this.handleAgentError.bind(this));
        this.on('task-completed', this.handleTaskCompleted.bind(this));
        this.on('agent-offline', this.handleAgentOffline.bind(this));
    }
    /**
     * Deploy core BS agents
     */
    async deployCoreAgents() {
        console.log('   🚀 Deploying BS Army core agents...');
        // BCBS Bootstrap Commander
        await this.deployAgent({
            name: 'BCBS Bootstrap Commander',
            type: 'bootstrap_commander',
            priority: 'critical',
            capabilities: [
                'system_initialization',
                'dependency_verification',
                'configuration_management',
                'environment_setup',
                'health_checks',
            ],
        });
        // BCBS Cascade Operator
        await this.deployAgent({
            name: 'BCBS Cascade Operator',
            type: 'cascade_operator',
            priority: 'high',
            capabilities: [
                'data_flow_management',
                'transformation_pipelines',
                'batch_processing',
                'stream_processing',
                'error_recovery',
            ],
        });
        // BCBS TDD Validator
        await this.deployAgent({
            name: 'BCBS TDD Validator',
            type: 'tdd_validator',
            priority: 'high',
            capabilities: [
                'test_driven_development',
                'code_quality_assurance',
                'automated_testing',
                'test_coverage_analysis',
                'regression_testing',
            ],
        });
        // Additional specialized agents
        await this.deploySpecializedAgents();
        console.log(`   ✅ ${this.agents.size} BS Army agents deployed and operational`);
    }
    /**
     * Deploy specialized agents for various tasks
     */
    async deploySpecializedAgents() {
        const specializedAgents = [
            {
                name: 'Revenue Hunter Alpha',
                type: 'revenue_hunter',
                priority: 'high',
                capabilities: [
                    'revenue_discovery',
                    'opportunity_analysis',
                    'tax_compliance_monitoring',
                    'business_license_tracking',
                    'str_violation_detection',
                ],
            },
            {
                name: 'Revenue Hunter Beta',
                type: 'revenue_hunter',
                priority: 'high',
                capabilities: [
                    'property_assessment_analysis',
                    'market_value_comparison',
                    'assessment_appeal_monitoring',
                    'exemption_validation',
                    'ownership_verification',
                ],
            },
            {
                name: 'Compliance Monitor Alpha',
                type: 'compliance_monitor',
                priority: 'medium',
                capabilities: [
                    'regulation_compliance',
                    'audit_trail_maintenance',
                    'documentation_verification',
                    'policy_enforcement',
                    'violation_reporting',
                ],
            },
            {
                name: 'Data Quality Guardian',
                type: 'cascade_operator',
                priority: 'medium',
                capabilities: [
                    'data_validation',
                    'quality_metrics',
                    'anomaly_detection',
                    'data_cleansing',
                    'integrity_checks',
                ],
            },
            {
                name: 'Performance Optimizer',
                type: 'bootstrap_commander',
                priority: 'low',
                capabilities: [
                    'system_optimization',
                    'resource_management',
                    'performance_tuning',
                    'bottleneck_identification',
                    'capacity_planning',
                ],
            },
        ];
        for (const agentConfig of specializedAgents) {
            await this.deployAgent(agentConfig);
        }
    }
    /**
     * Deploy a new agent
     */
    async deployAgent(config) {
        const agent = {
            id: (0, uuid_1.v4)(),
            name: config.name,
            type: config.type,
            status: 'idle',
            priority: config.priority,
            capabilities: config.capabilities,
            performance: {
                tasksCompleted: 0,
                successRate: 1.0,
                averageTaskTime: 0,
                errors: 0,
                warnings: 0,
            },
            resources: {
                cpuUsage: Math.random() * 20, // Start with low resource usage
                memoryUsage: 50 + Math.random() * 30,
                networkUsage: Math.random() * 10,
            },
            createdAt: new Date(),
            lastPingAt: new Date(),
        };
        this.agents.set(agent.id, agent);
        // Simulate agent initialization
        await this.initializeAgent(agent);
        console.log(`     🤖 Agent deployed: ${agent.name} (${agent.id.substr(0, 8)})`);
        this.emit('agent-deployed', agent);
        return agent.id;
    }
    /**
     * Initialize individual agent
     */
    async initializeAgent(agent) {
        // Simulate agent startup time
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        agent.status = 'idle';
        agent.lastPingAt = new Date();
        // Start agent-specific initialization based on type
        switch (agent.type) {
            case 'bootstrap_commander':
                await this.initializeBootstrapCommander(agent);
                break;
            case 'cascade_operator':
                await this.initializeCascadeOperator(agent);
                break;
            case 'tdd_validator':
                await this.initializeTDDValidator(agent);
                break;
            case 'revenue_hunter':
                await this.initializeRevenueHunter(agent);
                break;
            case 'compliance_monitor':
                await this.initializeComplianceMonitor(agent);
                break;
        }
    }
    /**
     * Initialize Bootstrap Commander
     */
    async initializeBootstrapCommander(agent) {
        // Bootstrap commanders handle system initialization and health checks
        await this.assignTask(agent.id, {
            type: 'system_health_check',
            description: 'Perform initial system health verification',
            parameters: {
                checkComponents: ['database', 'apis', 'file_systems', 'network'],
                thoroughCheck: true,
            },
            priority: 'high',
        });
    }
    /**
     * Initialize Cascade Operator
     */
    async initializeCascadeOperator(agent) {
        // Cascade operators handle data flow and transformation
        await this.assignTask(agent.id, {
            type: 'data_pipeline_check',
            description: 'Verify data pipeline integrity and performance',
            parameters: {
                pipelines: ['etl_pipeline', 'real_time_stream', 'batch_processing'],
                performanceBaseline: true,
            },
            priority: 'medium',
        });
    }
    /**
     * Initialize TDD Validator
     */
    async initializeTDDValidator(agent) {
        // TDD validators ensure code quality and testing
        await this.assignTask(agent.id, {
            type: 'test_suite_validation',
            description: 'Run comprehensive test suite validation',
            parameters: {
                testSuites: ['unit_tests', 'integration_tests', 'regression_tests'],
                coverageTarget: 0.8,
            },
            priority: 'medium',
        });
    }
    /**
     * Initialize Revenue Hunter
     */
    async initializeRevenueHunter(agent) {
        // Revenue hunters focus on revenue discovery and optimization
        await this.assignTask(agent.id, {
            type: 'revenue_scan',
            description: 'Perform initial revenue opportunity scan',
            parameters: {
                scope: 'benton_county',
                sources: ['property_records', 'business_licenses', 'permits'],
                analysisDepth: 'preliminary',
            },
            priority: 'high',
        });
    }
    /**
     * Initialize Compliance Monitor
     */
    async initializeComplianceMonitor(agent) {
        // Compliance monitors ensure regulatory adherence
        await this.assignTask(agent.id, {
            type: 'compliance_audit',
            description: 'Perform compliance audit and verification',
            parameters: {
                regulations: ['FISMA', 'local_ordinances', 'state_requirements'],
                auditLevel: 'standard',
            },
            priority: 'medium',
        });
    }
    /**
     * Assign task to specific agent
     */
    async assignTask(agentId, taskConfig) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${agentId}`);
        }
        const task = {
            id: (0, uuid_1.v4)(),
            agentId,
            type: taskConfig.type,
            description: taskConfig.description,
            parameters: taskConfig.parameters,
            status: 'pending',
            priority: taskConfig.priority,
            createdAt: new Date(),
            retryCount: 0,
            maxRetries: this.config.retryPolicy.maxRetries,
        };
        this.taskQueue.set(task.id, task);
        this.emit('task-queued', task);
        return task.id;
    }
    /**
     * Create and assign task using load balancing
     */
    async createTask(taskConfig) {
        // Find suitable agent using load balancing
        const suitableAgent = this.findSuitableAgent(taskConfig.requiredCapabilities);
        if (!suitableAgent) {
            throw new Error('No suitable agent available for task');
        }
        return this.assignTask(suitableAgent.id, taskConfig);
    }
    /**
     * Find suitable agent based on capabilities and load
     */
    findSuitableAgent(requiredCapabilities) {
        const availableAgents = Array.from(this.agents.values()).filter(agent => {
            // Check if agent is available
            if (agent.status === 'offline' || agent.status === 'error') {
                return false;
            }
            // Check capabilities if specified
            if (requiredCapabilities && requiredCapabilities.length > 0) {
                const hasRequiredCapabilities = requiredCapabilities.every(cap => agent.capabilities.includes(cap));
                if (!hasRequiredCapabilities) {
                    return false;
                }
            }
            return true;
        });
        if (availableAgents.length === 0) {
            return null;
        }
        // Apply load balancing strategy
        switch (this.config.loadBalancing) {
            case 'round_robin':
                return availableAgents[0]; // Simplified round-robin
            case 'least_busy':
                return availableAgents.reduce((leastBusy, current) => {
                    const currentLoad = this.calculateAgentLoad(current);
                    const leastBusyLoad = this.calculateAgentLoad(leastBusy);
                    return currentLoad < leastBusyLoad ? current : leastBusy;
                });
            case 'priority_based':
                return availableAgents.sort((a, b) => {
                    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                })[0];
            default:
                return availableAgents[0];
        }
    }
    /**
     * Calculate agent load score
     */
    calculateAgentLoad(agent) {
        // Simple load calculation based on current status and resource usage
        let load = 0;
        switch (agent.status) {
            case 'idle':
                load += 0;
                break;
            case 'active':
                load += 50;
                break;
            case 'busy':
                load += 100;
                break;
            default:
                load += 200; // Error or offline
        }
        load += agent.resources.cpuUsage;
        load += agent.resources.memoryUsage * 0.5;
        return load;
    }
    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        this.healthCheckTimer = setInterval(() => {
            this.performHealthChecks();
        }, this.config.healthCheckInterval);
        console.log('   💓 Agent health monitoring started');
    }
    /**
     * Perform health checks on all agents
     */
    performHealthChecks() {
        for (const [agentId, agent] of this.agents) {
            this.checkAgentHealth(agent);
        }
        this.emit('health-check-completed', {
            timestamp: new Date(),
            totalAgents: this.agents.size,
            healthyAgents: Array.from(this.agents.values()).filter(a => a.status !== 'error' && a.status !== 'offline').length,
        });
    }
    /**
     * Check individual agent health
     */
    checkAgentHealth(agent) {
        const now = new Date();
        const timeSinceLastPing = now.getTime() - agent.lastPingAt.getTime();
        // Update agent ping
        agent.lastPingAt = now;
        // Simulate resource usage updates
        agent.resources.cpuUsage = Math.max(0, Math.min(100, agent.resources.cpuUsage + (Math.random() - 0.5) * 10));
        agent.resources.memoryUsage = Math.max(0, Math.min(100, agent.resources.memoryUsage + (Math.random() - 0.5) * 5));
        agent.resources.networkUsage = Math.max(0, Math.min(100, agent.resources.networkUsage + (Math.random() - 0.5) * 15));
        // Check for health issues
        if (timeSinceLastPing > this.config.healthCheckInterval * 2) {
            if (agent.status !== 'offline') {
                agent.status = 'offline';
                this.emit('agent-offline', agent);
            }
        }
        else if (agent.resources.cpuUsage > 90 || agent.resources.memoryUsage > 95) {
            if (agent.status !== 'error') {
                agent.status = 'error';
                this.emit('agent-error', agent);
            }
        }
        else if (agent.status === 'offline' || agent.status === 'error') {
            // Recovery
            agent.status = 'idle';
            this.emit('agent-recovered', agent);
        }
    }
    /**
     * Start task processing
     */
    startTaskProcessing() {
        this.taskProcessingTimer = setInterval(() => {
            this.processTasks();
        }, 5000); // Process tasks every 5 seconds
        console.log('   ⚙️ Task processing started');
    }
    /**
     * Process queued tasks
     */
    processTasks() {
        const pendingTasks = Array.from(this.taskQueue.values())
            .filter(task => task.status === 'pending')
            .sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        for (const task of pendingTasks) {
            const agent = this.agents.get(task.agentId);
            if (agent && (agent.status === 'idle' || agent.status === 'active')) {
                this.executeTask(task, agent);
            }
        }
    }
    /**
     * Execute task on agent
     */
    async executeTask(task, agent) {
        task.status = 'assigned';
        task.startedAt = new Date();
        agent.status = 'busy';
        agent.currentTask = task.description;
        console.log(`   🎯 Agent ${agent.name} executing: ${task.description}`);
        try {
            // Simulate task execution
            const executionTime = this.calculateTaskExecutionTime(task, agent);
            await new Promise(resolve => setTimeout(resolve, executionTime));
            // Simulate task result
            const result = await this.simulateTaskExecution(task, agent);
            task.status = 'completed';
            task.completedAt = new Date();
            task.result = result;
            // Update agent performance
            agent.performance.tasksCompleted++;
            agent.performance.lastTaskTime = new Date();
            agent.performance.averageTaskTime = this.updateAverageTaskTime(agent.performance.averageTaskTime, executionTime, agent.performance.tasksCompleted);
            agent.status = 'idle';
            agent.currentTask = undefined;
            console.log(`   ✅ Task completed by ${agent.name}: ${task.description}`);
            this.emit('task-completed', { task, agent });
        }
        catch (error) {
            task.status = 'failed';
            task.error = String(error);
            task.retryCount++;
            agent.performance.errors++;
            agent.status = 'idle';
            agent.currentTask = undefined;
            console.error(`   ❌ Task failed: ${task.description}`, error);
            // Retry logic
            if (task.retryCount < task.maxRetries) {
                task.status = 'pending';
                console.log(`   🔄 Retrying task (attempt ${task.retryCount + 1}/${task.maxRetries})`);
            }
            else {
                this.emit('task-failed', { task, agent, error });
            }
        }
    }
    /**
     * Calculate task execution time based on task complexity and agent capabilities
     */
    calculateTaskExecutionTime(task, agent) {
        let baseTime = 2000; // 2 seconds base
        // Adjust based on task priority
        switch (task.priority) {
            case 'critical':
                baseTime *= 0.5;
                break;
            case 'high':
                baseTime *= 0.8;
                break;
            case 'low':
                baseTime *= 1.5;
                break;
        }
        // Adjust based on agent type specialization
        const isSpecialized = this.isAgentSpecializedForTask(agent, task);
        if (isSpecialized) {
            baseTime *= 0.7; // Specialized agents work faster
        }
        else {
            baseTime *= 1.3; // Non-specialized agents work slower
        }
        // Add random variation
        baseTime *= 0.8 + Math.random() * 0.4;
        return Math.round(baseTime);
    }
    /**
     * Check if agent is specialized for task
     */
    isAgentSpecializedForTask(agent, task) {
        const taskTypeCapabilityMap = {
            system_health_check: ['system_initialization', 'health_checks'],
            data_pipeline_check: ['data_flow_management', 'batch_processing'],
            test_suite_validation: ['test_driven_development', 'automated_testing'],
            revenue_scan: ['revenue_discovery', 'opportunity_analysis'],
            compliance_audit: ['regulation_compliance', 'audit_trail_maintenance'],
        };
        const requiredCapabilities = taskTypeCapabilityMap[task.type] || [];
        return requiredCapabilities.some(cap => agent.capabilities.includes(cap));
    }
    /**
     * Simulate task execution and generate results
     */
    async simulateTaskExecution(task, agent) {
        switch (task.type) {
            case 'system_health_check':
                return this.simulateSystemHealthCheck(task, agent);
            case 'data_pipeline_check':
                return this.simulateDataPipelineCheck(task, agent);
            case 'test_suite_validation':
                return this.simulateTestSuiteValidation(task, agent);
            case 'revenue_scan':
                return this.simulateRevenueScan(task, agent);
            case 'compliance_audit':
                return this.simulateComplianceAudit(task, agent);
            default:
                return { status: 'completed', message: 'Task executed successfully' };
        }
    }
    /**
     * Simulate system health check results
     */
    simulateSystemHealthCheck(task, agent) {
        return {
            status: 'healthy',
            components: {
                database: { status: 'operational', responseTime: '12ms' },
                apis: { status: 'operational', responseTime: '45ms' },
                file_systems: { status: 'operational', diskUsage: '67%' },
                network: { status: 'operational', latency: '8ms' },
            },
            overallScore: 96,
            recommendations: ['Monitor disk usage trends', 'Consider API response optimization'],
        };
    }
    /**
     * Simulate data pipeline check results
     */
    simulateDataPipelineCheck(task, agent) {
        return {
            status: 'optimal',
            pipelines: {
                etl_pipeline: { status: 'running', throughput: '1,250 records/min' },
                real_time_stream: { status: 'running', latency: '125ms' },
                batch_processing: { status: 'scheduled', nextRun: '02:00 AM' },
            },
            performance: {
                dataQuality: 98.5,
                processingEfficiency: 94.2,
                errorRate: 0.02,
            },
        };
    }
    /**
     * Simulate test suite validation results
     */
    simulateTestSuiteValidation(task, agent) {
        return {
            status: 'passed',
            testSuites: {
                unit_tests: { passed: 847, failed: 3, coverage: 92.3 },
                integration_tests: { passed: 156, failed: 1, coverage: 87.1 },
                regression_tests: { passed: 234, failed: 0, coverage: 89.5 },
            },
            overallCoverage: 91.2,
            recommendations: [
                'Increase integration test coverage',
                'Fix failing unit tests in PropertyValuation module',
            ],
        };
    }
    /**
     * Simulate revenue scan results
     */
    simulateRevenueScan(task, agent) {
        return {
            status: 'opportunities_found',
            opportunities: {
                str_violations: { count: 23, estimatedRevenue: 127500 },
                business_license_gaps: { count: 15, estimatedRevenue: 45000 },
                permit_violations: { count: 8, estimatedRevenue: 32000 },
            },
            totalEstimatedRevenue: 204500,
            priorityOpportunities: [
                'STR violation at 123 Main St - $8,500 potential',
                'Unlicensed business at 456 Oak Ave - $2,100 potential',
            ],
        };
    }
    /**
     * Simulate compliance audit results
     */
    simulateComplianceAudit(task, agent) {
        return {
            status: 'compliant',
            regulations: {
                FISMA: { status: 'compliant', score: 94 },
                local_ordinances: { status: 'compliant', score: 98 },
                state_requirements: { status: 'compliant', score: 96 },
            },
            overallCompliance: 96,
            findings: [
                'All required audit logs are properly maintained',
                'Access controls meet security standards',
            ],
            recommendations: [
                'Update security documentation quarterly',
                'Schedule annual third-party security assessment',
            ],
        };
    }
    /**
     * Update average task time
     */
    updateAverageTaskTime(currentAverage, newTime, taskCount) {
        return (currentAverage * (taskCount - 1) + newTime) / taskCount;
    }
    /**
     * Initialize performance tracking
     */
    initializePerformanceTracking() {
        // Collect performance metrics every minute
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 60000);
        console.log('   📊 Performance tracking initialized');
    }
    /**
     * Collect performance metrics
     */
    collectPerformanceMetrics() {
        const metrics = {
            timestamp: new Date(),
            totalAgents: this.agents.size,
            activeAgents: Array.from(this.agents.values()).filter(a => a.status === 'active' || a.status === 'busy').length,
            idleAgents: Array.from(this.agents.values()).filter(a => a.status === 'idle').length,
            errorAgents: Array.from(this.agents.values()).filter(a => a.status === 'error').length,
            offlineAgents: Array.from(this.agents.values()).filter(a => a.status === 'offline').length,
            totalTasks: this.taskQueue.size,
            pendingTasks: Array.from(this.taskQueue.values()).filter(t => t.status === 'pending').length,
            runningTasks: Array.from(this.taskQueue.values()).filter(t => t.status === 'assigned' || t.status === 'running').length,
            completedTasks: Array.from(this.taskQueue.values()).filter(t => t.status === 'completed')
                .length,
            failedTasks: Array.from(this.taskQueue.values()).filter(t => t.status === 'failed').length,
            avgCpuUsage: this.calculateAverageResourceUsage('cpuUsage'),
            avgMemoryUsage: this.calculateAverageResourceUsage('memoryUsage'),
            avgNetworkUsage: this.calculateAverageResourceUsage('networkUsage'),
        };
        this.emit('metrics-collected', metrics);
    }
    /**
     * Calculate average resource usage
     */
    calculateAverageResourceUsage(resourceType) {
        const agents = Array.from(this.agents.values()).filter(a => a.status !== 'offline');
        if (agents.length === 0)
            return 0;
        const total = agents.reduce((sum, agent) => sum + agent.resources[resourceType], 0);
        return Math.round(total / agents.length);
    }
    /**
     * Handle agent error
     */
    handleAgentError(agent) {
        console.warn(`⚠️ Agent error detected: ${agent.name} (${agent.id.substr(0, 8)})`);
        // Attempt recovery
        setTimeout(() => {
            if (agent.status === 'error') {
                this.attemptAgentRecovery(agent);
            }
        }, 30000); // Wait 30 seconds before recovery attempt
    }
    /**
     * Handle task completion
     */
    handleTaskCompleted(data) {
        // Update success rate
        const agent = data.agent;
        const totalTasks = agent.performance.tasksCompleted;
        const successfulTasks = totalTasks - agent.performance.errors;
        agent.performance.successRate = successfulTasks / totalTasks;
    }
    /**
     * Handle agent going offline
     */
    handleAgentOffline(agent) {
        console.warn(`📴 Agent offline: ${agent.name} (${agent.id.substr(0, 8)})`);
        // Reassign pending tasks to other agents
        this.reassignAgentTasks(agent.id);
    }
    /**
     * Attempt agent recovery
     */
    async attemptAgentRecovery(agent) {
        console.log(`🔄 Attempting recovery for agent: ${agent.name}`);
        try {
            // Simulate recovery process
            await new Promise(resolve => setTimeout(resolve, 2000));
            agent.status = 'idle';
            agent.lastPingAt = new Date();
            console.log(`✅ Agent recovered: ${agent.name}`);
            this.emit('agent-recovered', agent);
        }
        catch (error) {
            console.error(`❌ Agent recovery failed: ${agent.name}`, error);
        }
    }
    /**
     * Reassign tasks from failed agent to other agents
     */
    reassignAgentTasks(agentId) {
        const tasksToReassign = Array.from(this.taskQueue.values()).filter(task => task.agentId === agentId && task.status === 'pending');
        for (const task of tasksToReassign) {
            const newAgent = this.findSuitableAgent();
            if (newAgent) {
                task.agentId = newAgent.id;
                console.log(`🔄 Task reassigned from offline agent to ${newAgent.name}`);
            }
        }
    }
    /**
     * Get BS Army status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            totalAgents: this.agents.size,
            activeJobs: this.taskQueue.size,
            config: this.config,
            healthyAgents: Array.from(this.agents.values()).filter(a => a.status !== 'error' && a.status !== 'offline').length,
        };
    }
    /**
     * Get all agents
     */
    getAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * Get all tasks
     */
    getTasks() {
        return Array.from(this.taskQueue.values());
    }
    /**
     * Get tasks for specific agent
     */
    getAgentTasks(agentId) {
        return Array.from(this.taskQueue.values()).filter(task => task.agentId === agentId);
    }
    /**
     * Shutdown BS Army
     */
    async shutdown() {
        console.log('🔌 Shutting down BS Army Agent Manager...');
        // Stop timers
        if (this.healthCheckTimer)
            clearInterval(this.healthCheckTimer);
        if (this.taskProcessingTimer)
            clearInterval(this.taskProcessingTimer);
        // Mark all agents as offline
        for (const agent of this.agents.values()) {
            agent.status = 'offline';
        }
        this.isInitialized = false;
        console.log('✅ BS Army shutdown complete');
    }
}
exports.BSArmyAgentManager = BSArmyAgentManager;
// Export singleton instance
exports.bsArmyAgentManager = new BSArmyAgentManager();
//# sourceMappingURL=BSArmyAgentManager.js.map