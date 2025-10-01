/**
 * BCBS Data Engine Integration
 *
 * Advanced data processing and analysis engine integrated from BCBSDataEngine
 * Provides enterprise-grade data mining, pattern recognition, and insight generation
 */
import { EventEmitter } from 'events';
export interface DataSource {
    id: string;
    name: string;
    type: 'database' | 'api' | 'file' | 'stream';
    connection: {
        host?: string;
        port?: number;
        database?: string;
        endpoint?: string;
        filePath?: string;
    };
    credentials?: {
        username?: string;
        password?: string;
        apiKey?: string;
        token?: string;
    };
    schema?: any;
    status: 'connected' | 'disconnected' | 'error';
    lastSync?: Date;
}
export interface DataPipeline {
    id: string;
    name: string;
    sources: string[];
    transformations: DataTransformation[];
    destinations: string[];
    schedule?: {
        cron: string;
        timezone: string;
    };
    status: 'running' | 'paused' | 'error' | 'completed';
    lastRun?: Date;
    nextRun?: Date;
}
export interface DataTransformation {
    id: string;
    type: 'filter' | 'aggregate' | 'join' | 'enrich' | 'validate' | 'ai_analyze';
    config: any;
    order: number;
}
export interface DataInsight {
    id: string;
    type: 'pattern' | 'anomaly' | 'trend' | 'correlation' | 'prediction';
    title: string;
    description: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
    data: any;
    recommendations?: string[];
    metadata: {
        discoveryMethod: string;
        dataSource: string;
        timestamp: Date;
        aiModel?: string;
    };
}
export interface RevenueOpportunity {
    id: string;
    title: string;
    description: string;
    estimatedValue: number;
    probability: number;
    timeframe: string;
    category: 'cost_savings' | 'revenue_increase' | 'efficiency_gain' | 'risk_reduction';
    actionItems: string[];
    dependencies: string[];
    status: 'identified' | 'validated' | 'in_progress' | 'implemented';
    metadata: {
        discoverySource: string;
        analysisMethod: string;
        confidence: number;
        lastUpdated: Date;
    };
}
export declare class BCBSDataEngine extends EventEmitter {
    private dataSources;
    private dataPipelines;
    private activeAnalyses;
    private insights;
    private revenueOpportunities;
    constructor();
    /**
     * Initialize BCBS Data Engine
     */
    initialize(): Promise<void>;
    /**
     * Initialize default data sources
     */
    private initializeDefaultSources;
    /**
     * Connect to all data sources
     */
    private connectDataSources;
    /**
     * Connect to specific data source
     */
    connectDataSource(sourceId: string): Promise<void>;
    /**
     * Create data processing pipeline
     */
    createPipeline(config: {
        name: string;
        sources: string[];
        transformations: DataTransformation[];
        destinations: string[];
        schedule?: {
            cron: string;
            timezone: string;
        };
    }): Promise<string>;
    /**
     * Execute data pipeline
     */
    executePipeline(pipelineId: string): Promise<any>;
    /**
     * Execute individual pipeline stage
     */
    private executeStage;
    /**
     * Extract insights from AI analysis
     */
    private extractInsightsFromAnalysis;
    /**
     * Discover revenue opportunities from analysis
     */
    private discoverRevenueOpportunities;
    /**
     * Generate insight recommendations
     */
    private generateInsightRecommendations;
    /**
     * Generate action items based on opportunity category
     */
    private generateActionItems;
    /**
     * Generate dependencies based on opportunity category
     */
    private generateDependencies;
    /**
     * Start automatic insight discovery
     */
    private startInsightDiscovery;
    /**
     * Discover insights automatically
     */
    private discoverAutomaticInsights;
    /**
     * Calculate next run time for cron schedule
     */
    private calculateNextRun;
    /**
     * Get all data sources
     */
    getDataSources(): DataSource[];
    /**
     * Get all pipelines
     */
    getDataPipelines(): DataPipeline[];
    /**
     * Get all insights
     */
    getInsights(): DataInsight[];
    /**
     * Get revenue opportunities
     */
    getRevenueOpportunities(): RevenueOpportunity[];
    /**
     * Get engine status
     */
    getStatus(): any;
}
export declare const bcbsDataEngine: BCBSDataEngine;
//# sourceMappingURL=BCBSDataEngineIntegration.d.ts.map