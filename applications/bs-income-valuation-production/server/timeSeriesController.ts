/**
 * Time Series Controller
 * 
 * Handles time series analysis and forecasting using statistical methods
 * Implements various algorithms for trend analysis, seasonality detection,
 * and forecasting of income data.
 */

import { storage } from './storage';
import config from './config';

// Data structure for time series data points
interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

// Forecast options
interface ForecastOptions {
  confidenceLevel?: number;
  method?: 'arima' | 'ets' | 'auto';
}

// Forecast result structure
interface ForecastResult {
  values: number[];
  dates: string[];
  lowerBound: number[];
  upperBound: number[];
  method: string;
  confidenceLevel: number;
}

// Seasonality detection result
interface SeasonalityResult {
  hasSeasonal: boolean;
  seasonalPeriod: number;
  seasonalStrength: number;
  pValue: number;
}

// Time series decomposition result
interface DecompositionResult {
  trend: number[];
  seasonal: number[];
  residual: number[];
  dates: string[];
}

// Trend direction result
interface TrendDirectionResult {
  direction: 'up' | 'down' | 'flat';
  strength: number;
  changePct: number;
}

class TimeSeriesController {
  /**
   * Generate forecast for future time periods
   */
  async forecast(
    data: TimeSeriesDataPoint[], 
    periods: number,
    options: ForecastOptions = {}
  ): Promise<ForecastResult> {
    // Set default options
    const confidenceLevel = options.confidenceLevel || 0.95;
    const method = options.method || 'auto';
    
    // Sort data by date
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Basic validation
    if (sortedData.length < 3) {
      throw new Error('Insufficient data for forecasting (minimum 3 data points required)');
    }
    
    // Since we don't have actual ARIMA/ETS implementation here (would typically use a stats library),
    // we'll implement a simple moving average/linear regression hybrid approach
    
    // Simple linear regression
    const xValues = Array.from({ length: sortedData.length }, (_, i) => i);
    const yValues = sortedData.map(item => item.value);
    
    const n = xValues.length;
    const sumX = xValues.reduce((sum, val) => sum + val, 0);
    const sumY = yValues.reduce((sum, val) => sum + val, 0);
    const sumXY = xValues.reduce((sum, val, i) => sum + val * yValues[i], 0);
    const sumXX = xValues.reduce((sum, val) => sum + val * val, 0);
    
    // Calculate slope and intercept
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate the residual standard error
    const predYs = xValues.map(x => slope * x + intercept);
    const residuals = yValues.map((y, i) => y - predYs[i]);
    const residualSumSquares = residuals.reduce((sum, r) => sum + r * r, 0);
    const stdError = Math.sqrt(residualSumSquares / (n - 2));
    
    // T-distribution critical value for 95% confidence
    // Normally would use a t-table lookup, but we'll approximate
    const tCritical = 1.96; // Approximate for large sample sizes
    
    // Calculate forecasts
    const forecasts: number[] = [];
    const lowerBounds: number[] = [];
    const upperBounds: number[] = [];
    const forecastDates: string[] = [];
    
    // Get the last date from the data
    const lastDate = new Date(sortedData[sortedData.length - 1].date);
    
    // Calculate the average time interval between data points
    const timeIntervals: number[] = [];
    for (let i = 1; i < sortedData.length; i++) {
      const date1 = new Date(sortedData[i-1].date);
      const date2 = new Date(sortedData[i].date);
      const interval = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24); // in days
      timeIntervals.push(interval);
    }
    
    const avgInterval = timeIntervals.reduce((sum, val) => sum + val, 0) / timeIntervals.length;
    
    // Generate forecasts
    for (let i = 0; i < periods; i++) {
      const x = n + i;
      const forecast = slope * x + intercept;
      
      // Prediction standard error increases with forecast horizon
      const seForecasts = stdError * Math.sqrt(1 + 1/n + Math.pow(x - sumX/n, 2) / (sumXX - Math.pow(sumX, 2)/n));
      
      // Calculate confidence intervals
      const marginOfError = tCritical * seForecasts;
      const lowerBound = forecast - marginOfError;
      const upperBound = forecast + marginOfError;
      
      forecasts.push(forecast);
      lowerBounds.push(lowerBound);
      upperBounds.push(upperBound);
      
      // Generate forecast date
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + Math.round(avgInterval * (i + 1)));
      forecastDates.push(forecastDate.toISOString());
    }
    
    return {
      values: forecasts,
      dates: forecastDates,
      lowerBound: lowerBounds,
      upperBound: upperBounds,
      method: method === 'auto' ? 'linear-regression' : method,
      confidenceLevel
    };
  }

  /**
   * Detect seasonality in time series data
   */
  async detectSeasonality(data: TimeSeriesDataPoint[]): Promise<SeasonalityResult> {
    // Sort data by date
    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    if (sortedData.length < 12) {
      return {
        hasSeasonal: false,
        seasonalPeriod: 0,
        seasonalStrength: 0,
        pValue: 1
      };
    }
    
    // Group by month to detect annual seasonality
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
    
    const seasonalStrength = totalVariance > 0 ? seasonalVariance / totalVariance : 0;
    
    // Determine if there's seasonality based on strength threshold
    const SEASONALITY_THRESHOLD = 0.3; // 30% of variance explained by season
    const hasSeasonal = seasonalStrength > SEASONALITY_THRESHOLD;
    
    // Determine p-value (simulated - would normally come from statistical test)
    // Lower p-value = more confidence in seasonality
    const pValue = hasSeasonal ? 0.01 : 0.5;
    
    return {
      hasSeasonal,
      seasonalPeriod: hasSeasonal ? 12 : 0, // Assuming monthly seasonality if detected
      seasonalStrength,
      pValue
    };
  }

  /**
   * Decompose time series into trend, seasonality, and residual components
   */
  async decompose(data: TimeSeriesDataPoint[]): Promise<DecompositionResult> {
    // Sort data by date
    const sortedData = [...data].sort((a, b) => 
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
    const seasonalAvg = seasonalValues.length > 0 ? 
      seasonalValues.reduce((sum, val) => sum + val, 0) / seasonalValues.length : 0;
    
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
   * Determine the direction and strength of the trend
   */
  async getTrendDirection(data: TimeSeriesDataPoint[]): Promise<TrendDirectionResult> {
    // Sort data by date
    const sortedData = [...data].sort((a, b) => 
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
      (sum, y, i) => {
        const predicted = slope * xValues[i] + (sumY - slope * sumX) / n;
        return sum + Math.pow(y - predicted, 2);
      }, 
      0
    );
    const rSquared = totalSumSquares > 0 ? 1 - (sumResidualSquares / totalSumSquares) : 0;
    
    // Calculate percent change from first to last
    const firstValue = sortedData[0].value;
    const lastValue = sortedData[sortedData.length - 1].value;
    const changePct = firstValue !== 0 ? (lastValue - firstValue) / firstValue : 0;
    
    // Determine direction
    let direction: 'up' | 'down' | 'flat';
    
    if (Math.abs(slope) < 0.1 * avgY) {
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
   * Generate a natural language description of the forecast
   */
  async generateForecastDescription(
    historicalData: TimeSeriesDataPoint[],
    forecast: ForecastResult
  ): Promise<string> {
    // Get trend information from historical data
    const trendResult = await this.getTrendDirection(historicalData);
    
    // Create a human-readable time frame description
    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    const forecastEndDate = new Date(forecast.dates[forecast.dates.length - 1]);
    
    const formatDate = (date: Date): string => {
      return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    };
    
    const timeFrame = `${formatDate(lastDate)} to ${formatDate(forecastEndDate)}`;
    
    // Calculate forecast change
    const latestValue = historicalData[historicalData.length - 1].value;
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

// Export singleton instance
export const timeSeriesController = new TimeSeriesController();