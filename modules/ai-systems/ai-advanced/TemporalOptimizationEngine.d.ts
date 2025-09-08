import { EventEmitter } from 'events';
export interface TimeScale {
    range: string;
    resolution: string;
    optimizationFocus: string;
    decisionSpeed: string;
}
export interface TemporalModel {
    forwardCausality: boolean;
    backwardCausality: boolean;
    lateralCausality: boolean;
    emergentCausality: boolean;
}
export interface OptimizationAlgorithm {
    algorithm: string;
    objectives?: string[];
    constraintHandling?: string;
    solutionMethod?: string;
    stateSpace?: string;
    valueFunction?: string;
    policyOptimization?: string;
    temporalSymmetry?: boolean;
    timeReversalInvariance?: boolean;
    temporalSuperposition?: boolean;
}
export interface TemporalDecisionContext {
    decisionId: string;
    description: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    stakeholders: string[];
    resources: any;
    constraints: any;
    expectedOutcomes: any;
}
export interface TemporalOptimizationResult {
    optimizationId: string;
    decisionContext: TemporalDecisionContext;
    temporalAnalysis: any;
    causalityAnalysis: any;
    multiScaleOptimization: any;
    temporalStrategy: any;
    coherenceValidation: any;
    implementationTimeline: any;
    temporalEfficiency: number;
    longTermSustainability: number;
    temporalRiskAssessment: any;
}
export declare class TemporalOptimizationEngine extends EventEmitter {
    private timeScales;
    private temporalModels;
    private optimizationAlgorithms;
    private temporalCoordination;
    private temporalIntelligence;
    private isInitialized;
    constructor();
    /**
     * Initialize the Temporal Optimization Engine
     */
    initialize(): Promise<void>;
    /**
     * Initialize time scales configuration
     */
    private initializeTimeScales;
    /**
     * Initialize temporal models
     */
    private initializeTemporalModels;
    /**
     * Initialize optimization algorithms
     */
    private initializeOptimizationAlgorithms;
    /**
     * Set up temporal models
     */
    private setupTemporalModels;
    /**
     * Set up optimization algorithms
     */
    private setupOptimizationAlgorithms;
    /**
     * Set up temporal coordination
     */
    private setupTemporalCoordination;
    /**
     * Activate temporal intelligence
     */
    private activateTemporalIntelligence;
    /**
     * Optimize decision across all temporal scales
     */
    optimizeTemporalDecision(decisionContext: TemporalDecisionContext): Promise<TemporalOptimizationResult>;
    /**
     * Synchronize multiple operations across temporal scales
     */
    synchronizeTemporalOperations(operations: any[]): Promise<any>;
    private analyzeTemporalImplications;
    private modelCausalityPropagation;
    private optimizeAcrossTimeScales;
    private resolveTemporalConflicts;
    private generateTemporalStrategy;
    private validateTemporalCoherence;
    private createImplementationTimeline;
    private analyzeCrossScaleInteractions;
    private identifyTemporalHotspots;
    private findParetoOptimalSolutions;
    private analyzeTemporalDependencies;
    private createCoordinationMatrix;
    private optimizeTemporalSequencing;
    private resolveMultiOperationConflicts;
    private generateSynchronizedTimeline;
    private validateSynchronizationQuality;
    /**
     * Get current time scales configuration
     */
    getTimeScales(): Record<string, TimeScale>;
    /**
     * Get temporal models configuration
     */
    getTemporalModels(): Record<string, TemporalModel>;
    /**
     * Get optimization algorithms configuration
     */
    getOptimizationAlgorithms(): Record<string, OptimizationAlgorithm>;
}
export declare const temporalOptimizationEngine: TemporalOptimizationEngine;
//# sourceMappingURL=TemporalOptimizationEngine.d.ts.map