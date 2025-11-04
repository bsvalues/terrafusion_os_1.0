/**
 * Types for the TrendForecastService
 */

export interface DataPoint {
  date: Date;
  value: number;
}

export interface PredictionPoint {
  date: Date;
  value: number;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastResult {
  predictions: PredictionPoint[];
  confidenceScore: number;
  growthRate: number;
  volatility: number;
  warnings: string[];
  insights: string[];
}

/**
 * Service for generating trend forecasts based on historical data
 * Uses linear regression and statistical analysis to predict future values
 */
export class TrendForecastService {
  /**
   * Generate a forecast based on historical data points
   * @param historicalData Array of data points with date and value
   * @param periods Number of future periods to forecast
   * @returns Forecast result with predictions and metadata
   */
  public generateForecast(historicalData: DataPoint[], periods: number): ForecastResult {
    // Input validation
    if (historicalData.length === 0) {
      throw new Error('Historical data array cannot be empty');
    }
    
    if (periods < 0) {
      throw new Error('Forecast periods cannot be negative');
    }
    
    if (periods === 0) {
      return {
        predictions: [],
        confidenceScore: 0,
        growthRate: 0,
        volatility: 0,
        warnings: ['Zero forecast periods requested'],
        insights: [],
      };
    }
    
    // Sort data by date to ensure chronological order
    const sortedData = [...historicalData].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate time intervals between data points to determine periodicity
    const timeIntervals = this.calculateTimeIntervals(sortedData);
    
    // Generate warnings based on data quality
    const warnings = this.generateWarnings(sortedData, timeIntervals);
    
    // Calculate trends and statistics
    const regressionResult = this.performLinearRegression(sortedData);
    const volatility = this.calculateVolatility(sortedData);
    const growthRate = this.calculateGrowthRate(sortedData);
    const patternType = this.detectPatternType(sortedData);
    
    // Generate confidence score based on data quality and pattern predictability
    const confidenceScore = this.calculateConfidenceScore(
      sortedData.length,
      regressionResult.r2,
      volatility,
      patternType
    );
    
    // Generate predictions for requested periods
    const predictions: PredictionPoint[] = [];
    
    for (let i = 1; i <= periods; i++) {
      const lastDate = new Date(sortedData[sortedData.length - 1].date);
      const nextDate = this.calculateNextDate(lastDate, timeIntervals);
      nextDate.setMonth(nextDate.getMonth() + i);
      
      const x = this.dateToNumeric(nextDate);
      const predictedValue = regressionResult.slope * x + regressionResult.intercept;
      
      // Calculate confidence intervals
      const confidenceInterval = this.calculateConfidenceInterval(
        predictedValue, 
        volatility, 
        sortedData.length,
        i,
        confidenceScore
      );
      
      predictions.push({
        date: nextDate,
        value: predictedValue,
        lowerBound: confidenceInterval.lower,
        upperBound: confidenceInterval.upper
      });
    }
    
    // Generate insights based on the forecast
    const insights = this.generateInsights(
      sortedData,
      predictions,
      growthRate,
      volatility,
      patternType
    );
    
    return {
      predictions,
      confidenceScore,
      growthRate,
      volatility,
      warnings,
      insights
    };
  }

  /**
   * Converts a date to a numeric value for regression analysis
   * @param date The date to convert
   * @returns Numeric representation of the date
   */
  private dateToNumeric(date: Date): number {
    // Use months since epoch as numeric value
    const epochStart = new Date(1970, 0, 1);
    const monthDiff = (date.getFullYear() - epochStart.getFullYear()) * 12 + date.getMonth() - epochStart.getMonth();
    return monthDiff;
  }

  /**
   * Calculate time intervals between data points
   * @param data Sorted array of data points
   * @returns Average interval in milliseconds
   */
  private calculateTimeIntervals(data: DataPoint[]): number {
    if (data.length < 2) return 0;
    
    let totalInterval = 0;
    for (let i = 1; i < data.length; i++) {
      totalInterval += data[i].date.getTime() - data[i-1].date.getTime();
    }
    
    return totalInterval / (data.length - 1);
  }

  /**
   * Calculate the next date based on average interval
   * @param lastDate The last date in the series
   * @param avgInterval Average interval between dates
   * @returns The next date in the series
   */
  private calculateNextDate(lastDate: Date, avgInterval: number): Date {
    const nextDate = new Date(lastDate);
    nextDate.setTime(nextDate.getTime() + avgInterval);
    return nextDate;
  }

  /**
   * Perform linear regression on the data points
   * @param data Array of data points
   * @returns Regression result with slope, intercept and R-squared
   */
  private performLinearRegression(data: DataPoint[]): { slope: number; intercept: number; r2: number } {
    const n = data.length;
    
    // Convert dates to numeric values
    const xValues = data.map(point => this.dateToNumeric(point.date));
    const yValues = data.map(point => point.value);
    
    // Calculate sums
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumYY = yValues.reduce((sum, y) => sum + y * y, 0);
    
    // Calculate slope and intercept
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const predictions = xValues.map(x => slope * x + intercept);
    const totalSS = sumYY - (sumY * sumY) / n;
    const residualSS = yValues.reduce((sum, y, i) => sum + Math.pow(y - predictions[i], 2), 0);
    const r2 = 1 - (residualSS / totalSS);
    
    return { slope, intercept, r2 };
  }

  /**
   * Calculate the volatility of the data
   * @param data Array of data points
   * @returns Volatility score between 0 and 1
   */
  private calculateVolatility(data: DataPoint[]): number {
    if (data.length < 2) return 0;
    
    const values = data.map(point => point.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize volatility to a 0-1 scale using coefficient of variation
    const cv = stdDev / mean;
    
    // Cap at 1 for very volatile data
    return Math.min(cv, 1);
  }

  /**
   * Calculate the growth rate from the data
   * @param data Array of data points
   * @returns Growth rate as a decimal
   */
  private calculateGrowthRate(data: DataPoint[]): number {
    if (data.length < 2) return 0;
    
    // Use first and last points to calculate compound growth rate
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const periods = data.length - 1;
    
    // Calculate compound monthly growth rate
    const growthRate = Math.pow(lastValue / firstValue, 1 / periods) - 1;
    
    return growthRate;
  }

  /**
   * Detect the type of pattern in the data
   * @param data Array of data points
   * @returns Pattern type: 'linear', 'cyclical', or 'stable'
   */
  private detectPatternType(data: DataPoint[]): 'linear' | 'cyclical' | 'stable' {
    if (data.length < 4) return 'linear'; // Not enough data to detect patterns
    
    const values = data.map(point => point.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Check for stability - if all values are within 3% of mean
    const isStable = values.every(val => Math.abs(val - mean) / mean < 0.03);
    if (isStable) return 'stable';
    
    // Check for cyclical patterns by looking for direction changes
    let directionChanges = 0;
    for (let i = 2; i < values.length; i++) {
      const direction1 = values[i-1] - values[i-2];
      const direction2 = values[i] - values[i-1];
      
      if ((direction1 > 0 && direction2 < 0) || (direction1 < 0 && direction2 > 0)) {
        directionChanges++;
      }
    }
    
    // If more than 30% of possible points have direction changes, consider it cyclical
    const possibleChanges = values.length - 2;
    if (directionChanges / possibleChanges > 0.3) {
      return 'cyclical';
    }
    
    return 'linear';
  }

  /**
   * Calculate confidence score based on data quality
   * @param dataPoints Number of data points
   * @param r2 R-squared from regression
   * @param volatility Volatility score
   * @param patternType Type of pattern detected
   * @returns Confidence score between 0 and 1
   */
  private calculateConfidenceScore(
    dataPoints: number,
    r2: number,
    volatility: number,
    patternType: 'linear' | 'cyclical' | 'stable'
  ): number {
    // Base confidence on R-squared
    let confidence = r2;
    
    // Adjust for number of data points
    if (dataPoints < 3) {
      confidence *= 0.5; // Significantly reduce confidence with very few data points
    } else if (dataPoints < 6) {
      confidence *= 0.8; // Moderately reduce confidence with few data points
    }
    
    // Adjust for volatility
    confidence *= (1 - volatility * 0.5);
    
    // Adjust for pattern type
    if (patternType === 'cyclical') {
      confidence *= 0.8; // Cyclical patterns are harder to predict
    } else if (patternType === 'stable') {
      confidence *= 1.1; // Stable patterns are easier to predict
      confidence = Math.min(confidence, 0.95); // Cap at 0.95
    }
    
    return Math.max(0.1, Math.min(confidence, 1)); // Ensure between 0.1 and 1
  }

  /**
   * Calculate confidence interval for a prediction
   * @param predictedValue The predicted value
   * @param volatility Data volatility
   * @param dataPoints Number of historical data points
   * @param periodsAhead How many periods ahead is this prediction
   * @param confidenceScore Overall confidence score
   * @returns Lower and upper bounds
   */
  private calculateConfidenceInterval(
    predictedValue: number,
    volatility: number,
    dataPoints: number,
    periodsAhead: number,
    confidenceScore: number
  ): { lower: number; upper: number } {
    // Base interval on volatility
    const baseInterval = predictedValue * volatility;
    
    // Widen interval based on how far ahead we're predicting
    const forecastMultiplier = 1 + (periodsAhead * 0.2);
    
    // Tighten interval based on confidence and data points
    const confidenceMultiplier = 2.0 - confidenceScore;
    const dataPointAdjustment = Math.max(0.5, Math.min(1, dataPoints / 10));
    
    const intervalWidth = baseInterval * forecastMultiplier * confidenceMultiplier * dataPointAdjustment;
    
    return {
      lower: Math.max(0, predictedValue - intervalWidth), // Ensure non-negative
      upper: predictedValue + intervalWidth
    };
  }

  /**
   * Generate warnings based on data quality
   * @param data Array of data points
   * @param timeInterval Average time interval
   * @returns Array of warning messages
   */
  private generateWarnings(data: DataPoint[], timeInterval: number): string[] {
    const warnings: string[] = [];
    
    // Check for minimal data
    if (data.length < 3) {
      warnings.push('Limited data available for forecast. Predictions may be less accurate.');
    }
    
    // Check for irregular time intervals
    const intervals = [];
    for (let i = 1; i < data.length; i++) {
      intervals.push(data[i].date.getTime() - data[i-1].date.getTime());
    }
    
    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const intervalVariance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      const intervalStdDev = Math.sqrt(intervalVariance);
      
      if (intervalStdDev / avgInterval > 0.2) {
        warnings.push('Irregular time intervals detected in data. Forecast may be less accurate.');
      }
    }
    
    // Check for pattern type specific warnings
    const patternType = this.detectPatternType(data);
    if (patternType === 'cyclical') {
      warnings.push('Cyclical or seasonal patterns detected. Simple linear forecasting may not capture these patterns accurately.');
    }
    
    return warnings;
  }

  /**
   * Generate insights based on forecast
   * @param historicalData Historical data points
   * @param predictions Predicted data points
   * @param growthRate Calculated growth rate
   * @param volatility Calculated volatility
   * @param patternType Detected pattern type
   * @returns Array of insight messages
   */
  private generateInsights(
    historicalData: DataPoint[],
    predictions: PredictionPoint[],
    growthRate: number,
    volatility: number,
    patternType: 'linear' | 'cyclical' | 'stable'
  ): string[] {
    const insights: string[] = [];
    
    // Growth trend insights
    if (growthRate > 0.05) {
      insights.push(`Strong positive growth trend observed (${(growthRate * 100).toFixed(1)}% per period).`);
    } else if (growthRate > 0.01) {
      insights.push(`Moderate positive growth trend observed (${(growthRate * 100).toFixed(1)}% per period).`);
    } else if (growthRate > -0.01) {
      insights.push('Relatively stable values with minimal growth or decline.');
    } else if (growthRate > -0.05) {
      insights.push(`Moderate declining trend observed (${(Math.abs(growthRate) * 100).toFixed(1)}% per period).`);
    } else {
      insights.push(`Strong declining trend observed (${(Math.abs(growthRate) * 100).toFixed(1)}% per period).`);
    }
    
    // Volatility insights
    if (volatility < 0.05) {
      insights.push('Very stable values with minimal fluctuations.');
    } else if (volatility < 0.15) {
      insights.push('Moderate stability with some minor fluctuations.');
    } else if (volatility < 0.3) {
      insights.push('Notable fluctuations in values indicating some volatility.');
    } else {
      insights.push('High volatility detected with significant fluctuations in values.');
    }
    
    // Pattern type insights
    if (patternType === 'cyclical') {
      insights.push('Cyclical or seasonal patterns detected in the data.');
    } else if (patternType === 'stable') {
      insights.push('Consistent, stable pattern observed in the data.');
    } else {
      insights.push('Linear trend pattern observed in the data.');
    }
    
    // Future projection insights
    if (predictions.length > 0) {
      const lastHistorical = historicalData[historicalData.length - 1].value;
      const lastPrediction = predictions[predictions.length - 1].value;
      const changePercent = ((lastPrediction - lastHistorical) / lastHistorical) * 100;
      
      if (changePercent > 20) {
        insights.push(`Significant increase of ${changePercent.toFixed(1)}% projected over the forecast period.`);
      } else if (changePercent > 5) {
        insights.push(`Moderate increase of ${changePercent.toFixed(1)}% projected over the forecast period.`);
      } else if (changePercent > -5) {
        insights.push('Relatively stable values projected over the forecast period.');
      } else if (changePercent > -20) {
        insights.push(`Moderate decrease of ${Math.abs(changePercent).toFixed(1)}% projected over the forecast period.`);
      } else {
        insights.push(`Significant decrease of ${Math.abs(changePercent).toFixed(1)}% projected over the forecast period.`);
      }
    }
    
    return insights;
  }
}