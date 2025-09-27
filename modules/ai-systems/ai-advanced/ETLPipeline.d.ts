/**
 * ETL Pipeline
 * Integrated BCBSDataEngine ETL capabilities for Terrafusion OS
 *
 * Features:
 * - Multi-source data extraction (MLS, NARRPR, PACS, Harris PACS)
 * - Advanced data transformation and validation
 * - Intelligent data quality monitoring
 * - Real-time processing and error handling
 * - Audit logging and compliance tracking
 */
import { EventEmitter } from 'events';
export interface DataSource {
    id: string;
    name: string;
    type: 'database' | 'api' | 'file' | 'ftp' | 'webhook';
    connection: {
        host?: string;
        port?: number;
        database?: string;
        username?: string;
        password?: string;
        apiKey?: string;
        endpoint?: string;
        filePath?: string;
    };
    enabled: boolean;
    lastSync?: Date;
    syncFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'manual';
}
export interface DataRecord {
    id?: string;
    source: string;
    sourceId: string;
    data: Record<string, any>;
    extractedAt: Date;
    processedAt?: Date;
    status: 'pending' | 'processing' | 'validated' | 'failed' | 'rejected';
    validationErrors?: string[];
    transformedData?: Record<string, any>;
}
export interface ValidationRule {
    field: string;
    type: 'required' | 'numeric' | 'string' | 'date' | 'email' | 'phone' | 'custom';
    min?: number;
    max?: number;
    pattern?: RegExp;
    customValidator?: (value: any) => boolean;
    message: string;
}
export interface ETLJob {
    id: string;
    name: string;
    sources: string[];
    transformations: TransformationRule[];
    validations: ValidationRule[];
    destination: string;
    schedule?: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    lastRun?: Date;
    nextRun?: Date;
    statistics: {
        recordsExtracted: number;
        recordsTransformed: number;
        recordsValidated: number;
        recordsLoaded: number;
        errors: number;
        warnings: number;
    };
}
export interface TransformationRule {
    type: 'map' | 'filter' | 'aggregate' | 'join' | 'enrich' | 'normalize';
    sourceField?: string;
    targetField?: string;
    expression?: string;
    parameters?: Record<string, any>;
}
export interface ETLConfig {
    batchSize: number;
    retryAttempts: number;
    retryDelay: number;
    enableLogging: boolean;
    enableAuditing: boolean;
    dataRetentionDays: number;
    validationMode: 'strict' | 'lenient' | 'skip';
    parallelProcessing: boolean;
    maxParallelJobs: number;
}
export declare class ETLPipeline extends EventEmitter {
    private dataSources;
    private jobs;
    private config;
    private isInitialized;
    private activeJobs;
    private recordBuffer;
    constructor(config?: Partial<ETLConfig>);
    /**
     * Initialize the ETL pipeline
     */
    initialize(): Promise<void>;
    /**
     * Initialize pipeline components
     */
    private initializePipeline;
    /**
     * Set up Benton County specific data sources
     */
    private setupBentonCountyDataSources;
    /**
     * Initialize data source connections
     */
    private initializeDataSources;
    /**
     * Test connection to data source
     */
    private testConnection;
    /**
     * Test database connection
     */
    private testDatabaseConnection;
    /**
     * Test API connection
     */
    private testAPIConnection;
    /**
     * Test file connection
     */
    private testFileConnection;
    /**
     * Load existing ETL jobs
     */
    private loadETLJobs;
    /**
     * Create default ETL jobs for Benton County
     */
    private createDefaultETLJobs;
    /**
     * Initialize buffer system
     */
    private initializeBuffers;
    /**
     * Start job scheduler
     */
    private startScheduler;
    /**
     * Check for jobs that need to run
     */
    private checkScheduledJobs;
    /**
     * Check if job should run based on schedule
     */
    private shouldRunJob;
    /**
     * Calculate next run time from cron schedule
     */
    private calculateNextRun;
    /**
     * Initialize monitoring
     */
    private initializeMonitoring;
    /**
     * Collect ETL metrics
     */
    private collectMetrics;
    /**
     * Run an ETL job
     */
    runETLJob(jobId: string): Promise<void>;
    /**
     * Extract data from sources
     */
    private extractData;
    /**
     * Extract data from specific source
     */
    private extractFromSource;
    /**
     * Extract from database
     */
    private extractFromDatabase;
    /**
     * Extract from API
     */
    private extractFromAPI;
    /**
     * Extract from file
     */
    private extractFromFile;
    /**
     * Generate sample database data
     */
    private generateSampleDatabaseData;
    /**
     * Generate sample API data
     */
    private generateSampleAPIData;
    /**
     * Generate sample file data
     */
    private generateSampleFileData;
    /**
     * Transform data using transformation rules
     */
    private transformData;
    /**
     * Apply single transformation rule
     */
    private applyTransformation;
    /**
     * Apply normalization transformations
     */
    private applyNormalization;
    /**
     * Apply enrichment transformations
     */
    private applyEnrichment;
    /**
     * Apply filter transformations
     */
    private applyFilter;
    /**
     * Apply mapping transformations
     */
    private applyMapping;
    /**
     * Validate data using validation rules
     */
    private validateData;
    /**
     * Validate individual field
     */
    private validateField;
    /**
     * Load data to destination
     */
    private loadData;
    /**
     * Get ETL pipeline status
     */
    getStatus(): {
        initialized: boolean;
        activeJobs: number;
        totalJobs: number;
        enabledSources: number;
        config: ETLConfig;
    };
    /**
     * Get all ETL jobs
     */
    getJobs(): ETLJob[];
    /**
     * Get data sources
     */
    getDataSources(): DataSource[];
    /**
     * Manually trigger an ETL job
     */
    triggerJob(jobId: string): Promise<void>;
}
export declare const etlPipeline: ETLPipeline;
//# sourceMappingURL=ETLPipeline.d.ts.map