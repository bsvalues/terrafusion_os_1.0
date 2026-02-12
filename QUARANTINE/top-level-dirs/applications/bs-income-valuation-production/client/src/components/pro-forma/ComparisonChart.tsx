import React from 'react';
import {
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Define the scenario object type
export interface Scenario {
  name: string;
  data: any; // Property data
  analysis: {
    capRate?: number;
    cashOnCash?: number;
    roi?: number;
    valuation?: number;
    [key: string]: any; // Allow for other metrics
  };
}

export interface ComparisonChartProps {
  scenarios: Scenario[];
  metricKey: string;
  chartType: 'bar' | 'line';
  title: string;
  height?: number;
}

/**
 * ComparisonChart Component
 * 
 * Renders a comparison chart (bar or line) for different property analysis scenarios
 * Specifically designed for Benton County property comparisons
 */
const ComparisonChart: React.FC<ComparisonChartProps> = ({
  scenarios,
  metricKey,
  chartType,
  title,
  height = 300
}) => {
  // Format the data for the chart
  const formatChartData = () => {
    return scenarios.map(scenario => ({
      name: scenario.name,
      location: scenario.data.propertyInfo?.location || 'Unknown',
      [metricKey]: scenario.analysis[metricKey],
      purchasePrice: scenario.data.financing?.purchasePrice
    }));
  };

  // Helper to format tooltip value based on metric type
  const formatTooltipValue = (value: any) => {
    if (metricKey === 'capRate' || metricKey === 'cashOnCash' || metricKey === 'roi') {
      return `${value.toFixed(2)}%`;
    } else if (metricKey === 'valuation') {
      return `$${value.toLocaleString()}`;
    }
    return value;
  };

  // Set colors based on Benton County regional themes
  const getBarColor = () => {
    switch (metricKey) {
      case 'capRate': return '#4C9AFF';
      case 'cashOnCash': return '#36B37E';
      case 'roi': return '#6554C0';
      case 'valuation': return '#FF5630';
      default: return '#2684FF';
    }
  };

  // If we don't have any scenarios, show a message
  if (scenarios.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No scenarios to compare</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = formatChartData();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {chartType === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => formatTooltipValue(value)}
                labelFormatter={(label) => `Scenario: ${label}`}
              />
              <Legend />
              <Bar 
                dataKey={metricKey} 
                fill={getBarColor()} 
                name={metricKey.charAt(0).toUpperCase() + metricKey.slice(1).replace(/([A-Z])/g, ' $1')}
              />
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => formatTooltipValue(value)}
                labelFormatter={(label) => `Scenario: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={metricKey} 
                stroke={getBarColor()} 
                name={metricKey.charAt(0).toUpperCase() + metricKey.slice(1).replace(/([A-Z])/g, ' $1')}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ComparisonChart;