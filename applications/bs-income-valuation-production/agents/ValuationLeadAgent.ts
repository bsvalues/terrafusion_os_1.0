/**
 * Valuation Lead Agent
 * 
 * This module implements the Valuation Lead Agent, which is responsible
 * for coordinating and leading the Valuation domain agents.
 * It ensures valuation outputs meet quality standards and best practices.
 */

import { ComponentLeadAgent, ComponentDomain } from './ComponentLeadAgent';
import { AgentMessage, EventType } from '../shared/agentProtocol';

/**
 * Configuration options specific to the Valuation Lead Agent
 */
interface ValuationLeadConfig {
  capRateValidationEnabled: boolean;
  marketTrendIncorporationLevel: 'none' | 'low' | 'medium' | 'high';
  confidenceThresholdRequired: number;
  historicalDataComparisonEnabled: boolean;
}

/**
 * Default configuration for Valuation Lead Agent
 */
const DEFAULT_VALUATION_CONFIG: ValuationLeadConfig = {
  capRateValidationEnabled: true,
  marketTrendIncorporationLevel: 'medium',
  confidenceThresholdRequired: 0.75,
  historicalDataComparisonEnabled: true
};

/**
 * Valuation output type for validation
 */
interface ValuationOutput {
  propertyId?: string;
  incomeValue?: number;
  capRate?: number;
  confidence?: number;
  marketTrends?: any[];
  comparables?: any[];
  factors?: Record<string, number>;
  assumptions?: Record<string, any>;
  [key: string]: any;
}

/**
 * Valuation Lead Agent - Leads the Valuation domain
 */
export class ValuationLeadAgent extends ComponentLeadAgent {
  private valuationConfig: ValuationLeadConfig;
  
  /**
   * Create a new Valuation Lead Agent
   * @param agentId Unique identifier for this agent
   * @param config Configuration options
   * @param valuationConfig Valuation-specific configuration
   */
  constructor(
    agentId: string, 
    config: any = {}, 
    valuationConfig: Partial<ValuationLeadConfig> = {}
  ) {
    super(agentId, ComponentDomain.VALUATION, config);
    
    // Initialize valuation-specific configuration
    this.valuationConfig = {
      ...DEFAULT_VALUATION_CONFIG,
      ...valuationConfig
    };
    
    this.logMessage('Valuation Lead Agent initialized with config: ' + 
      JSON.stringify(this.valuationConfig));
  }
  
  /**
   * Set up agent capabilities
   */
  protected setupCapabilities(): void {
    this.capabilities = [
      'valuation_lead',
      'cap_rate_validation',
      'market_trend_analysis',
      'valuation_quality_control',
      'valuation_methodology_expertise',
      'comparable_assessment'
    ];
  }
  
  /**
   * Initialize domain-specific best practices
   */
  protected initializeBestPractices(): void {
    this.bestPractices = [
      {
        id: 'val-001',
        name: 'Capitalization Rate Range',
        description: 'Capitalization rates should be between 3% and 12% for most property types',
        checkFunction: (output: ValuationOutput) => {
          if (!output.capRate) return true; // Skip if no capRate
          return output.capRate >= 0.03 && output.capRate <= 0.12;
        },
        fixFunction: (output: ValuationOutput) => {
          if (!output.capRate) return output;
          const fixedOutput = { ...output };
          fixedOutput.capRate = Math.max(0.03, Math.min(0.12, output.capRate));
          return fixedOutput;
        },
        severity: 'high'
      },
      {
        id: 'val-002',
        name: 'Confidence Score',
        description: 'All valuations should include a confidence score',
        checkFunction: (output: ValuationOutput) => {
          return output.confidence !== undefined && 
                 typeof output.confidence === 'number' &&
                 output.confidence >= 0 && 
                 output.confidence <= 1;
        },
        fixFunction: (output: ValuationOutput) => {
          const fixedOutput = { ...output };
          if (fixedOutput.confidence === undefined) {
            fixedOutput.confidence = 0.5; // Default confidence
          } else if (typeof fixedOutput.confidence === 'number') {
            fixedOutput.confidence = Math.max(0, Math.min(1, fixedOutput.confidence));
          } else {
            fixedOutput.confidence = 0.5;
          }
          return fixedOutput;
        },
        severity: 'medium'
      },
      {
        id: 'val-003',
        name: 'Required Valuation Factors',
        description: 'Valuations should include key factors that influenced the result',
        checkFunction: (output: ValuationOutput) => {
          return output.factors !== undefined && 
                 Object.keys(output.factors || {}).length > 0;
        },
        fixFunction: undefined, // No automatic fix available
        severity: 'medium'
      },
      {
        id: 'val-004',
        name: 'Property ID Required',
        description: 'All valuations must include a property identifier',
        checkFunction: (output: ValuationOutput) => {
          return output.propertyId !== undefined && output.propertyId !== '';
        },
        fixFunction: undefined, // No automatic fix available
        severity: 'high'
      },
      {
        id: 'val-005',
        name: 'Assumptions Documentation',
        description: 'All key assumptions should be documented',
        checkFunction: (output: ValuationOutput) => {
          return output.assumptions !== undefined && 
                 Object.keys(output.assumptions || {}).length > 0;
        },
        fixFunction: undefined, // No automatic fix available
        severity: 'low'
      }
    ];
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
    if (payload.problemDescription.toLowerCase().includes('cap rate')) {
      assistance = this.provideCapRateGuidance(payload.context);
      confidence = 0.9;
    } else if (payload.problemDescription.toLowerCase().includes('market trend')) {
      assistance = this.provideMarketTrendGuidance(payload.context);
      confidence = 0.85;
    } else if (payload.problemDescription.toLowerCase().includes('valuation method')) {
      assistance = this.provideValuationMethodologyGuidance(payload.context);
      confidence = 0.95;
    } else if (payload.problemDescription.toLowerCase().includes('comparable')) {
      assistance = this.provideComparableGuidance(payload.context);
      confidence = 0.8;
    } else {
      assistance = this.provideGeneralValuationGuidance(payload.problemDescription);
      confidence = 0.7;
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
        domain: ComponentDomain.VALUATION,
        references: this.getRelevantReferences(payload.problemDescription)
      }
    };
    
    this.sendMessage(assistanceMessage);
    this.logMessage(`Provided valuation assistance to ${sourceAgentId}`);
  }
  
  /**
   * Provide guidance on capitalization rates
   * @param context Context information
   * @returns Capitalization rate guidance
   */
  private provideCapRateGuidance(context: any): string {
    // In a real implementation, this would be more sophisticated
    return `
      Capitalization Rate Guidance:
      
      1. For residential income properties in stable markets, cap rates typically range from 4-7%
      2. For commercial properties, cap rates typically range from 5-10%
      3. Industrial properties often have cap rates in the 6-9% range
      4. Higher-risk properties or locations warrant higher cap rates
      5. Factors that influence cap rates include:
         - Property class and condition
         - Location quality and market stability
         - Tenant quality and lease terms
         - Market trends and interest rates
         - Expected property appreciation
      
      Always document your cap rate assumptions and cite market comparables when possible.
    `;
  }
  
  /**
   * Provide guidance on market trends
   * @param context Context information
   * @returns Market trend guidance
   */
  private provideMarketTrendGuidance(context: any): string {
    return `
      Market Trend Incorporation Guidance:
      
      1. Current Benton County market trends to consider:
         - Vacancy rates are currently averaging 3.2% for residential properties
         - Rent growth has been 4.3% annually over the past 2 years
         - Property values have appreciated 6.7% in the last year
         - New construction permits increased by 12% year-over-year
      
      2. Integration methods:
         - Apply trend-based adjustments to comparable sales
         - Adjust growth assumptions in discounted cash flow models
         - Consider trend impacts on vacancy assumptions
         - Factor trend data into cap rate selection
      
      3. Best practices:
         - Document which trends were considered
         - Quantify the impact of each trend on the valuation
         - Include confidence intervals for trend projections
         - Cite sources for trend data
    `;
  }
  
  /**
   * Provide guidance on valuation methodologies
   * @param context Context information
   * @returns Valuation methodology guidance
   */
  private provideValuationMethodologyGuidance(context: any): string {
    return `
      Valuation Methodology Guidance:
      
      1. Income Approach:
         - Direct Capitalization: Best for stabilized properties with consistent income
         - Discounted Cash Flow: Preferred for properties with variable income projections
         - Gross Rent Multiplier: Quick assessment tool, less precise
      
      2. Sales Comparison Approach:
         - Most reliable when sufficient comparable sales exist
         - Requires adjustments for differences between subject and comparables
         - Good for residential and standard commercial properties
      
      3. Cost Approach:
         - Most useful for new or special-purpose properties
         - Requires accurate assessment of depreciation
         - Best used as a secondary approach to validate other methods
      
      4. Methodology Selection Criteria:
         - Property type and characteristics
         - Available data quality and quantity
         - Purpose of the valuation
         - Required level of precision
      
      Always document your methodology choice and the reasons for selecting it.
    `;
  }
  
  /**
   * Provide guidance on comparable properties
   * @param context Context information
   * @returns Comparable properties guidance
   */
  private provideComparableGuidance(context: any): string {
    return `
      Comparable Selection and Adjustment Guidance:
      
      1. Key comparable selection criteria:
         - Location proximity (ideally within 1-2 miles)
         - Similar property type, size, and age
         - Similar quality and condition
         - Recent transaction date (preferably within last 6-12 months)
         - Similar income characteristics for income properties
      
      2. Standard adjustment categories:
         - Transaction conditions and financing terms
         - Market conditions (time adjustment)
         - Location quality differences
         - Physical characteristics (size, age, condition, features)
         - Economic characteristics (income, expenses, cap rates)
         - Use/zoning differences
      
      3. Adjustment methodology:
         - Paired sales analysis when sufficient data exists
         - Statistical analysis for quantifiable factors
         - Market extraction for income property adjustments
         - Cost-based adjustments for physical differences
      
      4. Documentation requirements:
         - Minimum of 3-5 comparables (more for complex properties)
         - Clear explanation of adjustment reasoning
         - Summary of net and gross adjustment percentages
         - Reconciliation of adjusted values
    `;
  }
  
  /**
   * Provide general valuation guidance
   * @param problemDescription Description of the problem
   * @returns General valuation guidance
   */
  private provideGeneralValuationGuidance(problemDescription: string): string {
    return `
      General Valuation Guidance:
      
      1. Process best practices:
         - Clearly define the property and its characteristics
         - Research market conditions thoroughly
         - Collect reliable data from multiple sources
         - Apply appropriate methodologies based on property type
         - Document all assumptions clearly
         - Include a sensitivity analysis for key variables
         - Assign and explain confidence levels
      
      2. Quality control checklist:
         - Mathematical accuracy verified
         - Methodology appropriate for property type
         - Market data is recent and relevant
         - Assumptions are reasonable and documented
         - Adjustments are supported and consistent
         - Reconciliation explains weighting of approaches
         - Limitations and conditions are disclosed
      
      3. Key factors for accurate valuations:
         - Comprehensive property inspection and documentation
         - Thorough market research and economic analysis
         - Appropriate methodology selection and application
         - Clear documentation of reasoning and calculations
         - Peer review for complex valuations
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
        title: "Benton County Property Valuation Standards Guide",
        section: "3.2 - Best Practices for Income Property Valuation",
        relevance: 0.9
      },
      {
        title: "Market Analysis Report - Q1 2025",
        section: "Regional Cap Rate Trends",
        relevance: 0.85
      },
      {
        title: "Valuation Methodology Handbook",
        section: "Selecting Appropriate Approaches",
        relevance: 0.8
      }
    ];
    
    return references;
  }
}