/**
 * ValuationAgent - AI-powered agent for analyzing income data and generating valuation insights
 * Enhanced with MCP compatibility and learning capabilities
 */

import { Income, Valuation } from '../shared/schema';
import { 
  AgentType, 
  EventType,
  ErrorCode
} from '../shared/agentProtocol';
import { BaseAgent } from './BaseAgent';
import { AgentExperience } from '../shared/agentProtocol';
import { VALUATION_AGENT_CONFIG } from '../config/mcpConfig';
import { z } from 'zod';

/**
 * Interface for the analysis results from the valuation agent
 */
export interface IncomeAnalysis {
  analysis: {
    findings: string[];
    recommendations: string[];
    distribution: Array<{ source: string; percentage: number }>;
    metrics: {
      averageMonthlyIncome: number;
      totalAnnualIncome: number;
      diversificationScore: number;
      stabilityScore: number;
      growthPotential: number;
      seasonalImpact: 'high' | 'medium' | 'low';
    };
  };
  suggestedValuation: {
    amount: string;
    multiplier: string;
    considerations: string[];
    rangeMin: string;
    rangeMax: string;
    confidenceScore: number;
  };
  errors?: string[]; // Optional errors that didn't prevent analysis but might affect quality
}

/**
 * Interface for detected anomalies in valuation history
 */
export interface AnomalyDetection {
  anomalies: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    relatedValuationIds?: number[];
    potentialCauses?: string[];
    suggestedActions?: string[];
  }>;
  insights: string[];
  summary: string;
  errors?: string[]; // Optional errors that didn't prevent analysis but might affect quality
}

// Validation schema for Income data
export const IncomeSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  source: z.string().min(1).max(50),
  amount: z.string().refine(value => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  }, { message: "Amount must be a valid positive number" }),
  frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "annually"])
    .or(z.string()), // Allow string but will be normalized in processing
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional()
});

// Validation schema for Valuation data
export const ValuationSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  valuationAmount: z.string().refine(value => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  }, { message: "Valuation amount must be a valid positive number" }),
  multiplier: z.string().refine(value => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  }, { message: "Multiplier must be a valid positive number" }),
  valuationDate: z.date().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional()
});

/**
 * Enhanced ValuationAgent with MCP compatibility
 */
export class ValuationAgent extends BaseAgent {
  private confidenceThreshold: number;
  private learningRate: number;
  private multiplierRange: { min: number; max: number };
  private countyFactors: Record<string, number>;
  
  /**
   * Create a new ValuationAgent
   * @param agentId Unique ID for this agent
   */
  constructor(agentId: string = 'valuation-agent-1') {
    super(agentId, AgentType.VALUATION);
    
    // Initialize from configuration
    const config = VALUATION_AGENT_CONFIG;
    this.confidenceThreshold = config.confidenceThreshold;
    this.learningRate = config.learningRate;
    this.multiplierRange = config.multiplierRange;
    this.countyFactors = config.bentonCountyFactors;
  }
  
  /**
   * Process a request sent to this agent
   * @param request The request to process
   * @returns Promise resolving to the result
   */
  public async processRequest(request: any): Promise<any> {
    const startTime = Date.now();
    let result: any;
    
    try {
      // Determine which method to call based on request type
      if (request.type === 'analyze-income') {
        result = await this.analyzeIncome(request.incomeData);
      } else if (request.type === 'detect-anomalies') {
        result = await this.detectAnomalies(request.valuationHistory);
      } else {
        throw new Error(`Unknown request type: ${request.type}`);
      }
      
      const processingTime = Date.now() - startTime;
      this.reportResult(result, processingTime, undefined, request.correlationId);
      return result;
    } catch (error) {
      this.reportError(error as Error, request.id, request.correlationId);
      
      // If confidence is low, request help
      if (error instanceof Error && error.message.includes('confidence')) {
        this.requestHelp(
          `Low confidence in valuation analysis: ${error.message}`,
          request.id || 'unknown-task',
          1,
          error.message,
          { incomeData: request.incomeData }
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Pre-processes income data to normalize values and handle edge cases
   * @param incomeData Raw income data to process
   * @returns Processed income data array and any validation errors
   */
  private preprocessIncomeData(incomeData: Income[]): { processed: Income[], errors: string[] } {
    const processed: Income[] = [];
    const errors: string[] = [];
    
    // Process each income record
    for (let i = 0; i < incomeData.length; i++) {
      const income = { ...incomeData[i] };
      
      try {
        // Validate with Zod schema
        IncomeSchema.parse(income);
        
        // Normalize frequency to lowercase for consistent processing
        income.frequency = income.frequency.toLowerCase();
        
        // Add to processed array
        processed.push(income);
      } catch (error) {
        // If validation fails, record error but still try to use the data
        if (error instanceof z.ZodError) {
          const errorDetails = error.errors.map(e => `Field '${e.path.join('.')}': ${e.message}`).join('; ');
          errors.push(`Invalid income record (ID: ${income.id || 'unknown'}): ${errorDetails}`);
        } else {
          errors.push(`Error processing income record (ID: ${income.id || 'unknown'}): ${(error as Error).message}`);
        }
        
        // Still add to processed array if we can salvage it
        if (income.id && income.amount && parseFloat(income.amount) > 0) {
          // Ensure frequency is normalized
          if (!income.frequency || typeof income.frequency !== 'string') {
            income.frequency = 'monthly'; // Default to monthly if missing
            errors.push(`Missing frequency for income record ${income.id}, defaulting to monthly`);
          }
          
          processed.push(income);
        }
      }
    }
    
    // Check if we have a reasonable number of income records
    if (processed.length === 0 && incomeData.length > 0) {
      errors.push('All income records failed validation. Check data format.');
    }
    
    return { processed, errors };
  }
  
  /**
   * Analyzes income data to provide valuation insights
   * @param incomeData Array of income records
   * @returns Analysis results and recommendations
   */
  public async analyzeIncome(incomeData: Income[]): Promise<IncomeAnalysis> {
    if (!incomeData || incomeData.length === 0) {
      throw new Error('Cannot analyze income: No income data provided');
    }
    
    // Preprocess income data
    const { processed, errors } = this.preprocessIncomeData(incomeData);
    
    // If no valid records, throw error
    if (processed.length === 0) {
      throw new Error('Cannot analyze income: No valid income records after validation');
    }

    // Calculate total monthly and annual income
    const totalMonthlyIncome = processed.reduce((sum, income) => {
      const amount = parseFloat(income.amount);
      // Convert to monthly equivalent if needed
      switch (income.frequency.toLowerCase()) {
        case 'weekly': return sum + (amount * 4.33);
        case 'biweekly': return sum + (amount * 2.17);
        case 'monthly': return sum + amount;
        case 'quarterly': return sum + (amount / 3);
        case 'annually': return sum + (amount / 12);
        default: return sum + amount;
      }
    }, 0);

    const totalAnnualIncome = totalMonthlyIncome * 12;

    // Analyze income distribution by source
    const incomeBySource: Record<string, Income[]> = {};
    processed.forEach(income => {
      if (!incomeBySource[income.source]) {
        incomeBySource[income.source] = [];
      }
      incomeBySource[income.source].push(income);
    });

    // Calculate distribution percentages
    const distribution = Object.entries(incomeBySource).map(([source, incomes]) => {
      const sourceTotal = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      const percentage = (sourceTotal / totalMonthlyIncome) * 100;
      return { source, percentage };
    });

    // Get most common income type
    const mostCommonType = this.getMostCommonIncomeType(incomeBySource);

    // Calculate diversification score (0-100)
    // Higher when income comes from multiple sources with more even distribution
    const diversificationScore = Math.min(100, 
      Math.max(0, 100 - (Math.pow(distribution[0]?.percentage || 0, 2) / 100))
    );

    // Calculate stability score based on income types
    // Stable types: salary, rental; Less stable: freelance, business
    const stabilityMapping: Record<string, number> = {
      'salary': 90,
      'rental': 85,
      'investment': 70,
      'business': 60,
      'freelance': 50,
      'other': 40
    };

    const stabilityScore = Math.min(100, 
      distribution.reduce((score, { source, percentage }) => {
        return score + (stabilityMapping[source] || 50) * (percentage / 100);
      }, 0)
    );

    // Generate findings
    const findings = [
      `Your total monthly income is $${totalMonthlyIncome.toFixed(2)}`,
      `Your total annual income is $${totalAnnualIncome.toFixed(2)}`,
      `Your primary income source is ${mostCommonType} (${distribution.find(d => d.source === mostCommonType)?.percentage.toFixed(2)}% of total)`,
      `Your income diversification score is ${diversificationScore.toFixed(2)} out of 100`,
      `Your income stability score is ${stabilityScore.toFixed(2)} out of 100`
    ];

    // Generate recommendations based on analysis
    const recommendations = [];
    
    if (diversificationScore < 50) {
      recommendations.push("Consider diversifying your income sources to reduce risk");
    }
    
    if (stabilityScore < 70) {
      recommendations.push("Look for ways to increase income stability, such as long-term contracts or fixed-rate agreements");
    }
    
    // For Benton County specifically - use county factors from configuration
    let suggestedMultiplier = 3.0; // Base multiplier
    
    // Apply county-specific multiplier based on primary income type
    if (mostCommonType === 'rental') {
      suggestedMultiplier = this.countyFactors.residentialBaseMultiplier;
    } else if (mostCommonType === 'business') {
      suggestedMultiplier = this.countyFactors.commercialBaseMultiplier;
    } else if (mostCommonType === 'investment' && distribution.find(d => d.source === 'investment')?.percentage || 0 > 50) {
      // If primarily investment income related to agriculture
      suggestedMultiplier = this.countyFactors.agriculturalBaseMultiplier;
    }
    
    // Adjust based on stability
    if (stabilityScore > 80) suggestedMultiplier += 0.5;
    if (stabilityScore < 60) suggestedMultiplier -= 0.5;
    
    // Adjust based on diversification
    if (diversificationScore > 70) suggestedMultiplier += 0.3;
    if (diversificationScore < 40) suggestedMultiplier -= 0.3;
    
    // Ensure multiplier is within reasonable range
    suggestedMultiplier = Math.max(
      this.multiplierRange.min, 
      Math.min(this.multiplierRange.max, suggestedMultiplier)
    );
    
    const valuationAmount = totalAnnualIncome * suggestedMultiplier;
    const confidenceScore = Math.min(90, (stabilityScore + diversificationScore) / 2);
    
    // Create analysis result object
    const result: IncomeAnalysis = {
      analysis: {
        findings,
        recommendations,
        distribution,
        metrics: {
          averageMonthlyIncome: totalMonthlyIncome,
          totalAnnualIncome,
          diversificationScore,
          stabilityScore,
          growthPotential: diversificationScore * 0.7 + stabilityScore * 0.3,
          seasonalImpact: stabilityScore > 80 ? 'low' : stabilityScore > 60 ? 'medium' : 'high'
        }
      },
      suggestedValuation: {
        amount: valuationAmount.toFixed(2),
        multiplier: suggestedMultiplier.toFixed(2),
        considerations: [
          "Based on Benton County market conditions",
          "Considers income stability and diversification",
          "Assumes current income level remains consistent"
        ],
        rangeMin: (valuationAmount * 0.9).toFixed(2),
        rangeMax: (valuationAmount * 1.1).toFixed(2),
        confidenceScore
      }
    };
    
    // Include any validation errors
    if (errors.length > 0) {
      result.errors = errors;
      
      // Adjust confidence score based on errors
      result.suggestedValuation.confidenceScore = Math.max(
        10, 
        result.suggestedValuation.confidenceScore - (errors.length * 5)
      );
      
      // Add a finding about data quality
      result.analysis.findings.push(
        `Data quality issues were detected that may affect accuracy (${errors.length} issues found)`
      );
      
      // Add recommendation about data quality
      result.analysis.recommendations.push(
        "Review and correct income data to improve valuation accuracy"
      );
    }
    
    // Check if confidence is too low
    if (result.suggestedValuation.confidenceScore < this.confidenceThreshold) {
      console.warn(`Low confidence score: ${result.suggestedValuation.confidenceScore}`);
      
      // If extremely low confidence, request help
      if (result.suggestedValuation.confidenceScore < 0.4) {
        this.requestHelp(
          "Extremely low confidence in valuation result",
          "income-analysis-" + Date.now(),
          1,
          "Confidence score below critical threshold",
          { incomeData, initialResult: result }
        );
      }
    }

    return result;
  }
  
  /**
   * Pre-processes valuation data to normalize values and handle edge cases
   * @param valuationHistory Raw valuation data to process
   * @returns Processed valuation data array and any validation errors
   */
  private preprocessValuationData(valuationHistory: Valuation[]): { processed: Valuation[], errors: string[] } {
    const processed: Valuation[] = [];
    const errors: string[] = [];
    
    // Process each valuation record
    for (let i = 0; i < valuationHistory.length; i++) {
      const valuation = { ...valuationHistory[i] };
      
      try {
        // Validate with Zod schema
        ValuationSchema.parse(valuation);
        
        // Add to processed array
        processed.push(valuation);
      } catch (error) {
        // If validation fails, record error
        if (error instanceof z.ZodError) {
          const errorDetails = error.errors.map(e => `Field '${e.path.join('.')}': ${e.message}`).join('; ');
          errors.push(`Invalid valuation record (ID: ${valuation.id || 'unknown'}): ${errorDetails}`);
        } else {
          errors.push(`Error processing valuation record (ID: ${valuation.id || 'unknown'}): ${(error as Error).message}`);
        }
        
        // Still add to processed array if we can salvage it
        if (valuation.id && valuation.valuationAmount && parseFloat(valuation.valuationAmount) > 0) {
          // Ensure multiplier is present
          if (!valuation.multiplier || parseFloat(valuation.multiplier) <= 0) {
            valuation.multiplier = '3.0'; // Default Benton County multiplier
            errors.push(`Missing/invalid multiplier for valuation record ${valuation.id}, defaulting to 3.0`);
          }
          
          processed.push(valuation);
        }
      }
    }
    
    return { processed, errors };
  }

  /**
   * Detects anomalies in valuation history
   * @param valuationHistory Array of valuation records
   * @returns Detected anomalies and insights
   */
  public async detectAnomalies(valuationHistory: Valuation[]): Promise<AnomalyDetection> {
    if (!valuationHistory || valuationHistory.length <= 1) {
      // Not enough data to detect anomalies
      return {
        anomalies: [],
        insights: ['Not enough valuation data to perform anomaly detection. At least two valuations are required.'],
        summary: 'Insufficient valuation history for anomaly detection'
      };
    }
    
    // Preprocess valuation data
    const { processed, errors } = this.preprocessValuationData(valuationHistory);
    
    // If not enough valid records, return early
    if (processed.length <= 1) {
      return {
        anomalies: [],
        insights: ['Not enough valid valuation data after validation. At least two valuations are required.'],
        summary: 'Insufficient valid valuation history for anomaly detection',
        errors
      };
    }

    // Sort by creation date ascending
    const sortedValuations = [...processed].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const anomalies = [];
    const insights = [];

    // Analyze valuation changes
    const valuationChanges = [];
    for (let i = 1; i < sortedValuations.length; i++) {
      const prev = sortedValuations[i - 1];
      const current = sortedValuations[i];
      
      const prevAmount = parseFloat(prev.valuationAmount);
      const currentAmount = parseFloat(current.valuationAmount);
      const prevMultiplier = parseFloat(prev.multiplier);
      const currentMultiplier = parseFloat(current.multiplier);
      
      const percentChange = ((currentAmount - prevAmount) / prevAmount) * 100;
      const multiplierChange = currentMultiplier - prevMultiplier;
      const monthsBetween = (
        new Date(current.createdAt).getTime() - new Date(prev.createdAt).getTime()
      ) / (1000 * 60 * 60 * 24 * 30); // Approximate months
      
      valuationChanges.push({
        from: prev.createdAt,
        to: current.createdAt,
        prevId: prev.id,
        currentId: current.id,
        percentChange,
        multiplierChange,
        monthsBetween,
        annualizedChange: percentChange / (monthsBetween / 12),
        isAnomaly: false
      });
    }

    // Detect anomalies in valuation changes
    for (const change of valuationChanges) {
      // Anomaly detection criteria
      const isLargeChange = Math.abs(change.percentChange) > 25;
      const isVeryLargeChange = Math.abs(change.percentChange) > 50;
      const isRapidChange = Math.abs(change.annualizedChange) > 40;
      const isMultiplierJump = Math.abs(change.multiplierChange) > 1;
      
      if (isVeryLargeChange || (isLargeChange && isRapidChange) || isMultiplierJump) {
        change.isAnomaly = true;
        
        let severity: 'high' | 'medium' | 'low';
        if (isVeryLargeChange || (isLargeChange && isRapidChange && isMultiplierJump)) {
          severity = 'high';
        } else if (isLargeChange && isRapidChange) {
          severity = 'medium';
        } else {
          severity = 'low';
        }
        
        const anomalyType = change.percentChange > 0 ? 'rapid_increase' : 'rapid_decrease';
        
        anomalies.push({
          type: anomalyType,
          severity,
          description: `${change.percentChange > 0 ? 'Increase' : 'Decrease'} of ${Math.abs(change.percentChange).toFixed(2)}% between ${new Date(change.from).toLocaleDateString()} and ${new Date(change.to).toLocaleDateString()}`,
          relatedValuationIds: [change.prevId, change.currentId],
          potentialCauses: this.getPotentialCauses(anomalyType, change.multiplierChange),
          suggestedActions: this.getSuggestedActions(anomalyType, severity)
        });
      }
    }

    // Generate insights from the analysis
    if (anomalies.length === 0) {
      insights.push('No anomalies detected in valuation history. Values appear to follow expected patterns.');
    } else {
      insights.push(`Detected ${anomalies.length} anomalies in valuation history.`);
      
      if (anomalies.some(a => a.severity === 'high')) {
        insights.push('Some high severity anomalies require immediate attention.');
      }
      
      // Count rapid increases vs decreases
      const increases = anomalies.filter(a => a.type === 'rapid_increase').length;
      const decreases = anomalies.filter(a => a.type === 'rapid_decrease').length;
      
      if (increases > decreases) {
        insights.push(`Valuation trend shows irregular increases (${increases} rapid increases detected).`);
      } else if (decreases > increases) {
        insights.push(`Valuation trend shows concerning decreases (${decreases} rapid decreases detected).`);
      } else if (increases > 0) {
        insights.push(`Valuation shows both irregular increases and decreases (${increases} of each).`);
      }
    }
    
    // Calculate overall volatility
    const volatility = this.calculateVolatility(valuationChanges.map(c => c.percentChange));
    
    if (volatility > 20) {
      insights.push(`High valuation volatility detected (${volatility.toFixed(2)}%). Consider stabilizing factors.`);
    } else if (volatility > 10) {
      insights.push(`Moderate valuation volatility (${volatility.toFixed(2)}%).`);
    } else {
      insights.push(`Low valuation volatility (${volatility.toFixed(2)}%) indicates stable valuations.`);
    }

    return {
      anomalies,
      insights,
      summary: this.generateAnomalySummary(anomalies, volatility),
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  /**
   * Handle a help request from another agent
   * @param helpRequest The help request payload
   * @param requestingAgentId ID of the agent requesting help
   * @returns Promise resolving when help is provided
   */
  public override async handleHelpRequest(helpRequest: any, requestingAgentId: string): Promise<void> {
    console.log(`ValuationAgent handling help request from ${requestingAgentId}`);
    
    // We can only help with valuation-related tasks
    if (!helpRequest.problemDescription.includes('valuation') && 
        !helpRequest.problemDescription.includes('income') &&
        !helpRequest.problemDescription.includes('multiplier')) {
      console.log(`Cannot help with ${helpRequest.problemDescription}, not a valuation issue`);
      return;
    }
    
    // Check if we have the required context data
    if (!helpRequest.contextData) {
      console.log('Insufficient context data to provide help');
      return;
    }
    
    try {
      // If we have income data, try to analyze with adjusted parameters
      if (helpRequest.contextData.incomeData) {
        const incomeData = helpRequest.contextData.incomeData;
        
        // Temporarily lower our confidence threshold for this analysis
        const originalThreshold = this.confidenceThreshold;
        this.confidenceThreshold = 0.4;
        
        // Adjust multiplier range for this special analysis
        const originalRange = { ...this.multiplierRange };
        this.multiplierRange = {
          min: originalRange.min * 0.9,
          max: originalRange.max * 1.1
        };
        
        // Perform analysis
        const result = await this.analyzeIncome(incomeData);
        
        // Restore original parameters
        this.confidenceThreshold = originalThreshold;
        this.multiplierRange = originalRange;
        
        // Send result to MCP for routing back to requesting agent
        this.sendMessage({
          messageId: crypto.randomUUID(),
          correlationId: helpRequest.taskId,
          sourceAgentId: this.agentId,
          targetAgentId: 'MCP',
          timestamp: new Date().toISOString(),
          eventType: EventType.RESPONSE,
          payload: {
            status: 'success',
            result,
            helpProvidedTo: requestingAgentId,
            originalTask: helpRequest.taskId,
            notes: ['Analysis performed with expanded parameters']
          }
        });
      }
      // If we have valuation history, try to analyze anomalies with adjusted sensitivity
      else if (helpRequest.contextData.valuationHistory) {
        const valuationHistory = helpRequest.contextData.valuationHistory;
        const result = await this.detectAnomalies(valuationHistory);
        
        // Send result to MCP for routing back to requesting agent
        this.sendMessage({
          messageId: crypto.randomUUID(),
          correlationId: helpRequest.taskId,
          sourceAgentId: this.agentId,
          targetAgentId: 'MCP',
          timestamp: new Date().toISOString(),
          eventType: EventType.RESPONSE,
          payload: {
            status: 'success',
            result,
            helpProvidedTo: requestingAgentId,
            originalTask: helpRequest.taskId,
            notes: ['Anomaly detection performed with standard parameters']
          }
        });
      }
      else {
        console.log('Unable to help with the provided context data');
      }
    } catch (error) {
      console.error('Error providing valuation help:', error);
      
      // Report error to MCP
      this.sendMessage({
        messageId: crypto.randomUUID(),
        correlationId: helpRequest.taskId,
        sourceAgentId: this.agentId,
        targetAgentId: 'MCP',
        timestamp: new Date().toISOString(),
        eventType: EventType.ERROR,
        payload: {
          errorCode: ErrorCode.PROCESSING_ERROR,
          errorMessage: `Error providing help: ${(error as Error).message}`,
          helpRequestId: helpRequest.taskId,
          requestingAgentId
        }
      });
    }
  }
  
  /**
   * Learn from a set of experiences
   * @param experiences The experiences to learn from
   * @returns Promise resolving when learning is complete
   */
  public override async learn(experiences: AgentExperience[]): Promise<void> {
    console.log(`${this.agentId} learning from ${experiences.length} experiences`);
    
    // Extract successful valuation results to learn from
    const valuationResults = experiences
      .filter(exp => 
        exp.metadata.messageType === EventType.RESPONSE && 
        exp.result.status === 'success' &&
        exp.result.result?.suggestedValuation
      )
      .map(exp => exp.result.result);
    
    if (valuationResults.length === 0) {
      console.log('No relevant valuation experiences to learn from');
      return;
    }
    
    // Update confidence threshold based on successful results
    const confidenceScores = valuationResults
      .filter(result => result.suggestedValuation && typeof result.suggestedValuation.confidenceScore === 'number')
      .map(result => result.suggestedValuation.confidenceScore);
    
    if (confidenceScores.length > 0) {
      const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
      
      // Adjust confidence threshold (with limits)
      const newThreshold = Math.max(0.5, Math.min(0.9, 
        this.confidenceThreshold * (1 - this.learningRate) + avgConfidence / 100 * this.learningRate
      ));
      
      if (Math.abs(newThreshold - this.confidenceThreshold) > 0.05) {
        console.log(`Adjusted confidence threshold from ${this.confidenceThreshold} to ${newThreshold}`);
        this.confidenceThreshold = newThreshold;
      }
    }
    
    // Learn from multipliers in successful valuations
    const multipliers = valuationResults
      .filter(result => result.suggestedValuation && result.suggestedValuation.multiplier)
      .map(result => parseFloat(result.suggestedValuation.multiplier));
    
    if (multipliers.length > 0) {
      // Calculate average multiplier by category if available
      const multipliersBySource: Record<string, number[]> = {};
      
      valuationResults.forEach(result => {
        if (result.analysis && 
            result.analysis.distribution && 
            result.suggestedValuation && 
            result.suggestedValuation.multiplier) {
          
          // Find primary income source
          const primarySource = result.analysis.distribution
            .sort((a: any, b: any) => b.percentage - a.percentage)[0]?.source;
          
          if (primarySource) {
            if (!multipliersBySource[primarySource]) {
              multipliersBySource[primarySource] = [];
            }
            
            multipliersBySource[primarySource].push(
              parseFloat(result.suggestedValuation.multiplier)
            );
          }
        }
      });
      
      // Update county factors for sources with enough data
      Object.entries(multipliersBySource).forEach(([source, values]) => {
        if (values.length >= 3) {
          const avgMultiplier = values.reduce((sum, val) => sum + val, 0) / values.length;
          
          let factorKey: string;
          switch(source) {
            case 'rental':
              factorKey = 'residentialBaseMultiplier';
              break;
            case 'business':
              factorKey = 'commercialBaseMultiplier';
              break;
            case 'investment':
              factorKey = 'agriculturalBaseMultiplier';
              break;
            default:
              return; // Skip unknown sources
          }
          
          // Adjust factor with learning rate
          const oldFactor = this.countyFactors[factorKey];
          const newFactor = oldFactor * (1 - this.learningRate) + avgMultiplier * this.learningRate;
          
          if (Math.abs(newFactor - oldFactor) > 0.1) {
            console.log(`Adjusted ${factorKey} from ${oldFactor} to ${newFactor}`);
            this.countyFactors[factorKey] = newFactor;
          }
        }
      });
    }
    
    // Learn from error experiences
    const errorExperiences = experiences.filter(exp => exp.metadata.messageType === EventType.ERROR);
    if (errorExperiences.length > 0) {
      console.log(`Analyzing ${errorExperiences.length} error experiences to improve robustness`);
      
      // Check for common error patterns and adjust parameters if needed
      const lowConfidenceErrors = errorExperiences.filter(exp => 
        exp.result.errorMessage && exp.result.errorMessage.includes('confidence')
      );
      
      if (lowConfidenceErrors.length > errorExperiences.length / 2) {
        // Many confidence-related errors, reduce threshold slightly
        const newThreshold = Math.max(0.4, this.confidenceThreshold - 0.05);
        console.log(`Many confidence errors detected, reducing threshold from ${this.confidenceThreshold} to ${newThreshold}`);
        this.confidenceThreshold = newThreshold;
      }
    }
  }
  
  /**
   * Get the capabilities of this agent
   * @returns Array of capability strings
   */
  public override getCapabilities(): string[] {
    return [
      'income_analysis',
      'valuation_calculation',
      'anomaly_detection',
      'multiplier_optimization',
      'benton_county_valuation'
    ];
  }
  
  /**
   * Helper method to find the most common income type
   * @param incomeBySource Record mapping income sources to arrays of income records
   * @returns The most common income source type
   */
  private getMostCommonIncomeType(incomeBySource: Record<string, Income[]>): string {
    let maxCount = 0;
    let mostCommonType = 'other';
    
    Object.entries(incomeBySource).forEach(([source, incomes]) => {
      if (incomes.length > maxCount) {
        maxCount = incomes.length;
        mostCommonType = source;
      }
    });
    
    return mostCommonType;
  }
  
  /**
   * Calculate the volatility (standard deviation) of a set of values
   * @param values Array of numeric values
   * @returns The volatility value
   */
  private calculateVolatility(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Get potential causes for an anomaly
   * @param anomalyType Type of anomaly
   * @param multiplierChange Change in multiplier
   * @returns Array of potential causes
   */
  private getPotentialCauses(anomalyType: string, multiplierChange: number): string[] {
    const causes = [];
    
    if (anomalyType === 'rapid_increase') {
      causes.push('Significant improvement in property condition or amenities');
      causes.push('Change in local market conditions or comparable property sales');
      
      if (multiplierChange > 0.5) {
        causes.push('Substantial increase in income multiplier applied');
      }
      
      causes.push('Correction of previous undervaluation');
    } else {
      causes.push('Deterioration in property condition');
      causes.push('Unfavorable change in local market conditions');
      
      if (multiplierChange < -0.5) {
        causes.push('Substantial decrease in income multiplier applied');
      }
      
      causes.push('Correction of previous overvaluation');
    }
    
    return causes;
  }
  
  /**
   * Get suggested actions for an anomaly
   * @param anomalyType Type of anomaly
   * @param severity Severity of the anomaly
   * @returns Array of suggested actions
   */
  private getSuggestedActions(anomalyType: string, severity: 'high' | 'medium' | 'low'): string[] {
    const actions = [];
    
    if (severity === 'high') {
      actions.push('Review valuation methodology and inputs immediately');
      actions.push('Verify all income sources and amounts for accuracy');
      actions.push('Compare with recent comparable properties in Benton County');
    }
    
    if (anomalyType === 'rapid_increase') {
      actions.push('Verify that income projections are realistic and sustainable');
      actions.push('Consider if the multiplier is appropriate for the property type in current market');
    } else {
      actions.push('Investigate if any income sources have been overlooked or underreported');
      actions.push('Check if the property condition or market position has changed');
    }
    
    if (severity !== 'low') {
      actions.push('Document justification for the valuation change in detail');
    }
    
    return actions;
  }
  
  /**
   * Generate a summary of anomaly detection results
   * @param anomalies Array of detected anomalies
   * @param volatility Overall volatility value
   * @returns Summary text
   */
  private generateAnomalySummary(anomalies: any[], volatility: number): string {
    if (anomalies.length === 0) {
      if (volatility < 10) {
        return 'Valuation history shows consistent, stable patterns with no anomalies detected.';
      } else {
        return `Valuation history shows moderate volatility (${volatility.toFixed(2)}%) but no specific anomalies detected.`;
      }
    }
    
    const highSeverity = anomalies.filter(a => a.severity === 'high').length;
    const mediumSeverity = anomalies.filter(a => a.severity === 'medium').length;
    const lowSeverity = anomalies.filter(a => a.severity === 'low').length;
    
    let summary = `Detected ${anomalies.length} anomalies in valuation history: `;
    
    if (highSeverity > 0) {
      summary += `${highSeverity} high severity, `;
    }
    
    if (mediumSeverity > 0) {
      summary += `${mediumSeverity} medium severity, `;
    }
    
    if (lowSeverity > 0) {
      summary += `${lowSeverity} low severity. `;
    }
    
    summary += `Overall volatility is ${volatility.toFixed(2)}%.`;
    
    if (highSeverity > 0) {
      summary += ' High severity anomalies should be addressed immediately.';
    }
    
    return summary;
  }
}