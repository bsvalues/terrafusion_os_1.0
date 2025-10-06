"use strict";
/**
 * Terrafusion OS 1.0 - AI Agent Training System Demo
 *
 * Demonstration of the Advanced AI Agent Training System
 * Shows how to train, deploy, and manage AI agents in the Terrafusion ecosystem
 *
 * @author Terrafusion AI
 * @version 1.0.0
 * @date August 31, 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAgentTrainingDemo = void 0;
const AdvancedAIAgentTrainingSystem_1 = require("./AdvancedAIAgentTrainingSystem");
class AIAgentTrainingDemo {
    constructor() {
        this.trainingSystem = new AdvancedAIAgentTrainingSystem_1.AdvancedAIAgentTrainingSystem();
        this.setupEventListeners();
    }
    /**
     * Setup event listeners for training system
     */
    setupEventListeners() {
        this.trainingSystem.on('system-initialized', () => {
            console.log('🚀 Training system initialized successfully!');
            this.runDemo();
        });
        this.trainingSystem.on('training-started', (data) => {
            console.log(`🎯 Training started for job: ${data.jobId}`);
        });
        this.trainingSystem.on('training-completed', (data) => {
            console.log(`✅ Training completed for job: ${data.jobId}`);
            console.log('📊 Final metrics:', data.model.performance);
        });
        this.trainingSystem.on('agent-deployed', (data) => {
            console.log(`🚀 Agent deployed: ${data.modelId} to ${data.environment}`);
        });
    }
    /**
     * Run the demonstration
     */
    async runDemo() {
        console.log('\n🎭 Starting Terrafusion AI Agent Training System Demo\n');
        try {
            // Demo 1: Train a Property Assessor Agent
            await this.demoPropertyAssessorTraining();
            // Demo 2: Train a Revenue Hunter Agent
            await this.demoRevenueHunterTraining();
            // Demo 3: Train a Supreme Commander Agent
            await this.demoSupremeCommanderTraining();
            // Demo 4: Deploy and Monitor Agents
            await this.demoAgentDeployment();
            // Demo 5: List and Manage Agents
            await this.demoAgentManagement();
            console.log('\n🎉 Demo completed successfully!\n');
        }
        catch (error) {
            console.error('❌ Demo failed:', error);
        }
        finally {
            await this.trainingSystem.shutdown();
        }
    }
    /**
     * Demo: Train a Property Assessor Agent
     */
    async demoPropertyAssessorTraining() {
        console.log('🏠 Demo 1: Training Property Assessor Agent');
        const config = {
            agentType: 'property_assessor',
            trainingData: [
                {
                    name: 'property_valuation_dataset',
                    type: 'supervised',
                    size: 100000,
                    quality: 0.95,
                    domain: 'real_estate',
                    preprocessing: true,
                },
                {
                    name: 'market_comps_dataset',
                    type: 'unsupervised',
                    size: 50000,
                    quality: 0.9,
                    domain: 'market_analysis',
                    preprocessing: true,
                },
            ],
            quantumEnhancement: true,
            adaptiveLearning: true,
            multiAgentCoordination: false,
            performanceTargets: [
                { metric: 'accuracy', target: 0.95, current: 0, improvement: 0 },
                { metric: 'responseTime', target: 100, current: 0, improvement: 0 },
            ],
            securityLevel: 'government',
        };
        const jobId = await this.trainingSystem.startAgentTraining(config);
        console.log(`📋 Started training job: ${jobId}`);
        // Wait for training to complete (in real scenario, this would be async)
        await this.waitForTrainingCompletion(jobId);
    }
    /**
     * Demo: Train a Revenue Hunter Agent
     */
    async demoRevenueHunterTraining() {
        console.log('\n💰 Demo 2: Training Revenue Hunter Agent');
        const config = {
            agentType: 'revenue_hunter',
            trainingData: [
                {
                    name: 'tax_collection_dataset',
                    type: 'reinforcement',
                    size: 75000,
                    quality: 0.92,
                    domain: 'tax_collection',
                    preprocessing: true,
                },
            ],
            quantumEnhancement: true,
            adaptiveLearning: true,
            multiAgentCoordination: true,
            performanceTargets: [
                { metric: 'accuracy', target: 0.98, current: 0, improvement: 0 },
                { metric: 'throughput', target: 1000, current: 0, improvement: 0 },
            ],
            securityLevel: 'government',
        };
        const jobId = await this.trainingSystem.startAgentTraining(config);
        console.log(`📋 Started training job: ${jobId}`);
        await this.waitForTrainingCompletion(jobId);
    }
    /**
     * Demo: Train a Supreme Commander Agent
     */
    async demoSupremeCommanderTraining() {
        console.log('\n👑 Demo 3: Training Supreme Commander Agent');
        const config = {
            agentType: 'supreme_commander',
            trainingData: [
                {
                    name: 'strategic_command_dataset',
                    type: 'supervised',
                    size: 200000,
                    quality: 0.98,
                    domain: 'strategic_planning',
                    preprocessing: true,
                },
                {
                    name: 'multi_agent_coordination_dataset',
                    type: 'reinforcement',
                    size: 100000,
                    quality: 0.95,
                    domain: 'coordination',
                    preprocessing: true,
                },
            ],
            quantumEnhancement: true,
            adaptiveLearning: true,
            multiAgentCoordination: true,
            performanceTargets: [
                { metric: 'accuracy', target: 0.99, current: 0, improvement: 0 },
                { metric: 'adaptability', target: 0.95, current: 0, improvement: 0 },
            ],
            securityLevel: 'quantum',
        };
        const jobId = await this.trainingSystem.startAgentTraining(config);
        console.log(`📋 Started training job: ${jobId}`);
        await this.waitForTrainingCompletion(jobId);
    }
    /**
     * Demo: Deploy and Monitor Agents
     */
    async demoAgentDeployment() {
        console.log('\n🚀 Demo 4: Deploying Trained Agents');
        const deployedModels = this.trainingSystem.listDeployedModels();
        for (const model of deployedModels) {
            try {
                await this.trainingSystem.deployAgent(model.id, 'production', 3);
                console.log(`✅ Deployed ${model.type} to production with 3 instances`);
            }
            catch (error) {
                console.error(`❌ Failed to deploy ${model.type}:`, error);
            }
        }
    }
    /**
     * Demo: Agent Management
     */
    async demoAgentManagement() {
        console.log('\n📊 Demo 5: Agent Management Overview');
        const trainingJobs = this.trainingSystem.listTrainingJobs();
        const deployedModels = this.trainingSystem.listDeployedModels();
        console.log(`📋 Total training jobs: ${trainingJobs.length}`);
        console.log(`🤖 Deployed models: ${deployedModels.length}`);
        console.log('\n📈 Training Jobs Status:');
        trainingJobs.forEach(job => {
            console.log(`  - ${job.id}: ${job.status} (${(job.progress * 100).toFixed(1)}%)`);
        });
        console.log('\n🤖 Deployed Agents:');
        deployedModels.forEach(model => {
            console.log(`  - ${model.type}: v${model.version} (${model.deployment.health})`);
            console.log(`    Performance: ${(model.performance.accuracy * 100).toFixed(1)}% accuracy`);
            if (model.quantumMetrics.coherence > 0) {
                console.log(`    Quantum: ${(model.quantumMetrics.coherence * 100).toFixed(1)}% coherence`);
            }
        });
    }
    /**
     * Wait for training completion (simplified for demo)
     */
    async waitForTrainingCompletion(jobId) {
        // In a real implementation, this would use events or polling
        // For demo purposes, we'll simulate waiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        const job = this.trainingSystem.getTrainingStatus(jobId);
        if (job) {
            console.log(`📊 Training completed: ${(job.metrics.finalAccuracy * 100).toFixed(1)}% accuracy`);
        }
    }
}
exports.AIAgentTrainingDemo = AIAgentTrainingDemo;
// Run demo if this file is executed directly
if (require.main === module) {
    const demo = new AIAgentTrainingDemo();
}
