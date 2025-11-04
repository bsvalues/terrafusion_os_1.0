/**
 * ReportingAgent - AI-powered agent for generating insights and reports from valuations
 * Enhanced with MCP compatibility and learning capabilities
 */

import { Income, Valuation, incomeSourceEnum } from '../shared/schema';
import { 
  AgentType, 
  EventType,
  ErrorCode
} from '../shared/agentProtocol';
import { BaseAgent } from './BaseAgent';
import { AgentExperience } from '../shared/agentProtocol';
import { REPORTING_AGENT_CONFIG } from '../config/mcpConfig';
import { z } from 'zod';

// Reporting period validation schema
const ReportingPeriodSchema = z.enum(['monthly', 'quarterly', 'yearly']);
type ReportingPeriod = z.infer<typeof ReportingPeriodSchema>;

// Options schema with validation
const ReportOptionsSchema = z.object({
  period: ReportingPeriodSchema,
  includeCharts: z.boolean(),
  includeInsights: z.boolean(),
  includeRecommendations: z.boolean()
});
interface ReportOptions extends z.infer<typeof ReportOptionsSchema> {}

interface ValuationMetrics {
  averageValuation: number;
  medianValuation: number;
  valuationGrowth: number;
  valuationVolatility: number;
  incomeMultiplier: number;
  incomeToValueRatio: number;
  propertyCount: number;
  bentonCountyMarketShare: number;
}

interface ValuationInsight {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  importance: 'high' | 'medium' | 'low';
}

interface ValuationSummary {
  text: string;
  highlights: string[];
  trends: string[];
  period: ReportingPeriod;
}

interface ReportRecommendation {
  title: string;
  description: string;
  actionItems: string[];
  priority: 'high' | 'medium' | 'low';
}

interface ChartData {
  valuationHistory: Array<{ date: Date; amount: string }>;
  incomeBreakdown: Array<{ source: string; percentage: number }>;
  incomeGrowth: Array<{ date: Date; amount: string }>;
  valuationByPropertyType: Array<{ type: string; average: number; count: number }>;
}

interface ValuationReport {
  summary: ValuationSummary;
  metrics: ValuationMetrics;
  insights: ValuationInsight[];
  recommendations: ReportRecommendation[];
  charts?: ChartData;
  dateGenerated: Date;
  periodCovered: { start: Date; end: Date };
  errors?: string[]; // Optional array of errors encountered during processing
}

/**
 * Enhanced ReportingAgent with MCP compatibility
 */
export class ReportingAgent extends BaseAgent {
  private defaultPeriod: ReportingPeriod;
  private reportingPeriods: string[];
  private insightGenerationThreshold: number;
  private chartGenerationEnabled: boolean;
  
  /**
   * Create a new ReportingAgent
   * @param agentId Unique ID for this agent
   */
  constructor(agentId: string = 'reporting-agent-1') {
    super(agentId, AgentType.REPORTING);
    
    // Initialize from configuration
    const config = REPORTING_AGENT_CONFIG;
    this.defaultPeriod = config.defaultPeriod as ReportingPeriod;
    this.reportingPeriods = config.reportingPeriods;
    this.insightGenerationThreshold = config.insightGenerationThreshold;
    this.chartGenerationEnabled = config.chartGenerationEnabled;
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
      if (request.type === 'generate-report') {
        result = await this.generateReport(
          request.incomeData,
          request.valuationHistory,
          request.options
        );
      } else if (request.type === 'generate-summary') {
        result = await this.generateValuationSummary(
          request.incomeData,
          request.valuationHistory
        );
      } else {
        throw new Error(`Unknown request type: ${request.type}`);
      }
      
      const processingTime = Date.now() - startTime;
      this.reportResult(result, processingTime, undefined, request.correlationId);
      return result;
    } catch (error) {
      this.reportError(error as Error, request.id, request.correlationId);
      
      // If we have insufficient data for insights, request help
      if (error instanceof Error && (
          error.message.includes('insufficient data') || 
          error.message.includes('not enough data')
         )) {
        this.requestHelp(
          `Insufficient data for report generation: ${error.message}`,
          request.id || 'unknown-task',
          1,
          error.message,
          { 
            incomeData: request.incomeData,
            valuationHistory: request.valuationHistory,
            options: request.options
          }
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Generates a comprehensive report based on income and valuation data
   * @param incomeData Array of income records
   * @param valuationHistory Array of valuation records
   * @param options Report configuration options
   * @returns Generated report with insights and recommendations
   */
  async generateReport(
    incomeData: Income[],
    valuationHistory: Valuation[],
    options?: Partial<ReportOptions>
  ): Promise<ValuationReport> {
    if (!incomeData || !valuationHistory) {
      throw new Error('Cannot generate report: Missing income or valuation data');
    }

    // Initialize errors collection
    const errors: string[] = [];

    // Validate and pre-process options
    let validatedOptions: ReportOptions;
    try {
      // Default options
      const defaultOptions: ReportOptions = {
        period: this.defaultPeriod,
        includeCharts: this.chartGenerationEnabled,
        includeInsights: true,
        includeRecommendations: true
      };
      
      // Merge with provided options
      const mergedOptions = {
        ...defaultOptions,
        ...options
      };
      
      // Validate with schema
      validatedOptions = ReportOptionsSchema.parse(mergedOptions);
    } catch (error) {
      // If validation fails, use defaults and add to errors
      validatedOptions = {
        period: this.defaultPeriod,
        includeCharts: this.chartGenerationEnabled,
        includeInsights: true,
        includeRecommendations: true
      };
      
      if (error instanceof z.ZodError) {
        const optionsErrors = error.errors.map(e => `Invalid option '${e.path.join('.')}': ${e.message}`);
        errors.push(...optionsErrors);
        
        // Add specific errors for reporting period
        if (options?.period && !this.reportingPeriods.includes(options.period)) {
          errors.push(`Invalid reporting period '${options.period}'. Using default '${this.defaultPeriod}'.`);
        }
      } else {
        errors.push(`Error validating report options: ${(error as Error).message}`);
      }
    }
    
    // Pre-process income and valuation data
    const processedIncome = this.preprocessIncomeData(incomeData);
    const processedValuations = this.preprocessValuationData(valuationHistory);
    
    // Collect errors from preprocessing
    errors.push(...processedIncome.errors);
    errors.push(...processedValuations.errors);

    // Check if we have enough data for meaningful insights
    if (processedValuations.processed.length < this.insightGenerationThreshold) {
      errors.push(`Limited valuation data (${processedValuations.processed.length} records). Insights may be less reliable.`);
    }

    // Calculate metrics using processed data
    const metrics = this.calculateMetrics(processedIncome.processed, processedValuations.processed);

    // Generate period covered
    const now = new Date();
    let startDate: Date;
    
    switch (validatedOptions.period) {
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarterly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    // Group data by reporting period
    const groupedValuations = this.getDataByPeriod(processedValuations.processed, validatedOptions.period);

    // Generate insights if requested
    const insights = validatedOptions.includeInsights 
      ? this.generateInsights(processedIncome.processed, processedValuations.processed, metrics, validatedOptions.period)
      : [];

    // Generate recommendations if requested
    const recommendations = validatedOptions.includeRecommendations
      ? this.generateRecommendations(metrics, insights)
      : [];

    // Generate chart data if requested
    const charts = validatedOptions.includeCharts
      ? this.prepareChartData(processedIncome.processed, processedValuations.processed, validatedOptions.period)
      : undefined;

    // Generate summary text
    const summary = await this.generateValuationSummary(processedIncome.processed, processedValuations.processed);

    return {
      summary,
      metrics,
      insights,
      recommendations,
      charts,
      dateGenerated: new Date(),
      periodCovered: {
        start: startDate,
        end: now
      },
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Generates a natural language summary of valuation performance
   * @param incomeData Array of income records
   * @param valuationHistory Array of valuation records
   * @returns Generated summary text
   */
  async generateValuationSummary(incomeData: Income[], valuationHistory: Valuation[]): Promise<ValuationSummary> {
    if (valuationHistory.length === 0) {
      return {
        text: "No valuation data available for summary generation.",
        highlights: ["No valuation data available"],
        trends: ["Insufficient data to identify trends"],
        period: this.defaultPeriod
      };
    }

    // Pre-process the data for validation
    const processedIncome = this.preprocessIncomeData(incomeData);
    const processedValuations = this.preprocessValuationData(valuationHistory);

    // Sort by date
    const sortedValuations = [...processedValuations.processed].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Get metrics using validated data
    const metrics = this.calculateMetrics(processedIncome.processed, processedValuations.processed);
    
    // Calculate basic stats
    const firstValuation = sortedValuations[0];
    const lastValuation = sortedValuations[sortedValuations.length - 1];
    const firstAmount = parseFloat(firstValuation.valuationAmount);
    const lastAmount = parseFloat(lastValuation.valuationAmount);
    const percentChange = ((lastAmount - firstAmount) / firstAmount) * 100;
    
    // Calculate time period
    const firstDate = new Date(firstValuation.createdAt);
    const lastDate = new Date(lastValuation.createdAt);
    const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                       (lastDate.getMonth() - firstDate.getMonth());
    
    let period: ReportingPeriod = this.defaultPeriod;
    if (monthsDiff >= 12) {
      period = 'yearly';
    } else if (monthsDiff >= 3) {
      period = 'quarterly';
    }

    // Generate highlights
    const highlights = [
      `Average valuation: $${metrics.averageValuation.toFixed(2)}`,
      `Total properties valued: ${metrics.propertyCount}`,
      `Overall growth: ${percentChange.toFixed(2)}% over ${monthsDiff} months`
    ];

    // Generate trends
    const trends = [];
    if (percentChange > 0) {
      trends.push(`Valuations have shown an upward trend of ${percentChange.toFixed(2)}%`);
    } else if (percentChange < 0) {
      trends.push(`Valuations have shown a downward trend of ${Math.abs(percentChange).toFixed(2)}%`);
    } else {
      trends.push(`Valuations have remained stable`);
    }

    if (metrics.valuationVolatility > 20) {
      trends.push("Significant volatility observed in valuation data");
    } else if (metrics.valuationVolatility > 10) {
      trends.push("Moderate volatility observed in valuation data");
    } else {
      trends.push("Low volatility in valuation data indicates stable market conditions");
    }

    // Generate main summary text
    const summaryText = [
      `Valuation Summary for Benton County Properties (${period} report)`,
      ``,
      `Over the past ${monthsDiff} month${monthsDiff !== 1 ? 's' : ''}, property valuations ${percentChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(percentChange).toFixed(2)}%.`,
      `The average valuation across ${metrics.propertyCount} properties was $${metrics.averageValuation.toFixed(2)}.`,
      `The typical income multiplier used was ${metrics.incomeMultiplier.toFixed(2)}x.`,
      ``,
      `${trends.join('. ')}.`,
      ``,
      `This data represents Benton County's property market and reflects local economic trends.`
    ].join('\n');

    return {
      text: summaryText,
      highlights,
      trends,
      period
    };
  }
  
  /**
   * Handle a help request from another agent
   * @param helpRequest The help request payload
   * @param requestingAgentId ID of the agent requesting help
   * @returns Promise resolving when help is provided
   */
  public override async handleHelpRequest(helpRequest: any, requestingAgentId: string): Promise<void> {
    console.log(`ReportingAgent handling help request from ${requestingAgentId}`);
    
    // We can only help with reporting-related tasks
    if (!helpRequest.problemDescription.includes('report') && 
        !helpRequest.problemDescription.includes('insight') &&
        !helpRequest.problemDescription.includes('summary')) {
      console.log(`Cannot help with ${helpRequest.problemDescription}, not a reporting issue`);
      return;
    }
    
    // Check if we have the required context data
    if (!helpRequest.contextData) {
      console.log('Insufficient context data to provide help');
      return;
    }
    
    try {
      // Extract income and valuation data from the context
      const incomeData = helpRequest.contextData.incomeData || [];
      const valuationHistory = helpRequest.contextData.valuationHistory || [];
      
      // If we don't have enough data, we still try to provide a basic summary
      if (valuationHistory.length < this.insightGenerationThreshold) {
        // Temporarily lower our threshold for this request
        const originalThreshold = this.insightGenerationThreshold;
        this.insightGenerationThreshold = Math.max(1, this.insightGenerationThreshold / 2);
        
        // Get options or use defaults
        const options = helpRequest.contextData.options || {
          period: this.defaultPeriod,
          includeCharts: this.chartGenerationEnabled,
          includeInsights: true,
          includeRecommendations: true
        };
        
        // Try to generate a report even with limited data
        let result;
        if (helpRequest.problemDescription.includes('report')) {
          result = await this.generateReport(incomeData, valuationHistory, options);
        } else {
          result = await this.generateValuationSummary(incomeData, valuationHistory);
        }
        
        // Add note about limited data
        if (Array.isArray(result.errors)) {
          result.errors.push('Report generated with limited data at the request of another agent');
        } else {
          result.errors = ['Report generated with limited data at the request of another agent'];
        }
        
        // Restore original threshold
        this.insightGenerationThreshold = originalThreshold;
        
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
            notes: ['Report generated with limited data']
          }
        });
      } else {
        // We have enough data, generate a normal report
        let result;
        if (helpRequest.problemDescription.includes('report')) {
          result = await this.generateReport(
            incomeData, 
            valuationHistory, 
            helpRequest.contextData.options
          );
        } else {
          result = await this.generateValuationSummary(incomeData, valuationHistory);
        }
        
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
            originalTask: helpRequest.taskId
          }
        });
      }
    } catch (error) {
      console.error('Error providing reporting help:', error);
      
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
    
    // Extract successful report generations to learn from
    const reportResults = experiences
      .filter(exp => 
        exp.metadata.messageType === EventType.RESPONSE && 
        exp.result.status === 'success' &&
        exp.result.result?.summary
      )
      .map(exp => exp.result.result);
    
    if (reportResults.length === 0) {
      console.log('No relevant reporting experiences to learn from');
      return;
    }
    
    // Analyze which reporting period is most commonly used
    const periodCounts: Record<string, number> = {
      'monthly': 0,
      'quarterly': 0,
      'yearly': 0
    };
    
    reportResults.forEach(result => {
      if (result.summary && result.summary.period) {
        const period = result.summary.period;
        periodCounts[period] = (periodCounts[period] || 0) + 1;
      }
    });
    
    // Find the most common period
    let mostCommonPeriod = this.defaultPeriod;
    let maxCount = 0;
    
    Object.entries(periodCounts).forEach(([period, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonPeriod = period as ReportingPeriod;
      }
    });
    
    // Update default period if there's a clear preference
    if (maxCount >= 5 && mostCommonPeriod !== this.defaultPeriod) {
      console.log(`Updating default reporting period from ${this.defaultPeriod} to ${mostCommonPeriod} based on usage patterns`);
      this.defaultPeriod = mostCommonPeriod as ReportingPeriod;
    }
    
    // Learn from error experiences
    const errorExperiences = experiences.filter(exp => exp.metadata.messageType === EventType.ERROR);
    if (errorExperiences.length > 0) {
      console.log(`Analyzing ${errorExperiences.length} error experiences to improve robustness`);
      
      // Check for common error patterns
      const insufficientDataErrors = errorExperiences.filter(exp => 
        exp.result.errorMessage && (
          exp.result.errorMessage.includes('insufficient data') ||
          exp.result.errorMessage.includes('not enough data')
        )
      );
      
      if (insufficientDataErrors.length > errorExperiences.length / 2) {
        // If most errors are about insufficient data, lower our threshold
        const newThreshold = Math.max(1, this.insightGenerationThreshold - 1);
        console.log(`Many insufficient data errors, lowering insight generation threshold from ${this.insightGenerationThreshold} to ${newThreshold}`);
        this.insightGenerationThreshold = newThreshold;
      }
    }
  }
  
  /**
   * Get the capabilities of this agent
   * @returns Array of capability strings
   */
  public override getCapabilities(): string[] {
    return [
      'report_generation',
      'insight_generation',
      'valuation_summary',
      'trend_analysis',
      'recommendation_generation'
    ];
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
        // Fix any issues not caught by schema
        const amountNum = parseFloat(income.amount);
        if (amountNum < 0) {
          errors.push(`Income ID ${income.id}: Fixed negative amount (${income.amount})`);
          income.amount = Math.abs(amountNum).toString();
        }
        
        // Add to processed array
        processed.push(income);
      } catch (error) {
        // If validation fails, record error
        errors.push(`Error processing income record (ID: ${income.id || 'unknown'}): ${(error as Error).message}`);
        
        // Attempt to partially fix if possible
        if (income.id && income.amount) {
          // Check if source is the issue - use 'other' as fallback
          if (![
            'salary', 'business', 'freelance', 'investment', 'rental', 'other'
          ].includes(income.source)) {
            income.source = 'other';
            errors.push(`Income ID ${income.id}: Invalid source '${income.source}' defaulted to 'other'`);
            processed.push(income);
          }
        }
      }
    }
    
    return { processed, errors };
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
        // Fix any additional issues not caught by schema
        const valuationAmount = parseFloat(valuation.valuationAmount);
        const totalAnnualIncome = parseFloat(valuation.totalAnnualIncome);
        const multiplier = parseFloat(valuation.multiplier);
        
        // Check for consistency between income, multiplier and valuation
        const calculatedValuation = totalAnnualIncome * multiplier;
        const difference = Math.abs(calculatedValuation - valuationAmount);
        
        if (difference > (calculatedValuation * 0.01)) { // More than 1% difference
          errors.push(`Valuation ID ${valuation.id}: Inconsistency between totalAnnualIncome (${totalAnnualIncome}), multiplier (${multiplier}), and valuationAmount (${valuationAmount})`);
        }
        
        // Add to processed array
        processed.push(valuation);
      } catch (error) {
        // If validation fails, record error
        errors.push(`Error processing valuation record (ID: ${valuation.id || 'unknown'}): ${(error as Error).message}`);
        
        // Don't attempt to fix valuation records - they're more critical to be accurate
      }
    }
    
    return { processed, errors };
  }
  
  /**
   * Group valuation data by reporting period
   * @param valuations Array of valuations
   * @param period Reporting period granularity
   * @returns Valuations grouped by period key
   */
  private getDataByPeriod(valuations: Valuation[], period: ReportingPeriod): Record<string, Valuation[]> {
    const result: Record<string, Valuation[]> = {};
    
    valuations.forEach(valuation => {
      const date = new Date(valuation.createdAt);
      let key: string;
      
      switch (period) {
        case 'monthly':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'yearly':
          key = `${date.getFullYear()}`;
          break;
        default:
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      }
      
      if (!result[key]) {
        result[key] = [];
      }
      
      result[key].push(valuation);
    });
    
    return result;
  }
  
  /**
   * Calculate metrics from income and valuation data
   * @param incomes Array of income records
   * @param valuations Array of valuation records
   * @returns Calculated metrics
   */
  private calculateMetrics(incomes: Income[], valuations: Valuation[]): ValuationMetrics {
    if (valuations.length === 0) {
      return {
        averageValuation: 0,
        medianValuation: 0,
        valuationGrowth: 0,
        valuationVolatility: 0,
        incomeMultiplier: 0,
        incomeToValueRatio: 0,
        propertyCount: 0,
        bentonCountyMarketShare: 0
      };
    }
    
    // Calculate average valuation
    const valuationAmounts = valuations.map(v => parseFloat(v.valuationAmount));
    const totalValuation = valuationAmounts.reduce((sum, amount) => sum + amount, 0);
    const averageValuation = totalValuation / valuationAmounts.length;
    
    // Calculate median valuation
    const sortedAmounts = [...valuationAmounts].sort((a, b) => a - b);
    const midIndex = Math.floor(sortedAmounts.length / 2);
    const medianValuation = sortedAmounts.length % 2 === 0
      ? (sortedAmounts[midIndex - 1] + sortedAmounts[midIndex]) / 2
      : sortedAmounts[midIndex];
    
    // Calculate valuation growth (using first and last entries, sorted by date)
    const sortedByDate = [...valuations].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    let valuationGrowth = 0;
    if (sortedByDate.length >= 2) {
      const firstAmount = parseFloat(sortedByDate[0].valuationAmount);
      const lastAmount = parseFloat(sortedByDate[sortedByDate.length - 1].valuationAmount);
      valuationGrowth = ((lastAmount - firstAmount) / firstAmount) * 100;
    }
    
    // Calculate volatility (standard deviation of percentage changes)
    let valuationVolatility = 0;
    if (sortedByDate.length >= 3) {
      const percentChanges = [];
      for (let i = 1; i < sortedByDate.length; i++) {
        const prevAmount = parseFloat(sortedByDate[i - 1].valuationAmount);
        const currAmount = parseFloat(sortedByDate[i].valuationAmount);
        const percentChange = ((currAmount - prevAmount) / prevAmount) * 100;
        percentChanges.push(percentChange);
      }
      
      const avgChange = percentChanges.reduce((sum, change) => sum + change, 0) / percentChanges.length;
      const squaredDiffs = percentChanges.map(change => Math.pow(change - avgChange, 2));
      const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
      valuationVolatility = Math.sqrt(variance);
    }
    
    // Calculate average income multiplier
    const multipliers = valuations.map(v => parseFloat(v.multiplier));
    const incomeMultiplier = multipliers.reduce((sum, multiplier) => sum + multiplier, 0) / multipliers.length;
    
    // Calculate income to value ratio
    const totalIncome = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
    const incomeToValueRatio = totalIncome > 0 ? (totalValuation / totalIncome) : 0;
    
    // Count unique properties (estimating based on total valuations)
    const propertyCount = valuations.length;
    
    // Estimate market share (this would be replaced with actual data in a real implementation)
    const bentonCountyMarketShare = 0.05; // Placeholder value
    
    return {
      averageValuation,
      medianValuation,
      valuationGrowth,
      valuationVolatility,
      incomeMultiplier,
      incomeToValueRatio,
      propertyCount,
      bentonCountyMarketShare
    };
  }
  
  /**
   * Generate insights from metrics and data
   * @param incomes Array of income records
   * @param valuations Array of valuation records
   * @param metrics Calculated metrics
   * @param period Reporting period
   * @returns Array of insights
   */
  private generateInsights(
    incomes: Income[],
    valuations: Valuation[],
    metrics: ValuationMetrics,
    period: ReportingPeriod
  ): ValuationInsight[] {
    const insights: ValuationInsight[] = [];
    
    // Add insights based on growth
    if (metrics.valuationGrowth > 10) {
      insights.push({
        type: 'positive',
        message: `Strong valuation growth of ${metrics.valuationGrowth.toFixed(2)}% observed in Benton County properties`,
        importance: 'high'
      });
    } else if (metrics.valuationGrowth < -5) {
      insights.push({
        type: 'negative',
        message: `Concerning decline of ${Math.abs(metrics.valuationGrowth).toFixed(2)}% in property valuations`,
        importance: 'high'
      });
    } else if (metrics.valuationGrowth > 0) {
      insights.push({
        type: 'positive',
        message: `Modest valuation growth of ${metrics.valuationGrowth.toFixed(2)}% indicates stable market`,
        importance: 'medium'
      });
    } else {
      insights.push({
        type: 'neutral',
        message: `Flat valuations suggest a stabilizing market in Benton County`,
        importance: 'medium'
      });
    }
    
    // Add insights based on volatility
    if (metrics.valuationVolatility > 20) {
      insights.push({
        type: 'negative',
        message: `High valuation volatility (${metrics.valuationVolatility.toFixed(2)}) indicates market uncertainty`,
        importance: 'high'
      });
    } else if (metrics.valuationVolatility < 5) {
      insights.push({
        type: 'positive',
        message: `Low valuation volatility (${metrics.valuationVolatility.toFixed(2)}) suggests predictable market conditions`,
        importance: 'medium'
      });
    }
    
    // Add insights based on income multiplier
    if (metrics.incomeMultiplier > 4.5) {
      insights.push({
        type: 'neutral',
        message: `Income multiplier (${metrics.incomeMultiplier.toFixed(2)}x) is above average for Benton County`,
        importance: 'medium'
      });
    } else if (metrics.incomeMultiplier < 3.0) {
      insights.push({
        type: 'neutral',
        message: `Income multiplier (${metrics.incomeMultiplier.toFixed(2)}x) is below average for Benton County`,
        importance: 'medium'
      });
    }
    
    // Add insights based on income sources
    const incomeBySource: Record<string, number> = {};
    incomes.forEach(income => {
      const amount = parseFloat(income.amount);
      if (!incomeBySource[income.source]) {
        incomeBySource[income.source] = 0;
      }
      incomeBySource[income.source] += amount;
    });
    
    const totalIncome = Object.values(incomeBySource).reduce((sum, amount) => sum + amount, 0);
    
    if (totalIncome > 0) {
      // Find primary income source
      let primarySource = '';
      let primaryAmount = 0;
      
      Object.entries(incomeBySource).forEach(([source, amount]) => {
        if (amount > primaryAmount) {
          primarySource = source;
          primaryAmount = amount;
        }
      });
      
      const primaryPercentage = (primaryAmount / totalIncome) * 100;
      
      if (primaryPercentage > 80) {
        insights.push({
          type: 'negative',
          message: `Heavy reliance on ${primarySource} income (${primaryPercentage.toFixed(1)}%) creates concentration risk`,
          importance: 'medium'
        });
      } else if (primaryPercentage < 50 && Object.keys(incomeBySource).length >= 3) {
        insights.push({
          type: 'positive',
          message: `Well-diversified income sources provide stability to valuations`,
          importance: 'medium'
        });
      }
    }
    
    // Period-specific insights
    if (period === 'yearly' && metrics.valuationGrowth > 15) {
      insights.push({
        type: 'positive',
        message: `Annual growth rate of ${metrics.valuationGrowth.toFixed(1)}% exceeds regional average`,
        importance: 'high'
      });
    } else if (period === 'quarterly' && metrics.valuationVolatility > 10) {
      insights.push({
        type: 'negative',
        message: `Quarterly volatility of ${metrics.valuationVolatility.toFixed(1)} suggests monitoring market conditions closely`,
        importance: 'medium'
      });
    }
    
    return insights;
  }
  
  /**
   * Generate recommendations based on metrics and insights
   * @param metrics Calculated metrics
   * @param insights Generated insights
   * @returns Array of recommendations
   */
  private generateRecommendations(
    metrics: ValuationMetrics,
    insights: ValuationInsight[]
  ): ReportRecommendation[] {
    const recommendations: ReportRecommendation[] = [];
    
    // Check for high volatility
    if (metrics.valuationVolatility > 15) {
      recommendations.push({
        title: 'Monitor Market Volatility',
        description: `High valuation volatility of ${metrics.valuationVolatility.toFixed(1)} suggests increased market uncertainty.`,
        actionItems: [
          'Increase frequency of valuation updates',
          'Track local market conditions more closely',
          'Consider more conservative income projections'
        ],
        priority: 'high'
      });
    }
    
    // Check for growth trends
    if (metrics.valuationGrowth > 12) {
      recommendations.push({
        title: 'Capitalize on Strong Growth',
        description: `Valuation growth of ${metrics.valuationGrowth.toFixed(1)}% presents opportunities.`,
        actionItems: [
          'Evaluate whether current income multipliers reflect market conditions',
          'Consider reassessing property categories with strongest performance',
          'Track sustainability of growth trend with more frequent updates'
        ],
        priority: 'medium'
      });
    } else if (metrics.valuationGrowth < -8) {
      recommendations.push({
        title: 'Address Declining Valuations',
        description: `Valuation decline of ${Math.abs(metrics.valuationGrowth).toFixed(1)}% requires attention.`,
        actionItems: [
          'Identify property categories with largest declines',
          'Review and adjust income multipliers if necessary',
          'Investigate local market factors affecting values'
        ],
        priority: 'high'
      });
    }
    
    // Check for multiplier optimization
    if (metrics.incomeMultiplier < 3.0 || metrics.incomeMultiplier > 5.0) {
      recommendations.push({
        title: 'Review Income Multipliers',
        description: `Current multiplier of ${metrics.incomeMultiplier.toFixed(2)}x is outside typical Benton County range.`,
        actionItems: [
          'Analyze comparable properties and their multipliers',
          'Adjust multipliers to reflect current market conditions',
          'Validate multipliers against recent transaction data'
        ],
        priority: metrics.incomeMultiplier > 5.0 ? 'medium' : 'high'
      });
    }
    
    // Generate recommendations from high-importance insights
    const highImportanceInsights = insights.filter(insight => insight.importance === 'high');
    
    highImportanceInsights.forEach(insight => {
      if (insight.type === 'negative') {
        // For negative insights, create action-oriented recommendations
        if (insight.message.includes('decline')) {
          recommendations.push({
            title: 'Address Valuation Decline',
            description: insight.message,
            actionItems: [
              'Review recent property assessments for accuracy',
              'Analyze local market conditions affecting values',
              'Consider adjusting income multipliers to reflect current market'
            ],
            priority: 'high'
          });
        } else if (insight.message.includes('volatility')) {
          recommendations.push({
            title: 'Manage Market Volatility',
            description: insight.message,
            actionItems: [
              'Implement more frequent valuation updates',
              'Develop contingency plans for continued volatility',
              'Focus on stable income sources in valuations'
            ],
            priority: 'high'
          });
        }
      }
    });
    
    // Ensure we return at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Maintain Current Valuation Approach',
        description: 'Current valuations appear stable and within expected parameters.',
        actionItems: [
          'Continue regular valuation updates',
          'Monitor market conditions for any significant changes',
          'Keep income data current for accurate valuations'
        ],
        priority: 'low'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Prepares chart data from income and valuation records
   * @param incomes Array of income records
   * @param valuations Array of valuation records
   * @param period The reporting period granularity
   * @returns Formatted data for valuation history and income breakdown charts
   */
  private prepareChartData(
    incomes: Income[],
    valuations: Valuation[],
    period: ReportingPeriod
  ): ChartData {
    // Sort valuations by date
    const sortedValuations = [...valuations].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Prepare valuation history data
    const valuationHistory: Array<{ date: Date; amount: string }> = sortedValuations.map(valuation => ({
      date: new Date(valuation.createdAt),
      amount: valuation.valuationAmount
    }));
    
    // Prepare income breakdown data
    const incomeBySource: Record<string, number> = {};
    incomes.forEach(income => {
      const amount = parseFloat(income.amount);
      if (!incomeBySource[income.source]) {
        incomeBySource[income.source] = 0;
      }
      incomeBySource[income.source] += amount;
    });
    
    const totalIncome = Object.values(incomeBySource).reduce((sum, amount) => sum + amount, 0);
    
    const incomeBreakdown: Array<{ source: string; percentage: number }> = Object.entries(incomeBySource)
      .map(([source, amount]) => ({
        source,
        percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0
      }));
    
    // Prepare income growth data (simplified)
    const incomeGrowth: Array<{ date: Date; amount: string }> = [];
    
    // Prepare valuation by property type (simplified)
    const valuationByPropertyType: Array<{ type: string; average: number; count: number }> = [
      {
        type: 'Residential',
        average: valuations.length > 0 ? 
          valuations.reduce((sum, v) => sum + parseFloat(v.valuationAmount), 0) / valuations.length : 0,
        count: valuations.length
      }
    ];
    
    return {
      valuationHistory,
      incomeBreakdown,
      incomeGrowth,
      valuationByPropertyType
    };
  }
}