/**
 * Property Assessment Agent
 *
 * This agent specializes in property assessment and valuation.
 * It performs CAMA (Computer Assisted Mass Appraisal) operations
 * and helps with property valuations based on comparable properties,
 * improvements, and market trends.
 */

import { BaseAgent } from './base-agent';
import { AgentConfig, AgentCapability, AgentStatus } from '../models/agent-types';
import { IStorage } from '../services/storage-interface';
import { LLMService } from '../services/llm-service';

/**
 * Property story generation options
 */
export interface PropertyStoryOptions {
  includeMarketTrends?: boolean;
  includeNeighborhood?: boolean;
  includeImprovement?: boolean;
  format?: 'short' | 'detailed';
}

/**
 * Comparable sales analysis result
 */
export interface ComparableSalesAnalysis {
  propertyId: string;
  averageValue: number;
  medianValue: number;
  valueRange: {
    min: number;
    max: number;
  };
  comparableProperties: any[];
  adjustmentFactors: Record<string, number>;
  confidenceScore: number;
  timestamp: string;
}

/**
 * Property Assessment Agent implementation
 */
export class PropertyAssessmentAgent extends BaseAgent {
  constructor(
    id: string,
    name: string,
    description: string,
    storage: IStorage,
    llmService: LLMService,
    config?: AgentConfig
  ) {
    super(id, name, description, config || {}, storage, llmService);
  }

  /**
   * Register agent capabilities
   */
  protected registerCapabilities(): void {
    this.registerCapability({
      id: 'analyze-property',
      name: 'Analyze Property',
      description: 'Analyze property details and provide valuation insights',
      parameterSchema: {
        propertyId: { type: 'string', required: true },
      },
      handler: async params => this.analyzeProperty(params.propertyId),
    });

    this.registerCapability({
      id: 'generate-property-story',
      name: 'Generate Property Story',
      description: 'Generate a narrative description of a property',
      parameterSchema: {
        propertyId: { type: 'string', required: true },
        options: { type: 'object', required: false },
      },
      handler: async params => this.generatePropertyStory(params.propertyId, params.options),
    });

    this.registerCapability({
      id: 'find-comparable-properties',
      name: 'Find Comparable Properties',
      description: 'Find properties that are comparable to a given property',
      parameterSchema: {
        propertyId: { type: 'string', required: true },
        radius: { type: 'number', required: false },
        limit: { type: 'number', required: false },
      },
      handler: async params =>
        this.findComparableProperties(params.propertyId, params.radius, params.limit),
    });

    this.registerCapability({
      id: 'calculate-property-value',
      name: 'Calculate Property Value',
      description: 'Calculate the estimated value of a property',
      parameterSchema: {
        propertyId: { type: 'string', required: true },
        useComparables: { type: 'boolean', required: false },
      },
      handler: async params =>
        this.calculatePropertyValue(params.propertyId, params.useComparables),
    });

    this.registerCapability({
      id: 'generate-area-analysis',
      name: 'Generate Area Analysis',
      description: 'Generate analysis of property values in a specific area',
      parameterSchema: {
        areaId: { type: 'string', required: true },
        timeframe: { type: 'string', required: false },
      },
      handler: async params => this.generateAreaAnalysis(params.areaId, params.timeframe),
    });

    this.registerCapability({
      id: 'predict-future-value',
      name: 'Predict Future Value',
      description: 'Predict the future value of a property',
      parameterSchema: {
        propertyId: { type: 'string', required: true },
        timeframe: { type: 'string', required: true },
      },
      handler: async params => this.predictFutureValue(params.propertyId, params.timeframe),
    });
  }

  /**
   * Analyze a property
   */
  private async analyzeProperty(propertyId: string): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // Fetch property data from storage
      const property = await this.storage.getItem('properties', propertyId);

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      // Analyze property details
      const analysis = {
        propertyId,
        propertyType: property.type,
        landValue: property.landValue,
        improvementValue: property.improvementValue,
        totalValue: property.landValue + property.improvementValue,
        yearBuilt: property.yearBuilt,
        lastAssessmentDate: property.lastAssessmentDate,
        // Add more analysis details here
      };

      this.setStatus(AgentStatus.READY);
      return analysis;
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Generate a property story
   */
  private async generatePropertyStory(
    propertyId: string,
    options?: PropertyStoryOptions
  ): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // Fetch property data from storage
      const property = await this.storage.getItem('properties', propertyId);

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      const defaultOptions: PropertyStoryOptions = {
        includeMarketTrends: true,
        includeNeighborhood: true,
        includeImprovement: true,
        format: 'detailed',
      };

      const opts = { ...defaultOptions, ...options };

      // Use LLM service to generate the property story
      const prompt = this.buildPropertyStoryPrompt(property, opts);

      const result = await this.llmService.complete({
        prompt,
        options: {
          model: this.config.modelName || 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
        },
      });

      this.setStatus(AgentStatus.READY);
      return {
        propertyId,
        story: result.text,
        options: opts,
      };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Find comparable properties
   */
  private async findComparableProperties(
    propertyId: string,
    radius: number = 1.0,
    limit: number = 5
  ): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // Fetch property data from storage
      const property = await this.storage.getItem('properties', propertyId);

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      // Find properties with similar characteristics
      const comparableProperties = await this.storage.find(
        'properties',
        {
          type: property.type,
          // Add more filter criteria here
        },
        {
          limit,
        }
      );

      // Filter out the target property itself
      const filtered = comparableProperties.filter(p => p.id !== propertyId);

      this.setStatus(AgentStatus.READY);
      return {
        propertyId,
        radius,
        comparableProperties: filtered,
      };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Calculate property value
   */
  private async calculatePropertyValue(
    propertyId: string,
    useComparables: boolean = true
  ): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // Fetch property data from storage
      const property = await this.storage.getItem('properties', propertyId);

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      let estimatedValue = property.landValue + property.improvementValue;
      let confidenceScore = 0.8;

      if (useComparables) {
        const { comparableProperties } = await this.findComparableProperties(propertyId);

        if (comparableProperties.length > 0) {
          // Calculate average value from comparables
          const values = comparableProperties.map(p => p.landValue + p.improvementValue);
          const avgValue = values.reduce((sum, value) => sum + value, 0) / values.length;

          // Blend the direct value with the comparable value
          estimatedValue = (estimatedValue + avgValue) / 2;
          confidenceScore = 0.9; // Higher confidence with comparables
        }
      }

      this.setStatus(AgentStatus.READY);
      return {
        propertyId,
        estimatedValue,
        confidenceScore,
        useComparables,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Generate analysis of property values in a specific area
   */
  private async generateAreaAnalysis(areaId: string, timeframe: string = '1year'): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // Fetch area data from storage
      const area = await this.storage.getItem('areas', areaId);

      if (!area) {
        throw new Error(`Area not found: ${areaId}`);
      }

      // Find properties in this area
      const properties = await this.storage.find('properties', {
        areaId,
      });

      // Calculate area statistics
      const totalProperties = properties.length;
      const totalValue = properties.reduce((sum, p) => sum + (p.landValue + p.improvementValue), 0);
      const avgValue = totalValue / (totalProperties || 1);

      // Calculate property type distribution
      const typeDistribution = this.calculatePropertyTypeDistribution(properties);

      // Generate trend data
      const trends = this.generateAreaTrendData(properties, timeframe);

      this.setStatus(AgentStatus.READY);
      return {
        areaId,
        areaName: area.name,
        totalProperties,
        totalValue,
        averageValue: avgValue,
        propertyTypeDistribution: typeDistribution,
        trends,
        timeframe,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Predict future property value
   */
  private async predictFutureValue(propertyId: string, timeframe: string): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // Fetch property data from storage
      const property = await this.storage.getItem('properties', propertyId);

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      // Parse timeframe (e.g., '1year', '5years', '6months')
      const match = timeframe.match(/(\d+)(\w+)/);
      if (!match) {
        throw new Error(`Invalid timeframe format: ${timeframe}`);
      }

      const [_, valueStr, unit] = match;
      const value = parseInt(valueStr, 10);

      // Default growth rate (annual)
      let annualGrowthRate = 0.03; // 3% annual growth

      // Adjust growth rate based on property factors
      if (property.desirability === 'high') {
        annualGrowthRate += 0.01;
      }

      if (property.condition === 'excellent') {
        annualGrowthRate += 0.005;
      }

      // Calculate future value
      const currentValue = property.landValue + property.improvementValue;
      let years = 0;

      if (unit.includes('year')) {
        years = value;
      } else if (unit.includes('month')) {
        years = value / 12;
      }

      const futureValue = currentValue * Math.pow(1 + annualGrowthRate, years);

      this.setStatus(AgentStatus.READY);
      return {
        propertyId,
        currentValue,
        futureValue,
        timeframe,
        growthRate: annualGrowthRate,
        predictedDate: this.getFutureDate(timeframe),
        confidenceScore: 0.75,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Helper: Get future date based on timeframe
   */
  private getFutureDate(timeframe: string): string {
    const match = timeframe.match(/(\d+)(\w+)/);
    if (!match) {
      return new Date().toISOString();
    }

    const [_, valueStr, unit] = match;
    const value = parseInt(valueStr, 10);
    const now = new Date();

    if (unit.includes('year')) {
      now.setFullYear(now.getFullYear() + value);
    } else if (unit.includes('month')) {
      now.setMonth(now.getMonth() + value);
    }

    return now.toISOString();
  }

  /**
   * Helper: Build property story prompt
   */
  private buildPropertyStoryPrompt(property: any, options: PropertyStoryOptions): string {
    let prompt = `Generate a ${options.format === 'detailed' ? 'detailed' : 'brief'} description for the following property:\n\n`;

    prompt += `Address: ${property.address}\n`;
    prompt += `Property Type: ${property.type}\n`;
    prompt += `Year Built: ${property.yearBuilt}\n`;
    prompt += `Square Footage: ${property.squareFootage}\n`;
    prompt += `Lot Size: ${property.lotSize}\n`;
    prompt += `Bedrooms: ${property.bedrooms}\n`;
    prompt += `Bathrooms: ${property.bathrooms}\n`;

    if (options.includeNeighborhood && property.neighborhood) {
      prompt += `\nNeighborhood: ${property.neighborhood}\n`;
      prompt += `School District: ${property.schoolDistrict}\n`;
      prompt += `Walkability Score: ${property.walkabilityScore}\n`;
    }

    if (options.includeImprovement && property.improvements) {
      prompt += `\nRecent Improvements:\n`;
      for (const improvement of property.improvements) {
        prompt += `- ${improvement.description} (${improvement.year})\n`;
      }
    }

    prompt += `\nPlease create a professional property description that highlights its key features`;

    if (options.includeMarketTrends) {
      prompt += ` and includes current market trends for this type of property`;
    }

    prompt += `.`;

    return prompt;
  }

  /**
   * Helper: Calculate property type distribution
   */
  private calculatePropertyTypeDistribution(properties: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const property of properties) {
      const type = property.type || 'unknown';
      distribution[type] = (distribution[type] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Helper: Generate area trend data
   */
  private generateAreaTrendData(properties: any[], timeframe: string): any {
    // Simple mock trend data
    return {
      valueTrend: 'increasing',
      percentageChange: 5.2,
      historical: [
        { period: '2021-Q1', averageValue: 320000 },
        { period: '2021-Q2', averageValue: 325000 },
        { period: '2021-Q3', averageValue: 335000 },
        { period: '2021-Q4', averageValue: 340000 },
        { period: '2022-Q1', averageValue: 345000 },
      ],
    };
  }
}
