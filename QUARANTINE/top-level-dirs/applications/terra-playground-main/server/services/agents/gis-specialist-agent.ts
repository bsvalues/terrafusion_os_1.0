/**
 * GIS Specialist Agent
 *
 * An AI agent that specializes in spatial analysis, GIS data processing,
 * and map visualization. This agent provides expertise for complex GIS tasks
 * and can guide users through spatial analysis workflows.
 */

import { BaseAgent, AgentConfig } from '../agent-framework/base-agent';
import { MCPService } from '../mcp-service/mcp-service';
import { IStorage } from '../../storage';
import { GISDataService } from '../gis/gis-data-service';
import { LLMService } from '../llm-service/llm-service';
import { v4 as uuidv4 } from 'uuid';

// Spatial Analysis Request interface
export interface SpatialAnalysisRequest {
  operationType:
    | 'buffer'
    | 'intersection'
    | 'union'
    | 'difference'
    | 'nearest'
    | 'within'
    | 'contains'
    | 'custom';
  geometryA: any; // GeoJSON geometry
  geometryB?: any; // GeoJSON geometry (for operations that require two geometries)
  parameters?: {
    distance?: number;
    units?: string;
    maxResults?: number;
    filterExpression?: string;
    [key: string]: any;
  };
  contextData?: any; // Additional context for the analysis
}

// Map Styling Request interface
export interface MapStylingRequest {
  dataAttributes: string[];
  dataType: 'categorical' | 'numerical' | 'temporal';
  purpose: 'thematic' | 'reference' | 'analytical';
  theme?: 'light' | 'dark' | 'satellite' | 'terrain';
  preferences?: {
    colorScheme?: string;
    emphasis?: string;
    labelDensity?: 'low' | 'medium' | 'high';
    [key: string]: any;
  };
}

/**
 * Main GIS Specialist Agent class
 */
export class GISSpecialistAgent extends BaseAgent {
  private gisDataService: GISDataService;
  private llmService: LLMService | null = null;

  constructor(
    storage: IStorage,
    mcpService: MCPService,
    gisDataService: GISDataService,
    llmService?: LLMService
  ) {
    // Create base agent config
    const config: AgentConfig = {
      id: `gis-specialist-${uuidv4().substring(0, 8)}`,
      name: 'GIS Specialist Agent',
      type: 'gis_specialist',
      description: 'Specializes in spatial analysis, GIS data processing, and map visualization',
      capabilities: [
        'spatial_analysis',
        'map_styling',
        'feature_detection',
        'area_analysis',
        'topology_repair',
        'geocoding',
        'routing',
      ],
    };

    // Initialize the base agent with the config
    super(storage, mcpService, config);

    // Store service references
    this.gisDataService = gisDataService;

    if (llmService) {
      this.llmService = llmService;
    }
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    // Call parent initialize method
    await super.initialize();

    // Register message handlers
    this.registerMessageHandler(
      'spatial_analysis_request',
      this.handleSpatialAnalysisRequest.bind(this)
    );
    this.registerMessageHandler('map_styling_request', this.handleMapStylingRequest.bind(this));
    this.registerMessageHandler(
      'feature_detection_request',
      this.handleFeatureDetectionRequest.bind(this)
    );
    this.registerMessageHandler('area_analysis_request', this.handleAreaAnalysisRequest.bind(this));

    // Log initialization success
    await this.logActivity('initialization', 'GIS Specialist Agent initialized successfully');
  }

  /**
   * Handle spatial analysis requests
   */
  private async handleSpatialAnalysisRequest(message: any): Promise<any> {
    try {
      const request = message.data as SpatialAnalysisRequest;

      if (!request || !request.operationType || !request.geometryA) {
        return {
          success: false,
          error: 'Invalid spatial analysis request. Missing required parameters.',
        };
      }

      // Log the operation
      await this.logActivity('spatial_analysis', `Processing ${request.operationType} operation`);

      // Execute the operation based on type
      let result;
      switch (request.operationType) {
        case 'buffer':
          result = await this.performBufferAnalysis(request);
          break;
        case 'intersection':
          result = await this.performIntersectionAnalysis(request);
          break;
        case 'union':
          result = await this.performUnionAnalysis(request);
          break;
        case 'difference':
          result = await this.performDifferenceAnalysis(request);
          break;
        case 'nearest':
          result = await this.performNearestAnalysis(request);
          break;
        case 'within':
          result = await this.performWithinAnalysis(request);
          break;
        case 'contains':
          result = await this.performContainsAnalysis(request);
          break;
        case 'custom':
          result = await this.performCustomAnalysis(request);
          break;
        default:
          return {
            success: false,
            error: `Unsupported operation type: ${request.operationType}`,
          };
      }

      return {
        success: true,
        result,
        metadata: {
          operationType: request.operationType,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error handling spatial analysis request:', error);
      await this.logActivity('error', `Spatial analysis error: ${error.message}`, {
        error: error.message,
      });

      return {
        success: false,
        error: `Failed to perform spatial analysis: ${error.message}`,
      };
    }
  }

  /**
   * Perform buffer analysis
   */
  private async performBufferAnalysis(request: SpatialAnalysisRequest): Promise<any> {
    // Get buffer parameters
    const distance = request.parameters?.distance || 1;
    const units = request.parameters?.units || 'kilometers';

    // Call GIS data service to perform the operation
    return this.gisDataService.bufferGeometry(request.geometryA, distance, { units: units as any });
  }

  /**
   * Perform intersection analysis
   */
  private async performIntersectionAnalysis(request: SpatialAnalysisRequest): Promise<any> {
    if (!request.geometryB) {
      throw new Error('Intersection operation requires geometryB');
    }

    // Call GIS data service to perform the operation
    return this.gisDataService.intersectionGeometry(request.geometryA, request.geometryB);
  }

  /**
   * Perform union analysis
   */
  private async performUnionAnalysis(request: SpatialAnalysisRequest): Promise<any> {
    if (!request.geometryB) {
      throw new Error('Union operation requires geometryB');
    }

    // Call GIS data service to perform the operation
    return this.gisDataService.unionGeometry(request.geometryA, request.geometryB);
  }

  /**
   * Perform difference analysis
   */
  private async performDifferenceAnalysis(request: SpatialAnalysisRequest): Promise<any> {
    if (!request.geometryB) {
      throw new Error('Difference operation requires geometryB');
    }

    // Call GIS data service to perform the operation
    return this.gisDataService.differenceGeometry(request.geometryA, request.geometryB);
  }

  /**
   * Perform nearest analysis
   */
  private async performNearestAnalysis(request: SpatialAnalysisRequest): Promise<any> {
    if (!request.geometryB) {
      throw new Error('Nearest operation requires geometryB (points to search)');
    }

    // Get parameters
    const maxResults = request.parameters?.maxResults || 1;

    // Call GIS data service to perform the operation
    return this.gisDataService.nearestPoints(request.geometryA, request.geometryB, maxResults);
  }

  /**
   * Perform within analysis
   */
  private async performWithinAnalysis(request: SpatialAnalysisRequest): Promise<any> {
    if (!request.geometryB) {
      throw new Error('Within operation requires geometryB');
    }

    // Call GIS data service to perform the operation
    return this.gisDataService.withinGeometry(request.geometryA, request.geometryB);
  }

  /**
   * Perform contains analysis
   */
  private async performContainsAnalysis(request: SpatialAnalysisRequest): Promise<any> {
    if (!request.geometryB) {
      throw new Error('Contains operation requires geometryB');
    }

    // Call GIS data service to perform the operation
    return this.gisDataService.containsGeometry(request.geometryA, request.geometryB);
  }

  /**
   * Perform custom analysis
   */
  private async performCustomAnalysis(request: SpatialAnalysisRequest): Promise<any> {
    // Implement custom analysis logic here
    // For demonstration purposes, we'll just return some metadata
    return {
      message: 'Custom analysis performed',
      geometryA: request.geometryA.type,
      geometryB: request.geometryB?.type,
      parameters: request.parameters,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle map styling requests
   */
  private async handleMapStylingRequest(message: any): Promise<any> {
    try {
      const request = message.data as MapStylingRequest;

      if (!request || !request.dataAttributes || !request.dataType || !request.purpose) {
        return {
          success: false,
          error: 'Invalid map styling request. Missing required parameters.',
        };
      }

      // Log the operation
      await this.logActivity('map_styling', `Processing styling for ${request.purpose} map`);

      // Generate styling based on parameters
      const styling = await this.generateMapStyling(request);

      return {
        success: true,
        styling,
        metadata: {
          purpose: request.purpose,
          dataType: request.dataType,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error handling map styling request:', error);
      await this.logActivity('error', `Map styling error: ${error.message}`, {
        error: error.message,
      });

      return {
        success: false,
        error: `Failed to generate map styling: ${error.message}`,
      };
    }
  }

  /**
   * Generate map styling
   */
  private async generateMapStyling(request: MapStylingRequest): Promise<any> {
    // If we have an LLM service, use it for intelligent styling
    if (this.llmService) {
      return await this.llmService.generateMapStyling(
        request.dataAttributes,
        request.dataType,
        request.purpose
      );
    }

    // Otherwise, use built-in styling logic
    let colorScheme;
    let symbolSize;
    let lineWidth;

    // Determine color scheme based on purpose and data type
    switch (request.purpose) {
      case 'thematic':
        colorScheme =
          request.dataType === 'categorical'
            ? ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
            : ['#edf8fb', '#b2e2e2', '#66c2a4', '#2ca25f', '#006d2c'];
        break;
      case 'reference':
        colorScheme = ['#f2f0f7', '#cbc9e2', '#9e9ac8', '#756bb1', '#54278f'];
        break;
      case 'analytical':
        colorScheme = ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'];
        break;
      default:
        colorScheme = ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#3182bd'];
    }

    // Determine symbol size based on data type
    symbolSize = request.dataType === 'categorical' ? 8 : 6;

    // Determine line width
    lineWidth = 1.5;

    // Generate styling configuration
    return {
      colorScheme,
      symbols: {
        size: symbolSize,
        opacity: 0.8,
      },
      lines: {
        width: lineWidth,
        opacity: 0.8,
      },
      labels: {
        enabled: true,
        font: 'Arial',
        size: 12,
        color: '#333333',
        halo: {
          color: '#ffffff',
          width: 2,
        },
      },
      classification: {
        method: request.dataType === 'numerical' ? 'quantile' : 'unique',
        breaks: 5,
      },
    };
  }

  /**
   * Handle feature detection requests
   */
  private async handleFeatureDetectionRequest(message: any): Promise<any> {
    try {
      const { data, options } = message;

      if (!data) {
        return {
          success: false,
          error: 'Invalid feature detection request. Missing data.',
        };
      }

      // Log the operation
      await this.logActivity('feature_detection', 'Processing feature detection request');

      // Placeholder for feature detection implementation
      // In a real implementation, this would call appropriate GIS data service methods

      return {
        success: true,
        result: {
          features: [
            { type: 'road', confidence: 0.95, geometry: {} },
            { type: 'building', confidence: 0.89, geometry: {} },
            { type: 'water', confidence: 0.97, geometry: {} },
          ],
          metadata: {
            timestamp: new Date().toISOString(),
            processingTime: '1.2s',
          },
        },
      };
    } catch (error) {
      console.error('Error handling feature detection request:', error);
      await this.logActivity('error', `Feature detection error: ${error.message}`, {
        error: error.message,
      });

      return {
        success: false,
        error: `Failed to detect features: ${error.message}`,
      };
    }
  }

  /**
   * Handle area analysis requests
   */
  private async handleAreaAnalysisRequest(message: any): Promise<any> {
    try {
      const { area, options } = message.data;

      if (!area) {
        return {
          success: false,
          error: 'Invalid area analysis request. Missing area geometry.',
        };
      }

      // Log the operation
      await this.logActivity('area_analysis', 'Processing area analysis request');

      // Placeholder for area analysis implementation
      // In a real implementation, this would call appropriate GIS data service methods

      return {
        success: true,
        result: {
          totalArea: 1250000, // square meters
          landUseBreakdown: {
            residential: 45.2,
            commercial: 12.8,
            industrial: 8.5,
            parks: 15.3,
            roads: 18.2,
          },
          demographics: {
            populationEstimate: 8500,
            householdCount: 3200,
            medianIncome: 72500,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            processingTime: '2.5s',
          },
        },
      };
    } catch (error) {
      console.error('Error handling area analysis request:', error);
      await this.logActivity('error', `Area analysis error: ${error.message}`, {
        error: error.message,
      });

      return {
        success: false,
        error: `Failed to analyze area: ${error.message}`,
      };
    }
  }
}
