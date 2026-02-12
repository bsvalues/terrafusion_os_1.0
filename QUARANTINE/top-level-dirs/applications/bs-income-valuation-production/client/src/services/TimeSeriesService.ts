import { Income } from '../../../shared/schema';
import { BaseService } from './BaseService';

// Interface for time series data point
interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

// Convert Income records to TimeSeriesDataPoint format
const prepareIncomeData = (incomeData: Income[]): TimeSeriesDataPoint[] => {
  return incomeData.map(income => {
    // Use the date field if available, otherwise fall back to createdAt
    const dateValue = income.date || income.createdAt;
    
    // Convert amount to number if it's a string
    const amountValue = typeof income.amount === 'string' 
      ? parseFloat(income.amount) 
      : income.amount;
      
    return {
      date: dateValue.toISOString(),
      value: amountValue
    };
  });
};

/**
 * Forecast result interface
 */
export interface ForecastResult {
  values: number[];
  dates: string[];
  lowerBound: number[];
  upperBound: number[];
  method: string;
  confidenceLevel: number;
}

/**
 * Seasonality detection result
 */
export interface SeasonalityResult {
  hasSeasonal: boolean;
  seasonalPeriod: number;
  seasonalStrength: number;
  pValue: number;
}

/**
 * Time series decomposition result
 */
export interface DecompositionResult {
  trend: number[];
  seasonal: number[];
  residual: number[];
  dates: string[];
}

/**
 * Trend direction result
 */
export interface TrendDirectionResult {
  direction: 'up' | 'down' | 'flat';
  strength: number;
  changePct: number;
}

/**
 * Service for time series analysis and forecasting
 */
export class TimeSeriesService extends BaseService {
  /**
   * Generate a forecast for future values based on historical data
   * 
   * @param incomeData Historical income data
   * @param periods Number of periods to forecast
   * @param options Optional forecasting options
   * @returns Forecast result with predicted values and confidence intervals
   */
  static async forecast(
    incomeData: Income[], 
    periods: number,
    options: { confidenceLevel?: number; method?: 'arima' | 'ets' | 'auto' } = {}
  ): Promise<ForecastResult> {
    try {
      const endpoint = '/api/timeseries/forecast';
      const timeSeriesData = prepareIncomeData(incomeData);
      
      const reqData = {
        data: timeSeriesData,
        periods,
        confidenceLevel: options.confidenceLevel || 0.95,
        method: options.method || 'auto'
      };
      
      return await this.post<ForecastResult>(endpoint, reqData, 'Failed to generate forecast');
    } catch (error) {
      // If API fails, use simple moving average as fallback
      console.warn('API-based forecasting failed, using simple moving average fallback', error);
      return this.simpleMovingAverageForecast(incomeData, periods);
    }
  }
  
  /**
   * Detect seasonality patterns in time series data
   * 
   * @param incomeData Historical income data
   * @returns Analysis of seasonal patterns in the data
   */
  static async detectSeasonality(incomeData: Income[]): Promise<SeasonalityResult> {
    try {
      const endpoint = '/api/timeseries/seasonality';
      const timeSeriesData = prepareIncomeData(incomeData);
      
      const reqData = {
        data: timeSeriesData
      };
      
      return await this.post<SeasonalityResult>(endpoint, reqData, 'Failed to detect seasonality');
    } catch (error) {
      // Fallback to simple seasonality detection
      console.warn('API-based seasonality detection failed, using simple detection', error);
      return this.simpleSeasonalityDetection(incomeData);
    }
  }
  
  /**
   * Decompose a time series into trend, seasonal, and residual components
   * 
   * @param incomeData Historical income data
   * @returns Components of the decomposed time series
   */
  static async decompose(incomeData: Income[]): Promise<DecompositionResult> {
    try {
      const endpoint = '/api/timeseries/decompose';
      const timeSeriesData = prepareIncomeData(incomeData);
      
      const reqData = {
        data: timeSeriesData
      };
      
      return await this.post<DecompositionResult>(endpoint, reqData, 'Failed to decompose time series');
    } catch (error) {
      // Fallback to simple decomposition
      console.warn('API-based decomposition failed, using simple decomposition', error);
      return this.simpleDecomposition(incomeData);
    }
  }
  
  /**
   * Determine the direction and strength of the trend in time series data
   * 
   * @param incomeData Historical income data
   * @returns Analysis of trend direction and strength
   */
  static async getTrendDirection(incomeData: Income[]): Promise<TrendDirectionResult> {
    try {
      const endpoint = '/api/timeseries/trend';
      const timeSeriesData = prepareIncomeData(incomeData);
      
      const reqData = {
        data: timeSeriesData
      };
      
      return await this.post<TrendDirectionResult>(endpoint, reqData, 'Failed to get trend direction');
    } catch (error) {
      // Fallback to simple trend detection
      console.warn('API-based trend detection failed, using simple trend analysis', error);
      return this.simpleTrendAnalysis(incomeData);
    }
  }
  
  /**
   * Generate a natural language description of forecast results
   * 
   * @param incomeData Historical income data
   * @param forecast Forecast results
   * @returns Human-readable description of the forecast
   */
  static async generateForecastDescription(
    incomeData: Income[],
    forecast: ForecastResult
  ): Promise<string> {
    try {
      const endpoint = '/api/timeseries/description';
      const timeSeriesData = prepareIncomeData(incomeData);
      
      const reqData = {
        historicalData: timeSeriesData,
        forecast
      };
      
      const result = await this.post<{ description: string }>(
        endpoint, 
        reqData, 
        'Failed to generate forecast description'
      );
      
      return result.description;
    } catch (error) {
      // Fallback to simple description
      console.warn('API-based description generation failed, using template description', error);
      return this.generateSimpleDescription(incomeData, forecast);
    }
  }
  
  /**
   * Fallback implementation for forecasting using simple moving average
   * Used when the API call fails
   */
  private static simpleMovingAverageForecast(
    incomeData: Income[], 
    periods: number
  ): ForecastResult {
    // Convert income data to time series format
    const timeSeriesData = prepareIncomeData(incomeData);
    
    // Sort data by date
    const sortedData = [...timeSeriesData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Need at least 3 data points for a meaningful forecast
    if (sortedData.length < 3) {
      throw new Error('Insufficient data for forecasting');
    }
    
    // Calculate average change between periods
    const changes: number[] = [];
    for (let i = 1; i < sortedData.length; i++) {
      changes.push(sortedData[i].value - sortedData[i-1].value);
    }
    
    const avgChange = changes.reduce((sum, val) => sum + val, 0) / changes.length;
    
    // Calculate standard deviation of changes for confidence intervals
    const squaredDiffs = changes.map(change => Math.pow(change - avgChange, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / changes.length;
    const stdDev = Math.sqrt(variance);
    
    // Generate forecast values
    const lastValue = sortedData[sortedData.length - 1].value;
    const lastDate = new Date(sortedData[sortedData.length - 1].date);
    
    const values: number[] = [];
    const dates: string[] = [];
    const lowerBound: number[] = [];
    const upperBound: number[] = [];
    
    // Z-score for 95% confidence (approximately 1.96)
    const zScore = 1.96;
    
    for (let i = 0; i < periods; i++) {
      const forecastValue = lastValue + avgChange * (i + 1);
      values.push(forecastValue);
      
      // Add one month to the date
      const forecastDate = new Date(lastDate);
      forecastDate.setMonth(lastDate.getMonth() + i + 1);
      dates.push(forecastDate.toISOString());
      
      // Calculate confidence interval (wider as we go further into the future)
      const interval = stdDev * zScore * Math.sqrt(i + 1);
      lowerBound.push(forecastValue - interval);
      upperBound.push(forecastValue + interval);
    }
    
    return {
      values,
      dates,
      lowerBound,
      upperBound,
      method: 'simple-moving-average',
      confidenceLevel: 0.95
    };
  }
  
  /**
   * Fallback implementation for seasonality detection
   * Used when the API call fails
   */
  private static simpleSeasonalityDetection(incomeData: Income[]): SeasonalityResult {
    // Convert income data to time series format
    const timeSeriesData = prepareIncomeData(incomeData);
    
    // Sort data by date
    const sortedData = [...timeSeriesData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Need at least 12 months of data to detect seasonality
    if (sortedData.length < 12) {
      return {
        hasSeasonal: false,
        seasonalPeriod: 0,
        seasonalStrength: 0,
        pValue: 1
      };
    }
    
    // Group by month
    const monthlyData: Record<number, number[]> = {};
    for (const item of sortedData) {
      const date = new Date(item.date);
      const month = date.getMonth();
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(item.value);
    }
    
    // Calculate monthly averages
    const monthlyAvgs: number[] = [];
    for (let i = 0; i < 12; i++) {
      if (monthlyData[i] && monthlyData[i].length > 0) {
        const avg = monthlyData[i].reduce((sum, val) => sum + val, 0) / monthlyData[i].length;
        monthlyAvgs[i] = avg;
      } else {
        monthlyAvgs[i] = 0;
      }
    }
    
    // Calculate overall average
    const validMonths = monthlyAvgs.filter(avg => avg > 0);
    const overallAvg = validMonths.reduce((sum, val) => sum + val, 0) / validMonths.length;
    
    // Calculate squared differences from overall average
    let seasonalVariance = 0;
    let validMonthCount = 0;
    for (const monthAvg of monthlyAvgs) {
      if (monthAvg > 0) {
        seasonalVariance += Math.pow(monthAvg - overallAvg, 2);
        validMonthCount++;
      }
    }
    
    // Normalize by number of valid months
    seasonalVariance /= validMonthCount;
    
    // Calculate "seasonal strength" - ratio of seasonal variance to total variance
    const totalVariance = sortedData.reduce(
      (sum, item) => sum + Math.pow(item.value - overallAvg, 2), 
      0
    ) / sortedData.length;
    
    const seasonalStrength = seasonalVariance / totalVariance;
    
    // Determine if there's seasonality based on strength threshold
    const SEASONALITY_THRESHOLD = 0.3; // 30% of variance explained by season
    const hasSeasonal = seasonalStrength > SEASONALITY_THRESHOLD;
    
    return {
      hasSeasonal,
      seasonalPeriod: hasSeasonal ? 12 : 0, // Assuming monthly seasonality if detected
      seasonalStrength,
      pValue: hasSeasonal ? 0.05 : 0.5 // Mock p-value, would be calculated from statistical test
    };
  }
  
  /**
   * Fallback implementation for time series decomposition
   * Used when the API call fails
   */
  private static simpleDecomposition(incomeData: Income[]): DecompositionResult {
    // Convert income data to time series format
    const timeSeriesData = prepareIncomeData(incomeData);
    
    // Sort data by date
    const sortedData = [...timeSeriesData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const values = sortedData.map(item => item.value);
    const dates = sortedData.map(item => item.date);
    
    // Simple moving average for trend (centered)
    const trendWindow = Math.min(7, Math.max(3, Math.floor(values.length / 4)));
    const trend: number[] = [];
    
    for (let i = 0; i < values.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - Math.floor(trendWindow / 2)); 
           j <= Math.min(values.length - 1, i + Math.floor(trendWindow / 2)); j++) {
        sum += values[j];
        count++;
      }
      
      trend.push(count > 0 ? sum / count : values[i]);
    }
    
    // Detrend the series
    const detrended = values.map((val, i) => val - trend[i]);
    
    // Simple seasonal component calculation
    // We'll use average detrended value for each month as seasonal component
    const monthlyDetrended: Record<number, number[]> = {};
    for (let i = 0; i < sortedData.length; i++) {
      const date = new Date(sortedData[i].date);
      const month = date.getMonth();
      if (!monthlyDetrended[month]) {
        monthlyDetrended[month] = [];
      }
      monthlyDetrended[month].push(detrended[i]);
    }
    
    // Calculate average seasonal component for each month
    const monthlySeasonalComponent: Record<number, number> = {};
    for (const [month, values] of Object.entries(monthlyDetrended)) {
      monthlySeasonalComponent[parseInt(month)] = 
        values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    // Normalize seasonal components to sum to zero
    const seasonalValues = Object.values(monthlySeasonalComponent);
    const seasonalAvg = seasonalValues.reduce((sum, val) => sum + val, 0) / seasonalValues.length;
    
    for (const month in monthlySeasonalComponent) {
      monthlySeasonalComponent[parseInt(month)] -= seasonalAvg;
    }
    
    // Map seasonal component back to time series
    const seasonal: number[] = [];
    for (const item of sortedData) {
      const month = new Date(item.date).getMonth();
      seasonal.push(monthlySeasonalComponent[month] || 0);
    }
    
    // Calculate residual (what's left after removing trend and seasonality)
    const residual = values.map((val, i) => val - trend[i] - seasonal[i]);
    
    return {
      trend,
      seasonal,
      residual,
      dates
    };
  }
  
  /**
   * Fallback implementation for trend analysis
   * Used when the API call fails
   */
  private static simpleTrendAnalysis(incomeData: Income[]): TrendDirectionResult {
    // Convert income data to time series format
    const timeSeriesData = prepareIncomeData(incomeData);
    
    // Sort data by date
    const sortedData = [...timeSeriesData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    if (sortedData.length < 2) {
      return {
        direction: 'flat',
        strength: 0,
        changePct: 0
      };
    }
    
    // Simple linear regression
    const xValues = Array.from({ length: sortedData.length }, (_, i) => i);
    const yValues = sortedData.map(item => item.value);
    
    const n = xValues.length;
    const sumX = xValues.reduce((sum, val) => sum + val, 0);
    const sumY = yValues.reduce((sum, val) => sum + val, 0);
    const sumXY = xValues.reduce((sum, val, i) => sum + val * yValues[i], 0);
    const sumXX = xValues.reduce((sum, val) => sum + val * val, 0);
    
    // Calculate slope
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calculate R-squared (coefficient of determination)
    const avgY = sumY / n;
    const totalSumSquares = yValues.reduce((sum, y) => sum + Math.pow(y - avgY, 2), 0);
    const sumResidualSquares = yValues.reduce(
      (sum, y, i) => sum + Math.pow(y - (slope * xValues[i] + (sumY - slope * sumX) / n), 2), 
      0
    );
    const rSquared = 1 - (sumResidualSquares / totalSumSquares);
    
    // Calculate percent change from first to last
    const firstValue = sortedData[0].value;
    const lastValue = sortedData[sortedData.length - 1].value;
    const changePct = firstValue !== 0 ? (lastValue - firstValue) / firstValue : 0;
    
    // Determine direction
    let direction: 'up' | 'down' | 'flat';
    
    if (Math.abs(slope) < 1) {
      direction = 'flat';
    } else {
      direction = slope > 0 ? 'up' : 'down';
    }
    
    return {
      direction,
      strength: Math.sqrt(Math.abs(rSquared)), // Use square root of R-squared as strength
      changePct
    };
  }
  
  /**
   * Generate a simple description of forecast results
   * Used when the API call fails
   */
  private static generateSimpleDescription(
    incomeData: Income[],
    forecast: ForecastResult
  ): string {
    // Get trend information
    const trendResult = this.simpleTrendAnalysis(incomeData);
    
    // Convert income data to time series format
    const timeSeriesData = prepareIncomeData(incomeData);
    
    // Sort data by date
    const sortedData = [...timeSeriesData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Create a human-readable time frame description
    const lastDate = new Date(sortedData[sortedData.length - 1].date);
    const forecastEndDate = new Date(forecast.dates[forecast.dates.length - 1]);
    
    const formatDate = (date: Date): string => {
      return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    };
    
    const timeFrame = `${formatDate(lastDate)} to ${formatDate(forecastEndDate)}`;
    
    // Calculate forecast change
    const latestValue = sortedData[sortedData.length - 1].value;
    const forecastEndValue = forecast.values[forecast.values.length - 1];
    const forecastChangePct = latestValue !== 0 ? (forecastEndValue - latestValue) / latestValue : 0;
    
    // Generate description based on trend and forecast
    let description = `Based on historical data, the forecast for ${timeFrame} `;
    
    if (Math.abs(forecastChangePct) < 0.05) {
      description += `suggests relatively stable income with minimal change `;
    } else if (forecastChangePct > 0) {
      description += `shows an upward trend with approximately ${(forecastChangePct * 100).toFixed(1)}% growth `;
    } else {
      description += `indicates a downward trend with approximately ${(Math.abs(forecastChangePct) * 100).toFixed(1)}% decline `;
    }
    
    description += `from the current value of $${latestValue.toLocaleString()}. `;
    
    // Add confidence interval information
    const avgUpper = forecast.upperBound.reduce((sum, val) => sum + val, 0) / forecast.upperBound.length;
    const avgLower = forecast.lowerBound.reduce((sum, val) => sum + val, 0) / forecast.lowerBound.length;
    const avgWidth = avgUpper - avgLower;
    const avgValue = forecast.values.reduce((sum, val) => sum + val, 0) / forecast.values.length;
    const widthPct = avgValue !== 0 ? (avgWidth / avgValue) * 100 : 0;
    
    description += `With ${forecast.confidenceLevel * 100}% confidence, the actual values are expected to fall within ±${widthPct.toFixed(0)}% of the forecast. `;
    
    // Add trend context
    if (trendResult.direction !== 'flat') {
      description += `This forecast continues the ${trendResult.direction}ward pattern observed in your historical data. `;
    }
    
    // Add recommendation
    if (trendResult.direction === 'up') {
      description += `This positive trend suggests a healthy revenue stream which may support expansion planning.`;
    } else if (trendResult.direction === 'down') {
      description += `This downward trend may require attention to stabilize income sources.`;
    } else {
      description += `The stability in this forecast provides a reliable foundation for financial planning.`;
    }
    
    return description;
  }
}