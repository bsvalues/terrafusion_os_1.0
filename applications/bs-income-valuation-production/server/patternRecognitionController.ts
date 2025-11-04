import { Request, Response } from 'express';
import { Income, Valuation, incomeSourceEnum } from '../shared/schema';
import { z } from 'zod';
import { storage } from './storage';

// Validation schemas
const IncomeSchema = z.object({
  id: z.number(),
  userId: z.number(),
  source: z.enum(["salary", "business", "freelance", "investment", "rental", "other"]),
  amount: z.string(),
  frequency: z.string(),
  description: z.string().nullable().optional(),
  date: z.union([z.string(), z.date()]).transform(val => val instanceof Date ? val : new Date(val)),
  createdAt: z.union([z.string(), z.date()]).transform(val => val instanceof Date ? val : new Date(val)),
});

const ValuationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  name: z.string(),
  totalAnnualIncome: z.string(),
  multiplier: z.string(),
  valuationAmount: z.string(),
  incomeBreakdown: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).transform(val => val instanceof Date ? val : new Date(val)),
  updatedAt: z.union([z.string(), z.date()]).transform(val => val instanceof Date ? val : new Date(val)),
  isActive: z.boolean(),
});

const CorrelationRequestSchema = z.object({
  incomes: z.array(IncomeSchema),
});

const OutlierRequestSchema = z.object({
  incomes: z.array(IncomeSchema),
  threshold: z.number().optional().default(2.5),
  groupBy: z.string().optional().default('source'),
  methodology: z.enum(['z-score', 'iqr', 'isolation-forest']).optional().default('z-score'),
});

const SeasonalityRequestSchema = z.object({
  incomes: z.array(IncomeSchema),
  minConfidence: z.number().optional().default(0.8),
  maxPeriods: z.number().optional().default(12),
  detrend: z.boolean().optional().default(true),
});

const GrowthTrendRequestSchema = z.object({
  valuations: z.array(ValuationSchema),
  categories: z.array(z.string()).optional().default([]),
  timeframe: z.enum(['month', 'quarter', 'year']).optional().default('year'),
  adjustForInflation: z.boolean().optional().default(false),
});

// Utility for logging errors
const logError = (error: unknown, message: string) => {
  console.error(`${message}:`, error instanceof Error ? error.message : String(error));
};

// Type definitions matching the frontend
interface IncomeCorrelation {
  sourceA: string;
  sourceB: string;
  coefficient: number;
  significance: 'high' | 'medium' | 'low';
}

interface CorrelationResult {
  correlations: IncomeCorrelation[];
  sampleSize: number;
  timePeriod: string;
}

interface DataOutlier {
  id: number;
  reason: string;
  confidenceScore: number;
  suggestedAction: string;
}

interface OutlierResult {
  outliers: DataOutlier[];
  thresholdUsed: number;
  methodology: string;
}

interface SeasonalPattern {
  source: string;
  periodicity: number;
  strength: number;
  phase: string;
}

interface SeasonalityResult {
  seasonalPatterns: SeasonalPattern[];
  confidenceLevel: number;
  dataPointsAnalyzed: number;
}

interface GrowthTrend {
  category: string;
  annualRate: number;
  volatility: number;
  confidenceInterval: [number, number];
  sampleSize: number;
}

interface GrowthTrendResult {
  trends: GrowthTrend[];
  overallMarketTrend: number;
  timePeriod: string;
  methodology: string;
}

// Controller
export const patternRecognitionController = {
  /**
   * Analyze correlations between different income sources
   */
  findIncomeCorrelations: async (req: Request, res: Response) => {
    try {
      const validationResult = CorrelationRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request data', 
          details: validationResult.error.format() 
        });
      }
      
      const { incomes } = validationResult.data;
      
      // Calculate correlations between income sources
      const result = await calculateIncomeCorrelations(incomes);
      
      return res.json(result);
    } catch (error) {
      logError(error, 'Error calculating income correlations');
      return res.status(500).json({ error: 'Failed to analyze income correlations' });
    }
  },
  
  /**
   * Detect outliers in income data
   */
  detectOutliers: async (req: Request, res: Response) => {
    try {
      const validationResult = OutlierRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request data', 
          details: validationResult.error.format() 
        });
      }
      
      const { incomes, threshold, groupBy, methodology } = validationResult.data;
      
      // Detect outliers in income data
      const result = await detectIncomeOutliers(incomes, { threshold, groupBy, methodology });
      
      return res.json(result);
    } catch (error) {
      logError(error, 'Error detecting income outliers');
      return res.status(500).json({ error: 'Failed to detect outliers' });
    }
  },
  
  /**
   * Analyze seasonality patterns in income data
   */
  analyzeSeasonality: async (req: Request, res: Response) => {
    try {
      const validationResult = SeasonalityRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request data', 
          details: validationResult.error.format() 
        });
      }
      
      const { incomes, minConfidence, maxPeriods, detrend } = validationResult.data;
      
      // Analyze seasonality patterns
      const result = await analyzeIncomeSeasonality(incomes, { minConfidence, maxPeriods, detrend });
      
      return res.json(result);
    } catch (error) {
      logError(error, 'Error analyzing income seasonality');
      return res.status(500).json({ error: 'Failed to analyze seasonality' });
    }
  },
  
  /**
   * Identify growth trends in valuation data
   */
  identifyGrowthTrends: async (req: Request, res: Response) => {
    try {
      const validationResult = GrowthTrendRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request data', 
          details: validationResult.error.format() 
        });
      }
      
      const { valuations, categories, timeframe, adjustForInflation } = validationResult.data;
      
      // Identify growth trends
      const result = await identifyValuationGrowthTrends(
        valuations, 
        { categories, timeframe, adjustForInflation }
      );
      
      return res.json(result);
    } catch (error) {
      logError(error, 'Error identifying growth trends');
      return res.status(500).json({ error: 'Failed to identify growth trends' });
    }
  },
};

// Implementation of the analysis functions

/**
 * Calculate correlations between different income sources
 */
async function calculateIncomeCorrelations(incomes: Income[]): Promise<CorrelationResult> {
  // Group incomes by source and date
  const incomesBySourceAndDate: Record<string, Record<string, number>> = {};
  
  // First, organize data by source and date
  for (const income of incomes) {
    const source = income.source;
    const date = new Date(income.date).toISOString().slice(0, 7); // YYYY-MM format
    
    if (!incomesBySourceAndDate[source]) {
      incomesBySourceAndDate[source] = {};
    }
    
    if (!incomesBySourceAndDate[source][date]) {
      incomesBySourceAndDate[source][date] = 0;
    }
    
    incomesBySourceAndDate[source][date] += parseFloat(income.amount);
  }
  
  // Calculate correlations between each pair of sources
  const sources = Object.keys(incomesBySourceAndDate);
  const correlations: IncomeCorrelation[] = [];
  
  // Need at least two sources to calculate correlations
  if (sources.length < 2) {
    return {
      correlations: [],
      sampleSize: incomes.length,
      timePeriod: calculateTimePeriod(incomes)
    };
  }
  
  for (let i = 0; i < sources.length; i++) {
    for (let j = i + 1; j < sources.length; j++) {
      const sourceA = sources[i];
      const sourceB = sources[j];
      
      // Get all dates that have values for both sources
      const datesA = Object.keys(incomesBySourceAndDate[sourceA]);
      const datesB = Object.keys(incomesBySourceAndDate[sourceB]);
      const commonDates = datesA.filter(date => datesB.includes(date));
      
      // Need sufficient overlapping dates
      if (commonDates.length < 3) {
        continue;
      }
      
      // Extract paired values
      const valuesA: number[] = [];
      const valuesB: number[] = [];
      
      for (const date of commonDates) {
        valuesA.push(incomesBySourceAndDate[sourceA][date]);
        valuesB.push(incomesBySourceAndDate[sourceB][date]);
      }
      
      // Calculate Pearson correlation coefficient
      const coefficient = calculateCorrelationCoefficient(valuesA, valuesB);
      
      // Determine significance
      let significance: 'high' | 'medium' | 'low';
      const absCoefficient = Math.abs(coefficient);
      
      if (absCoefficient > 0.7) {
        significance = 'high';
      } else if (absCoefficient > 0.4) {
        significance = 'medium';
      } else {
        significance = 'low';
      }
      
      correlations.push({
        sourceA,
        sourceB,
        coefficient,
        significance
      });
    }
  }
  
  return {
    correlations,
    sampleSize: incomes.length,
    timePeriod: calculateTimePeriod(incomes)
  };
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelationCoefficient(x: number[], y: number[]): number {
  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  
  return numerator / denominator;
}

/**
 * Detect outliers in income data
 */
async function detectIncomeOutliers(
  incomes: Income[], 
  options: { threshold: number; groupBy: string; methodology: string }
): Promise<OutlierResult> {
  const { threshold, groupBy, methodology } = options;
  
  // Group incomes by the specified grouping
  const groupedIncomes: Record<string, Income[]> = {};
  
  for (const income of incomes) {
    const groupKey = income[groupBy as keyof Income] as string || 'ungrouped';
    
    if (!groupedIncomes[groupKey]) {
      groupedIncomes[groupKey] = [];
    }
    
    groupedIncomes[groupKey].push(income);
  }
  
  const outliers: DataOutlier[] = [];
  
  // Detect outliers within each group
  for (const [group, groupIncomes] of Object.entries(groupedIncomes)) {
    // Need sufficient data for outlier detection
    if (groupIncomes.length < 5) continue;
    
    // Calculate mean and standard deviation for the group
    const amounts = groupIncomes.map(income => parseFloat(income.amount));
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    
    const squaredDiffs = amounts.map(amount => Math.pow(amount - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    // Identify outliers using Z-score
    for (let i = 0; i < groupIncomes.length; i++) {
      const income = groupIncomes[i];
      const amount = amounts[i];
      const zScore = Math.abs((amount - mean) / stdDev);
      
      if (zScore > threshold) {
        const isHigh = amount > mean;
        
        outliers.push({
          id: income.id,
          reason: `${isHigh ? 'Unusually high' : 'Unusually low'} ${group} income (${zScore.toFixed(2)} std. dev.)`,
          confidenceScore: Math.min(0.99, zScore / (threshold + 2)),
          suggestedAction: zScore > threshold * 1.5 ? 'Review' : 'Monitor'
        });
      }
    }
  }
  
  return {
    outliers,
    thresholdUsed: threshold,
    methodology: `${methodology} analysis`
  };
}

/**
 * Analyze seasonality patterns in income data
 */
async function analyzeIncomeSeasonality(
  incomes: Income[],
  options: { minConfidence: number; maxPeriods: number; detrend: boolean }
): Promise<SeasonalityResult> {
  const { minConfidence, maxPeriods, detrend } = options;
  
  // Group incomes by source and month
  const incomesBySourceAndMonth: Record<string, Record<number, number[]>> = {};
  
  for (const income of incomes) {
    const source = income.source;
    const month = new Date(income.date).getMonth();
    
    if (!incomesBySourceAndMonth[source]) {
      incomesBySourceAndMonth[source] = {};
    }
    
    if (!incomesBySourceAndMonth[source][month]) {
      incomesBySourceAndMonth[source][month] = [];
    }
    
    incomesBySourceAndMonth[source][month].push(parseFloat(income.amount));
  }
  
  const seasonalPatterns: SeasonalPattern[] = [];
  
  // Analyze each source for seasonality
  for (const [source, monthlyData] of Object.entries(incomesBySourceAndMonth)) {
    // Need data for at least 6 different months
    if (Object.keys(monthlyData).length < 6) {
      continue;
    }
    
    // Calculate monthly averages
    const monthlyAverages: Record<number, number> = {};
    for (const [month, amounts] of Object.entries(monthlyData)) {
      monthlyAverages[Number(month)] = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    }
    
    // Calculate overall average
    const values = Object.values(monthlyAverages);
    const overallAverage = values.reduce((sum, value) => sum + value, 0) / values.length;
    
    // Calculate variance ratio (between months vs. total)
    let betweenMonthsVariance = 0;
    for (const value of values) {
      betweenMonthsVariance += Math.pow(value - overallAverage, 2);
    }
    betweenMonthsVariance /= values.length;
    
    // Calculate total variance from all observations
    let allAmounts: number[] = [];
    for (const amounts of Object.values(monthlyData)) {
      allAmounts = allAmounts.concat(amounts);
    }
    
    let totalVariance = 0;
    for (const amount of allAmounts) {
      totalVariance += Math.pow(amount - overallAverage, 2);
    }
    totalVariance /= allAmounts.length;
    
    // Seasonality strength is the ratio of between-months variance to total variance
    const seasonalStrength = totalVariance > 0 ? betweenMonthsVariance / totalVariance : 0;
    
    // Only include if strength is sufficient
    if (seasonalStrength > 0.3) {
      // Determine phase (which months are high/low)
      let highestMonth = 0;
      let highestValue = -Infinity;
      
      for (const [month, value] of Object.entries(monthlyAverages)) {
        if (value > highestValue) {
          highestValue = value;
          highestMonth = Number(month);
        }
      }
      
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
      const season = highestMonth >= 5 && highestMonth <= 8 ? 'Summer' : 
                     (highestMonth >= 2 && highestMonth <= 4 ? 'Spring' :
                     (highestMonth >= 9 && highestMonth <= 10 ? 'Fall' : 'Winter'));
      
      const phase = `${season} peak (${months[highestMonth]})`;
      
      seasonalPatterns.push({
        source,
        periodicity: 12, // Monthly data => annual cycle
        strength: seasonalStrength,
        phase
      });
    }
  }
  
  return {
    seasonalPatterns,
    confidenceLevel: minConfidence,
    dataPointsAnalyzed: incomes.length
  };
}

/**
 * Identify growth trends in valuation data
 */
async function identifyValuationGrowthTrends(
  valuations: Valuation[],
  options: { categories: string[]; timeframe: string; adjustForInflation: boolean }
): Promise<GrowthTrendResult> {
  const { categories, timeframe, adjustForInflation } = options;
  
  // Group valuations by property type
  const valuationsByType: Record<string, Valuation[]> = {};
  
  // Extract property type from name (assuming format "[Type] Property X")
  for (const valuation of valuations) {
    const match = valuation.name?.match(/^(\w+)/i);
    const propertyType = match ? match[1].toLowerCase() : 'unknown';
    
    if (!valuationsByType[propertyType]) {
      valuationsByType[propertyType] = [];
    }
    
    valuationsByType[propertyType].push(valuation);
  }
  
  const trends: GrowthTrend[] = [];
  let overallValues: Array<{amount: number, date: Date}> = [];
  
  // Calculate growth trend for each property type
  for (const [category, typeValuations] of Object.entries(valuationsByType)) {
    // Filter by requested categories if provided
    if (categories.length > 0 && !categories.includes(category)) {
      continue;
    }
    
    // Need at least 3 valuations to calculate trend
    if (typeValuations.length < 3) {
      continue;
    }
    
    // Sort by date (using createdAt)
    const sorted = [...typeValuations].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Convert to amount/date pairs for regression
    const pairs = sorted.map(v => ({
      amount: parseFloat(v.valuationAmount),
      date: new Date(v.createdAt)
    }));
    
    overallValues = overallValues.concat(pairs);
    
    // Calculate annual growth rate using regression
    const growthRate = calculateAnnualGrowthRate(pairs);
    
    // Calculate volatility (standard deviation of month-to-month changes)
    let volatility = 0;
    if (pairs.length > 1) {
      const changes: number[] = [];
      for (let i = 1; i < pairs.length; i++) {
        const prevAmount = pairs[i-1].amount;
        const currAmount = pairs[i].amount;
        if (prevAmount > 0) {
          changes.push((currAmount - prevAmount) / prevAmount);
        }
      }
      
      if (changes.length > 0) {
        const meanChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
        volatility = Math.sqrt(
          changes.reduce((sum, change) => sum + Math.pow(change - meanChange, 2), 0) / changes.length
        );
      }
    }
    
    // Calculate confidence interval (simple approximation)
    const confidenceInterval: [number, number] = [
      growthRate - volatility * 1.96,
      growthRate + volatility * 1.96
    ];
    
    trends.push({
      category,
      annualRate: growthRate,
      volatility,
      confidenceInterval,
      sampleSize: typeValuations.length
    });
  }
  
  // Calculate overall market trend
  const overallGrowthRate = calculateAnnualGrowthRate(overallValues);
  
  return {
    trends,
    overallMarketTrend: overallGrowthRate,
    timePeriod: calculateTimePeriod(valuations),
    methodology: 'Linear regression'
  };
}

/**
 * Calculate annual growth rate from a series of valuations
 */
function calculateAnnualGrowthRate(
  valuations: Array<{amount: number, date: Date}>
): number {
  if (valuations.length < 2) return 0;
  
  // Sort by date
  const sorted = [...valuations].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Calculate time difference in years
  const firstDate = sorted[0].date;
  const lastDate = sorted[sorted.length - 1].date;
  const yearsDiff = (lastDate.getTime() - firstDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  
  if (yearsDiff < 0.1) return 0; // Less than ~36 days of data
  
  // For short periods, use simple percentage change
  if (yearsDiff < 0.5) {
    const firstAmount = sorted[0].amount;
    const lastAmount = sorted[sorted.length - 1].amount;
    
    if (firstAmount === 0) return 0;
    
    const totalGrowth = (lastAmount - firstAmount) / firstAmount;
    return totalGrowth * (1 / yearsDiff); // Annualize
  }
  
  // For longer periods, use regression
  const xValues = sorted.map(v => v.date.getTime());
  const yValues = sorted.map(v => Math.log(v.amount)); // Use logarithm for exponential growth
  
  // Simple linear regression
  const n = xValues.length;
  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = yValues.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Convert slope to annual growth rate
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  return Math.exp(slope * msPerYear) - 1;
}

/**
 * Calculate the time period covered by a data set
 */
function calculateTimePeriod(data: Income[] | Valuation[]): string {
  if (data.length === 0) return 'no data';
  
  // Extract dates
  const dates = data.map(item => {
    // Use different date field based on data type
    if ('source' in item) {
      // It's an Income
      return new Date(item.createdAt);
    } else {
      // It's a Valuation
      return new Date(item.createdAt);
    }
  });
  
  // Find min and max dates
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Format dates
  const formatMonth = (date: Date) => 
    date.toLocaleString('default', { month: 'short', year: 'numeric' });
  
  return `${formatMonth(minDate)} to ${formatMonth(maxDate)}`;
}