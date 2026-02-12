/**
 * Data Visualization Utilities for TerraFusion OS
 * 
 * Comprehensive utilities for data transformation, axis calculations, color scales,
 * statistical functions, and chart helpers for property assessment visualizations.
 * 
 * Features:
 * - Data transformation (normalize, aggregate, bin, smooth, interpolate)
 * - Axis calculations (min/max, ticks, nice numbers, logarithmic scales)
 * - Color scales (linear, quantize, threshold, categorical, sequential, diverging)
 * - Statistical functions (mean, median, percentile, std dev, variance, quartiles)
 * - Number formatting (currency, percentages, abbreviations, scientific notation)
 * - Chart helpers (pie angles, bar widths, line paths, stacked bars)
 * - Property assessment specific utilities (valuation trends, comparative sales)
 * 
 * @module data-viz
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Data point with value and optional label
 */
export interface DataPoint {
  value: number;
  label?: string;
  category?: string;
  timestamp?: Date | string | number;
  [key: string]: any;
}

/**
 * Time series data point
 */
export interface TimeSeriesPoint {
  timestamp: Date | string | number;
  value: number;
  [key: string]: any;
}

/**
 * Statistical summary
 */
export interface StatisticalSummary {
  mean: number;
  median: number;
  mode: number[];
  min: number;
  max: number;
  range: number;
  variance: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  count: number;
}

/**
 * Axis configuration
 */
export interface AxisConfig {
  min: number;
  max: number;
  ticks: number[];
  tickCount: number;
  domain: [number, number];
  range: [number, number];
}

/**
 * Color scale function type
 */
export type ColorScale = (value: number) => string;

/**
 * Histogram bin
 */
export interface HistogramBin {
  min: number;
  max: number;
  count: number;
  values: number[];
}

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Normalize values to 0-1 range
 */
export function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  if (range === 0) {
    return values.map(() => 0.5);
  }
  
  return values.map(v => (v - min) / range);
}

/**
 * Normalize values to a specific range
 */
export function normalizeToRange(
  values: number[],
  targetMin: number,
  targetMax: number
): number[] {
  const normalized = normalize(values);
  const targetRange = targetMax - targetMin;
  return normalized.map(v => v * targetRange + targetMin);
}

/**
 * Standardize values (z-score normalization)
 */
export function standardize(values: number[]): number[] {
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);
  
  if (stdDev === 0) {
    return values.map(() => 0);
  }
  
  return values.map(v => (v - mean) / stdDev);
}

/**
 * Aggregate data by category
 */
export function aggregateByCategory<T extends { category: string; value: number }>(
  data: T[],
  aggregation: 'sum' | 'mean' | 'count' | 'min' | 'max' = 'sum'
): Record<string, number> {
  const groups: Record<string, number[]> = {};
  
  data.forEach(item => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item.value);
  });
  
  const result: Record<string, number> = {};
  
  for (const [category, values] of Object.entries(groups)) {
    switch (aggregation) {
      case 'sum':
        result[category] = values.reduce((sum, v) => sum + v, 0);
        break;
      case 'mean':
        result[category] = calculateMean(values);
        break;
      case 'count':
        result[category] = values.length;
        break;
      case 'min':
        result[category] = Math.min(...values);
        break;
      case 'max':
        result[category] = Math.max(...values);
        break;
    }
  }
  
  return result;
}

/**
 * Create histogram bins
 */
export function createHistogram(
  values: number[],
  binCount: number = 10
): HistogramBin[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / binCount;
  
  const bins: HistogramBin[] = [];
  
  for (let i = 0; i < binCount; i++) {
    const binMin = min + i * binWidth;
    const binMax = binMin + binWidth;
    bins.push({
      min: binMin,
      max: binMax,
      count: 0,
      values: [],
    });
  }
  
  values.forEach(value => {
    const binIndex = Math.min(
      Math.floor((value - min) / binWidth),
      binCount - 1
    );
    bins[binIndex].count++;
    bins[binIndex].values.push(value);
  });
  
  return bins;
}

/**
 * Smooth data using moving average
 */
export function movingAverage(values: number[], windowSize: number = 3): number[] {
  if (windowSize <= 1 || windowSize > values.length) {
    return [...values];
  }
  
  const result: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(values.length, i + halfWindow + 1);
    const window = values.slice(start, end);
    result.push(calculateMean(window));
  }
  
  return result;
}

/**
 * Exponential moving average
 */
export function exponentialMovingAverage(
  values: number[],
  alpha: number = 0.3
): number[] {
  if (values.length === 0) return [];
  
  const result: number[] = [values[0]];
  
  for (let i = 1; i < values.length; i++) {
    const ema = alpha * values[i] + (1 - alpha) * result[i - 1];
    result.push(ema);
  }
  
  return result;
}

/**
 * Linear interpolation between data points
 */
export function interpolateDataPoints(
  data: TimeSeriesPoint[],
  targetCount: number
): TimeSeriesPoint[] {
  if (data.length === 0 || targetCount <= data.length) {
    return [...data];
  }
  
  const result: TimeSeriesPoint[] = [];
  const step = (data.length - 1) / (targetCount - 1);
  
  for (let i = 0; i < targetCount; i++) {
    const position = i * step;
    const index = Math.floor(position);
    const fraction = position - index;
    
    if (index >= data.length - 1) {
      result.push({ ...data[data.length - 1] });
    } else {
      const value = data[index].value + fraction * (data[index + 1].value - data[index].value);
      result.push({
        ...data[index],
        value,
      });
    }
  }
  
  return result;
}

/**
 * Remove outliers using IQR method
 */
export function removeOutliers(
  values: number[],
  factor: number = 1.5
): { values: number[]; outliers: number[] } {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = calculatePercentile(sorted, 25);
  const q3 = calculatePercentile(sorted, 75);
  const iqr = q3 - q1;
  
  const lowerBound = q1 - factor * iqr;
  const upperBound = q3 + factor * iqr;
  
  const filtered: number[] = [];
  const outliers: number[] = [];
  
  values.forEach(v => {
    if (v >= lowerBound && v <= upperBound) {
      filtered.push(v);
    } else {
      outliers.push(v);
    }
  });
  
  return { values: filtered, outliers };
}

// ============================================================================
// Statistical Functions
// ============================================================================

/**
 * Calculate mean (average)
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate median
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Calculate mode (most frequent value)
 */
export function calculateMode(values: number[]): number[] {
  if (values.length === 0) return [];
  
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  
  values.forEach(v => {
    frequency[v] = (frequency[v] || 0) + 1;
    maxFreq = Math.max(maxFreq, frequency[v]);
  });
  
  return Object.entries(frequency)
    .filter(([_, freq]) => freq === maxFreq)
    .map(([value, _]) => Number(value));
}

/**
 * Calculate variance
 */
export function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = calculateMean(values);
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return calculateMean(squaredDiffs);
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values: number[]): number {
  return Math.sqrt(calculateVariance(values));
}

/**
 * Calculate percentile
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  if (percentile < 0 || percentile > 100) {
    throw new Error('Percentile must be between 0 and 100');
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (lower === upper) {
    return sorted[lower];
  }
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate quartiles (Q1, Q2/median, Q3)
 */
export function calculateQuartiles(values: number[]): {
  q1: number;
  q2: number;
  q3: number;
} {
  return {
    q1: calculatePercentile(values, 25),
    q2: calculatePercentile(values, 50),
    q3: calculatePercentile(values, 75),
  };
}

/**
 * Calculate comprehensive statistical summary
 */
export function calculateStatistics(values: number[]): StatisticalSummary {
  if (values.length === 0) {
    return {
      mean: 0,
      median: 0,
      mode: [],
      min: 0,
      max: 0,
      range: 0,
      variance: 0,
      stdDev: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      count: 0,
    };
  }
  
  const quartiles = calculateQuartiles(values);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  return {
    mean: calculateMean(values),
    median: calculateMedian(values),
    mode: calculateMode(values),
    min,
    max,
    range: max - min,
    variance: calculateVariance(values),
    stdDev: calculateStdDev(values),
    q1: quartiles.q1,
    q3: quartiles.q3,
    iqr: quartiles.q3 - quartiles.q1,
    count: values.length,
  };
}

/**
 * Calculate correlation coefficient (Pearson's r)
 */
export function calculateCorrelation(xValues: number[], yValues: number[]): number {
  if (xValues.length !== yValues.length || xValues.length === 0) {
    throw new Error('Arrays must have same non-zero length');
  }
  
  const xMean = calculateMean(xValues);
  const yMean = calculateMean(yValues);
  
  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;
  
  for (let i = 0; i < xValues.length; i++) {
    const xDiff = xValues[i] - xMean;
    const yDiff = yValues[i] - yMean;
    numerator += xDiff * yDiff;
    xDenominator += xDiff * xDiff;
    yDenominator += yDiff * yDiff;
  }
  
  return numerator / Math.sqrt(xDenominator * yDenominator);
}

// ============================================================================
// Axis Calculations
// ============================================================================

/**
 * Calculate nice number (round to nearest "pretty" value)
 */
export function niceNumber(value: number, round: boolean = false): number {
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const fraction = Math.abs(value) / Math.pow(10, exponent);
  
  let niceFraction: number;
  
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }
  
  return niceFraction * Math.pow(10, exponent) * Math.sign(value);
}

/**
 * Calculate nice axis bounds and ticks
 */
export function calculateAxisTicks(
  min: number,
  max: number,
  targetTickCount: number = 5
): AxisConfig {
  const range = niceNumber(max - min, false);
  const tickSpacing = niceNumber(range / (targetTickCount - 1), true);
  const niceMin = Math.floor(min / tickSpacing) * tickSpacing;
  const niceMax = Math.ceil(max / tickSpacing) * tickSpacing;
  
  const ticks: number[] = [];
  for (let tick = niceMin; tick <= niceMax; tick += tickSpacing) {
    ticks.push(Math.round(tick * 1e10) / 1e10); // Avoid floating point errors
  }
  
  return {
    min: niceMin,
    max: niceMax,
    ticks,
    tickCount: ticks.length,
    domain: [niceMin, niceMax],
    range: [0, 100], // Percentage range, adjust as needed
  };
}

/**
 * Calculate logarithmic scale ticks
 */
export function calculateLogTicks(
  min: number,
  max: number,
  base: number = 10
): number[] {
  if (min <= 0 || max <= 0) {
    throw new Error('Logarithmic scale requires positive values');
  }
  
  const logMin = Math.log(min) / Math.log(base);
  const logMax = Math.log(max) / Math.log(base);
  
  const ticks: number[] = [];
  
  for (let i = Math.floor(logMin); i <= Math.ceil(logMax); i++) {
    const tick = Math.pow(base, i);
    if (tick >= min && tick <= max) {
      ticks.push(tick);
    }
  }
  
  return ticks;
}

/**
 * Map value from domain to range (scale)
 */
export function scaleLinear(
  value: number,
  domain: [number, number],
  range: [number, number]
): number {
  const [domainMin, domainMax] = domain;
  const [rangeMin, rangeMax] = range;
  
  const domainRange = domainMax - domainMin;
  const rangeRange = rangeMax - rangeMin;
  
  if (domainRange === 0) return rangeMin;
  
  return ((value - domainMin) / domainRange) * rangeRange + rangeMin;
}

/**
 * Map value from domain to range using logarithmic scale
 */
export function scaleLog(
  value: number,
  domain: [number, number],
  range: [number, number],
  base: number = 10
): number {
  if (value <= 0) {
    throw new Error('Logarithmic scale requires positive values');
  }
  
  const [domainMin, domainMax] = domain;
  const [rangeMin, rangeMax] = range;
  
  const logValue = Math.log(value) / Math.log(base);
  const logMin = Math.log(domainMin) / Math.log(base);
  const logMax = Math.log(domainMax) / Math.log(base);
  
  return scaleLinear(logValue, [logMin, logMax], [rangeMin, rangeMax]);
}

// ============================================================================
// Color Scales
// ============================================================================

/**
 * Linear color scale (interpolate between two colors)
 */
export function createLinearColorScale(
  domain: [number, number],
  colors: [string, string]
): ColorScale {
  return (value: number) => {
    const t = (value - domain[0]) / (domain[1] - domain[0]);
    return interpolateColor(colors[0], colors[1], Math.max(0, Math.min(1, t)));
  };
}

/**
 * Interpolate between two hex colors
 */
function interpolateColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  
  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Quantize color scale (discrete buckets)
 */
export function createQuantizeColorScale(
  domain: [number, number],
  colors: string[]
): ColorScale {
  return (value: number) => {
    const t = (value - domain[0]) / (domain[1] - domain[0]);
    const index = Math.floor(t * colors.length);
    return colors[Math.max(0, Math.min(colors.length - 1, index))];
  };
}

/**
 * Threshold color scale (specific breakpoints)
 */
export function createThresholdColorScale(
  thresholds: number[],
  colors: string[]
): ColorScale {
  if (colors.length !== thresholds.length + 1) {
    throw new Error('Colors array must have one more element than thresholds');
  }
  
  return (value: number) => {
    for (let i = 0; i < thresholds.length; i++) {
      if (value < thresholds[i]) {
        return colors[i];
      }
    }
    return colors[colors.length - 1];
  };
}

/**
 * TerraFusion color palettes
 */
export const TerraFusionColors = {
  // Sequential (low to high)
  blues: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'],
  greens: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d'],
  purples: ['#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7c3aed'],
  
  // Diverging (emphasis on middle)
  redGreen: ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#ecf0f1', '#86efac', '#4ade80', '#22c55e', '#16a34a'],
  blueRed: ['#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#ecf0f1', '#fca5a5', '#f87171', '#ef4444', '#dc2626'],
  
  // Categorical (distinct colors)
  category10: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'],
  
  // TerraFusion brand colors
  brand: {
    primary: '#7c3aed',
    secondary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#14b8a6',
  },
};

/**
 * Create sequential color scale
 */
export function createSequentialColorScale(
  domain: [number, number],
  palette: 'blues' | 'greens' | 'purples' = 'blues'
): ColorScale {
  return createQuantizeColorScale(domain, TerraFusionColors[palette]);
}

/**
 * Create diverging color scale
 */
export function createDivergingColorScale(
  domain: [number, number],
  midpoint: number,
  palette: 'redGreen' | 'blueRed' = 'redGreen'
): ColorScale {
  const colors = TerraFusionColors[palette];
  const midIndex = Math.floor(colors.length / 2);
  
  return (value: number) => {
    if (value < midpoint) {
      const scale = createQuantizeColorScale([domain[0], midpoint], colors.slice(0, midIndex + 1));
      return scale(value);
    } else {
      const scale = createQuantizeColorScale([midpoint, domain[1]], colors.slice(midIndex));
      return scale(value);
    }
  };
}

/**
 * Create categorical color scale
 */
export function createCategoricalColorScale(categories: string[]): (category: string) => string {
  const colors = TerraFusionColors.category10;
  const colorMap = new Map<string, string>();
  
  categories.forEach((cat, i) => {
    colorMap.set(cat, colors[i % colors.length]);
  });
  
  return (category: string) => colorMap.get(category) || colors[0];
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format number as currency
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  decimals: number = 0
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format number as percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with abbreviations (K, M, B, T)
 */
export function formatAbbreviated(value: number, decimals: number = 1): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1e12) {
    return `${sign}${(absValue / 1e12).toFixed(decimals)}T`;
  } else if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(decimals)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(decimals)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(decimals)}K`;
  } else {
    return `${sign}${absValue.toFixed(decimals)}`;
  }
}

/**
 * Format number with thousands separators
 */
export function formatThousands(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format number in scientific notation
 */
export function formatScientific(value: number, decimals: number = 2): string {
  return value.toExponential(decimals);
}

// ============================================================================
// Chart Helpers
// ============================================================================

/**
 * Calculate pie chart angles
 */
export function calculatePieAngles(values: number[]): {
  startAngle: number;
  endAngle: number;
  value: number;
  percentage: number;
}[] {
  const total = values.reduce((sum, v) => sum + v, 0);
  
  let currentAngle = 0;
  return values.map(value => {
    const percentage = (value / total) * 100;
    const angle = (value / total) * 2 * Math.PI;
    const result = {
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      value,
      percentage,
    };
    currentAngle += angle;
    return result;
  });
}

/**
 * Calculate bar widths with padding
 */
export function calculateBarWidths(
  barCount: number,
  totalWidth: number,
  padding: number = 0.1
): { barWidth: number; offset: number }[] {
  const paddingSpace = totalWidth * padding;
  const availableWidth = totalWidth - paddingSpace;
  const barWidth = availableWidth / barCount;
  
  return Array.from({ length: barCount }, (_, i) => ({
    barWidth,
    offset: i * barWidth + (paddingSpace / 2),
  }));
}

/**
 * Calculate stacked bar positions
 */
export function calculateStackedBars<T extends Record<string, number>>(
  data: T[],
  keys: (keyof T)[]
): Array<{ key: keyof T; y0: number; y1: number }[]> {
  return data.map(item => {
    let cumulative = 0;
    return keys.map(key => {
      const value = item[key] as number;
      const result = { key, y0: cumulative, y1: cumulative + value };
      cumulative += value;
      return result;
    });
  });
}

/**
 * Generate SVG path for line chart
 */
export function generateLinePath(
  points: { x: number; y: number }[],
  smooth: boolean = false
): string {
  if (points.length === 0) return '';
  
  if (!smooth) {
    // Straight line path
    const commands = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`);
    return commands.join(' ');
  } else {
    // Smooth curve using cubic Bezier
    if (points.length < 2) return `M ${points[0].x} ${points[0].y}`;
    
    const commands: string[] = [`M ${points[0].x} ${points[0].y}`];
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      commands.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
    }
    
    return commands.join(' ');
  }
}

/**
 * Generate SVG path for area chart
 */
export function generateAreaPath(
  points: { x: number; y: number }[],
  baseline: number = 0,
  smooth: boolean = false
): string {
  if (points.length === 0) return '';
  
  const linePath = generateLinePath(points, smooth);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  
  return `${linePath} L ${lastPoint.x} ${baseline} L ${firstPoint.x} ${baseline} Z`;
}

// ============================================================================
// Property Assessment Utilities
// ============================================================================

/**
 * Calculate year-over-year growth rate
 */
export function calculateYoYGrowth(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate compound annual growth rate (CAGR)
 */
export function calculateCAGR(
  beginningValue: number,
  endingValue: number,
  years: number
): number {
  if (beginningValue === 0 || years === 0) return 0;
  return (Math.pow(endingValue / beginningValue, 1 / years) - 1) * 100;
}

/**
 * Calculate moving average for property valuations
 */
export function calculateValuationTrend(
  valuations: TimeSeriesPoint[],
  windowSize: number = 3
): TimeSeriesPoint[] {
  const values = valuations.map(v => v.value);
  const smoothed = movingAverage(values, windowSize);
  
  return valuations.map((v, i) => ({
    ...v,
    value: smoothed[i],
  }));
}

/**
 * Calculate comparative market analysis (CMA) statistics
 */
export function calculateCMAStats(propertyValues: number[]): {
  stats: StatisticalSummary;
  pricePerSqFt: { min: number; max: number; avg: number };
  recommended: { low: number; mid: number; high: number };
} {
  const stats = calculateStatistics(propertyValues);
  
  return {
    stats,
    pricePerSqFt: {
      min: stats.min,
      max: stats.max,
      avg: stats.mean,
    },
    recommended: {
      low: stats.q1,
      mid: stats.median,
      high: stats.q3,
    },
  };
}

/**
 * Detect seasonality in time series data
 */
export function detectSeasonality(
  data: TimeSeriesPoint[],
  period: number = 12
): { hasSeasonality: boolean; strength: number } {
  if (data.length < period * 2) {
    return { hasSeasonality: false, strength: 0 };
  }
  
  const values = data.map(d => d.value);
  const detrended = values.map((v, i) => {
    const start = Math.max(0, i - Math.floor(period / 2));
    const end = Math.min(values.length, i + Math.ceil(period / 2));
    const avg = calculateMean(values.slice(start, end));
    return v - avg;
  });
  
  const seasonal = detrended.slice(0, period);
  const residuals: number[] = [];
  
  for (let i = period; i < detrended.length; i++) {
    residuals.push(detrended[i] - seasonal[i % period]);
  }
  
  const seasonalVariance = calculateVariance(seasonal);
  const residualVariance = calculateVariance(residuals);
  const strength = seasonalVariance / (seasonalVariance + residualVariance);
  
  return {
    hasSeasonality: strength > 0.6,
    strength: strength * 100,
  };
}
