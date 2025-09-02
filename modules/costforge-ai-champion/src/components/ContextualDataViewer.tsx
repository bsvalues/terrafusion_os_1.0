/**
 * Contextual Data Viewer Component - RESTORED from BCBSCOSTApp
 * 
 * Advanced data exploration component with multiple interaction modes,
 * trend analysis, threshold monitoring, and contextual information display.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info, TrendingUp, TrendingDown, BarChart3, PieChart  } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

interface DataPoint {
  label: string;
  value: string | number;
  format?: 'currency' | 'percentage' | 'number' | 'text' | 'date';
  context?: string;
  explanation?: string;
  trendData?: Array<{
    date: string;
    value: number;
  }>;
  breakdownData?: Array<{
    label: string;
    value: number;
    percentage: number;
  }>;
  contextType?: 'tooltip' | 'hovercard' | 'popover';
  thresholds?: {
    low?: number;
    medium?: number;
    high?: number;
  };
}

interface ContextualDataViewerProps {
  /**
   * Title of the data viewer component
   */
  title?: string;
  
  /**
   * Optional description text
   */
  description?: string;
  
  /**
   * Optional CSS class for the container
   */
  className?: string;
  
  /**
   * Sample data mode to demonstrate different interaction patterns
   */
  mode?: 'cost' | 'usage' | 'comparison' | 'custom';

  /**
   * Custom data for the data viewer (when mode is 'custom')
   */
  customData?: DataPoint[];

  /**
   * Callback triggered when a data point is interacted with
   */
  onDataPointInteraction?: (label: string, value: string | number, type: 'hover' | 'click') => void;
}

/**
 * ContextualDataViewer provides sophisticated data exploration capabilities
 * with interactive tooltips, trend analysis, and breakdown visualizations.
 */
export function ContextualDataViewer({
  title = "Contextual Data Viewer",
  description = "Hover or click on data points for more information",
  className = "",
  mode = 'cost',
  customData,
  onDataPointInteraction
}: ContextualDataViewerProps) {
  const [activeView, setActiveView] = useState<'table' | 'trends' | 'breakdowns'>('table');
  const [selectedDataPoint, setSelectedDataPoint] = useState<DataPoint | null>(null);

  // Sample cost data with trends and breakdowns
  const costData: DataPoint[] = [
    {
      label: "Base Cost",
      value: 245000,
      format: 'currency',
      context: "Base construction cost without adjustments",
      explanation: "This is the starting point for cost calculations based on square footage and building type.",
      contextType: 'tooltip'
    },
    {
      label: "Regional Multiplier",
      value: 1.25,
      format: 'number',
      context: "Regional cost adjustment factor",
      explanation: "This multiplier accounts for regional variations in labor and material costs.",
      trendData: [
        { date: "2020", value: 1.18 },
        { date: "2021", value: 1.20 },
        { date: "2022", value: 1.22 },
        { date: "2023", value: 1.24 },
        { date: "2024", value: 1.25 }
      ],
      contextType: 'popover'
    },
    {
      label: "Quality Adjustment",
      value: 32000,
      format: 'currency',
      context: "Adjustment based on construction quality",
      breakdownData: [
        { label: "Materials", value: 18000, percentage: 56 },
        { label: "Fixtures", value: 8000, percentage: 25 },
        { label: "Finishes", value: 6000, percentage: 19 }
      ],
      contextType: 'popover'
    },
    {
      label: "Age Depreciation",
      value: 15,
      format: 'percentage',
      context: "Value reduction due to age",
      explanation: "The depreciation is calculated based on the building's age and condition.",
      trendData: [
        { date: "5 yrs", value: 5 },
        { date: "10 yrs", value: 10 },
        { date: "15 yrs", value: 15 },
        { date: "20 yrs", value: 22 },
        { date: "25 yrs", value: 30 }
      ],
      contextType: 'popover'
    },
    {
      label: "Total Cost",
      value: 306250,
      format: 'currency',
      context: "Final adjusted cost",
      explanation: "This is the final cost after all adjustments have been applied to the base cost.",
      breakdownData: [
        { label: "Base", value: 245000, percentage: 80 },
        { label: "Regional", value: 61250, percentage: 20 },
        { label: "Quality", value: 32000, percentage: 10 },
        { label: "Depreciation", value: -32000, percentage: -10 }
      ],
      contextType: 'popover'
    }
  ];

  // Sample usage data with contextual information
  const usageData: DataPoint[] = [
    {
      label: "API Calls",
      value: 1250423,
      format: 'number',
      context: "Total API calls in the current billing period",
      trendData: [
        { date: "Mon", value: 180000 },
        { date: "Tue", value: 195000 },
        { date: "Wed", value: 210000 },
        { date: "Thu", value: 230000 },
        { date: "Fri", value: 245000 },
        { date: "Sat", value: 90000 },
        { date: "Sun", value: 100423 }
      ],
      thresholds: { low: 1000000, medium: 2000000, high: 3000000 },
      contextType: 'popover'
    },
    {
      label: "Storage Used",
      value: 85.7,
      format: 'percentage',
      context: "Current storage capacity usage",
      explanation: "Storage usage is approaching the limit. Consider upgrading your plan or optimizing storage.",
      thresholds: { low: 60, medium: 80, high: 90 },
      contextType: 'tooltip'
    },
    {
      label: "Response Time",
      value: 425,
      format: 'number',
      context: "Average API response time in milliseconds",
      explanation: "Response times over 500ms may indicate performance issues.",
      trendData: [
        { date: "8AM", value: 320 },
        { date: "10AM", value: 350 },
        { date: "12PM", value: 480 },
        { date: "2PM", value: 510 },
        { date: "4PM", value: 425 },
        { date: "6PM", value: 380 }
      ],
      thresholds: { low: 300, medium: 450, high: 600 },
      contextType: 'popover'
    }
  ];

  // Sample comparison data
  const comparisonData: DataPoint[] = [
    {
      label: "Performance Score",
      value: 92,
      format: 'number',
      context: "Overall system performance rating",
      thresholds: { low: 70, medium: 85, high: 95 },
      contextType: 'tooltip'
    },
    {
      label: "Cost Efficiency",
      value: 78,
      format: 'percentage',
      context: "Cost optimization effectiveness",
      thresholds: { low: 60, medium: 75, high: 90 },
      contextType: 'tooltip'
    }
  ];

  // Get data based on mode
  const getData = (): DataPoint[] => {
    switch (mode) {
      case 'cost': return costData;
      case 'usage': return usageData;
      case 'comparison': return comparisonData;
      case 'custom': return customData || [];
      default: return costData;
    }
  };

  const data = getData();

  // Format value based on type
  const formatValue = (value: string | number, format?: string): string => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  // Get threshold color
  const getThresholdColor = (value: number, thresholds?: DataPoint['thresholds']): string => {
    if (!thresholds) return 'default';
    
    if (thresholds.high && value >= thresholds.high) return 'destructive';
    if (thresholds.medium && value >= thresholds.medium) return 'secondary';
    return 'default';
  };

  // Render data point with context
  const renderDataPoint = (dataPoint: DataPoint) => {
    const formattedValue = formatValue(dataPoint.value, dataPoint.format);
    const hasThresholds = dataPoint.thresholds && typeof dataPoint.value === 'number';
    const thresholdColor = hasThresholds ? getThresholdColor(dataPoint.value, dataPoint.thresholds) : 'default';

    const content = (
      <div className="flex items-center gap-2">
        <span className="font-medium">{formattedValue}</span>
        {hasThresholds && (
          <Badge variant={thresholdColor === 'default' ? 'outline' : thresholdColor as any}>
            {thresholdColor === 'destructive' ? 'High' : thresholdColor === 'secondary' ? 'Medium' : 'Low'}
          </Badge>
        )}
        {dataPoint.trendData && <TrendingUp className="h-4 w-4 text-muted-foreground" />}
        {dataPoint.breakdownData && <PieChart className="h-4 w-4 text-muted-foreground" />}
      </div>
    );

    if (dataPoint.contextType === 'tooltip' && dataPoint.context) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">{content}</div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <p className="font-medium">{dataPoint.context}</p>
                {dataPoint.explanation && <p className="text-sm text-muted-foreground mt-1">{dataPoint.explanation}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (dataPoint.contextType === 'popover') {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="h-auto p-0">
              {content}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div>
<>
                <h4 className="font-medium">{dataPoint.label}</h4>
                <p
</> className="text-sm text-muted-foreground">{dataPoint.context}</p>
                {dataPoint.explanation && (
                  <p className="text-xs text-muted-foreground mt-1">{dataPoint.explanation}</p>
                )}
              </div>
              
              {dataPoint.trendData && (
                <div>
<>
                  <h5 className="text-sm font-medium mb-2">Trend Analysis</h5>
                  <ResponsiveContainer
</> width="100%" height={120}>
                    <LineChart data={dataPoint.trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {dataPoint.breakdownData && (
                <div>
<>
                  <h5 className="text-sm font-medium mb-2">Breakdown</h5>
                  <div
</> className="space-y-1">
                    {dataPoint.breakdownData.map((item /* , index */) => (
                      <div key={index} className="flex justify-between items-center text-sm">
<>
                        <span>{item.label}</span>
                        <div
</> className="flex items-center gap-2">
<>
                          <span className="font-mono">{formatValue(item.value, dataPoint.format)}</span>
                          <span
</> className="text-muted-foreground">({item.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return content;
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 {title}
          <Badge variant="secondary">RESTORED</Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
<>
            <TabsTrigger value="table">Data Table</TabsTrigger>
            <TabsTrigger
</> value="trends">Trends</TabsTrigger>
            <TabsTrigger value="breakdowns">Breakdowns</TabsTrigger>
          </TabsList>
          
          <TabsContent value="table">
            <Table>
              <TableHeader>
                <TableRow>
<>
                  <TableHead>Metric</TableHead>
                  <TableHead
</>>Value</TableHead>
                  <TableHead>Context</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((dataPoint /* , index */) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {dataPoint.label}
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
<>
                    <TableCell>{renderDataPoint(dataPoint)}</TableCell>
                    <TableCell
</> className="text-sm text-muted-foreground max-w-xs">
                      {dataPoint.context}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="trends">
            <div className="space-y-4">
              {data.filter(d => d.trendData).map((dataPoint /* , index */) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{dataPoint.label} Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={dataPoint.trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="breakdowns">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.filter(d => d.breakdownData).map((dataPoint /* , index */) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{dataPoint.label} Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dataPoint.breakdownData?.map((item, itemIndex) => (
                        <div key={itemIndex} className="space-y-1">
                          <div className="flex justify-between text-sm">
<>
                            <span>{item.label}</span>
                            <span
</> className="font-mono">{formatValue(item.value, dataPoint.format)}</span>
                          </div>
                          <Progress value={Math.abs(item.percentage)} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}