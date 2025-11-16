import React, { useMemo } from 'react';
import { Line, Bar, Pie } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TimeSeriesDataPoint, DiagnosticVisualizationData } from '@/lib/diagnostics/types';

// Custom colors for the charts
const CHART_COLORS = [
  '#2563eb', // blue-600
  '#0891b2', // cyan-600
  '#4f46e5', // indigo-600
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
];

// Interfaces for component props
interface DiagnosticChartProps {
  data: DiagnosticVisualizationData;
  height?: number;
  width?: number;
  className?: string;
}

/**
 * A component that renders different chart types based on diagnostic visualization data
 */
const DiagnosticChart: React.FC<DiagnosticChartProps> = ({
  data,
  height = 300,
  width = 500,
  className = '',
}) => {
  // Process and format data for the charts
  const formattedData = useMemo(() => {
    // If no data or empty series, return empty array
    if (!data || !data.series || data.series.length === 0) {
      return [];
    }

    // For time series data, we need to merge multiple series into a single dataset
    // with multiple values for each timestamp
    if (data.type === 'line' || data.type === 'bar') {
      // Get all unique timestamps
      const allTimestamps = new Set<string>();
      data.series.forEach(series => {
        series.data.forEach(point => {
          allTimestamps.add(point.timestamp);
        });
      });

      // Sort timestamps chronologically
      const sortedTimestamps = Array.from(allTimestamps).sort();

      // Create a map for easy lookup of values by timestamp
      const seriesDataMaps = data.series.map(series => {
        const dataMap = new Map<string, number>();
        series.data.forEach(point => {
          dataMap.set(point.timestamp, point.value);
        });
        return { name: series.name, dataMap };
      });

      // Create the merged dataset
      return sortedTimestamps.map(timestamp => {
        const entry: Record<string, any> = {
          timestamp: new Date(timestamp).toLocaleString(),
          // We'll use the full timestamp as name for the x-axis
          name: new Date(timestamp).toLocaleString(),
        };

        // Add a value for each series
        seriesDataMaps.forEach(series => {
          entry[series.name] = series.dataMap.get(timestamp) || null;
        });

        return entry;
      });
    }

    // For pie charts, we'll use the most recent data point from each series
    if (data.type === 'pie') {
      return data.series.map(series => {
        // Sort by timestamp and get the most recent
        const sortedData = [...series.data].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        const mostRecent = sortedData[0] || { value: 0 };
        
        return {
          name: series.name,
          value: mostRecent.value,
          label: mostRecent.label || series.name,
        };
      });
    }

    return [];
  }, [data]);

  // If we have no data, show a placeholder
  if (!data || !data.series || data.series.length === 0) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader><>

          <CardTitle>{data?.title || 'No Data'}</CardTitle>
          <CardDescription
</>>{data?.description || 'No visualization data available'}</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data to display
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div><>

            <CardTitle>{data.title}</CardTitle>
            <CardDescription
</>>{data.description}</CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {data.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {data.type === 'line' && (
          <div className="h-[300px] w-full">
            <ResponsiveLineChart 
              data={formattedData} 
              series={data.series.map(s => s.name)} 
              height={height}
              width={width}
            />
          </div>
        )}
        {data.type === 'bar' && (
          <div className="h-[300px] w-full">
            <ResponsiveBarChart 
              data={formattedData} 
              series={data.series.map(s => s.name)} 
              height={height}
              width={width}
            />
          </div>
        )}
        {data.type === 'pie' && (
          <div className="h-[300px] w-full">
            <ResponsivePieChart 
              data={formattedData}
              height={height}
              width={width}
            />
          </div>
        )}
        {data.type === 'heatmap' && (
          <div className="h-[300px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">Heatmap visualization coming soon</p>
          </div>
        )}
        {data.type === 'status' && (
          <div className="h-[300px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">Status visualization coming soon</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Subcomponents for different chart types
interface LineChartProps {
  data: any[];
  series: string[];
  height?: number;
  width?: number;
}

const ResponsiveLineChart: React.FC<LineChartProps> = ({ data, series, height = 300, width = 500 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 70 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis 
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip labelStyle={{ color: 'black' }} />
        <Legend />
        {series.map((seriesName /* , index */) => (
          <Line
            key={seriesName}
            type="monotone"
            dataKey={seriesName}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            activeDot={{ r: 8 }}
            dot={{ r: 4 }}
            strokeWidth={2}
            name={seriesName}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

interface BarChartProps {
  data: any[];
  series: string[];
  height?: number;
  width?: number;
}

const ResponsiveBarChart: React.FC<BarChartProps> = ({ data, series, height = 300, width = 500 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 70 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis 
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip labelStyle={{ color: 'black' }} />
        <Legend />
        {series.map((seriesName /* , index */) => (
          <Bar
            key={seriesName}
            dataKey={seriesName}
            fill={CHART_COLORS[index % CHART_COLORS.length]}
            name={seriesName}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

interface PieChartProps {
  data: any[];
  height?: number;
  width?: number;
}

const ResponsivePieChart: React.FC<PieChartProps> = ({ data, height = 300, width = 500 }) => {
  const coloredData = data.map((item /* , index */) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={coloredData}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        />
        <Tooltip labelStyle={{ color: 'black' }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Import from recharts
import {
  LineChart,
  BarChart,
  PieChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default DiagnosticChart;