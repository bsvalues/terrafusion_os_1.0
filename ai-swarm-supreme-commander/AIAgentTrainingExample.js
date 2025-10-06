"use strict";
/**
 * Terrafusion OS 1.0 - AI Agent Training System Usage Example
 *
 * Simple example showing how to use the Advanced AI Agent Training System
 *
 * @author Terrafusion AI
 * @version 1.0.0
 * @date August 31, 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAgentTrainingExample = void 0;
const AdvancedAIAgentTrainingSystem_1 = require("./AdvancedAIAgentTrainingSystem");
class AIAgentTrainingExample {
    constructor() {
        this.trainingSystem = new AdvancedAIAgentTrainingSystem_1.AdvancedAIAgentTrainingSystem();
        this.setupEventListeners();
    }
    /**
     * Setup event listeners for training system
     */
    setupEventListeners() {
        this.trainingSystem.on('system-initialized', () => {
            // System is ready for training
            this.startExampleTraining();
        });
        this.trainingSystem.on('training-completed', data => {
            // Training completed successfully
            this.handleTrainingCompletion(data);
        });
    }
    /**
     * Start an example training session
     */
    async startExampleTraining() {
        const config = {
            agentType: 'property_assessor',
            trainingData: [
                {
                    name: 'property_dataset',
                    type: 'supervised',
                    size: 50000,
                    quality: 0.9,
                    domain: 'real_estate',
                    preprocessing: true,
                },
            ],
            quantumEnhancement: true,
            adaptiveLearning: true,
            multiAgentCoordination: false,
            performanceTargets: [{ metric: 'accuracy', target: 0.95, current: 0, improvement: 0 }],
            securityLevel: 'government',
        };
        try {
            const jobId = await this.trainingSystem.startAgentTraining(config);
            // Store jobId for tracking if needed
            jobId;
        }
        catch (error) {
            // Handle training error
        }
    }
    /**
     * Handle training completion
     */
    async handleTrainingCompletion(data) {
        const eventData = data;
        // Deploy the trained model
        try {
            await this.trainingSystem.deployAgent(eventData.model.id, 'production', 2);
            // Model deployed successfully
        }
        catch (error) {
            // Handle deployment error
        }
    }
    /**
     * Get list of deployed models
     */
    getDeployedModels() {
        return this.trainingSystem.listDeployedModels();
    }
    /**
     * Shutdown the training system
     */
    async shutdown() {
        await this.trainingSystem.shutdown();
    }
}
exports.AIAgentTrainingExample = AIAgentTrainingExample;
// Export for use in other modules
exports.default = AIAgentTrainingExample;
