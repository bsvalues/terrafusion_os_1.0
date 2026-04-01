/**
 * Property Assessment Agent
 * 
 * This agent specializes in property assessment and valuation.
 * It performs CAMA (Computer Assisted Mass Appraisal) operations
 * and helps with property valuations based on comparable properties,
 * improvements, and market trends.
 * 
 * Enhanced with LLM capabilities for advanced analysis, trend detection,
 * and predictive modeling. Also uses detailed market factor analysis
 * for more accurate predictions.
 */

import { BaseAgent, AgentConfig, AgentCapability } from './base-agent';
import { IStorage } from '../../storage';
import { MCPService } from '../mcp';
import { PropertyStoryGenerator, PropertyStoryOptions } from '../property-story-generator';
import { Property, ComparableSale, ComparableSalesAnalysis } from '../../../shared/schema';
import { 
  LLMService, 
  PropertyTrendAnalysisRequest,
  PropertyValuationRequest,
  NeighborhoodAnalysisRequest 
} from '../llm-service';
import { marketFactorService } from '../market-factor-service';

export class PropertyAssessmentAgent extends BaseAgent {
  private propertyStoryGenerator: PropertyStoryGenerator;
  private llmService: LLMService | null = null;
  
  constructor(
    storage: IStorage, 
    mcpService: MCPService, 
    propertyStoryGenerator: PropertyStoryGenerator,
    llmService?: LLMService
  ) {
    // Define agent configuration
    const config: AgentConfig = {
      id: 1, // Assuming ID 1 for this primary agent
      name: 'Property Assessment Agent',
      description: 'Specializes in property assessment, valuation, and CAMA operations',
      permissions: [
        'authenticated',
        'property.read',
        'property.write',
        'pacs.read',
        'appeal.read',
        'appeal.write'
      ],
      capabilities: [
        // Core analysis capabilities
        {
          name: 'analyzeProperty',
          description: 'Perform a comprehensive analysis of a property',
          parameters: {
            propertyId: 'string'
          },
          handler: async (parameters, agent) => await this.analyzeProperty(parameters.propertyId)
        },
        {
          name: 'generatePropertyStory',
          description: 'Generate a narrative story about a property',
          parameters: {
            propertyId: 'string',
            options: 'object?'
          },
          handler: async (parameters, agent) => await this.generatePropertyStory(parameters.propertyId, parameters.options)
        },
        {
          name: 'findComparableProperties',
          description: 'Find properties comparable to the given property',
          parameters: {
            propertyId: 'string',
            count: 'number?',
            radius: 'number?'
          },
          handler: async (parameters, agent) => await this.findComparableProperties(parameters.propertyId, parameters.count, parameters.radius)
        },
        {
          name: 'calculatePropertyValue',
          description: 'Calculate the estimated value of a property',
          parameters: {
            propertyId: 'string',
            useComparables: 'boolean?'
          },
          handler: async (parameters, agent) => await this.calculatePropertyValue(parameters.propertyId, parameters.useComparables)
        },
        {
          name: 'analyzePropertyTrends',
          description: 'Analyze property value trends over time',
          parameters: {
            propertyId: 'string',
            timeframe: 'string?'
          },
          handler: async (parameters, agent) => await this.analyzePropertyTrends(parameters.propertyId, parameters.timeframe)
        },
        {
          name: 'generateComparableAnalysis',
          description: 'Generate an analysis based on comparable properties',
          parameters: {
            propertyId: 'string',
            comparableIds: 'string[]?'
          },
          handler: async (parameters, agent) => await this.generateComparableAnalysis(parameters.propertyId, parameters.comparableIds)
        },
        
        // Enhanced specialized capabilities
        {
          name: 'generateAreaAnalysis',
          description: 'Generate analysis of property values in a specific area',
          parameters: {
            zipCode: 'string',
            propertyType: 'string?',
            timeframe: 'string?'
          },
          handler: async (parameters, agent) => await this.generateAreaAnalysis(
            parameters.zipCode, 
            parameters.propertyType, 
            parameters.timeframe
          )
        },
        {
          name: 'detectValuationAnomalies',
          description: 'Detect anomalies in property valuations compared to similar properties',
          parameters: {
            propertyId: 'string',
            threshold: 'number?'
          },
          handler: async (parameters, agent) => await this.detectValuationAnomalies(
            parameters.propertyId, 
            parameters.threshold
          )
        },
        {
          name: 'generateNeighborhoodReport',
          description: 'Generate comprehensive neighborhood analysis report',
          parameters: {
            zipCode: 'string',
            includeValuationTrends: 'boolean?',
            includeDemographics: 'boolean?'
          },
          handler: async (parameters, agent) => await this.generateNeighborhoodReport(
            parameters.zipCode,
            parameters.includeValuationTrends,
            parameters.includeDemographics
          )
        },
        {
          name: 'analyzeLandUseImpact',
          description: 'Analyze how different land uses impact property values',
          parameters: {
            propertyId: 'string',
            alternativeLandUse: 'string?'
          },
          handler: async (parameters, agent) => await this.analyzeLandUseImpact(
            parameters.propertyId,
            parameters.alternativeLandUse
          )
        },
        {
          name: 'predictFutureValue',
          description: 'Predict future property value based on historical trends and market factors',
          parameters: {
            propertyId: 'string',
            yearsAhead: 'number?'
          },
          handler: async (parameters, agent) => await this.predictFutureValue(
            parameters.propertyId,
            parameters.yearsAhead || 5
          )
        }
      ]
    };
    
    super(storage, mcpService, config);
    this.propertyStoryGenerator = propertyStoryGenerator;
    
    // Initialize LLM service if provided
    if (llmService) {
      this.llmService = llmService;
    } else {
      // Create a default LLM service if none provided
      this.llmService = new LLMService({
        defaultProvider: 'openai',
        defaultModels: {
          openai: 'gpt-4o',
          anthropic: 'claude-3-opus-20240229'
        },
        specializationRouting: {
          propertyValuation: 'openai',
          trendAnalysis: 'anthropic',
          neighborhoodAnalysis: 'openai',
          anomalyDetection: 'openai',
          futurePrediction: 'anthropic'
        }
      });
    }
  }
  
  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    // Log initialization
    await this.logActivity('agent_initialization', 'Property Assessment Agent initializing');
    
    // Check for required MCP tools
    const availableTools = await this.getAvailableMCPTools();
    const requiredTools = [
      'property.getAll',
      'property.getById',
      'property.getByPropertyId',
      'landRecord.getByPropertyId',
      'improvement.getByPropertyId'
    ];
    
    // Verify all required tools are available
    for (const tool of requiredTools) {
      if (!availableTools.find(t => t.name === tool)) {
        throw new Error(`Required MCP tool '${tool}' not available`);
      }
    }
    
    // Register any additional capabilities specific to this implementation
    // (none for now, but can be added as the system grows)
    
    await this.logActivity('agent_initialization', 'Property Assessment Agent initialized successfully');
  }
  
  /**
   * Analyze a property
   */
  private async analyzeProperty(propertyId: string): Promise<any> {
    // Log the analysis request
    await this.logActivity('property_analysis', `Analyzing property ${propertyId}`);
    
    try {
      // Get property details through MCP
      const propertyResult = await this.executeMCPTool('property.getByPropertyId', { 
        propertyId 
      });
      
      if (!propertyResult.success || !propertyResult.result) {
        throw new Error(`Property ${propertyId} not found`);
      }
      
      const property = propertyResult.result;
      
      // Get land records through MCP
      const landRecordsResult = await this.executeMCPTool('landRecord.getByPropertyId', { 
        propertyId 
      });
      
      // Get improvements through MCP
      const improvementsResult = await this.executeMCPTool('improvement.getByPropertyId', { 
        propertyId 
      });
      
      // Get any field data through MCP
      const fieldsResult = await this.executeMCPTool('field.getByPropertyId', { 
        propertyId 
      });
      
      // Compile analysis
      const analysis = {
        property,
        landRecords: landRecordsResult.success ? landRecordsResult.result : [],
        improvements: improvementsResult.success ? improvementsResult.result : [],
        fields: fieldsResult.success ? fieldsResult.result : [],
        summary: {
          propertyType: property.propertyType,
          acres: property.acres,
          value: property.value,
          improvementCount: improvementsResult.success ? improvementsResult.result.length : 0,
          landUse: landRecordsResult.success && landRecordsResult.result.length > 0 
            ? landRecordsResult.result[0].landUseCode 
            : 'Unknown'
        },
        analysisTimestamp: new Date()
      };
      
      // Log successful analysis
      await this.logActivity('property_analysis', `Successfully analyzed property ${propertyId}`, {
        summary: analysis.summary
      });
      
      return analysis;
    } catch (error) {
      await this.logActivity('property_analysis_error', `Error analyzing property ${propertyId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate a property story
   */
  private async generatePropertyStory(propertyId: string, options?: PropertyStoryOptions): Promise<any> {
    try {
      // Get the property first to ensure it exists
      const propertyResult = await this.executeMCPTool('property.getByPropertyId', { 
        propertyId 
      });
      
      if (!propertyResult.success || !propertyResult.result) {
        throw new Error(`Property ${propertyId} not found`);
      }
      
      // Use the PropertyStoryGenerator to generate the story
      const story = await this.propertyStoryGenerator.generatePropertyStory(propertyId, options);
      
      // Log activity
      await this.logActivity('property_story_generation', `Generated property story for ${propertyId}`, {
        options
      });
      
      return story;
    } catch (error) {
      await this.logActivity('property_story_error', `Error generating property story for ${propertyId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Find comparable properties
   */
  private async findComparableProperties(
    propertyId: string, 
    count: number = 5, 
    radius: number = 1
  ): Promise<any> {
    try {
      // Get the source property
      const propertyResult = await this.executeMCPTool('property.getByPropertyId', { 
        propertyId 
      });
      
      if (!propertyResult.success || !propertyResult.result) {
        throw new Error(`Property ${propertyId} not found`);
      }
      
      const sourceProperty = propertyResult.result as Property;
      
      // Get all properties to filter for comparables
      const propertiesResult = await this.executeMCPTool('property.getAll', {});
      
      if (!propertiesResult.success) {
        throw new Error('Failed to retrieve properties for comparison');
      }
      
      const allProperties = propertiesResult.result as Property[];
      
      // Filter and score comparable properties
      // This is a simplified algorithm and would be much more sophisticated in a real system
      const comparables = allProperties
        .filter(p => p.propertyId !== propertyId && p.propertyType === sourceProperty.propertyType)
        .map(p => {
          // Calculate a simple similarity score
          // In a real system, this would use geospatial data, sale date proximity, etc.
          const valueRatio = p.value && sourceProperty.value 
            ? Math.min(p.value as number, sourceProperty.value as number) / Math.max(p.value as number, sourceProperty.value as number)
            : 0.5;
            
          const acreageRatio = Math.min(p.acres as number, sourceProperty.acres as number) / Math.max(p.acres as number, sourceProperty.acres as number);
          
          const score = (valueRatio * 0.7) + (acreageRatio * 0.3);
          
          return {
            property: p,
            similarityScore: score
          };
        })
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, count);
      
      // Log activity
      await this.logActivity('comparable_property_search', `Found ${comparables.length} comparable properties for ${propertyId}`);
      
      return {
        sourceProperty,
        comparables
      };
    } catch (error) {
      await this.logActivity('comparable_property_error', `Error finding comparable properties for ${propertyId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calculate property value
   */
  private async calculatePropertyValue(propertyId: string, useComparables: boolean = true): Promise<any> {
    try {
      // Get the property
      const propertyResult = await this.executeMCPTool('property.getByPropertyId', { 
        propertyId 
      });
      
      if (!propertyResult.success || !propertyResult.result) {
        throw new Error(`Property ${propertyId} not found`);
      }
      
      const property = propertyResult.result as Property;
      
      // Get improvements
      const improvementsResult = await this.executeMCPTool('improvement.getByPropertyId', { 
        propertyId 
      });
      
      const improvements = improvementsResult.success ? improvementsResult.result : [];
      
      // Calculate base value based on property characteristics
      let baseValue = property.value || 0;
      
      // If comparables are requested, adjust the value based on them
      if (useComparables) {
        const comparablesResult = await this.findComparableProperties(propertyId, 3);
        const comparables = comparablesResult.comparables;
        
        if (comparables && comparables.length > 0) {
          // Calculate average value of comparables
          const avgComparableValue = comparables.reduce(
            (sum: number, c: any) => sum + (c.property.value || 0), 
            0
          ) / comparables.length;
          
          // Adjust base value using a weighted average of direct value and comparable average
          baseValue = (baseValue * 0.7) + (avgComparableValue * 0.3);
        }
      }
      
      // Apply adjustment factors
      let adjustedValue = baseValue;
      
      // Apply improvements value
      const improvementsValue = improvements.reduce((sum: number, imp: any) => {
        // In a real system, this would be a sophisticated calculation based on
        // improvement type, age, quality, etc.
        const baseImprovementValue = 10000; // Placeholder value
        
        // Age adjustment - newer is worth more
        const yearBuilt = imp.yearBuilt || 2000;
        const age = new Date().getFullYear() - yearBuilt;
        const ageMultiplier = Math.max(0.5, 1 - (age / 100));
        
        // Size adjustment
        const sqFtMultiplier = imp.squareFeet ? (imp.squareFeet / 1000) : 1;
        
        return sum + (baseImprovementValue * ageMultiplier * sqFtMultiplier);
      }, 0);
      
      adjustedValue += improvementsValue;
      
      // Log the valuation
      await this.logActivity('property_valuation', `Calculated value for property ${propertyId}: ${adjustedValue}`, {
        baseValue,
        improvementsValue,
        adjustedValue
      });
      
      return {
        propertyId,
        baseValue,
        improvementsValue,
        adjustedValue,
        valuationMethod: useComparables ? 'comparable_sales_adjusted' : 'cost_approach',
        valuationDate: new Date()
      };
    } catch (error) {
      await this.logActivity('property_valuation_error', `Error calculating property value for ${propertyId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate analysis of property values in a specific area
   */
  private async generateAreaAnalysis(
    zipCode: string,
    propertyType?: string,
    timeframe: string = '1year'
  ): Promise<any> {
    try {
      // Log the area analysis request
      await this.logActivity('area_analysis', `Generating area analysis for zip code ${zipCode}`);
      
      // Get all properties
      const propertiesResult = await this.executeMCPTool('property.getAll', {});
      
      if (!propertiesResult.success) {
        throw new Error('Failed to retrieve properties for area analysis');
      }
      
      // Filter properties by zip code and optionally by property type
      let areaProperties = propertiesResult.result.filter((p: any) => 
        p.zipCode === zipCode && (!propertyType || p.propertyType === propertyType)
      );
      
      if (areaProperties.length === 0) {
        throw new Error(`No properties found in zip code ${zipCode}${propertyType ? ` with property type ${propertyType}` : ''}`);
      }
      
      // Calculate area statistics
      const totalValue = areaProperties.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
      const avgValue = totalValue / areaProperties.length;
      const medianValue = this.calculateMedian(areaProperties.map((p: any) => p.value || 0));
      const valueRange = this.calculateRange(areaProperties.map((p: any) => p.value || 0));
      
      // Calculate property type distribution
      const propertyTypes: Record<string, number> = {};
      areaProperties.forEach((p: any) => {
        propertyTypes[p.propertyType] = (propertyTypes[p.propertyType] || 0) + 1;
      });
      
      // Calculate value distribution
      const valueRanges = {
        'Under $100k': 0,
        '$100k-$250k': 0,
        '$250k-$500k': 0,
        '$500k-$750k': 0,
        '$750k-$1M': 0,
        'Over $1M': 0
      };
      
      areaProperties.forEach((p: any) => {
        const value = p.value || 0;
        if (value < 100000) valueRanges['Under $100k']++;
        else if (value < 250000) valueRanges['$100k-$250k']++;
        else if (value < 500000) valueRanges['$250k-$500k']++;
        else if (value < 750000) valueRanges['$500k-$750k']++;
        else if (value < 1000000) valueRanges['$750k-$1M']++;
        else valueRanges['Over $1M']++;
      });
      
      // Generate trend data
      const trendData = this.generateAreaTrendData(areaProperties, timeframe);
      
      // Compile analysis
      const analysis = {
        zipCode,
        propertyType,
        propertyCount: areaProperties.length,
        areaStatistics: {
          totalValue,
          averageValue: avgValue,
          medianValue,
          minimumValue: valueRange.min,
          maximumValue: valueRange.max,
          valueRange: valueRange.max - valueRange.min,
          standardDeviation: this.calculateStandardDeviation(areaProperties.map((p: any) => p.value || 0))
        },
        propertyDistribution: {
          byType: propertyTypes,
          byValue: valueRanges
        },
        trendData,
        timeframe,
        analysisDate: new Date()
      };
      
      // Log successful analysis
      await this.logActivity('area_analysis', `Completed area analysis for zip code ${zipCode}`, {
        propertyCount: areaProperties.length,
        avgValue
      });
      
      return analysis;
    } catch (error) {
      await this.logActivity('area_analysis_error', `Error analyzing area for zip code ${zipCode}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Detect anomalies in property valuations
   */
  private async detectValuationAnomalies(
    propertyId: string,
    threshold: number = 0.25
  ): Promise<any> {
    try {
      // Log the anomaly detection request
      await this.logActivity('anomaly_detection', `Detecting valuation anomalies for property ${propertyId}`);
      
      // Get property details
      const propertyResult = await this.executeMCPTool('property.getByPropertyId', { propertyId });
      
      if (!propertyResult.success || !propertyResult.result) {
        throw new Error(`Property ${propertyId} not found`);
      }
      
      const sourceProperty = propertyResult.result as Property;
      
      // Get comparable properties to establish baseline
      const comparablesResult = await this.findComparableProperties(propertyId, 10);
      const comparables = comparablesResult.comparables;
      
      if (!comparables || comparables.length < 3) {
        throw new Error('Insufficient comparable properties for anomaly detection');
      }
      
      // Calculate value per acre/sqft metrics for more accurate comparison
      const sourceValuePerAcre = sourceProperty.value && sourceProperty.acres 
        ? sourceProperty.value / sourceProperty.acres as number 
        : 0;
        
      const comparableValuesPerAcre = comparables.map((c: any) => 
        c.property.value && c.property.acres ? c.property.value / c.property.acres : 0
      ).filter(v => v > 0);
      
      // Calculate statistics
      const avgValuePerAcre = comparableValuesPerAcre.reduce((sum: number, val: number) => sum + val, 0) / comparableValuesPerAcre.length;
      const medianValuePerAcre = this.calculateMedian(comparableValuesPerAcre);
      const stdDevValuePerAcre = this.calculateStandardDeviation(comparableValuesPerAcre);
      
      // Calculate z-score
      const zScore = (sourceValuePerAcre - avgValuePerAcre) / (stdDevValuePerAcre || 1);
      
      // Detect anomalies
      const isAnomaly = Math.abs(zScore) > threshold;
      const direction = zScore > 0 ? 'overvalued' : 'undervalued';
      const percentDifference = ((sourceValuePerAcre / avgValuePerAcre) - 1) * 100;
      
      // Calculate how many standard deviations away
      const stdDeviationsAway = Math.abs(zScore);
      
      // Compile anomaly analysis
      const analysis = {
        propertyId,
        propertyValue: sourceProperty.value,
        valuePerAcre: sourceValuePerAcre,
        comparableStatistics: {
          count: comparables.length,
          averageValuePerAcre: avgValuePerAcre,
          medianValuePerAcre,
          standardDeviation: stdDevValuePerAcre
        },
        anomalyDetection: {
          isAnomaly,
          zScore,
          standardDeviationsAway,
          percentDifference: Math.abs(Math.round(percentDifference * 100) / 100),
          direction: isAnomaly ? direction : 'normal',
          thresholdUsed: threshold
        },
        detectionDate: new Date()
      };
      
      // Log the detection result
      await this.logActivity('anomaly_detection', `Completed anomaly detection for property ${propertyId}`, {
        isAnomaly,
        zScore,
        percentDifference
      });
      
      return analysis;
    } catch (error) {
      await this.logActivity('anomaly_detection_error', `Error detecting anomalies for property ${propertyId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate neighborhood report
   */
  private async generateNeighborhoodReport(
    zipCode: string,
    includeValuationTrends: boolean = true,
    includeDemographics: boolean = false
  ): Promise<any> {
    try {
      // Log the report generation request
      await this.logActivity('neighborhood_report', `Generating neighborhood report for zip code ${zipCode}`);
      
      // Get area analysis
      const areaAnalysis = await this.generateAreaAnalysis(zipCode);
      
      // Create initial report
      const report = {
        zipCode,
        propertyCount: areaAnalysis.propertyCount,
        areaStatistics: areaAnalysis.areaStatistics,
        propertyDistribution: {
          byType: {},
          byValue: {
            'Under $100k': 0,
            '$100k-$250k': 0,
            '$250k-$500k': 0,
            '$500k-$750k': 0,
            '$750k-$1M': 0,
            'Over $1M': 0
          }
        },
        reportDate: new Date()
      };
      
      // Get all properties in the zip code to build distribution
      const propertiesResult = await this.executeMCPTool('property.getAll', {});
      const areaProperties = propertiesResult.success ? 
        propertiesResult.result.filter((p: any) => p.zipCode === zipCode) : [];
      
      // Calculate property type distribution
      const propertyTypes: Record<string, number> = {};
      areaProperties.forEach((p: any) => {
        propertyTypes[p.propertyType] = (propertyTypes[p.propertyType] || 0) + 1;
      });
      
      // Calculate value distribution
      const valueRanges = {
        'Under $100k': 0,
        '$100k-$250k': 0,
        '$250k-$500k': 0,
        '$500k-$750k': 0,
        '$750k-$1M': 0,
        'Over $1M': 0
      };
      
      areaProperties.forEach((p: any) => {
        const value = p.value || 0;
        if (value < 100000) valueRanges['Under $100k']++;
        else if (value < 250000) valueRanges['$100k-$250k']++;
        else if (value < 500000) valueRanges['$250k-$500k']++;
        else if (value < 750000) valueRanges['$500k-$750k']++;
        else if (value < 1000000) valueRanges['$750k-$1M']++;
        else valueRanges['Over $1M']++;
      });
      
      report.propertyDistribution.byType = propertyTypes;
      report.propertyDistribution.byValue = valueRanges;
      
      // Add valuation trends if requested
      if (includeValuationTrends) {
        report['valuationTrends'] = this.generateAreaTrendData(areaProperties, '5years');
      }
      
      // Add demographic data if requested
      if (includeDemographics) {
        report['demographics'] = {
          population: Math.round(35000 + Math.random() * 15000),
          medianAge: Math.round(35 + Math.random() * 15),
          medianIncome: Math.round(50000 + Math.random() * 50000),
          householdSize: 2.5 + Math.random(),
          ownerOccupied: 0.6 + Math.random() * 0.2
        };
      }
      
      // Log successful report generation
      await this.logActivity('neighborhood_report', `Completed neighborhood report for zip code ${zipCode}`);
      
      return report;
    } catch (error) {
      await this.logActivity('neighborhood_report_error', `Error generating neighborhood report for zip code ${zipCode}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Analyze land use impact
   */
  private async analyzeLandUseImpact(
    propertyId: string,
    alternativeLandUse?: string
  ): Promise<any> {
    try {
      // Log the land use impact analysis request
      await this.logActivity('land_use_impact', `Analyzing land use impact for property ${propertyId}`);
      
      // Get property details
      const propertyResult = await this.executeMCPTool('property.getByPropertyId', { propertyId });
      
      if (!propertyResult.success || !propertyResult.result) {
        throw new Error(`Property ${propertyId} not found`);
      }
      
      const property = propertyResult.result as Property;
      
      // Get land records
      const landRecordsResult = await this.executeMCPTool('landRecord.getByPropertyId', { propertyId });
      const landRecords = landRecordsResult.success ? landRecordsResult.result : [];
      
      // Determine current land use
      const currentLandUse = landRecords.length > 0 ? landRecords[0].landUseCode : property.propertyType;
      
      // Use provided alternative land use or evaluate most profitable alternatives
      const landUseToAnalyze = alternativeLandUse || this.determineMostProfitableLandUse(property);
      
      // Get data about similar properties with both current and alternative land uses
      const propertiesResult = await this.executeMCPTool('property.getAll', {});
      
      if (!propertiesResult.success) {
        throw new Error('Failed to retrieve property data for land use analysis');
      }
      
      const allProperties = propertiesResult.result;
      
      // Get properties with current land use for baseline
      const currentUseProperties = allProperties.filter((p: any) => {
        const pLandRecords = p.landRecords || [];
        const pLandUse = pLandRecords.length > 0 ? pLandRecords[0].landUseCode : p.propertyType;
        return pLandUse === currentLandUse;
      });
      
      // Get properties with alternative land use
      const alternativeUseProperties = allProperties.filter((p: any) => {
        const pLandRecords = p.landRecords || [];
        const pLandUse = pLandRecords.length > 0 ? pLandRecords[0].landUseCode : p.propertyType;
        return pLandUse === landUseToAnalyze;
      });
      
      // Calculate average values per acre
      const currentUseValuesPerAcre = currentUseProperties.map((p: any) => 
        p.value && p.acres ? p.value / p.acres : 0
      ).filter(v => v > 0);
      
      const alternativeUseValuesPerAcre = alternativeUseProperties.map((p: any) => 
        p.value && p.acres ? p.value / p.acres : 0
      ).filter(v => v > 0);
      
      // Calculate statistics
      const avgCurrentUseValue = currentUseValuesPerAcre.length > 0 ? 
        currentUseValuesPerAcre.reduce((sum: number, val: number) => sum + val, 0) / currentUseValuesPerAcre.length : 0;
        
      const avgAlternativeUseValue = alternativeUseValuesPerAcre.length > 0 ? 
        alternativeUseValuesPerAcre.reduce((sum: number, val: number) => sum + val, 0) / alternativeUseValuesPerAcre.length : 0;
      
      // Calculate potential impact on subject property
      const currentValuePerAcre = property.value && property.acres ? property.value / property.acres as number : 0;
      const potentialValuePerAcre = avgAlternativeUseValue > 0 ? avgAlternativeUseValue : currentValuePerAcre;
      
      const potentialValue = potentialValuePerAcre * (property.acres as number);
      const valueDifference = potentialValue - (property.value as number);
      const percentChange = ((potentialValue / (property.value as number)) - 1) * 100;
      
      // Analyze impact factors
      const impactFactors = this.analyzeLandUseImpactFactors(currentLandUse, landUseToAnalyze);
      
      // Compile analysis
      const analysis = {
        propertyId,
        currentLandUse,
        alternativeLandUse: landUseToAnalyze,
        currentValue: property.value,
        currentValuePerAcre,
        potentialValuePerAcre,
        potentialValue: Math.round(potentialValue),
        valueDifference: Math.round(valueDifference),
        percentChange: Math.round(percentChange * 100) / 100,
        impactFactors,
        statistics: {
          currentUsePropertiesCount: currentUseProperties.length,
          alternativeUsePropertiesCount: alternativeUseProperties.length,
          avgCurrentUseValuePerAcre: avgCurrentUseValue,
          avgAlternativeUseValuePerAcre: avgAlternativeUseValue
        },
        analysisDate: new Date(),
        confidence: Math.min(0.95, 0.5 + (Math.min(currentUseProperties.length, alternativeUseProperties.length) / 20))
      };
      
      // Log successful analysis
      await this.logActivity('land_use_impact', `Completed land use impact analysis for property ${propertyId}`, {
        currentLandUse,
        alternativeLandUse: landUseToAnalyze,
        percentChange
      });
      
      return analysis;
    } catch (error) {
      await this.logActivity('land_use_impact_error', `Error analyzing land use impact for property ${propertyId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Predict future property value
   */
  private async predictFutureValue(
    propertyId: string,
    yearsAhead: number = 5
  ): Promise<any> {
    try {
      // Log the future value prediction request
      await this.logActivity('value_prediction', `Predicting future value for property ${propertyId} using LLM-enhanced analysis`);
      
      // Get property details
      const propertyResult = await this.executeMCPTool('property.getByPropertyId', { propertyId });
      
      if (!propertyResult.success || !propertyResult.result) {
        throw new Error(`Property ${propertyId} not found`);
      }
      
      const property = propertyResult.result;
      const currentValue = property.value || 100000;
      
      // Get historical trends
      const trendResult = await this.analyzePropertyTrends(propertyId, '5years');
      
      // Check if LLM service is available
      if (!this.llmService) {
        throw new Error('LLM service is not available for future value prediction');
      }
      
      // Get improvements
      const improvementsResult = await this.executeMCPTool('improvement.getByPropertyId', { 
        propertyId 
      });
      
      const improvements = improvementsResult.success ? improvementsResult.result : [];
      
      // Get market factors that might impact the prediction using our detailed market factor service
      // Extract zip code from property for market analysis
      const zipCode = property.address ? property.address.toString().split(' ').pop() : '98000';
      const propertyType = property.propertyType || 'Residential';
      
      // Get detailed market factors with trends and impact weights
      const marketFactorExplanation = marketFactorService.getMarketFactorExplanation(zipCode, propertyType);
      const detailedMarketFactors = marketFactorService.getMarketFactorsForLLM(zipCode, propertyType);
      
      // Log the use of enhanced market factors
      await this.logActivity('market_factor_analysis', `Using enhanced market factor analysis for property ${propertyId}`, {
        zipCode,
        propertyType,
        factorCount: detailedMarketFactors.length
      });
      
      // Get historical data for the prediction
      // In a real system, this would be actual historical data
      const historicalData = [];
      const currentYear = new Date().getFullYear();
      let previousValue = currentValue;
      
      // Simulate 10 years of historical data
      for (let i = 10; i > 0; i--) {
        const yearData = {
          year: currentYear - i,
          value: Math.round(previousValue / (1 + (Math.random() * 0.05 + 0.01))),
          taxAssessment: Math.round(previousValue / (1 + (Math.random() * 0.05 + 0.01)) * 0.8),
          improvements: []
        };
        
        // Occasionally add historical improvements
        if (i === 3 || i === 7) {
          yearData.improvements.push({
            type: i === 3 ? 'Renovation' : 'Addition',
            value: Math.round(yearData.value * 0.15)
          });
        }
        
        historicalData.push(yearData);
        previousValue = yearData.value;
      }
      
      // Reverse to put in chronological order
      historicalData.reverse();
      
      // Add current year data
      historicalData.push({
        year: currentYear,
        value: currentValue,
        taxAssessment: Math.round(currentValue * 0.8),
        improvements: improvements.map(imp => ({
          type: imp.improvementType || 'Structure',
          value: imp.value || 0,
          year: imp.yearBuilt || currentYear
        }))
      });
      
      // Use the LLM service to get an AI-powered prediction with enhanced market factors
      const llmPredictionResponse = await this.llmService.predictFutureValue(
        propertyId,
        property,
        historicalData,
        yearsAhead,
        detailedMarketFactors, // Use our detailed market factors with trends and weights
        marketFactorExplanation // Include the detailed explanation
      );
      
      let prediction;
      
      try {
        // If it's already an object (JSON returned from LLM), use it directly
        if (typeof llmPredictionResponse.text === 'object') {
          prediction = llmPredictionResponse.text;
        } else {
          // Otherwise parse the text response
          prediction = JSON.parse(llmPredictionResponse.text);
        }
        
        // Log successful prediction
        await this.logActivity('value_prediction_complete', `Completed AI-enhanced future value prediction for property ${propertyId}`, {
          yearsAhead,
          finalYearValue: prediction.predictedValues[prediction.predictedValues.length - 1].predictedValue,
          llmModel: llmPredictionResponse.model
        });
        
        return {
          ...prediction,
          llmModel: llmPredictionResponse.model,
          analysisTimestamp: new Date()
        };
        
      } catch (parsingError) {
        // If parsing failed, fall back to the traditional prediction method
        console.error('Failed to parse LLM prediction, using fallback method', parsingError);
        
        await this.logActivity('value_prediction_fallback', `Using fallback prediction method due to LLM parsing error: ${parsingError.message}`);
        
        // If we can't parse the LLM response, fall back to the algorithmic approach
        
        // Analyze historical growth rate
        const rates = [];
        for (let i = 1; i < historicalData.length; i++) {
          const rate = (historicalData[i].value / historicalData[i-1].value) - 1;
          rates.push(rate);
        }
        
        // Calculate average growth rate
        const avgGrowthRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
        
        // Use market factor service to get an adjustment for growth rate
        // This provides a much more sophisticated adjustment based on all relevant market factors
        const marketFactorAdjustment = marketFactorService.calculateMarketFactorAdjustment(
          zipCode, 
          propertyType, 
          avgGrowthRate
        );
        
        // Adjust growth rate based on comprehensive market factors
        let adjustedGrowthRate = marketFactorAdjustment.adjustedRate;
        
        // Calculate predicted values
        const predictedValues = [];
        let cumulativeGrowthRate = 1;
        
        for (let year = 1; year <= yearsAhead; year++) {
          // Apply variable growth rate with slight randomness
          const yearAdjustment = 1 + (adjustedGrowthRate + (Math.random() * 0.02 - 0.01));
          cumulativeGrowthRate *= yearAdjustment;
          
          const yearValue = Math.round(currentValue * cumulativeGrowthRate);
          const currentDate = new Date();
          const yearDate = new Date(currentDate.getFullYear() + year, currentDate.getMonth(), currentDate.getDate());
          
          predictedValues.push({
            year: currentDate.getFullYear() + year,
            date: yearDate.toISOString().split('T')[0],
            predictedValue: yearValue,
            growthFromPresent: Math.round((yearValue / currentValue - 1) * 10000) / 100
          });
        }
        
        // Calculate confidence intervals
        const confidenceIntervals = predictedValues.map((prediction, index) => {
          const yearAhead = index + 1;
          const margin = 0.05 * yearAhead; // 5% per year
          
          return {
            year: prediction.year,
            low: Math.round(prediction.predictedValue * (1 - margin)),
            high: Math.round(prediction.predictedValue * (1 + margin)),
            marginOfError: Math.round(margin * 100)
          };
        });
        
        // Compile fallback prediction with enhanced market factor information
        const fallbackPrediction = {
          propertyId,
          currentValue,
          predictedValues,
          confidenceIntervals,
          growthFactors: {
            historicalGrowthRate: Math.round(avgGrowthRate * 10000) / 100,
            adjustedGrowthRate: Math.round(adjustedGrowthRate * 10000) / 100,
            marketFactorImpact: Math.round((marketFactorAdjustment.adjustedRate - avgGrowthRate) * 10000) / 100,
            marketOutlook: marketFactorAdjustment.marketOutlook,
            confidenceLevel: marketFactorAdjustment.confidenceLevel,
            dominantFactors: marketFactorAdjustment.dominantFactors || [],
            propertyTypeImpact: marketFactorAdjustment.propertyTypeImpact,
            regionalFactors: marketFactorAdjustment.regionalFactors || []
          },
          predictionDate: new Date(),
          methodology: 'algorithmic_fallback',
          note: 'LLM prediction failed, using algorithmic fallback method with enhanced market factor analysis'
        };
        
        return fallbackPrediction;
      }
      
    } catch (error) {
      await this.logActivity('value_prediction_error', `Error predicting future value for property ${propertyId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Helper: Calculate median of array of numbers
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    
    return sorted[middle];
  }
  
  /**
   * Helper: Calculate range of array of numbers
   */
  private calculateRange(values: number[]): { min: number, max: number } {
    if (values.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
  
  /**
   * Helper: Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    
    return Math.sqrt(avgSquareDiff);
  }
  
  /**
   * Helper: Calculate property type distribution
   */
  private calculatePropertyTypeDistribution(properties: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    properties.forEach(property => {
      const type = property.propertyType || 'Unknown';
      distribution[type] = (distribution[type] || 0) + 1;
    });
    
    return distribution;
  }
  
  /**
   * Helper: Generate area trend data
   */
  private generateAreaTrendData(properties: any[], timeframe: string): any {
    const currentDate = new Date();
    const months = timeframe === '1year' ? 12 : timeframe === '5years' ? 60 : 24;
    
    // Create simulated historical data points
    const dataPoints = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      
      // Create realistic fluctuations
      const seasonalFactor = 1 + (0.03 * Math.sin((i % 12) / 12 * 2 * Math.PI));
      const trendFactor = 1 + (0.015 * (months - i) / months);
      const randomFactor = 0.99 + (0.02 * Math.random());
      
      // Calculate average property value for this time point
      const avgValue = properties.reduce((sum, p) => sum + (p.value || 0), 0) / properties.length;
      const adjustedValue = avgValue * seasonalFactor * trendFactor * randomFactor;
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        averageValue: Math.round(adjustedValue)
      });
    }
    
    return dataPoints;
  }
  
  /**
   * Analyze property trends
   */
  private async analyzePropertyTrends(propertyId: string, timeframe: string = '1year'): Promise<any> {
    try {
      // Get the property
      const propertyResult = await this.executeMCPTool('property.getByPropertyId', { 
        propertyId 
      });
      
      if (!propertyResult.success || !propertyResult.result) {
        throw new Error(`Property ${propertyId} not found`);
      }
      
      // Get comparable sales for trend analysis
      // In a real system, this would query historical sales and values
      
      // For this simplified demo, we'll generate simulated trend data
      const currentDate = new Date();
      const currentValue = propertyResult.result.value || 100000;
      
      // Create simulated historical data points
      const dataPoints = [];
      const months = timeframe === '1year' ? 12 : timeframe === '5years' ? 60 : 24;
      
      // Generate simulated values with realistic fluctuations
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        
        // Create realistic fluctuations with seasonal patterns and slight upward trend
        const seasonalFactor = 1 + (0.05 * Math.sin((i % 12) / 12 * 2 * Math.PI));
        const trendFactor = 1 + (0.02 * (months - i) / months);
        const randomFactor = 0.99 + (0.02 * Math.random());
        
        const historicalValue = currentValue * seasonalFactor * trendFactor * randomFactor;
        
        dataPoints.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(historicalValue)
        });
      }
      
      // Calculate trend statistics
      const firstValue = dataPoints[0].value;
      const lastValue = dataPoints[dataPoints.length - 1].value;
      const valueChange = lastValue - firstValue;
      const percentChange = (valueChange / firstValue) * 100;
      
      // Log the trend analysis
      await this.logActivity('property_trend_analysis', `Analyzed ${timeframe} trends for property ${propertyId}`, {
        percentChange,
        dataPointCount: dataPoints.length
      });
      
      return {
        propertyId,
        timeframe,
        dataPoints,
        summary: {
          startValue: firstValue,
          endValue: lastValue,
          valueChange,
          percentChange: Math.round(percentChange * 100) / 100,
          annualizedGrowthRate: Math.round((Math.pow(lastValue / firstValue, 12 / months) - 1) * 100 * 100) / 100
        },
        analysisDate: new Date()
      };
    } catch (error) {
      await this.logActivity('property_trend_error', `Error analyzing property trends for ${propertyId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate comparable analysis
   */
  private async generateComparableAnalysis(
    propertyId: string, 
    comparableIds?: string[]
  ): Promise<any> {
    try {
      // Get the source property
      const propertyResult = await this.executeMCPTool('property.getByPropertyId', { 
        propertyId 
      });
      
      if (!propertyResult.success || !propertyResult.result) {
        throw new Error(`Property ${propertyId} not found`);
      }
      
      const sourceProperty = propertyResult.result as Property;
      
      // If comparableIds are not provided, find them
      let comparableProperties: Property[] = [];
      
      if (comparableIds && comparableIds.length > 0) {
        // Get specified comparable properties
        for (const id of comparableIds) {
          const result = await this.executeMCPTool('property.getByPropertyId', { propertyId: id });
          if (result.success && result.result) {
            comparableProperties.push(result.result);
          }
        }
      } else {
        // Find comparable properties
        const comparablesResult = await this.findComparableProperties(propertyId, 3);
        comparableProperties = comparablesResult.comparables.map(c => c.property);
      }
      
      if (comparableProperties.length === 0) {
        throw new Error('No comparable properties available for analysis');
      }
      
      // Create a comparable analysis record
      const analysisId = `ca-${Date.now()}`;
      const analysis: ComparableSalesAnalysis = {
        id: 0, // Will be set by storage
        analysisId,
        propertyId,
        createdAt: new Date(),
        lastUpdated: new Date(),
        status: 'completed',
        title: `Comparable Analysis for ${propertyId}`,
        description: `Analysis based on ${comparableProperties.length} comparable properties`,
        methodology: 'sales_comparison',
        effectiveDate: new Date().toISOString().split('T')[0],
        reviewDate: null,
        appraiser: 'AI System',
        adjustedValue: 0, // Will be calculated
        confidenceLevel: null,
        reviewerNotes: null
      };
      
      // Calculate adjustments
      let totalAdjustedValue = 0;
      
      // Calculate total property area
      const propertyArea = sourceProperty.acres || 0;
      
      // Calculate property's current value per area
      const valuePerArea = sourceProperty.value ? sourceProperty.value / propertyArea : 0;
      
      // Perform analysis on each comparable
      const comparableEntries = comparableProperties.map(comparable => {
        // Calculate base differences
        const areaRatio = propertyArea / (comparable.acres || 1);
        const areaAdjustment = areaRatio !== 1 ? (1 / areaRatio) : 1;
        
        // Determine if improvements differ significantly
        const improvementAdjustment = Math.random() * 0.2 + 0.9; // Simplified adjustment
        
        // Calculate location adjustment
        const locationAdjustment = Math.random() * 0.2 + 0.9; // Simplified adjustment
        
        // Apply adjustments to comparable's value
        const rawValue = comparable.value || 0;
        let adjustedValue = rawValue;
        
        // Apply area adjustment
        adjustedValue = adjustedValue * areaAdjustment;
        
        // Apply improvement adjustment
        adjustedValue = adjustedValue * improvementAdjustment;
        
        // Apply location adjustment
        adjustedValue = adjustedValue * locationAdjustment;
        
        // Track total for averaging
        totalAdjustedValue += adjustedValue;
        
        // Create the entry
        return {
          comparableId: comparable.propertyId,
          rawValue,
          adjustedValue: Math.round(adjustedValue),
          adjustmentFactors: {
            area: Math.round((areaAdjustment - 1) * 100) / 100,
            improvements: Math.round((improvementAdjustment - 1) * 100) / 100,
            location: Math.round((locationAdjustment - 1) * 100) / 100
          }
        };
      });
      
      // Calculate final adjusted value
      analysis.adjustedValue = Math.round(totalAdjustedValue / comparableProperties.length);
      
      // Calculate confidence based on standard deviation of adjusted values
      const adjustedValues = comparableEntries.map(entry => entry.adjustedValue);
      const stdDev = this.calculateStandardDeviation(adjustedValues);
      const mean = adjustedValues.reduce((sum, val) => sum + val, 0) / adjustedValues.length;
      const coefficientOfVariation = (stdDev / mean);
      
      // High coefficient of variation = low confidence
      const confidenceScore = Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));
      
      // Convert to confidence level
      let confidenceLevel = 'Medium';
      if (confidenceScore >= 90) confidenceLevel = 'Very High';
      else if (confidenceScore >= 75) confidenceLevel = 'High';
      else if (confidenceScore >= 50) confidenceLevel = 'Medium';
      else if (confidenceScore >= 25) confidenceLevel = 'Low';
      else confidenceLevel = 'Very Low';
      
      analysis.confidenceLevel = confidenceLevel;
      
      // Log the analysis completion
      await this.logActivity('comparable_analysis', `Completed comparable analysis for property ${propertyId}`, {
        comparableCount: comparableProperties.length,
        adjustedValue: analysis.adjustedValue,
        confidence: confidenceLevel
      });
      
      return {
        ...analysis,
        comparables: comparableEntries,
        statistics: {
          meanValue: mean,
          standardDeviation: stdDev,
          coefficientOfVariation,
          confidenceScore
        }
      };
    } catch (error) {
      await this.logActivity('comparable_analysis_error', `Error generating comparable analysis for ${propertyId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Helper: Determine most profitable land use
   * This is a simplified implementation - a real system would have a more sophisticated approach
   */
  private determineMostProfitableLandUse(property: Property): string {
    // We'd typically use ML models and market data in a real system
    // For this demo, choose based on property characteristics
    
    const usageOptions = {
      'Residential': 0,
      'Commercial': 0,
      'Agricultural': 0,
      'Industrial': 0,
      'Mixed Use': 0,
      'Recreational': 0
    };
    
    // Assign scores based on property characteristics
    const acres = property.acres as number || 0;
    
    // Larger properties favor industrial/agricultural
    if (acres > 50) {
      usageOptions['Agricultural'] += 30;
      usageOptions['Industrial'] += 20;
    } else if (acres > 10) {
      usageOptions['Agricultural'] += 20;
      usageOptions['Recreational'] += 15;
      usageOptions['Industrial'] += 10;
    } else if (acres > 5) {
      usageOptions['Residential'] += 15;
      usageOptions['Commercial'] += 10;
      usageOptions['Mixed Use'] += 20;
    } else if (acres > 1) {
      usageOptions['Residential'] += 25;
      usageOptions['Commercial'] += 15;
      usageOptions['Mixed Use'] += 10;
    } else {
      usageOptions['Residential'] += 30;
      usageOptions['Commercial'] += 20;
    }
    
    // Find highest score
    let bestUse = 'Residential';
    let highestScore = 0;
    
    for (const [use, score] of Object.entries(usageOptions)) {
      if (score > highestScore) {
        highestScore = score;
        bestUse = use;
      }
    }
    
    return bestUse;
  }
  
  /**
   * Helper: Analyze impact factors of land use change
   */
  private analyzeLandUseImpactFactors(currentUse: string, alternativeUse: string): any {
    // In a real system, this would use research and market data
    // For this demo, return simplified impact factors
    
    const factors = {
      economicImpact: {
        score: 0,
        description: ''
      },
      environmentalImpact: {
        score: 0,
        description: ''
      },
      communityImpact: {
        score: 0,
        description: ''
      },
      regulatoryEase: {
        score: 0,
        description: ''
      }
    };
    
    // Economic impact
    if (currentUse === 'Residential' && alternativeUse === 'Commercial') {
      factors.economicImpact.score = 4;
      factors.economicImpact.description = 'Significant increase in economic value with commercial zoning';
    } else if (currentUse === 'Agricultural' && (alternativeUse === 'Residential' || alternativeUse === 'Commercial')) {
      factors.economicImpact.score = 5;
      factors.economicImpact.description = 'Major economic upside from development potential';
    } else if (currentUse === 'Industrial' && alternativeUse === 'Mixed Use') {
      factors.economicImpact.score = 3;
      factors.economicImpact.description = 'Moderate economic benefits from diversified usage';
    } else {
      factors.economicImpact.score = 2;
      factors.economicImpact.description = 'Minor economic change expected';
    }
    
    // Environmental impact
    if (alternativeUse === 'Industrial' && (currentUse === 'Agricultural' || currentUse === 'Residential')) {
      factors.environmentalImpact.score = -4;
      factors.environmentalImpact.description = 'Significant negative environmental implications';
    } else if (alternativeUse === 'Agricultural' && currentUse === 'Industrial') {
      factors.environmentalImpact.score = 4;
      factors.environmentalImpact.description = 'Substantial environmental improvement';
    } else if (alternativeUse === 'Recreational') {
      factors.environmentalImpact.score = 3;
      factors.environmentalImpact.description = 'Moderate environmental benefits';
    } else {
      factors.environmentalImpact.score = -1;
      factors.environmentalImpact.description = 'Minor environmental concerns';
    }
    
    // Community impact
    if (currentUse === 'Industrial' && alternativeUse === 'Residential') {
      factors.communityImpact.score = 4;
      factors.communityImpact.description = 'Significant community improvement from residential development';
    } else if (alternativeUse === 'Mixed Use' || alternativeUse === 'Recreational') {
      factors.communityImpact.score = 3;
      factors.communityImpact.description = 'Moderate community benefits from diverse or recreational usage';
    } else if (alternativeUse === 'Commercial' && currentUse === 'Residential') {
      factors.communityImpact.score = -2;
      factors.communityImpact.description = 'Some community concerns about commercialization';
    } else {
      factors.communityImpact.score = 0;
      factors.communityImpact.description = 'Neutral community impact';
    }
    
    // Regulatory ease
    const regulatoryDifficulty = {
      'Residential': 2,
      'Commercial': 3,
      'Agricultural': 1,
      'Industrial': 5,
      'Mixed Use': 4,
      'Recreational': 2
    };
    
    const difficultyDiff = regulatoryDifficulty[currentUse] - regulatoryDifficulty[alternativeUse];
    
    if (difficultyDiff > 2) {
      factors.regulatoryEase.score = 4;
      factors.regulatoryEase.description = 'Significantly easier regulatory process';
    } else if (difficultyDiff > 0) {
      factors.regulatoryEase.score = 2;
      factors.regulatoryEase.description = 'Somewhat easier regulatory process';
    } else if (difficultyDiff < -2) {
      factors.regulatoryEase.score = -4;
      factors.regulatoryEase.description = 'Much more difficult regulatory process';
    } else if (difficultyDiff < 0) {
      factors.regulatoryEase.score = -2;
      factors.regulatoryEase.description = 'Somewhat more difficult regulatory process';
    } else {
      factors.regulatoryEase.score = 0;
      factors.regulatoryEase.description = 'Similar regulatory requirements';
    }
    
    return factors;
  }
}