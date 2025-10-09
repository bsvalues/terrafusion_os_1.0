# TerraFusion Charts & Data Visualization System
## Day 20 Component Library - Comprehensive Documentation

A powerful, zero-dependency chart system designed for property assessment, market analysis, and data visualization needs. Built with React/TypeScript, Canvas/SVG rendering, and full integration with the TerraFusion ecosystem.

## 📊 Overview

The Charts & Data Visualization System provides:
- **7 Chart Components**: LineChart, BarChart, PieChart, ScatterPlot, PropertyTrendChart, ComparablesChart, AssessmentChart
- **Interactive Features**: Zoom, pan, hover effects, click handlers, tooltips
- **Export Capabilities**: PNG, SVG, PDF export support
- **Responsive Design**: Automatic sizing and mobile-friendly layouts
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation
- **Zero Dependencies**: Pure Canvas/SVG implementation, no external chart libraries

## 🏗️ Architecture

### Core Components
```
charts.tsx (1,400+ lines)
├── BaseChart          # Foundation component with common functionality
├── LineChart          # Time-series and trend visualization
├── BarChart           # Categorical data comparison
├── PieChart           # Proportional data display
├── ScatterPlot        # Correlation and bubble charts
├── PropertyTrendChart # Property market trend analysis
├── ComparablesChart   # Property comparison visualization
└── AssessmentChart    # Comprehensive assessment analysis
```

### Integration Points
- **Day 6 (Forms)**: Form-driven chart parameters and filters
- **Day 15 (Loading)**: Loading states during data fetch
- **Day 16 (Notifications)**: Export notifications and error alerts
- **Day 17 (Modals)**: Charts displayed in modal dialogs
- **Day 18 (Tabs)**: Multiple chart views in tabbed interfaces
- **Day 19 (Tables)**: Chart data sourced from table components

## 🚀 Quick Start

### Basic Usage

```tsx
import { LineChart, BarChart, PieChart } from '@/components/charts';

// Simple line chart
<LineChart
  series={[{
    id: 'sales',
    name: 'Property Sales',
    data: [
      { x: new Date('2024-01'), y: 450000 },
      { x: new Date('2024-02'), y: 475000 },
      { x: new Date('2024-03'), y: 462000 },
    ],
    color: '#3B82F6'
  }]}
  title="Monthly Property Sales"
/>

// Bar chart for comparisons
<BarChart
  series={[{
    id: 'prices',
    name: 'Average Prices',
    data: [
      { x: 'Downtown', y: 850000 },
      { x: 'Suburbs', y: 650000 },
      { x: 'Rural', y: 425000 },
    ],
    color: '#10B981'
  }]}
  title="Price by Location"
/>
```

### Advanced Configuration

```tsx
<LineChart
  series={chartSeries}
  xAxis={{
    type: 'time',
    label: 'Date',
    format: (date) => formatDate(new Date(date)),
    grid: true
  }}
  yAxis={{
    type: 'linear',
    label: 'Price ($)',
    format: (value) => formatCurrency(value),
    grid: true
  }}
  config={{
    height: 500,
    interactive: true,
    exportable: true,
    animations: true,
    responsive: true
  }}
  legend={{ show: true, position: 'bottom' }}
  tooltip={{ show: true }}
  onDataClick={(data, series) => showPropertyDetails(data)}
  onExport={(format) => trackExport(format)}
  smooth={true}
  showPoints={true}
  fillArea={true}
/>
```

## 📚 Component API Reference

### BaseChart Props

```tsx
interface BaseChartProps {
  series: ChartSeries[];           // Data series to display
  xAxis?: ChartAxis;              // X-axis configuration
  yAxis?: ChartAxis;              // Y-axis configuration
  config?: ChartConfig;           // Chart styling and behavior
  legend?: ChartLegend;           // Legend display options
  tooltip?: ChartTooltipConfig;   // Tooltip configuration
  title?: string;                 // Chart title
  subtitle?: string;              // Chart subtitle
  className?: string;             // Custom CSS classes
  onDataClick?: (data, series) => void;  // Click event handler
  onExport?: (format) => void;    // Export event handler
  loading?: boolean;              // Loading state
  error?: string;                 // Error message
}
```

### Chart Data Structure

```tsx
interface ChartSeries {
  id: string;                     // Unique identifier
  name: string;                   // Display name
  data: ChartDataPoint[];         // Data points
  color: string;                  // Series color
  type?: 'line' | 'bar' | 'area' | 'scatter';
  visible?: boolean;              // Visibility toggle
}

interface ChartDataPoint {
  x: number | string | Date;      // X-axis value
  y: number;                      // Y-axis value
  label?: string;                 // Tooltip label
  color?: string;                 // Point-specific color
  metadata?: Record<string, any>; // Additional data
}
```

### Chart Configuration

```tsx
interface ChartConfig {
  width?: number;                 // Chart width (auto if responsive)
  height?: number;                // Chart height (default: 400)
  margin?: {                      // Chart margins
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  backgroundColor?: string;       // Background color
  gridColor?: string;            // Grid line color
  textColor?: string;            // Text color
  axisColor?: string;            // Axis line color
  interactive?: boolean;          // Enable interactions
  exportable?: boolean;          // Show export button
  responsive?: boolean;          // Auto-resize
  animations?: boolean;          // Enable animations
}
```

## 🎨 Chart Types

### 1. LineChart
Perfect for time-series data, trends, and continuous values.

```tsx
<LineChart
  series={trendData}
  smooth={true}                   // Smooth curve interpolation
  showPoints={true}              // Show data points
  strokeWidth={2}                // Line thickness
  fillArea={false}               // Fill area under line
/>
```

**Use Cases:**
- Property price trends over time
- Market performance tracking
- Assessment value changes
- Forecast visualization

### 2. BarChart
Ideal for categorical comparisons and discrete data.

```tsx
<BarChart
  series={comparisonData}
  barWidth={0.8}                 // Bar width ratio
  groupGap={0.2}                 // Gap between groups
  horizontal={false}             // Vertical bars
/>
```

**Use Cases:**
- Regional price comparisons
- Property type distributions
- Assessment accuracy by district
- Revenue by category

### 3. PieChart
Best for showing proportions and parts of a whole.

```tsx
<PieChart
  series={proportionData}
  innerRadius={0.3}              // Donut chart (0-1)
  showLabels={true}              // Display labels
  labelFormat={(value, percent) => `${formatCurrency(value)} (${percent}%)`}
/>
```

**Use Cases:**
- Property type distribution
- Assessment value breakdown
- Budget allocation
- Market share analysis

### 4. ScatterPlot
Perfect for correlation analysis and bubble charts.

```tsx
<ScatterPlot
  series={correlationData}
  pointSize={6}                  // Base point size
  showTrendLine={true}           // Linear regression line
  bubbleMode={true}              // Variable point sizes
/>
```

**Use Cases:**
- Price vs. square footage correlation
- Assessment accuracy analysis
- Comparable property plotting
- Market confidence indicators

### 5. PropertyTrendChart
Specialized component for property market analysis.

```tsx
<PropertyTrendChart
  data={marketTrendData}
  timeRange="1Y"                 // '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y'
  showForecast={true}            // Include forecast data
  title="Property Market Trends"
/>
```

**Features:**
- Historical vs. forecast data
- Multiple metrics (price, volume, price/sqft)
- Time range selection
- Interactive controls

### 6. ComparablesChart
Designed for property comparison analysis.

```tsx
<ComparablesChart
  subjectProperty={targetProperty}
  comparables={similarProperties}
  title="Comparable Properties Analysis"
/>
```

**Features:**
- Subject property highlighting
- Multiple metric comparisons
- Scatter and bar chart modes
- Statistical summaries

### 7. AssessmentChart
Comprehensive assessment visualization tool.

```tsx
<AssessmentChart
  data={assessmentData}
  chartType="comparison"         // 'comparison' | 'trend' | 'breakdown' | 'confidence'
  showControls={true}            // Show chart type controls
  title="Property Assessment Analysis"
/>
```

**Features:**
- Multiple chart types
- Single vs. multiple property views
- Assessment quality metrics
- Confidence scoring

## 🔧 Integration Examples

### Example 1: Charts in Modals (Day 17 Integration)

```tsx
import { Modal, ModalTrigger, ModalContent } from '@/components/modal';
import { LineChart } from '@/components/charts';
import { Button } from '@/components/button';

function PropertyTrendModal({ propertyData }) {
  return (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="outline">View Trends</Button>
      </ModalTrigger>
      <ModalContent className="max-w-4xl">
        <ModalHeader>
          <ModalTitle>Property Value Trends</ModalTitle>
          <ModalDescription>
            Historical and forecasted value trends for {propertyData.address}
          </ModalDescription>
        </ModalHeader>
        
        <div className="p-6">
          <LineChart
            series={[{
              id: 'historical',
              name: 'Historical Values',
              data: propertyData.historicalValues,
              color: '#3B82F6'
            }, {
              id: 'forecast',
              name: 'Forecasted Values',
              data: propertyData.forecastValues,
              color: '#EF4444'
            }]}
            config={{ height: 400, exportable: true }}
            smooth={true}
            fillArea={true}
          />
        </div>
      </ModalContent>
    </Modal>
  );
}
```

### Example 2: Charts with Tabs (Day 18 Integration)

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/tabs';
import { LineChart, BarChart, ScatterPlot } from '@/components/charts';

function AssessmentAnalysisTabs({ assessmentData }) {
  return (
    <Tabs defaultValue="trends" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="trends">Trends</TabsTrigger>
        <TabsTrigger value="comparison">Comparison</TabsTrigger>
        <TabsTrigger value="correlation">Correlation</TabsTrigger>
      </TabsList>
      
      <TabsContent value="trends" className="space-y-4">
        <LineChart
          series={assessmentData.trendSeries}
          title="Assessment Value Trends"
          config={{ height: 450 }}
        />
      </TabsContent>
      
      <TabsContent value="comparison" className="space-y-4">
        <BarChart
          series={assessmentData.comparisonSeries}
          title="Regional Comparison"
          config={{ height: 450 }}
        />
      </TabsContent>
      
      <TabsContent value="correlation" className="space-y-4">
        <ScatterPlot
          series={assessmentData.correlationSeries}
          title="Size vs. Value Correlation"
          config={{ height: 450 }}
          showTrendLine={true}
        />
      </TabsContent>
    </Tabs>
  );
}
```

### Example 3: Form-Driven Charts (Day 6 Integration)

```tsx
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/select';
import { PropertyTrendChart } from '@/components/charts';

function MarketAnalysisForm() {
  const form = useForm({
    defaultValues: {
      timeRange: '1Y',
      metric: 'averagePrice',
      showForecast: true,
    }
  });
  
  const watchedValues = form.watch();
  
  return (
    <div className="space-y-6">
      <Form {...form}>
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="timeRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Range</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1M">1 Month</SelectItem>
                      <SelectItem value="3M">3 Months</SelectItem>
                      <SelectItem value="6M">6 Months</SelectItem>
                      <SelectItem value="1Y">1 Year</SelectItem>
                      <SelectItem value="2Y">2 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="metric"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Metric</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="averagePrice">Average Price</SelectItem>
                      <SelectItem value="medianPrice">Median Price</SelectItem>
                      <SelectItem value="salesVolume">Sales Volume</SelectItem>
                      <SelectItem value="pricePerSqFt">Price per Sq Ft</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </Form>
      
      <PropertyTrendChart
        data={marketData}
        timeRange={watchedValues.timeRange}
        selectedMetric={watchedValues.metric}
        showForecast={watchedValues.showForecast}
        title="Dynamic Market Analysis"
      />
    </div>
  );
}
```

### Example 4: Charts with Table Data (Day 19 Integration)

```tsx
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { BarChart } from '@/components/charts';
import { Button } from '@/components/button';

function PropertyDataVisualization({ properties }) {
  const [selectedRows, setSelectedRows] = useState([]);
  const [showChart, setShowChart] = useState(false);
  
  const chartData = selectedRows.map(row => ({
    id: 'selected-properties',
    name: 'Selected Properties',
    data: selectedRows.map(property => ({
      x: property.address,
      y: property.assessedValue,
      metadata: { property }
    })),
    color: '#3B82F6'
  }));
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Property Assessment Data</h3>
        <Button
          onClick={() => setShowChart(!showChart)}
          disabled={selectedRows.length === 0}
        >
          {showChart ? 'Hide Chart' : 'Show Chart'}
        </Button>
      </div>
      
      <DataTable
        data={properties}
        columns={propertyColumns}
        onSelectionChange={setSelectedRows}
        enableSelection={true}
      />
      
      {showChart && selectedRows.length > 0 && (
        <BarChart
          series={chartData}
          title={`Assessment Values (${selectedRows.length} properties selected)`}
          config={{ height: 400, exportable: true }}
        />
      )}
    </div>
  );
}
```

### Example 5: Loading States and Notifications (Days 15 & 16 Integration)

```tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart } from '@/components/charts';
import { showNotification } from '@/components/notifications';
import { LoadingState } from '@/components/loading-states';

function AsyncChartComponent({ propertyId }) {
  const [isExporting, setIsExporting] = useState(false);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['property-trends', propertyId],
    queryFn: () => fetchPropertyTrends(propertyId),
  });
  
  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      await exportChart(data, format);
      showNotification('Chart exported successfully', 'success');
    } catch (error) {
      showNotification('Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };
  
  if (isLoading) {
    return <LoadingState variant="chart" message="Loading trend data..." />;
  }
  
  if (error) {
    showNotification('Failed to load chart data', 'error');
    return <div>Error loading chart</div>;
  }
  
  return (
    <LineChart
      series={data.series}
      title="Property Value Trends"
      loading={isExporting}
      onExport={handleExport}
      config={{ 
        height: 400, 
        exportable: true,
        interactive: true 
      }}
    />
  );
}
```

## 🎯 Interactive Features

### Hover Effects
All charts support hover interactions:
- Point highlighting on line and scatter charts
- Bar highlighting on bar charts
- Slice highlighting on pie charts
- Custom tooltip display

### Click Handlers
```tsx
<LineChart
  onDataClick={(dataPoint, series) => {
    console.log('Clicked:', dataPoint, series);
    // Navigate to detail view
    // Show property details
    // Update other components
  }}
/>
```

### Zoom and Pan
```tsx
const chartContext = useChartContext();

// Programmatic zoom
chartContext.setZoomLevel(1.5);

// Reset view
chartContext.setZoomLevel(1);
chartContext.setPanOffset({ x: 0, y: 0 });
```

### Export Functionality
```tsx
<LineChart
  config={{ exportable: true }}
  onExport={(format) => {
    // Track export analytics
    analytics.track('chart_export', { format });
  }}
/>
```

## ♿ Accessibility Features

### Keyboard Navigation
- Tab through chart elements
- Arrow keys for point navigation
- Enter/Space for activation
- Escape to close overlays

### Screen Reader Support
```tsx
<LineChart
  title="Property Value Trends"
  config={{
    ariaLabel: "Chart showing property values from 2020 to 2024",
    ariaDescription: "Line chart with increasing trend, current value $450,000"
  }}
/>
```

### Color Accessibility
- High contrast color palette
- Colorblind-friendly combinations
- Pattern alternatives for critical information

## 🎨 Theming and Customization

### Color Palettes
```tsx
const customColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', 
  '#96CEB4', '#FFEAA7', '#DDA0DD'
];

<BarChart
  series={data.map((series, index) => ({
    ...series,
    color: customColors[index % customColors.length]
  }))}
/>
```

### Custom Styling
```tsx
<LineChart
  config={{
    backgroundColor: '#F8F9FA',
    gridColor: '#E9ECEF',
    textColor: '#495057',
    axisColor: '#6C757D'
  }}
  className="custom-chart shadow-lg rounded-lg"
/>
```

## ⚡ Performance Optimization

### Data Virtualization
For large datasets (>1000 points):
```tsx
// Automatic data sampling for performance
const optimizedData = useMemo(() => {
  if (rawData.length > 1000) {
    return sampleData(rawData, 500); // Reduce to 500 points
  }
  return rawData;
}, [rawData]);
```

### Lazy Loading
```tsx
const LazyChart = lazy(() => import('@/components/charts').then(module => ({
  default: module.LineChart
})));

<Suspense fallback={<LoadingState variant="chart" />}>
  <LazyChart series={data} />
</Suspense>
```

### Canvas Optimization
- Automatic canvas size management
- Efficient redraw cycles
- Memory cleanup on unmount

## 🐛 Error Handling

### Graceful Degradation
```tsx
<LineChart
  series={data}
  error={errorMessage}
  fallback={<SimpleTableView data={data} />}
/>
```

### Data Validation
```tsx
const validateChartData = (series) => {
  return series.every(s => 
    s.data.every(point => 
      typeof point.y === 'number' && !isNaN(point.y)
    )
  );
};
```

## 📊 Best Practices

### Data Preparation
1. **Clean your data**: Remove null/undefined values
2. **Consistent formats**: Use consistent date/number formats
3. **Reasonable limits**: Limit data points for performance
4. **Meaningful labels**: Provide descriptive labels and titles

### Chart Selection
1. **Line charts**: Time-series, trends, continuous data
2. **Bar charts**: Categories, comparisons, discrete values
3. **Pie charts**: Proportions, parts of whole (max 7 slices)
4. **Scatter plots**: Correlations, relationships, distributions

### Performance
1. **Memoize data**: Use useMemo for expensive calculations
2. **Limit updates**: Debounce real-time data updates
3. **Optimize re-renders**: Use React.memo for chart components
4. **Canvas cleanup**: Ensure proper cleanup on unmount

### Accessibility
1. **Alt text**: Always provide meaningful titles and descriptions
2. **Color independence**: Don't rely solely on color for information
3. **Keyboard support**: Ensure all interactions are keyboard accessible
4. **Screen readers**: Provide text alternatives for visual data

## 🔧 Troubleshooting

### Common Issues

#### Chart not rendering
```tsx
// Check data structure
console.log('Chart data:', series);

// Verify required props
if (!series || series.length === 0) {
  return <div>No data available</div>;
}
```

#### Performance issues
```tsx
// Enable debugging
<LineChart
  series={data}
  config={{ 
    debug: true,  // Shows performance metrics
    animations: false  // Disable for better performance
  }}
/>
```

#### Export not working
```tsx
// Check browser support
if (!HTMLCanvasElement.prototype.toDataURL) {
  showNotification('Export not supported in this browser', 'warning');
}
```

### Debug Mode
```tsx
<LineChart
  config={{ 
    debug: true,  // Enables console logging
    showBounds: true,  // Shows chart boundaries
    showGrid: true  // Highlights grid system
  }}
/>
```

## 📈 Advanced Usage

### Custom Chart Types
```tsx
// Extend BaseChart for custom visualizations
export const HeatmapChart = ({ data, ...props }) => {
  const customRenderer = useCallback((ctx, bounds) => {
    // Custom rendering logic
  }, [data]);
  
  return (
    <BaseChart {...props}>
      <CustomRenderer onRender={customRenderer} />
    </BaseChart>
  );
};
```

### Real-time Updates
```tsx
const [data, setData] = useState([]);

useEffect(() => {
  const interval = setInterval(() => {
    setData(prevData => [
      ...prevData.slice(-100), // Keep last 100 points
      { x: new Date(), y: Math.random() * 1000 }
    ]);
  }, 1000);
  
  return () => clearInterval(interval);
}, []);
```

### Chart Composition
```tsx
const DashboardCharts = () => (
  <div className="grid grid-cols-2 gap-6">
    <PropertyTrendChart data={trendData} />
    <ComparablesChart subjectProperty={property} comparables={comps} />
    <AssessmentChart data={assessments} />
    <PieChart series={distributionData} />
  </div>
);
```

---

## 📋 Component Checklist

- ✅ **BaseChart**: Foundation with common functionality
- ✅ **LineChart**: Time-series and trend visualization  
- ✅ **BarChart**: Categorical data comparison
- ✅ **PieChart**: Proportional data display
- ✅ **ScatterPlot**: Correlation and bubble charts
- ✅ **PropertyTrendChart**: Property market analysis
- ✅ **ComparablesChart**: Property comparison tool
- ✅ **AssessmentChart**: Comprehensive assessment visualization
- ✅ **Interactive Features**: Hover, click, zoom, pan
- ✅ **Export Support**: PNG, SVG, PDF capabilities
- ✅ **Accessibility**: WCAG 2.1 AA compliance
- ✅ **Integration**: Days 6,15,16,17,18,19 compatibility
- ✅ **Performance**: Optimized Canvas rendering
- ✅ **Documentation**: Comprehensive API reference

**Total Implementation**: ~2,100 lines (1,400 code + 700 documentation)
**Integration Points**: 6 previous days
**Chart Types**: 7 comprehensive components
**Features**: Interactive, exportable, accessible, responsive

The TerraFusion Charts & Data Visualization System is now complete and ready for property assessment, market analysis, and data visualization needs! 🎉