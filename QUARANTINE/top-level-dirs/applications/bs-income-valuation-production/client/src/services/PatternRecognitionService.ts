import { Income, Valuation } from '../../../shared/schema';
import { BaseService } from './BaseService';

/**
 * Correlation between two income sources
 */
export interface IncomeCorrelation {
  sourceA: string;
  sourceB: string;
  coefficient: number;
  significance: 'high' | 'medium' | 'low';
}

/**
 * Result from income source correlation analysis
 */
export interface CorrelationResult {
  correlations: IncomeCorrelation[];
  sampleSize: number;
  timePeriod: string;
}

/**
 * Detected outlier in financial data
 */
export interface DataOutlier {
  id: number;
  reason: string;
  confidenceScore: number;
  suggestedAction: string;
}

/**
 * Result from outlier detection analysis
 */
export interface OutlierResult {
  outliers: DataOutlier[];
  thresholdUsed: number;
  methodology: string;
}

/**
 * Detected seasonal pattern in financial data
 */
export interface SeasonalPattern {
  source: string;
  periodicity: number;
  strength: number;
  phase: string;
}

/**
 * Result from seasonality analysis
 */
export interface SeasonalityResult {
  seasonalPatterns: SeasonalPattern[];
  confidenceLevel: number;
  dataPointsAnalyzed: number;
}

/**
 * Growth trend in valuation data
 */
export interface GrowthTrend {
  category: string;
  annualRate: number;
  volatility: number;
  confidenceInterval: [number, number];
  sampleSize: number;
}

/**
 * Result from growth trend analysis
 */
export interface GrowthTrendResult {
  trends: GrowthTrend[];
  overallMarketTrend: number;
  timePeriod: string;
  methodology: string;
}

/**
 * Options for outlier detection
 */
export interface OutlierDetectionOptions {
  threshold?: number;
  groupBy?: string;
  methodology?: 'z-score' | 'iqr' | 'isolation-forest';
}

/**
 * Options for seasonality analysis
 */
export interface SeasonalityAnalysisOptions {
  minConfidence?: number;
  maxPeriods?: number;
  detrend?: boolean;
}

/**
 * Options for growth trend analysis
 */
export interface GrowthTrendOptions {
  categories?: string[];
  timeframe?: 'month' | 'quarter' | 'year';
  adjustForInflation?: boolean;
}

/**
 * Service for detecting patterns, correlations, and anomalies in financial data
 */
export class PatternRecognitionService extends BaseService {
  /**
   * Find correlations between different income sources
   * 
   * @param incomes Array of income records to analyze
   * @returns Correlation analysis results
   */
  static async findIncomeCorrelations(incomes: Income[]): Promise<CorrelationResult> {
    try {
      // Minimum required data for meaningful correlation
      if (incomes.length < 10) {
        return {
          correlations: [],
          sampleSize: incomes.length,
          timePeriod: 'insufficient data'
        };
      }
      
      const endpoint = '/api/patterns/correlation';
      const reqData = {
        incomes
      };
      
      return await this.post<CorrelationResult>(
        endpoint, 
        reqData, 
        'Failed to analyze income correlations'
      );
    } catch (error) {
      console.warn('Income correlation analysis failed, using fallback implementation', error);
      return this.calculateBasicCorrelations(incomes);
    }
  }
  
  /**
   * Detect statistical outliers in income data
   * 
   * @param incomes Array of income records to analyze
   * @param options Optional configuration for outlier detection
   * @returns Outlier detection results
   */
  static async detectOutliers(
    incomes: Income[], 
    options: OutlierDetectionOptions = {}
  ): Promise<OutlierResult> {
    try {
      const endpoint = '/api/patterns/outliers';
      const reqData = {
        incomes,
        threshold: options.threshold || 2.5,
        groupBy: options.groupBy || 'source',
        methodology: options.methodology || 'z-score'
      };
      
      return await this.post<OutlierResult>(
        endpoint, 
        reqData, 
        'Failed to detect outliers'
      );
    } catch (error) {
      console.warn('Outlier detection failed, using fallback implementation', error);
      return this.detectBasicOutliers(incomes, options);
    }
  }
  
  /**
   * Analyze seasonality patterns in income data
   * 
   * @param incomes Array of income records to analyze
   * @param options Optional configuration for seasonality analysis
   * @returns Seasonality analysis results
   */
  static async analyzeSeasonality(
    incomes: Income[],
    options: SeasonalityAnalysisOptions = {}
  ): Promise<SeasonalityResult> {
    try {
      // Need sufficient data to detect seasonality
      if (incomes.length < 12) {
        return {
          seasonalPatterns: [],
          confidenceLevel: 0,
          dataPointsAnalyzed: incomes.length
        };
      }
      
      const endpoint = '/api/patterns/seasonality';
      const reqData = {
        incomes,
        minConfidence: options.minConfidence || 0.8,
        maxPeriods: options.maxPeriods || 12,
        detrend: options.detrend !== undefined ? options.detrend : true
      };
      
      return await this.post<SeasonalityResult>(
        endpoint, 
        reqData, 
        'Failed to analyze seasonality'
      );
    } catch (error) {
      console.warn('Seasonality analysis failed, using fallback implementation', error);
      return this.analyzeBasicSeasonality(incomes, options);
    }
  }
  
  /**
   * Identify growth trends in valuation data
   * 
   * @param valuations Array of valuation records to analyze
   * @param options Optional configuration for trend analysis
   * @returns Growth trend analysis results
   */
  static async identifyGrowthTrends(
    valuations: Valuation[],
    options: GrowthTrendOptions = {}
  ): Promise<GrowthTrendResult> {
    try {
      // Need sufficient data to identify trends
      if (valuations.length < 5) {
        return {
          trends: [],
          overallMarketTrend: 0,
          timePeriod: 'insufficient data',
          methodology: 'regression analysis'
        };
      }
      
      const endpoint = '/api/patterns/growth-trends';
      const reqData = {
        valuations,
        categories: options.categories || [],
        timeframe: options.timeframe || 'year',
        adjustForInflation: options.adjustForInflation || false
      };
      
      return await this.post<GrowthTrendResult>(
        endpoint, 
        reqData, 
        'Failed to analyze growth trends'
      );
    } catch (error) {
      console.warn('Growth trend analysis failed, using fallback implementation', error);
      return this.calculateBasicGrowthTrends(valuations, options);
    }
  }
  
  // Private fallback implementations
  
  /**
   * Basic correlation calculation as fallback
   */
  private static calculateBasicCorrelations(incomes: Income[]): CorrelationResult {
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
        timePeriod: this.calculateTimePeriod(incomes)
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
        const coefficient = this.calculateCorrelationCoefficient(valuesA, valuesB);
        
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
      timePeriod: this.calculateTimePeriod(incomes)
    };
  }
  
  /**
   * Calculate Pearson correlation coefficient
   */
  private static calculateCorrelationCoefficient(x: number[], y: number[]): number {
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
   * Basic outlier detection as fallback
   */
  private static detectBasicOutliers(
    incomes: Income[], 
    options: OutlierDetectionOptions
  ): OutlierResult {
    const threshold = options.threshold || 2.5;
    const groupBy = options.groupBy || 'source';
    
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
      methodology: 'Z-score analysis'
    };
  }
  
  /**
   * Basic seasonality analysis as fallback
   */
  private static analyzeBasicSeasonality(
    incomes: Income[],
    options: SeasonalityAnalysisOptions
  ): SeasonalityResult {
    const minConfidence = options.minConfidence || 0.8;
    const maxPeriods = options.maxPeriods || 12;
    
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
   * Basic growth trend calculation as fallback
   */
  private static calculateBasicGrowthTrends(
    valuations: Valuation[],
    options: GrowthTrendOptions
  ): GrowthTrendResult {
    // Group valuations by property type
    const valuationsByType: Record<string, Valuation[]> = {};
    
    // Extract property type from notes (assuming format "... for [type] property")
    for (const valuation of valuations) {
      const match = valuation.notes?.match(/for\s+(\w+[\-\s]\w+)\s+property/i);
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
      // Need at least 3 valuations to calculate trend
      if (typeValuations.length < 3) {
        continue;
      }
      
      // Sort by date
      const sorted = [...typeValuations].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Convert to amount/date pairs for regression
      const pairs = sorted.map(v => ({
        amount: parseFloat(v.amount),
        date: new Date(v.date)
      }));
      
      overallValues = overallValues.concat(pairs);
      
      // Calculate annual growth rate using regression
      const growthRate = this.calculateAnnualGrowthRate(pairs);
      
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
    const overallGrowthRate = this.calculateAnnualGrowthRate(overallValues);
    
    return {
      trends,
      overallMarketTrend: overallGrowthRate,
      timePeriod: this.calculateTimePeriod(valuations),
      methodology: 'Linear regression'
    };
  }
  
  /**
   * Calculate annual growth rate from a series of valuations
   */
  private static calculateAnnualGrowthRate(
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
  private static calculateTimePeriod(data: Income[] | Valuation[]): string {
    if (data.length === 0) return 'no data';
    
    // Extract dates
    const dates = data.map(item => new Date(item.date));
    
    // Find min and max dates
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Format dates
    const formatMonth = (date: Date) => 
      date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    return `${formatMonth(minDate)} to ${formatMonth(maxDate)}`;
  }
}