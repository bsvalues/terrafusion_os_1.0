/**
 * Data Integration Lead Agent
 * 
 * This module implements the Data Integration Lead Agent, which is responsible
 * for coordinating and managing connections with external data sources.
 * It ensures data consistency, transformation, and proper integration with 
 * county and state systems.
 */

import { ComponentLeadAgent, ComponentDomain } from './ComponentLeadAgent';
import { AgentMessage, EventType } from '../shared/agentProtocol';
import { ExtendedComponentDomain } from './ComplianceLeadAgent';

/**
 * New component domain for data integration
 */
export enum IntegrationComponentDomain {
  DATA_INTEGRATION = 'DATA_INTEGRATION'
}

/**
 * Configuration options specific to the Data Integration Lead Agent
 */
interface DataIntegrationLeadConfig {
  refreshInterval: number; // Interval for data refresh checks in ms
  enableDeltaSync: boolean; // Whether to use delta syncing or full refresh
  maxConcurrentConnections: number; // Maximum concurrent external connections
  cacheDuration: number; // Duration to cache external data in ms
  enableSchemaValidation: boolean; // Whether to validate incoming data against schemas
}

/**
 * Default configuration for Data Integration Lead Agent
 */
const DEFAULT_DATA_INTEGRATION_CONFIG: DataIntegrationLeadConfig = {
  refreshInterval: 3600000, // 1 hour
  enableDeltaSync: true,
  maxConcurrentConnections: 5,
  cacheDuration: 900000, // 15 minutes
  enableSchemaValidation: true
};

/**
 * External data source definition
 */
interface ExternalDataSource {
  id: string;
  name: string;
  description: string;
  type: 'api' | 'database' | 'file' | 'service';
  connectionDetails: {
    url?: string;
    protocol?: string;
    authMethod?: string;
    credentialsKey?: string;
    headers?: Record<string, string>;
    parameters?: Record<string, string>;
  };
  syncConfig: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual';
    idField: string;
    lastSyncTimestamp?: string;
    deltaField?: string;
  };
  transformations?: {
    id: string;
    description: string;
    mappingFunction: string;
  }[];
  status: 'active' | 'inactive' | 'error';
  errorMessage?: string;
}

/**
 * Data mapping definition
 */
interface DataMapping {
  sourceField: string;
  targetField: string;
  transformationType: 'direct' | 'format' | 'lookup' | 'calculate' | 'combine';
  transformationDetails?: Record<string, any>;
}

/**
 * Data Integration Lead Agent - Leads the Data Integration domain
 */
export class DataIntegrationLeadAgent extends ComponentLeadAgent {
  private integrationConfig: DataIntegrationLeadConfig;
  private dataSources: Map<string, ExternalDataSource> = new Map();
  private dataMappings: Map<string, DataMapping[]> = new Map();
  private activeConnections: Set<string> = new Set();
  private refreshInterval: NodeJS.Timeout | null = null;
  
  /**
   * Create a new Data Integration Lead Agent
   * @param agentId Unique identifier for this agent
   * @param config Configuration options
   * @param integrationConfig Integration-specific configuration
   */
  constructor(
    agentId: string, 
    config: any = {}, 
    integrationConfig: Partial<DataIntegrationLeadConfig> = {}
  ) {
    // Use DATA_INTEGRATION as domain, converting to the expected type
    super(agentId, IntegrationComponentDomain.DATA_INTEGRATION as unknown as ComponentDomain, config);
    
    // Initialize integration-specific configuration
    this.integrationConfig = {
      ...DEFAULT_DATA_INTEGRATION_CONFIG,
      ...integrationConfig
    };
    
    // Initialize known data sources
    this.initializeDataSources();
    
    // Initialize data mappings
    this.initializeDataMappings();
    
    // Set up refresh interval
    this.setupRefreshInterval();
    
    this.logMessage('Data Integration Lead Agent initialized with config: ' + 
      JSON.stringify(this.integrationConfig));
  }
  
  /**
   * Set up agent capabilities
   */
  protected setupCapabilities(): void {
    this.capabilities = [
      'data_integration_lead',
      'external_system_connectivity',
      'data_transformation',
      'schema_mapping',
      'sync_management',
      'data_lineage_tracking',
      'source_discovery'
    ];
  }
  
  /**
   * Initialize domain-specific best practices
   */
  protected initializeBestPractices(): void {
    this.bestPractices = [
      {
        id: 'int-001',
        name: 'Source Data Validation',
        description: 'External data must be validated before integration',
        checkFunction: (integrationOperation: any): boolean => {
          // Check if validation was performed
          return integrationOperation.validationPerformed === true;
        },
        fixFunction: undefined, // No automatic fix for validation
        severity: 'high'
      },
      {
        id: 'int-002',
        name: 'Data Lineage Tracking',
        description: 'Data lineage must be tracked for all integrated data',
        checkFunction: (integrationOperation: any): boolean => {
          // Check if lineage information is present
          return (
            integrationOperation.sourceSystem && 
            integrationOperation.sourceTimestamp &&
            integrationOperation.integrationTimestamp
          );
        },
        fixFunction: (integrationOperation: any) => {
          // Add basic lineage information if possible
          const fixedOperation = { ...integrationOperation };
          if (!fixedOperation.integrationTimestamp) {
            fixedOperation.integrationTimestamp = new Date().toISOString();
          }
          return fixedOperation;
        },
        severity: 'medium'
      },
      {
        id: 'int-003',
        name: 'Transformation Documentation',
        description: 'All data transformations must be documented',
        checkFunction: (integrationOperation: any): boolean => {
          // Check if transformations are documented when present
          if (integrationOperation.transformationsApplied && 
              Array.isArray(integrationOperation.transformationsApplied) && 
              integrationOperation.transformationsApplied.length > 0) {
            return integrationOperation.transformationsApplied.every((t: any) => 
              t.id && t.description && t.type
            );
          }
          return true; // No transformations applied
        },
        fixFunction: undefined, // No automatic fix for documentation
        severity: 'medium'
      },
      {
        id: 'int-004',
        name: 'Delta Sync Efficiency',
        description: 'Use delta syncing when available for performance',
        checkFunction: (integrationOperation: any): boolean => {
          // Check if delta sync was used when available
          if (integrationOperation.fullSync === true && 
              integrationOperation.deltaAvailable === true) {
            return false;
          }
          return true;
        },
        fixFunction: undefined, // Cannot automatically fix sync strategy
        severity: 'low'
      },
      {
        id: 'int-005',
        name: 'Connection Security',
        description: 'All external connections must use secure protocols',
        checkFunction: (integrationOperation: any): boolean => {
          if (integrationOperation.connectionDetails && 
              integrationOperation.connectionDetails.protocol) {
            // Check if protocol is secure
            const secureProtocols = ['https', 'sftp', 'ftps', 'ssh', 'tls'];
            return secureProtocols.some(p => 
              integrationOperation.connectionDetails.protocol.toLowerCase().includes(p)
            );
          }
          return true; // No connection details specified
        },
        fixFunction: undefined, // Cannot automatically fix connection security
        severity: 'critical'
      }
    ];
  }
  
  /**
   * Initialize known external data sources
   */
  private initializeDataSources(): void {
    // Washington State Department of Revenue
    this.dataSources.set('wa_dor', {
      id: 'wa_dor',
      name: 'Washington Department of Revenue',
      description: 'State-level property tax and assessment data',
      type: 'api',
      connectionDetails: {
        url: 'https://api.dor.wa.gov/property',
        protocol: 'https',
        authMethod: 'api_key',
        credentialsKey: 'WA_DOR_API_KEY',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      syncConfig: {
        frequency: 'daily',
        idField: 'parcel_id',
        lastSyncTimestamp: undefined,
        deltaField: 'last_updated'
      },
      transformations: [
        {
          id: 'wa_dor_tax_rate',
          description: 'Transform state tax rate format to county format',
          mappingFunction: 'mapStateTaxRateToCounty'
        }
      ],
      status: 'inactive'
    });
    
    // Benton County GIS System
    this.dataSources.set('benton_gis', {
      id: 'benton_gis',
      name: 'Benton County GIS',
      description: 'Geographic Information System data for Benton County properties',
      type: 'service',
      connectionDetails: {
        url: 'https://gis.co.benton.wa.us/arcgis/rest/services/property/MapServer',
        protocol: 'https',
        authMethod: 'basic',
        credentialsKey: 'BENTON_GIS_CREDENTIALS'
      },
      syncConfig: {
        frequency: 'weekly',
        idField: 'OBJECTID',
        lastSyncTimestamp: undefined
      },
      transformations: [
        {
          id: 'gis_coordinates',
          description: 'Transform GIS coordinates to standard lat/long format',
          mappingFunction: 'transformGISCoordinates'
        }
      ],
      status: 'inactive'
    });
    
    // Building Permit System
    this.dataSources.set('building_permits', {
      id: 'building_permits',
      name: 'Building Permit System',
      description: 'County building permit issuance and status tracking',
      type: 'database',
      connectionDetails: {
        url: 'jdbc:postgresql://permits.co.benton.wa.us:5432/permits',
        protocol: 'jdbc',
        authMethod: 'database',
        credentialsKey: 'PERMIT_DB_CREDENTIALS'
      },
      syncConfig: {
        frequency: 'daily',
        idField: 'permit_id',
        lastSyncTimestamp: undefined,
        deltaField: 'status_date'
      },
      transformations: [
        {
          id: 'permit_status_normalize',
          description: 'Normalize permit status codes to standard values',
          mappingFunction: 'normalizePermitStatus'
        }
      ],
      status: 'inactive'
    });
    
    // Property Sales Records
    this.dataSources.set('property_sales', {
      id: 'property_sales',
      name: 'Property Sales Records',
      description: 'County recorded property transactions and sales data',
      type: 'api',
      connectionDetails: {
        url: 'https://records.co.benton.wa.us/api/property/sales',
        protocol: 'https',
        authMethod: 'oauth',
        credentialsKey: 'RECORDS_API_CREDENTIALS'
      },
      syncConfig: {
        frequency: 'daily',
        idField: 'transaction_id',
        lastSyncTimestamp: undefined,
        deltaField: 'recording_date'
      },
      status: 'inactive'
    });
    
    // Census Data API
    this.dataSources.set('census', {
      id: 'census',
      name: 'US Census Bureau Data API',
      description: 'Demographic and housing statistics',
      type: 'api',
      connectionDetails: {
        url: 'https://api.census.gov/data/v1',
        protocol: 'https',
        authMethod: 'api_key',
        credentialsKey: 'CENSUS_API_KEY',
        parameters: {
          'vintage': '2020',
          'dataset': 'acs',
          'state': '53', // Washington
          'county': '005' // Benton County
        }
      },
      syncConfig: {
        frequency: 'monthly',
        idField: 'geoid',
        lastSyncTimestamp: undefined
      },
      transformations: [
        {
          id: 'census_geo_match',
          description: 'Match census geographies to county parcel data',
          mappingFunction: 'matchCensusGeographies'
        }
      ],
      status: 'inactive'
    });
  }
  
  /**
   * Initialize data mappings for different sources
   */
  private initializeDataMappings(): void {
    // WA DOR to County Property Record mappings
    this.dataMappings.set('wa_dor', [
      {
        sourceField: 'StateParcelID',
        targetField: 'parcel_id',
        transformationType: 'direct'
      },
      {
        sourceField: 'StateTaxYear',
        targetField: 'tax_year',
        transformationType: 'direct'
      },
      {
        sourceField: 'StateMarketValue',
        targetField: 'state_market_value',
        transformationType: 'direct'
      },
      {
        sourceField: 'TaxRate',
        targetField: 'tax_rate',
        transformationType: 'format',
        transformationDetails: {
          format: 'decimal',
          precision: 6
        }
      },
      {
        sourceField: 'LevyCode',
        targetField: 'levy_code',
        transformationType: 'direct'
      }
    ]);
    
    // GIS to Property Record mappings
    this.dataMappings.set('benton_gis', [
      {
        sourceField: 'OBJECTID',
        targetField: 'gis_object_id',
        transformationType: 'direct'
      },
      {
        sourceField: 'Shape',
        targetField: 'boundary_geometry',
        transformationType: 'transform',
        transformationDetails: {
          transformer: 'convertEsriToGeoJSON'
        }
      },
      {
        sourceField: 'ACRES',
        targetField: 'acres',
        transformationType: 'format',
        transformationDetails: {
          format: 'decimal',
          precision: 3
        }
      },
      {
        sourceField: 'ADDRESS',
        targetField: 'property_address',
        transformationType: 'format',
        transformationDetails: {
          format: 'standardAddress'
        }
      },
      {
        sourceField: 'ZONING',
        targetField: 'zoning_code',
        transformationType: 'direct'
      }
    ]);
    
    // Building Permits to Property Record mappings
    this.dataMappings.set('building_permits', [
      {
        sourceField: 'permit_id',
        targetField: 'permit_reference',
        transformationType: 'direct'
      },
      {
        sourceField: 'parcel_no',
        targetField: 'parcel_id',
        transformationType: 'direct'
      },
      {
        sourceField: 'issue_date',
        targetField: 'permit_issue_date',
        transformationType: 'format',
        transformationDetails: {
          format: 'iso8601'
        }
      },
      {
        sourceField: 'permit_type',
        targetField: 'permit_type',
        transformationType: 'lookup',
        transformationDetails: {
          lookupTable: 'permit_type_codes'
        }
      },
      {
        sourceField: 'construction_value',
        targetField: 'permit_declared_value',
        transformationType: 'format',
        transformationDetails: {
          format: 'currency',
          precision: 2
        }
      }
    ]);
    
    // Property Sales to Property Record mappings
    this.dataMappings.set('property_sales', [
      {
        sourceField: 'transaction_id',
        targetField: 'sale_reference',
        transformationType: 'direct'
      },
      {
        sourceField: 'parcel_number',
        targetField: 'parcel_id',
        transformationType: 'direct'
      },
      {
        sourceField: 'sale_date',
        targetField: 'sale_date',
        transformationType: 'format',
        transformationDetails: {
          format: 'iso8601'
        }
      },
      {
        sourceField: 'sale_price',
        targetField: 'sale_price',
        transformationType: 'direct'
      },
      {
        sourceField: 'document_type',
        targetField: 'sale_document_type',
        transformationType: 'lookup',
        transformationDetails: {
          lookupTable: 'document_types'
        }
      },
      {
        sourceField: 'buyer',
        targetField: 'buyer_name',
        transformationType: 'format',
        transformationDetails: {
          format: 'standardName'
        }
      },
      {
        sourceField: 'seller',
        targetField: 'seller_name',
        transformationType: 'format',
        transformationDetails: {
          format: 'standardName'
        }
      }
    ]);
    
    // Census data to neighborhood/market area mappings
    this.dataMappings.set('census', [
      {
        sourceField: 'geoid',
        targetField: 'census_tract_id',
        transformationType: 'direct'
      },
      {
        sourceField: 'B25077_001E',
        targetField: 'median_home_value',
        transformationType: 'direct'
      },
      {
        sourceField: 'B25064_001E',
        targetField: 'median_gross_rent',
        transformationType: 'direct'
      },
      {
        sourceField: 'B25008_002E',
        targetField: 'owner_occupied_units',
        transformationType: 'direct'
      },
      {
        sourceField: 'B25008_003E',
        targetField: 'renter_occupied_units',
        transformationType: 'direct'
      },
      {
        sourceField: 'B01003_001E',
        targetField: 'total_population',
        transformationType: 'direct'
      }
    ]);
  }
  
  /**
   * Set up refresh interval for data integration checks
   */
  private setupRefreshInterval(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(() => {
      this.performScheduledSyncs();
    }, this.integrationConfig.refreshInterval);
  }
  
  /**
   * Check for and perform scheduled data synchronizations
   */
  private async performScheduledSyncs(): Promise<void> {
    this.logMessage('Checking for scheduled data synchronizations');
    
    const now = new Date();
    const syncCandidates: string[] = [];
    
    // Identify data sources that need synchronization
    for (const [sourceId, source] of this.dataSources.entries()) {
      if (source.status !== 'active') {
        continue; // Skip inactive sources
      }
      
      // Check if sync is due based on frequency and last sync
      if (source.syncConfig.lastSyncTimestamp) {
        const lastSync = new Date(source.syncConfig.lastSyncTimestamp);
        let syncDue = false;
        
        switch (source.syncConfig.frequency) {
          case 'hourly':
            syncDue = (now.getTime() - lastSync.getTime()) >= 3600000; // 1 hour
            break;
          case 'daily':
            syncDue = (now.getTime() - lastSync.getTime()) >= 86400000; // 24 hours
            break;
          case 'weekly':
            syncDue = (now.getTime() - lastSync.getTime()) >= 604800000; // 7 days
            break;
          case 'monthly':
            // Approximate month as 30 days
            syncDue = (now.getTime() - lastSync.getTime()) >= 2592000000; // 30 days
            break;
          case 'manual':
            syncDue = false; // Manual syncs are not scheduled
            break;
        }
        
        if (syncDue) {
          syncCandidates.push(sourceId);
        }
      } else {
        // No previous sync, should be synchronized
        syncCandidates.push(sourceId);
      }
    }
    
    // Limit concurrent connections based on configuration
    const syncBatch = syncCandidates.slice(0, this.integrationConfig.maxConcurrentConnections - this.activeConnections.size);
    
    // Process each sync
    for (const sourceId of syncBatch) {
      this.beginDataSync(sourceId);
    }
  }
  
  /**
   * Begin synchronization with a data source
   * @param sourceId The ID of the data source to sync
   */
  public async beginDataSync(sourceId: string): Promise<void> {
    const source = this.dataSources.get(sourceId);
    
    if (!source) {
      this.logMessage(`Cannot sync unknown data source: ${sourceId}`, 'error');
      return;
    }
    
    // Check if source is already syncing
    if (this.activeConnections.has(sourceId)) {
      this.logMessage(`Data source ${sourceId} is already syncing, skipping`, 'warn');
      return;
    }
    
    this.logMessage(`Beginning data sync with source: ${source.name} (${sourceId})`);
    
    try {
      // Add to active connections
      this.activeConnections.add(sourceId);
      
      // Update source status
      const updatedSource = { ...source, status: 'active' };
      this.dataSources.set(sourceId, updatedSource);
      
      // In a real implementation, this would connect to the external system and
      // perform the actual data synchronization
      
      // Simulate successful sync
      const syncResult = await this.simulateDataSync(source);
      
      // Update last sync timestamp
      const finalSource = { 
        ...updatedSource, 
        syncConfig: {
          ...updatedSource.syncConfig,
          lastSyncTimestamp: new Date().toISOString()
        }
      };
      
      this.dataSources.set(sourceId, finalSource);
      
      this.logMessage(`Completed data sync with source: ${source.name} (${sourceId})`);
      this.logMessage(`Sync result: ${syncResult.recordsProcessed} records processed, ${syncResult.recordsAdded} added, ${syncResult.recordsUpdated} updated`);
      
      // Broadcast sync completion
      this.broadcastSyncCompletion(sourceId, syncResult);
    } catch (error) {
      // Update source with error status
      const errorSource = { 
        ...source, 
        status: 'error',
        errorMessage: `Sync error: ${error}`
      };
      
      this.dataSources.set(sourceId, errorSource);
      this.logMessage(`Error syncing data source ${sourceId}: ${error}`, 'error');
    } finally {
      // Remove from active connections
      this.activeConnections.delete(sourceId);
    }
  }
  
  /**
   * Simulate a data sync operation (for development/testing)
   * @param source The data source to simulate sync for
   * @returns Simulated sync results
   */
  private async simulateDataSync(source: ExternalDataSource): Promise<{
    recordsProcessed: number;
    recordsAdded: number;
    recordsUpdated: number;
    errors: number;
    syncDuration: number;
  }> {
    // In a real implementation, this would be replaced with actual sync logic
    
    // Add some randomness to simulate real-world variability
    const recordsProcessed = Math.floor(Math.random() * 1000) + 100;
    const recordsAdded = Math.floor(Math.random() * (recordsProcessed * 0.3));
    const recordsUpdated = Math.floor(Math.random() * (recordsProcessed * 0.5));
    const errors = Math.floor(Math.random() * 5); // Small number of potential errors
    const syncDuration = Math.floor(Math.random() * 60000) + 5000; // 5-65 seconds
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
    
    return {
      recordsProcessed,
      recordsAdded,
      recordsUpdated,
      errors,
      syncDuration
    };
  }
  
  /**
   * Broadcast sync completion to interested agents
   * @param sourceId ID of the synced data source
   * @param syncResult Results of the sync operation
   */
  private broadcastSyncCompletion(sourceId: string, syncResult: any): void {
    const source = this.dataSources.get(sourceId);
    
    if (!source) {
      return;
    }
    
    const broadcastMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      sourceAgentId: this.agentId,
      targetAgentId: 'BROADCAST',
      timestamp: new Date().toISOString(),
      eventType: EventType.STATUS_UPDATE,
      payload: {
        messageType: 'DATA_SYNC_COMPLETED',
        dataSourceId: sourceId,
        dataSourceName: source.name,
        syncResult: {
          ...syncResult,
          timestamp: new Date().toISOString()
        }
      }
    };
    
    this.sendMessage(broadcastMessage);
  }
  
  /**
   * Get list of available data sources with status and last sync info
   * @returns Array of data source summaries
   */
  public getDataSourcesSummary(): any[] {
    return Array.from(this.dataSources.values()).map(source => ({
      id: source.id,
      name: source.name,
      description: source.description,
      type: source.type,
      status: source.status,
      lastSync: source.syncConfig.lastSyncTimestamp,
      frequency: source.syncConfig.frequency,
      errorMessage: source.errorMessage
    }));
  }
  
  /**
   * Get detailed information for a specific data source
   * @param sourceId ID of the data source
   * @returns Data source details or error
   */
  public getDataSourceDetails(sourceId: string): any {
    const source = this.dataSources.get(sourceId);
    
    if (!source) {
      return {
        error: `Unknown data source: ${sourceId}`,
        knownSources: Array.from(this.dataSources.keys())
      };
    }
    
    // Get mappings for this source
    const mappings = this.dataMappings.get(sourceId) || [];
    
    return {
      ...source,
      mappings,
      isCurrentlySyncing: this.activeConnections.has(sourceId)
    };
  }
  
  /**
   * Provide domain-specific assistance to requesting agents
   * @param requestMessage The assistance request message
   */
  protected provideDomainAssistance(requestMessage: AgentMessage): void {
    const { payload, correlationId, sourceAgentId } = requestMessage;
    
    let assistance = '';
    let confidence = 0;
    
    // Determine the type of assistance needed
    if (payload.problemDescription.toLowerCase().includes('connect') || 
        payload.problemDescription.toLowerCase().includes('source')) {
      assistance = this.provideDataSourceGuidance(payload.context);
      confidence = 0.9;
    } else if (payload.problemDescription.toLowerCase().includes('transform') || 
               payload.problemDescription.toLowerCase().includes('mapping')) {
      assistance = this.provideTransformationGuidance(payload.context);
      confidence = 0.85;
    } else if (payload.problemDescription.toLowerCase().includes('sync') || 
               payload.problemDescription.toLowerCase().includes('refresh')) {
      assistance = this.provideSyncGuidance(payload.context);
      confidence = 0.9;
    } else if (payload.problemDescription.toLowerCase().includes('lineage') || 
               payload.problemDescription.toLowerCase().includes('tracking')) {
      assistance = this.provideDataLineageGuidance(payload.context);
      confidence = 0.85;
    } else {
      assistance = this.provideGeneralIntegrationGuidance(payload.problemDescription);
      confidence = 0.8;
    }
    
    // Send assistance response
    const assistanceMessage: AgentMessage = {
      messageId: crypto.randomUUID(),
      correlationId: correlationId,
      sourceAgentId: this.agentId,
      targetAgentId: sourceAgentId,
      timestamp: new Date().toISOString(),
      eventType: EventType.ASSISTANCE_RESPONSE,
      payload: {
        assistance,
        confidence,
        domain: IntegrationComponentDomain.DATA_INTEGRATION,
        references: this.getRelevantReferences(payload.problemDescription)
      }
    };
    
    this.sendMessage(assistanceMessage);
    this.logMessage(`Provided data integration assistance to ${sourceAgentId}`);
  }
  
  /**
   * Provide guidance on data sources
   * @param context Context information
   * @returns Data source guidance
   */
  private provideDataSourceGuidance(context: any): string {
    return `
      Data Source Integration Guidance:
      
      1. Available property assessment data sources for Benton County:
         - Washington Department of Revenue (WA DOR): State-level property tax data
         - Benton County GIS: Spatial and geographic data for properties
         - Building Permits System: Construction and improvement activity
         - Property Sales Records: Transaction history and sales data
         - US Census Bureau: Demographic and housing statistics by area
      
      2. Connection requirements by source:
         - WA DOR: API key required, HTTPS REST API, JSON format
         - Benton County GIS: Basic auth credentials, ArcGIS REST API
         - Building Permits: Database credentials, PostgreSQL connection
         - Property Sales: OAuth2 authentication, REST API with XML/JSON
         - Census Bureau: API key, specialized query parameters
      
      3. Connection best practices:
         - Use secure connection protocols (HTTPS, SFTP, SSH)
         - Implement connection pooling for database sources
         - Use application-specific credentials (not admin/root)
         - Implement proper error handling and retries
         - Cache results according to refresh frequency needs
      
      4. Source selection guidelines:
         - Match data needs with appropriate source
         - Consider refresh frequency requirements
         - Evaluate data quality and completeness
         - Check for existing relationships and agreements
         - Verify regulatory compliance for data usage
    `;
  }
  
  /**
   * Provide guidance on data transformations
   * @param context Context information
   * @returns Transformation guidance
   */
  private provideTransformationGuidance(context: any): string {
    return `
      Data Transformation Guidance:
      
      1. Common property data transformations:
         - Address standardization to USPS format
         - Coordinate system conversions (State Plane to WGS84)
         - Unit conversions (acres/square feet, etc.)
         - Classification code normalization
         - Value format standardization (decimal places, currency)
      
      2. Transformation strategies:
         - Field-level mapping with clear documentation
         - Lookup tables for code/classification conversion
         - Custom functions for complex transformations
         - Data quality validation pre/post transformation
         - Preserve original values when appropriate
      
      3. Property identifiers and keys:
         - Maintain consistent parcel ID format
         - Create mapping tables for cross-reference
         - Document identifier schemes from each source
         - Create composite keys when necessary
         - Implement validation for key integrity
      
      4. Implementation considerations:
         - Design for reproducibility and audit
         - Include data lineage tracking
         - Document transformation logic
         - Create test cases for validation
         - Implement error handling for edge cases
    `;
  }
  
  /**
   * Provide guidance on data synchronization
   * @param context Context information
   * @returns Sync guidance
   */
  private provideSyncGuidance(context: any): string {
    return `
      Data Synchronization Guidance:
      
      1. Sync frequency considerations:
         - WA DOR property data: Daily updates recommended
         - GIS data: Weekly updates typically sufficient
         - Building permits: Daily for active construction periods
         - Sales data: Daily to capture market activity
         - Census data: Monthly or quarterly (slow-changing)
      
      2. Delta sync implementation:
         - Utilize change tracking fields when available
         - Implement timestamp-based filtering
         - Compare record checksums for changes
         - Maintain sync state for resumable operations
         - Document sync boundary conditions
      
      3. Resource management:
         - Implement connection pooling
         - Use batch processing for large datasets
         - Schedule syncs during off-peak hours
         - Implement throttling for rate-limited APIs
         - Monitor system resource usage during syncs
      
      4. Error handling strategies:
         - Classify errors (temporary vs. persistent)
         - Implement exponential backoff for retries
         - Create error thresholds for sync abortion
         - Provide detailed logging for troubleshooting
         - Implement notification system for persistent issues
    `;
  }
  
  /**
   * Provide guidance on data lineage
   * @param context Context information
   * @returns Data lineage guidance
   */
  private provideDataLineageGuidance(context: any): string {
    return `
      Data Lineage Guidance:
      
      1. Essential lineage information:
         - Source system identifier
         - Original record identifier
         - Timestamp of data capture
         - Timestamp of integration
         - Version of integration process
         - Transformations applied
         - User or process responsible
      
      2. Lineage implementation strategies:
         - Embed lineage metadata in data records
         - Maintain separate lineage registry
         - Implement versioned datasets
         - Create audit logs for all transformations
         - Document process flows with lineage tracking
      
      3. Lineage for property assessment:
         - Track primary data sources for each valuation factor
         - Document methodology changes with effective dates
         - Maintain history of input data changes
         - Associate external sources with resulting values
         - Create clear derivation paths for calculated values
      
      4. Compliance considerations:
         - Ensure traceability for regulatory requirements
         - Document data handling for privacy compliance
         - Maintain provenance for legal defensibility
         - Create retention policies aligned with source data
         - Implement access controls based on data source
    `;
  }
  
  /**
   * Provide general integration guidance
   * @param problemDescription Description of the problem
   * @returns General integration guidance
   */
  private provideGeneralIntegrationGuidance(problemDescription: string): string {
    return `
      General Data Integration Guidance:
      
      1. Integration architecture for property assessment:
         - Hub-and-spoke model for multiple data sources
         - Central property registry as integration point
         - Consistent identifier strategy across systems
         - Separation of raw and transformed data
         - Metadata registry for source tracking
      
      2. Quality control requirements:
         - Source data validation before integration
         - Post-transformation validation
         - Reconciliation with existing data
         - Exception handling and reporting
         - Regular data quality audits
      
      3. Implementation best practices:
         - Design for testability and reproducibility
         - Document all integration points and processes
         - Implement comprehensive logging
         - Create monitoring dashboards
         - Develop recovery procedures for failures
      
      4. Performance considerations:
         - Optimize for read vs. write patterns
         - Implement appropriate indexing
         - Consider caching strategies
         - Use batch processing for large operations
         - Monitor and tune resource usage
    `;
  }
  
  /**
   * Get relevant references for a problem description
   * @param problemDescription Description of the problem
   * @returns Array of references
   */
  private getRelevantReferences(problemDescription: string): any[] {
    // In a real implementation, this would query a knowledge base
    const references = [
      {
        title: "Washington State Department of Revenue Integration Guide",
        section: "API Documentation for County Assessors",
        relevance: 0.9
      },
      {
        title: "Benton County Data Integration Standards",
        section: "External System Connectivity",
        relevance: 0.85
      },
      {
        title: "Property Data Exchange Standards",
        section: "PRIA Standards for Assessment Data",
        relevance: 0.8
      }
    ];
    
    return references;
  }
  
  /**
   * Clean up resources when agent is shut down
   */
  public shutdown(): void {
    // Clear scheduled tasks
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    // Clear any active connections
    this.activeConnections.clear();
    
    // Log shutdown
    this.logMessage(`Data Integration Lead Agent shutting down`);
    
    // Call parent shutdown
    super.shutdown();
  }
}