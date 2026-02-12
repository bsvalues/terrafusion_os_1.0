import { BaseAgent } from "../core/base-agent";
import { AgentTask } from "../interfaces/agent";
import { AIService } from "../core/ai-service";

/**
 * Valuation Agent
 *
 * Specializes in analyzing property data and generating
 * accurate valuations using AI-assisted methods.
 */
export class ValuationAgent extends BaseAgent {
  private aiService: AIService;

  /**
   * Constructor
   */
  constructor() {
    super(
      "valuation-agent",
      "Valuation Agent",
      "Specializes in property valuation and market analysis",
      [
        "assess-property-value",
        "generate-comp-analysis",
        "analyze-market-trends",
        "predict-value-change",
        "identify-value-factors",
      ]
    );

    this.aiService = AIService.getInstance();
  }

  /**
   * Process a task
   * @param task The task to process
   */
  protected async processTask<T, R>(task: AgentTask<T>): Promise<R> {
    switch (task.type) {
      case "assess-property-value":
        return this.assessPropertyValue(task) as unknown as R;
      case "generate-comp-analysis":
        return this.generateCompAnalysis(task) as unknown as R;
      case "analyze-market-trends":
        return this.analyzeMarketTrends(task) as unknown as R;
      case "predict-value-change":
        return this.predictValueChange(task) as unknown as R;
      case "identify-value-factors":
        return this.identifyValueFactors(task) as unknown as R;
      default:
        throw new Error(`Unsupported task type: ${task.type}`);
    }
  }

  /**
   * Assess the value of a property
   * @param task The task containing property data
   */
  private async assessPropertyValue(task: AgentTask<any>): Promise<any> {
    const {
      property,
      assessmentDate,
      methodologies = ["comparable", "income", "cost"],
    } = task.data;

    console.log(`Assessing value for property ${property.id || property.parcelId}`);

    // In a production environment, we would use a more sophisticated valuation model
    // For this example, we'll use AI to assist with the valuation

    const valuationPrompt = `
      I need to assess the value of the following property as of ${assessmentDate}:
      
      ${JSON.stringify(property, null, 2)}
      
      Please analyze this property and provide a valuation using these methodologies: ${methodologies.join(", ")}.
      
      Return your analysis as a JSON object with the following structure:
      {
        "estimatedValue": number,
        "confidenceLevel": number (between 0 and 1),
        "methodologyResults": {
          // Include each requested methodology with its own value estimate
          [methodology]: {
            "valueEstimate": number,
            "approach": string (description of approach)
          }
        },
        "keyFactors": [
          // List of key factors that influenced the valuation
          {
            "factor": string,
            "impact": string,
            "weight": number (between 0 and 1)
          }
        ],
        "recommendedReassessmentDate": string (ISO date)
      }
    `;

    const valuationResult = await this.aiService.generateJson(
      valuationPrompt,
      task.context?.provider || "openai"
    );

    return {
      property: {
        id: property.id || property.parcelId,
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
      },
      assessmentDate,
      methodologies,
      ...valuationResult,
      valuationTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate a comparative market analysis
   * @param task The task containing property and comparable parameters
   */
  private async generateCompAnalysis(task: AgentTask<any>): Promise<any> {
    const { property, comparableProperties, adjustmentFactors } = task.data;

    console.log(`Generating comparative analysis for property ${property.id || property.parcelId}`);

    // Use AI to help generate the comparative analysis
    const compAnalysisPrompt = `
      I need to generate a comparative market analysis for the following property:
      
      SUBJECT PROPERTY:
      ${JSON.stringify(property, null, 2)}
      
      COMPARABLE PROPERTIES:
      ${JSON.stringify(comparableProperties, null, 2)}
      
      ADJUSTMENT FACTORS:
      ${JSON.stringify(adjustmentFactors, null, 2)}
      
      Please analyze these properties and provide a detailed comparative market analysis.
      
      Return your analysis as a JSON object with the following structure:
      {
        "estimatedValue": number,
        "adjustedComparables": [
          {
            "propertyId": string,
            "originalValue": number,
            "adjustedValue": number,
            "adjustments": [
              {
                "factor": string,
                "amount": number,
                "reason": string
              }
            ],
            "similarityScore": number (between 0 and 1)
          }
        ],
        "analysisSummary": string,
        "confidenceLevel": number (between 0 and 1)
      }
    `;

    const compAnalysisResult = await this.aiService.generateJson(
      compAnalysisPrompt,
      task.context?.provider || "openai"
    );

    return {
      property: {
        id: property.id || property.parcelId,
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
      },
      comparableCount: comparableProperties.length,
      ...compAnalysisResult,
      analysisTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Analyze market trends for a specific area
   * @param task The task containing market analysis parameters
   */
  private async analyzeMarketTrends(task: AgentTask<any>): Promise<any> {
    const {
      location,
      timeframe,
      propertyType,
      metrics = ["median_price", "dom", "price_per_sqft"],
    } = task.data;

    console.log(`Analyzing market trends for ${location.city}, ${location.state}`);

    // Use AI to help analyze market trends
    const marketTrendsPrompt = `
      I need to analyze real estate market trends for the following criteria:
      
      LOCATION: ${location.city}, ${location.state} (${location.zipCode || "all zip codes"})
      TIMEFRAME: ${timeframe}
      PROPERTY TYPE: ${propertyType}
      METRICS: ${metrics.join(", ")}
      
      Please analyze these trends and provide insights.
      
      Return your analysis as a JSON object with the following structure:
      {
        "summary": string,
        "trends": {
          [metric]: {
            "currentValue": number,
            "changePercent": number,
            "direction": "increasing" | "decreasing" | "stable",
            "analysis": string
          }
        },
        "forecast": {
          "shortTerm": string,
          "longTerm": string,
          "confidenceLevel": number (between 0 and 1)
        },
        "recommendedActions": [
          {
            "action": string,
            "reasoning": string,
            "priority": "high" | "medium" | "low"
          }
        ]
      }
    `;

    const marketTrendsResult = await this.aiService.generateJson(
      marketTrendsPrompt,
      task.context?.provider || "openai"
    );

    return {
      location,
      timeframe,
      propertyType,
      metrics,
      ...marketTrendsResult,
      analysisTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Predict value changes for a property over time
   * @param task The task containing prediction parameters
   */
  private async predictValueChange(task: AgentTask<any>): Promise<any> {
    const { property, timeframe, factors } = task.data;

    console.log(`Predicting value change for property ${property.id || property.parcelId}`);

    // Use AI to help predict value changes
    const predictionPrompt = `
      I need to predict value changes for the following property over ${timeframe}:
      
      PROPERTY:
      ${JSON.stringify(property, null, 2)}
      
      FACTORS TO CONSIDER:
      ${JSON.stringify(factors, null, 2)}
      
      Please predict how the property value will change over the specified timeframe.
      
      Return your prediction as a JSON object with the following structure:
      {
        "currentValue": number,
        "predictedValue": number,
        "percentageChange": number,
        "timeframe": string,
        "intervals": [
          {
            "period": string,
            "predictedValue": number,
            "percentageChange": number,
            "keyFactors": [
              {
                "factor": string,
                "impact": number,
                "description": string
              }
            ]
          }
        ],
        "confidenceLevel": number (between 0 and 1),
        "riskFactors": [
          {
            "factor": string,
            "probability": number (between 0 and 1),
            "potentialImpact": number,
            "description": string
          }
        ]
      }
    `;

    const predictionResult = await this.aiService.generateJson(
      predictionPrompt,
      task.context?.provider || "openai"
    );

    return {
      property: {
        id: property.id || property.parcelId,
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
      },
      timeframe,
      ...predictionResult,
      predictionTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Identify key factors affecting a property's value
   * @param task The task containing property data
   */
  private async identifyValueFactors(task: AgentTask<any>): Promise<any> {
    const { property, marketData } = task.data;

    console.log(`Identifying value factors for property ${property.id || property.parcelId}`);

    // Use AI to help identify value factors
    const factorsPrompt = `
      I need to identify key factors affecting the value of the following property:
      
      PROPERTY:
      ${JSON.stringify(property, null, 2)}
      
      MARKET DATA:
      ${JSON.stringify(marketData, null, 2)}
      
      Please identify and analyze the key factors affecting this property's value.
      
      Return your analysis as a JSON object with the following structure:
      {
        "propertySpecificFactors": [
          {
            "factor": string,
            "impact": number (positive or negative value),
            "description": string,
            "recommendations": string
          }
        ],
        "marketFactors": [
          {
            "factor": string,
            "impact": number (positive or negative value),
            "description": string,
            "trend": "improving" | "worsening" | "stable"
          }
        ],
        "topPositiveFactors": [
          {
            "factor": string,
            "impact": number (positive value),
            "leverageStrategy": string
          }
        ],
        "topNegativeFactors": [
          {
            "factor": string,
            "impact": number (negative value),
            "mitigationStrategy": string
          }
        ],
        "overallAnalysis": string
      }
    `;

    const factorsResult = await this.aiService.generateJson(
      factorsPrompt,
      task.context?.provider || "openai"
    );

    return {
      property: {
        id: property.id || property.parcelId,
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
      },
      ...factorsResult,
      analysisTimestamp: new Date().toISOString(),
    };
  }
}
