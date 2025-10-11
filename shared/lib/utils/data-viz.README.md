# Data Visualization Utilities

Comprehensive data transformation, statistical analysis, axis calculations, color scales, and chart helpers for TerraFusion property assessment visualizations.

## Features

- ✅ **Data Transformation** - Normalize, aggregate, bin, smooth, interpolate
- ✅ **Statistical Functions** - Mean, median, mode, variance, std dev, percentiles, correlation
- ✅ **Axis Calculations** - Nice numbers, tick generation, linear/log scales
- ✅ **Color Scales** - Linear, quantize, threshold, sequential, diverging, categorical
- ✅ **Number Formatting** - Currency, percentage, abbreviations (K/M/B), thousands
- ✅ **Chart Helpers** - Pie angles, bar widths, stacked bars, SVG paths
- ✅ **Property Assessment** - Valuation trends, YoY growth, CAGR, CMA statistics
- ✅ **TypeScript** - Full type safety
- ✅ **Zero Dependencies** - Pure JavaScript/TypeScript

## Installation

```typescript
import {
  normalize,
  calculateStatistics,
  calculateAxisTicks,
  createSequentialColorScale,
  formatCurrency,
  calculatePieAngles,
  calculateYoYGrowth,
} from './utils/data-viz';
```

## Real-World Examples

### 1. Property Valuation Trend Chart

Visualize property values over time with smoothing:

```typescript
import { calculateValuationTrend, formatCurrency, calculateAxisTicks } from './utils/data-viz';

// Property valuations over past 12 months
const valuations = [
  { timestamp: '2024-01', value: 450000 },
  { timestamp: '2024-02', value: 455000 },
  { timestamp: '2024-03', value: 460000 },
  // ... more months
  { timestamp: '2024-12', value: 485000 },
];

// Smooth the trend (3-month moving average)
const smoothed = calculateValuationTrend(valuations, 3);

// Calculate nice axis bounds and ticks
const values = smoothed.map(v => v.value);
const axisConfig = calculateAxisTicks(
  Math.min(...values),
  Math.max(...values),
  5
);

console.log('Y-axis ticks:', axisConfig.ticks.map(t => formatCurrency(t)));
// Output: ['$450K', '$460K', '$470K', '$480K', '$490K']

// Calculate year-over-year growth
const yoyGrowth = calculateYoYGrowth(485000, 450000);
console.log(`YoY Growth: ${yoyGrowth.toFixed(1)}%`); // 7.8%
```

### 2. Comparative Market Analysis (CMA) Dashboard

Statistical analysis of comparable properties:

```typescript
import { calculateCMAStats, formatCurrency, createSequentialColorScale } from './utils/data-viz';

// Comparable property sales in neighborhood
const comparableSales = [
  425000, 438000, 445000, 450000, 455000,
  460000, 465000, 470000, 475000, 485000
];

const cmaStats = calculateCMAStats(comparableSales);

console.log('Market Statistics:');
console.log(`  Median: ${formatCurrency(cmaStats.stats.median)}`);
console.log(`  Mean: ${formatCurrency(cmaStats.stats.mean)}`);
console.log(`  Range: ${formatCurrency(cmaStats.stats.min)} - ${formatCurrency(cmaStats.stats.max)}`);
console.log(`  Std Dev: ${formatCurrency(cmaStats.stats.stdDev)}`);
console.log(`\nRecommended Pricing:`);
console.log(`  Conservative: ${formatCurrency(cmaStats.recommended.low)}`);
console.log(`  Market: ${formatCurrency(cmaStats.recommended.mid)}`);
console.log(`  Aggressive: ${formatCurrency(cmaStats.recommended.high)}`);

// Create color scale for heat map of property values
const colorScale = createSequentialColorScale(
  [cmaStats.stats.min, cmaStats.stats.max],
  'greens'
);

// Apply colors to map parcels
comparableSales.forEach((value, i) => {
  const color = colorScale(value);
  console.log(`Parcel ${i + 1}: ${formatCurrency(value)} → ${color}`);
});
```

### 3. Tax Levy Distribution Pie Chart

Visualize tax distribution across districts:

```typescript
import { calculatePieAngles, formatCurrency, formatPercentage, TerraFusionColors } from './utils/data-viz';

const taxDistricts = [
  { name: 'School District', amount: 5500 },
  { name: 'County', amount: 1500 },
  { name: 'City', amount: 1200 },
  { name: 'Fire District', amount: 800 },
  { name: 'Hospital', amount: 600 },
  { name: 'Library', amount: 400 },
];

const amounts = taxDistricts.map(d => d.amount);
const total = amounts.reduce((sum, a) => sum + a, 0);
const angles = calculatePieAngles(amounts);

// Assign categorical colors
const colors = TerraFusionColors.category10;

taxDistricts.forEach((district, i) => {
  const angle = angles[i];
  console.log(`${district.name}:`);
  console.log(`  Amount: ${formatCurrency(angle.value)}`);
  console.log(`  Percentage: ${formatPercentage(angle.percentage)}`);
  console.log(`  Angle: ${angle.startAngle.toFixed(2)} → ${angle.endAngle.toFixed(2)}`);
  console.log(`  Color: ${colors[i]}`);
});
```

### 4. Assessment Ratio Analysis Histogram

Analyze distribution of assessment ratios:

```typescript
import { createHistogram, calculateStatistics, removeOutliers } from './utils/data-viz';

// Assessment ratios (assessed value / market value)
let assessmentRatios = [
  0.85, 0.88, 0.90, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98,
  0.99, 1.00, 1.01, 1.02, 1.03, 1.04, 1.05, 1.10, 1.15, 1.50 // 1.50 is outlier
];

// Remove outliers
const { values: cleanRatios, outliers } = removeOutliers(assessmentRatios);
console.log(`Removed ${outliers.length} outliers:`, outliers);

// Create histogram
const histogram = createHistogram(cleanRatios, 10);

console.log('Assessment Ratio Distribution:');
histogram.forEach((bin, i) => {
  const bar = '█'.repeat(bin.count);
  console.log(`${bin.min.toFixed(2)}-${bin.max.toFixed(2)}: ${bar} (${bin.count})`);
});

// Calculate statistics
const stats = calculateStatistics(cleanRatios);
console.log(`\nStatistics:`);
console.log(`  Median: ${stats.median.toFixed(3)}`);
console.log(`  COD (Coefficient of Dispersion): ${(stats.stdDev / stats.mean * 100).toFixed(2)}%`);
```

### 5. Sales Volume Forecast with Trend

Forecast future sales volume using exponential moving average:

```typescript
import { exponentialMovingAverage, calculateAxisTicks, scaleLinear } from './utils/data-viz';

// Monthly sales volume for past 12 months
const salesVolume = [250, 280, 320, 350, 330, 380, 400, 420, 390, 410, 430, 450];

// Calculate EMA for smoothing (alpha = 0.3)
const ema = exponentialMovingAverage(salesVolume, 0.3);

// Project next 3 months
const lastEMA = ema[ema.length - 1];
const forecast = [lastEMA, lastEMA * 1.05, lastEMA * 1.08];

console.log('Sales Volume Forecast:');
ema.forEach((value, i) => {
  console.log(`Month ${i + 1}: ${Math.round(value)} sales`);
});
console.log('--- Forecast ---');
forecast.forEach((value, i) => {
  console.log(`Month ${ema.length + i + 1}: ${Math.round(value)} sales (projected)`);
});

// Calculate axis for chart
const allValues = [...ema, ...forecast];
const axis = calculateAxisTicks(
  Math.min(...allValues),
  Math.max(...allValues),
  5
);
console.log('Chart Y-axis ticks:', axis.ticks.map(t => Math.round(t)));
```

### 6. Property Value Heat Map

Create color-coded heat map of property values by neighborhood:

```typescript
import { createDivergingColorScale, aggregateByCategory, formatAbbreviated } from './utils/data-viz';

// Property data by neighborhood
const properties = [
  { category: 'Downtown', value: 750000 },
  { category: 'Downtown', value: 800000 },
  { category: 'Suburbs', value: 450000 },
  { category: 'Suburbs', value: 480000 },
  { category: 'Rural', value: 280000 },
  { category: 'Rural', value: 310000 },
];

// Aggregate by neighborhood (mean)
const avgByNeighborhood = aggregateByCategory(properties, 'mean');

console.log('Average Property Value by Neighborhood:');
Object.entries(avgByNeighborhood).forEach(([neighborhood, avg]) => {
  console.log(`  ${neighborhood}: ${formatAbbreviated(avg)}`);
});

// Create diverging color scale (blue = low, red = high)
const values = Object.values(avgByNeighborhood);
const midpoint = (Math.min(...values) + Math.max(...values)) / 2;
const colorScale = createDivergingColorScale(
  [Math.min(...values), Math.max(...values)],
  midpoint,
  'blueRed'
);

// Apply colors
Object.entries(avgByNeighborhood).forEach(([neighborhood, avg]) => {
  const color = colorScale(avg);
  console.log(`${neighborhood}: ${color}`);
});
```

### 7. Multi-Year Revenue Bar Chart (Stacked)

Visualize tax revenue by source over multiple years:

```typescript
import { calculateStackedBars, formatCurrency, TerraFusionColors } from './utils/data-viz';

const revenueData = [
  { year: '2022', property: 50000, sales: 15000, income: 10000 },
  { year: '2023', property: 55000, sales: 16000, income: 11000 },
  { year: '2024', property: 60000, sales: 17000, income: 12000 },
];

const keys = ['property', 'sales', 'income'] as const;
const stacked = calculateStackedBars(revenueData, keys);

console.log('Stacked Revenue Bars:');
revenueData.forEach((data, i) => {
  console.log(`\n${data.year}:`);
  stacked[i].forEach((segment) => {
    const height = segment.y1 - segment.y0;
    console.log(`  ${String(segment.key)}: ${formatCurrency(height)} (${segment.y0} → ${segment.y1})`);
  });
  const total = stacked[i][stacked[i].length - 1].y1;
  console.log(`  Total: ${formatCurrency(total)}`);
});
```

### 8. Property Price Correlation Analysis

Analyze correlation between property characteristics and price:

```typescript
import { calculateCorrelation, calculateStatistics } from './utils/data-viz';

// Property data: square footage vs price
const sqft = [1200, 1500, 1800, 2100, 2400, 2700, 3000];
const prices = [250000, 300000, 350000, 400000, 450000, 500000, 550000];

// Calculate correlation
const correlation = calculateCorrelation(sqft, prices);

console.log(`Square Footage vs Price Correlation: ${correlation.toFixed(3)}`);
if (correlation > 0.8) {
  console.log('Strong positive correlation');
} else if (correlation > 0.5) {
  console.log('Moderate positive correlation');
} else {
  console.log('Weak correlation');
}

// Price per square foot analysis
const pricePerSqFt = prices.map((price, i) => price / sqft[i]);
const ppsfStats = calculateStatistics(pricePerSqFt);

console.log(`\nPrice per Sq Ft:`);
console.log(`  Mean: $${ppsfStats.mean.toFixed(2)}`);
console.log(`  Median: $${ppsfStats.median.toFixed(2)}`);
console.log(`  Range: $${ppsfStats.min.toFixed(2)} - $${ppsfStats.max.toFixed(2)}`);
```

### 9. Logarithmic Scale for Wide Value Ranges

Handle properties with vastly different values:

```typescript
import { scaleLog, calculateLogTicks, formatAbbreviated } from './utils/data-viz';

// Property values ranging from $100K to $10M
const wideRangeValues = [100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000];

// Calculate logarithmic ticks
const logTicks = calculateLogTicks(100000, 10000000, 10);

console.log('Logarithmic Y-axis Ticks:');
logTicks.forEach(tick => {
  console.log(`  ${formatAbbreviated(tick, 0)}`);
});
// Output: 100K, 1M, 10M

// Map values to pixel positions (0-100)
wideRangeValues.forEach(value => {
  const position = scaleLog(value, [100000, 10000000], [0, 100]);
  console.log(`${formatAbbreviated(value, 0)} → ${position.toFixed(1)}px`);
});
```

### 10. Seasonality Detection in Sales Data

Detect seasonal patterns in property sales:

```typescript
import { detectSeasonality, calculateStatistics } from './utils/data-viz';

// Monthly sales data for 3 years (36 months)
const monthlySales = [
  // Year 1: Lower in winter, higher in spring/summer
  45, 42, 55, 78, 92, 105, 110, 108, 98, 75, 58, 48,
  // Year 2: Similar pattern
  48, 45, 58, 82, 95, 108, 115, 112, 102, 78, 60, 50,
  // Year 3: Pattern continues
  50, 48, 60, 85, 98, 112, 118, 115, 105, 80, 62, 52,
].map((value, i) => ({
  timestamp: `2022-${String((i % 12) + 1).padStart(2, '0')}`,
  value,
}));

// Detect seasonality (12-month period)
const seasonality = detectSeasonality(monthlySales, 12);

console.log('Seasonality Analysis:');
console.log(`  Has Seasonality: ${seasonality.hasSeasonality ? 'Yes' : 'No'}`);
console.log(`  Strength: ${seasonality.strength.toFixed(1)}%`);

if (seasonality.hasSeasonality) {
  console.log('\nInsight: Property sales show strong seasonal patterns.');
  console.log('Peak sales occur in summer months (June-August).');
  console.log('Plan marketing campaigns accordingly.');
}
```

## API Reference

### Data Transformation

- `normalize(values: number[]): number[]` - Normalize to 0-1 range
- `normalizeToRange(values, targetMin, targetMax): number[]` - Normalize to custom range
- `standardize(values: number[]): number[]` - Z-score normalization
- `aggregateByCategory(data, aggregation): Record<string, number>` - Group and aggregate
- `createHistogram(values, binCount): HistogramBin[]` - Create histogram bins
- `movingAverage(values, windowSize): number[]` - Simple moving average
- `exponentialMovingAverage(values, alpha): number[]` - Exponential moving average
- `interpolateDataPoints(data, targetCount): TimeSeriesPoint[]` - Interpolate time series
- `removeOutliers(values, factor): { values, outliers }` - Remove statistical outliers

### Statistical Functions

- `calculateMean(values): number` - Average
- `calculateMedian(values): number` - Middle value
- `calculateMode(values): number[]` - Most frequent value(s)
- `calculateVariance(values): number` - Variance
- `calculateStdDev(values): number` - Standard deviation
- `calculatePercentile(values, percentile): number` - Percentile
- `calculateQuartiles(values): { q1, q2, q3 }` - Quartiles
- `calculateStatistics(values): StatisticalSummary` - Comprehensive stats
- `calculateCorrelation(xValues, yValues): number` - Pearson's r

### Axis Calculations

- `niceNumber(value, round): number` - Round to "pretty" number
- `calculateAxisTicks(min, max, targetTickCount): AxisConfig` - Generate nice ticks
- `calculateLogTicks(min, max, base): number[]` - Logarithmic scale ticks
- `scaleLinear(value, domain, range): number` - Linear scale mapping
- `scaleLog(value, domain, range, base): number` - Logarithmic scale mapping

### Color Scales

- `createLinearColorScale(domain, colors): ColorScale` - Linear interpolation
- `createQuantizeColorScale(domain, colors): ColorScale` - Discrete buckets
- `createThresholdColorScale(thresholds, colors): ColorScale` - Specific breakpoints
- `createSequentialColorScale(domain, palette): ColorScale` - Sequential (low→high)
- `createDivergingColorScale(domain, midpoint, palette): ColorScale` - Diverging (emphasis on middle)
- `createCategoricalColorScale(categories): (category: string) => string` - Categorical

### Number Formatting

- `formatCurrency(value, currency, decimals): string` - Currency format
- `formatPercentage(value, decimals): string` - Percentage format
- `formatAbbreviated(value, decimals): string` - K/M/B/T abbreviations
- `formatThousands(value, decimals): string` - Thousands separators
- `formatScientific(value, decimals): string` - Scientific notation

### Chart Helpers

- `calculatePieAngles(values): Array<{ startAngle, endAngle, value, percentage }>` - Pie chart
- `calculateBarWidths(barCount, totalWidth, padding): Array<{ barWidth, offset }>` - Bar chart
- `calculateStackedBars(data, keys): Array<Array<{ key, y0, y1 }>>` - Stacked bars
- `generateLinePath(points, smooth): string` - SVG line path
- `generateAreaPath(points, baseline, smooth): string` - SVG area path

### Property Assessment

- `calculateYoYGrowth(current, previous): number` - Year-over-year growth
- `calculateCAGR(beginningValue, endingValue, years): number` - Compound annual growth rate
- `calculateValuationTrend(valuations, windowSize): TimeSeriesPoint[]` - Smooth valuation trend
- `calculateCMAStats(propertyValues): CMAStats` - Comparative market analysis
- `detectSeasonality(data, period): { hasSeasonality, strength }` - Seasonality detection

### Color Palettes

`TerraFusionColors`:
- `blues`: Sequential blue palette (8 colors)
- `greens`: Sequential green palette (8 colors)
- `purples`: Sequential purple palette (8 colors)
- `redGreen`: Diverging red-green palette (9 colors)
- `blueRed`: Diverging blue-red palette (9 colors)
- `category10`: Categorical palette (10 distinct colors)
- `brand`: TerraFusion brand colors (primary, secondary, success, warning, error, info)

## Use Cases

### Property Assessment

- ✅ Valuation trend charts with smoothing
- ✅ Comparative market analysis dashboards
- ✅ Assessment ratio distribution histograms
- ✅ Year-over-year growth calculations
- ✅ Property value heat maps

### Tax Administration

- ✅ Tax levy distribution pie charts
- ✅ Revenue by source stacked bar charts
- ✅ Multi-year revenue trend lines
- ✅ District-level tax analysis

### Market Analysis

- ✅ Sales volume forecasting
- ✅ Price correlation analysis
- ✅ Seasonality detection
- ✅ Market statistics (median, quartiles, etc.)

### Geographic Visualization

- ✅ Neighborhood value heat maps
- ✅ Color-coded property zones
- ✅ Geographic distribution analysis

## Performance Considerations

- **Large Datasets**: Functions are optimized for arrays up to 10,000 elements
- **Complexity**: Most operations are O(n) or O(n log n)
- **Memory**: Minimal allocations, reuses arrays where possible
- **Accuracy**: Uses floating-point precision with rounding where appropriate

## Browser Support

- ✅ Chrome 16+ (Intl.NumberFormat)
- ✅ Firefox 29+
- ✅ Safari 10+
- ✅ Edge (all versions)
- ✅ Mobile browsers (iOS 10+, Android 5+)

## TypeScript Support

Full TypeScript support with generics and strict typing:

```typescript
// Strongly typed aggregation
interface SalesData {
  category: string;
  value: number;
  region: string;
}

const sales: SalesData[] = [
  { category: 'Residential', value: 500000, region: 'North' },
  { category: 'Commercial', value: 1200000, region: 'Downtown' },
];

const totalByCategory = aggregateByCategory(sales, 'sum');
// Type: Record<string, number>
```

## Testing

```typescript
import { calculateStatistics, normalize, calculateCorrelation } from './data-viz';

describe('Statistical Functions', () => {
  it('should calculate mean correctly', () => {
    const values = [1, 2, 3, 4, 5];
    const stats = calculateStatistics(values);
    expect(stats.mean).toBe(3);
  });

  it('should normalize values to 0-1', () => {
    const values = [100, 200, 300];
    const normalized = normalize(values);
    expect(normalized[0]).toBe(0);
    expect(normalized[2]).toBe(1);
  });

  it('should calculate correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    const r = calculateCorrelation(x, y);
    expect(r).toBeCloseTo(1.0, 2);
  });
});
```

## Integration with Chart Libraries

### Chart.js

```typescript
import { calculateAxisTicks, TerraFusionColors, formatCurrency } from './data-viz';

const chartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [{
    data: [450000, 460000, 470000, 480000, 490000],
    backgroundColor: TerraFusionColors.brand.primary,
  }],
};

const values = chartData.datasets[0].data;
const axis = calculateAxisTicks(Math.min(...values), Math.max(...values), 5);

const chartOptions = {
  scales: {
    y: {
      min: axis.min,
      max: axis.max,
      ticks: {
        values: axis.ticks,
        callback: (value: number) => formatCurrency(value, 'USD', 0),
      },
    },
  },
};
```

### D3.js

```typescript
import { scaleLinear, createSequentialColorScale } from './data-viz';
import * as d3 from 'd3';

const data = [/* ... */];
const colorScale = createSequentialColorScale([0, 100], 'blues');

// Create D3 color scale from our utility
const d3ColorScale = d3.scaleLinear()
  .domain([0, 100])
  .range(['#eff6ff', '#1d4ed8'])
  .interpolate((a, b) => (t) => colorScale(t * 100));
```

## Related Utilities

- `animation.ts` - Animate chart transitions (Day 10)
- `format.ts` - Additional number/date formatting (Day 2)
- `geospatial.ts` - Geographic data transformations (Day 8)
- `websocket.ts` - Real-time data updates (Day 9)

---

**THE TERRAFUSION WAY™** - Data-driven insights for property assessment! 📊✨
