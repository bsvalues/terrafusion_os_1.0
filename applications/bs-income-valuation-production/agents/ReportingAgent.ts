import { Income, Valuation, incomeSourceEnum } from '../shared/schema';
import { TestValuation } from '../shared/testTypes';
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

// Income schema for validation
const IncomeSchema = z.object({
  id: z.number(),
  userId: z.number(),
  source: z.enum(['salary', 'business', 'freelance', 'investment', 'rental', 'other']),
  amount: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: 'Amount must be a valid number string'
  }),
  frequency: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.date()
});

// Valuation schema for validation
const ValuationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  name: z.string().min(1, "Name is required"),
  totalAnnualIncome: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: 'Total annual income must be a valid number string'
  }),
  multiplier: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: 'Multiplier must be a valid number string'
  }),
  valuationAmount: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: 'Valuation amount must be a valid number string'
  }),
  incomeBreakdown: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean().optional()
});

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
 * ReportingAgent - AI-powered agent for generating insights and reports from valuations
 */
export class ReportingAgent {
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
        period: 'monthly',
        includeCharts: true,
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
        period: 'monthly',
        includeCharts: true,
        includeInsights: true,
        includeRecommendations: true
      };
      
      if (error instanceof z.ZodError) {
        const optionsErrors = error.errors.map(e => `Invalid option '${e.path.join('.')}': ${e.message}`);
        errors.push(...optionsErrors);
        
        // Add specific errors for reporting period
        if (options?.period && !['monthly', 'quarterly', 'yearly'].includes(options.period)) {
          errors.push(`Invalid reporting period '${options.period}'. Using default 'monthly'.`);
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
        period: 'monthly'
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
    
    let period: ReportingPeriod = 'monthly';
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
        
        // Fix any additional issues not caught by schema
        const amountNum = parseFloat(income.amount);
        if (amountNum < 0) {
          errors.push(`Income ID ${income.id}: Fixed negative amount (${income.amount})`);
          income.amount = Math.abs(amountNum).toString();
        }
        
        // Add to processed array
        processed.push(income);
      } catch (error) {
        // If validation fails, record error
        if (error instanceof z.ZodError) {
          const errorDetails = error.errors.map(e => `Field '${e.path.join('.')}': ${e.message}`).join('; ');
          errors.push(`Invalid income record (ID: ${income.id || 'unknown'}): ${errorDetails}`);
        } else {
          errors.push(`Error processing income record (ID: ${income.id || 'unknown'}): ${(error as Error).message}`);
        }
        
        // Attempt to partially fix if possible
        if (income.id && income.amount) {
          // Check if source is the issue - use 'other' as fallback
          if (!['salary', 'business', 'freelance', 'investment', 'rental', 'other'].includes(income.source)) {
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
        // Validate with Zod schema
        ValuationSchema.parse(valuation);
        
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
        if (error instanceof z.ZodError) {
          const errorDetails = error.errors.map(e => `Field '${e.path.join('.')}': ${e.message}`).join('; ');
          errors.push(`Invalid valuation record (ID: ${valuation.id || 'unknown'}): ${errorDetails}`);
        } else {
          errors.push(`Error processing valuation record (ID: ${valuation.id || 'unknown'}): ${(error as Error).message}`);
        }
        
        // Don't attempt to fix valuation records - they're more critical to be accurate
      }
    }
    
    return { processed, errors };
  }
  
  /**
   * Private helper methods below
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
      }
      
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(valuation);
    });
    
    return result;
  }

  private calculateMetrics(incomes: Income[], valuations: Valuation[]): ValuationMetrics {
    // Convert to TestValuation to handle potential propertyId field
    const valuationsWithExtras = valuations as unknown as TestValuation[];
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
    
    // Count unique properties (this is a simplification - in real app would need better property identification)
    // Use the TestValuation interface to handle the propertyId field
    const valuationsWithId = valuations as unknown as TestValuation[];
    const propertyIds = new Set(valuationsWithId.map(v => v.propertyId ?? v.id));
    const propertyCount = propertyIds.size;
    
    // Placeholder for Benton County market share calculation
    // In a real application, this would compare against total Benton County properties
    // For now, just a placeholder value
    const bentonCountyMarketShare = Math.min(propertyCount / 100, 1) * 100;
    
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
        type: 'negative',
        message: `High income multiplier (${metrics.incomeMultiplier.toFixed(2)}x) may indicate overvaluation`,
        importance: 'medium'
      });
    } else if (metrics.incomeMultiplier < 3.0) {
      insights.push({
        type: 'positive',
        message: `Conservative income multiplier (${metrics.incomeMultiplier.toFixed(2)}x) suggests potential upside`,
        importance: 'medium'
      });
    }
    
    // Add additional insights based on income data
    if (incomes.length > 0) {
      const incomeBySource: Record<string, number> = {};
      incomes.forEach(income => {
        incomeBySource[income.source] = (incomeBySource[income.source] || 0) + parseFloat(income.amount);
      });
      
      // Find the dominant income source
      let dominantSource = '';
      let maxAmount = 0;
      Object.entries(incomeBySource).forEach(([source, amount]) => {
        if (amount > maxAmount) {
          maxAmount = amount;
          dominantSource = source;
        }
      });
      
      const dominantPercentage = (maxAmount / incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0)) * 100;
      
      if (dominantPercentage > 70) {
        insights.push({
          type: 'negative',
          message: `Heavy reliance on ${dominantSource} income (${dominantPercentage.toFixed(2)}%) creates potential risk`,
          importance: 'high'
        });
      } else if (Object.keys(incomeBySource).length >= 4) {
        insights.push({
          type: 'positive',
          message: `Well-diversified income sources with ${Object.keys(incomeBySource).length} different categories`,
          importance: 'medium'
        });
      }
    }
    
    return insights;
  }

  private generateRecommendations(
    metrics: ValuationMetrics,
    insights: ValuationInsight[]
  ): ReportRecommendation[] {
    const recommendations: ReportRecommendation[] = [];
    
    // Add recommendation based on growth and volatility
    if (metrics.valuationGrowth > 15 && metrics.valuationVolatility > 15) {
      recommendations.push({
        title: 'Monitor for Market Correction',
        description: 'High growth combined with high volatility may indicate an unstable market that could experience a correction.',
        actionItems: [
          'Review valuation methodologies to ensure they remain conservative',
          'Consider implementing more frequent valuation updates for high-value properties',
          'Prepare contingency plans for potential market downturns'
        ],
        priority: 'high'
      });
    }
    
    // Add recommendation based on income multiplier
    if (metrics.incomeMultiplier > 4.5) {
      recommendations.push({
        title: 'Review Income Multiplier Approach',
        description: 'Current income multipliers are above historical Benton County averages, which may lead to overvaluation.',
        actionItems: [
          'Compare current multipliers with historical data and regional benchmarks',
          'Consider adjusting multipliers downward for higher risk properties',
          'Incorporate additional valuation approaches to validate results'
        ],
        priority: 'medium'
      });
    } else if (metrics.incomeMultiplier < 2.8) {
      recommendations.push({
        title: 'Evaluate Conservative Multipliers',
        description: 'Income multipliers are lower than typical for Benton County, potentially undervaluing properties.',
        actionItems: [
          'Review comparable property data to validate multiplier selection',
          'Consider gradual adjustment of multipliers based on market trends',
          'Analyze properties individually to identify those suitable for higher multipliers'
        ],
        priority: 'medium'
      });
    }
    
    // Add recommendation based on negative insights
    const negativeInsights = insights.filter(insight => insight.type === 'negative');
    if (negativeInsights.length > 0) {
      const highPriorityNegatives = negativeInsights.filter(insight => insight.importance === 'high');
      
      if (highPriorityNegatives.length > 0) {
        recommendations.push({
          title: 'Address Key Risk Factors',
          description: 'Several high-importance risk factors have been identified that require attention.',
          actionItems: highPriorityNegatives.map(insight => `Resolve: ${insight.message}`),
          priority: 'high'
        });
      }
    }
    
    // Always add a general recommendation for improvement
    recommendations.push({
      title: 'Data Quality Enhancement',
      description: 'Improve data collection and management practices to enhance valuation accuracy.',
      actionItems: [
        'Implement regular data quality audits for income and valuation records',
        'Standardize property identification and categorization across all records',
        'Consider adding more Benton County-specific property attributes to valuation models'
      ],
      priority: 'medium'
    });
    
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
    // Prepare valuation history data
    const sortedValuations = [...valuations].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const valuationHistory: Array<{ date: Date; amount: string }> = sortedValuations.map(valuation => ({
      date: new Date(valuation.createdAt),
      amount: valuation.valuationAmount
    }));
    
    // Prepare income breakdown data
    const incomeBySource: Record<string, number> = {};
    let totalIncome = 0;
    
    incomes.forEach(income => {
      const amount = parseFloat(income.amount);
      incomeBySource[income.source] = (incomeBySource[income.source] || 0) + amount;
      totalIncome += amount;
    });
    
    const incomeBreakdown = Object.entries(incomeBySource).map(([source, amount]) => ({
      source,
      percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0
    }));
    
    // Prepare income growth data (simplified)
    const incomeGrowth: Array<{ date: Date; amount: string }> = [];
    const incomesByMonth: Record<string, number> = {};
    
    incomes.forEach(income => {
      const date = new Date(income.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      incomesByMonth[key] = (incomesByMonth[key] || 0) + parseFloat(income.amount);
    });
    
    Object.entries(incomesByMonth).forEach(([key, amount]) => {
      const [year, month] = key.split('-').map(Number);
      incomeGrowth.push({
        date: new Date(year, month - 1, 1),
        amount: amount.toString()
      });
    });
    
    // Sort income growth by date
    incomeGrowth.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Prepare valuation by property type data (simplified)
    const valuationByType: Record<string, { total: number; count: number }> = {};
    
    // Use TestValuation to handle the propertyType field
    const valuationsWithType = valuations as unknown as TestValuation[];
    
    valuationsWithType.forEach(valuation => {
      // Use a default property type if not provided
      const propertyType = valuation.propertyType || 'Residential';
      
      if (!valuationByType[propertyType]) {
        valuationByType[propertyType] = { total: 0, count: 0 };
      }
      
      valuationByType[propertyType].total += parseFloat(valuation.valuationAmount);
      valuationByType[propertyType].count += 1;
    });
    
    const valuationByPropertyType = Object.entries(valuationByType).map(([type, data]) => ({
      type,
      average: data.total / data.count,
      count: data.count
    }));
    
    return {
      valuationHistory,
      incomeBreakdown,
      incomeGrowth,
      valuationByPropertyType
    };
  }

  /**
   * Generates a human-readable summary from metrics and key insights
   * @param metrics The calculated valuation metrics
   * @param insights Array of valuation insights
   * @returns A concise summary string
   */
  private generateSummary(
    metrics: ValuationMetrics,
    insights: ValuationInsight[]
  ): string {
    // Get key highlights
    const positiveInsights = insights
      .filter(i => i.type === 'positive' && i.importance === 'high')
      .map(i => i.message);
    
    const negativeInsights = insights
      .filter(i => i.type === 'negative' && i.importance === 'high')
      .map(i => i.message);
    
    // Build summary
    const parts = [
      `Benton County Property Valuation Summary`,
      ``,
      `Average Valuation: $${metrics.averageValuation.toFixed(2)}`,
      `Properties Analyzed: ${metrics.propertyCount}`,
      `Valuation Growth: ${metrics.valuationGrowth > 0 ? '+' : ''}${metrics.valuationGrowth.toFixed(2)}%`,
      `Average Income Multiplier: ${metrics.incomeMultiplier.toFixed(2)}x`,
      ``
    ];
    
    if (positiveInsights.length > 0) {
      parts.push(`Key Strengths:`);
      positiveInsights.forEach(insight => parts.push(`- ${insight}`));
      parts.push(``);
    }
    
    if (negativeInsights.length > 0) {
      parts.push(`Key Concerns:`);
      negativeInsights.forEach(insight => parts.push(`- ${insight}`));
      parts.push(``);
    }
    
    return parts.join('\n');
  }
}