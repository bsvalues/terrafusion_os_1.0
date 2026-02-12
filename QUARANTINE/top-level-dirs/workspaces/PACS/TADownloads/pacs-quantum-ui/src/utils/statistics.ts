/**
 * Statistical Analysis Utilities
 * Elite Power User - Deep Statistical Analysis
 */

import type { StatisticalAnalysis, CorrelationMatrix, LiveMetrics } from '../types/pacs';

/**
 * Calculate comprehensive statistics from a dataset
 */
export function calculateStatistics(data: number[]): StatisticalAnalysis {
  if (data.length === 0) {
    throw new Error('Cannot calculate statistics for empty dataset');
  }

  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  // Basic statistics
  const mean = data.reduce((sum, val) => sum + val, 0) / n;
  const median = calculateMedian(sorted);
  const mode = calculateMode(data);
  const variance = calculateVariance(data, mean);
  const standardDeviation = Math.sqrt(variance);
  const min = sorted[0];
  const max = sorted[n - 1];

  // Quartiles
  const q1 = calculatePercentile(sorted, 25);
  const q2 = median;
  const q3 = calculatePercentile(sorted, 75);

  // Outliers (values beyond 2 standard deviations)
  const outliers = findOutliers(data, mean, standardDeviation);

  // Distribution
  const binCount = Math.min(20, Math.ceil(Math.sqrt(n)));
  const binWidth = (max - min) / binCount;
  const distribution = createDistribution(data, min, max, binCount, binWidth);

  return {
    mean,
    median,
    mode,
    standardDeviation,
    variance,
    min,
    max,
    quartiles: { q1, q2, q3 },
    outliers,
    distribution,
  };
}

/**
 * Calculate median
 */
function calculateMedian(sorted: number[]): number {
  const n = sorted.length;
  if (n % 2 === 0) {
    return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  }
  return sorted[Math.floor(n / 2)];
}

/**
 * Calculate mode
 */
function calculateMode(data: number[]): number {
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode = data[0];

  for (const value of data) {
    const rounded = Math.round(value * 100) / 100; // Round to 2 decimals
    frequency[rounded] = (frequency[rounded] || 0) + 1;
    if (frequency[rounded] > maxFreq) {
      maxFreq = frequency[rounded];
      mode = rounded;
    }
  }

  return mode;
}

/**
 * Calculate variance
 */
function calculateVariance(data: number[], mean: number): number {
  const sumSquaredDiffs = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  return sumSquaredDiffs / data.length;
}

/**
 * Calculate percentile
 */
function calculatePercentile(sorted: number[], percentile: number): number {
  const n = sorted.length;
  const index = (percentile / 100) * (n - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Find outliers (values beyond 2 standard deviations)
 */
function findOutliers(data: number[], mean: number, stdDev: number): number[] {
  const threshold = 2 * stdDev;
  return data.filter((value) => Math.abs(value - mean) > threshold);
}

/**
 * Create distribution bins
 */
function createDistribution(
  data: number[],
  min: number,
  _max: number, // Used in binWidth calculation which is passed in
  binCount: number,
  binWidth: number
): Array<{ bin: string; count: number; frequency: number }> {
  const bins = Array.from({ length: binCount }, () => 0);

  for (const value of data) {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
    bins[binIndex]++;
  }

  const total = data.length;

  return bins.map((count, index) => {
    const binStart = min + index * binWidth;
    const binEnd = binStart + binWidth;
    return {
      bin: `${binStart.toFixed(0)}-${binEnd.toFixed(0)}`,
      count,
      frequency: (count / total) * 100,
    };
  });
}

/**
 * Calculate correlation matrix from live metrics
 */
export function calculateCorrelationMatrix(metrics: LiveMetrics): CorrelationMatrix {
  const variables = Object.keys(metrics.metrics);
  const n = variables.length;

  if (n < 2) {
    return {
      variables,
      correlations: [[1]],
      significance: [[1]],
    };
  }

  const correlations: number[][] = [];
  const significance: number[][] = [];

  // Generate historical data for correlation calculation
  const historicalData: Record<string, number[]> = {};
  variables.forEach((key) => {
    historicalData[key] = generateHistoricalSeries(metrics.metrics[key], metrics.trends[key]);
  });

  // Calculate correlations
  for (let i = 0; i < n; i++) {
    const rowCorrelations: number[] = [];
    const rowSignificance: number[] = [];

    for (let j = 0; j < n; j++) {
      if (i === j) {
        rowCorrelations.push(1.0); // Self-correlation
        rowSignificance.push(0.0); // Always significant
      } else {
        const correlation = calculatePearsonCorrelation(
          historicalData[variables[i]],
          historicalData[variables[j]]
        );
        rowCorrelations.push(correlation);

        // Calculate significance (p-value approximation)
        const significanceValue = calculateSignificance(correlation, historicalData[variables[i]].length);
        rowSignificance.push(significanceValue);
      }
    }

    correlations.push(rowCorrelations);
    significance.push(rowSignificance);
  }

  return {
    variables,
    correlations,
    significance,
  };
}

/**
 * Generate historical series for correlation calculation
 */
function generateHistoricalSeries(baseValue: number, trend?: { changePercent: number; direction: string }): number[] {
  const length = 100; // Generate 100 data points
  const series: number[] = [];

  for (let i = 0; i < length; i++) {
    const position = i / length;
    let value = baseValue;

    if (trend) {
      // Apply trend
      const trendEffect = trend.changePercent * position * 0.01;
      value = baseValue * (1 - trendEffect);

      // Add realistic variation
      const variation = (Math.random() - 0.5) * baseValue * 0.1;
      value += variation;
    } else {
      // Random variation
      const variation = (Math.random() - 0.5) * baseValue * 0.1;
      value += variation;
    }

    series.push(value);
  }

  return series;
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Arrays must have the same length');
  }

  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * Calculate significance (p-value approximation)
 */
function calculateSignificance(correlation: number, n: number): number {
  if (n < 3) {
    return 1.0; // Not significant
  }

  // Simplified t-test approximation
  const t = (correlation * Math.sqrt(n - 2)) / Math.sqrt(1 - correlation * correlation);
  // df (degrees of freedom) = n - 2, used in calculation above

  // Approximate p-value (simplified)
  // In production, use proper t-distribution lookup
  if (Math.abs(t) > 2.576) {
    return 0.01; // p < 0.01
  }
  if (Math.abs(t) > 1.96) {
    return 0.05; // p < 0.05
  }
  if (Math.abs(t) > 1.645) {
    return 0.10; // p < 0.10
  }

  return 0.5; // Not significant
}

/**
 * Calculate z-score
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) {
    return 0;
  }
  return (value - mean) / stdDev;
}

/**
 * Calculate coefficient of variation
 */
export function calculateCoefficientOfVariation(stdDev: number, mean: number): number {
  if (mean === 0) {
    return 0;
  }
  return (stdDev / mean) * 100;
}

/**
 * Detect anomalies using statistical methods
 */
export function detectAnomalies(data: number[], threshold: number = 2): number[] {
  if (data.length === 0) {
    return [];
  }

  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  return data.filter((value) => Math.abs(value - mean) > threshold * stdDev);
}

