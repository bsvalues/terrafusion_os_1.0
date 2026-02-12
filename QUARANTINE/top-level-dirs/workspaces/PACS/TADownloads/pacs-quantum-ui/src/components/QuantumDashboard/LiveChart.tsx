/**
 * Live Chart Component
 * Real-time trend visualization
 * Elite Power User - Time Series Analysis
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { LiveMetrics } from '../../types/pacs';

interface LiveChartProps {
  metrics: LiveMetrics;
  height?: number;
}

type ChartType = 'line' | 'area';
type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

interface HistoricalDataPoint {
  timestamp: Date;
  [key: string]: number | Date;
}

export const LiveChart: React.FC<LiveChartProps> = ({ metrics, height = 300 }) => {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

  // Generate mock historical data
  useEffect(() => {
    const generateHistoricalData = () => {
      const now = new Date();
      const data: HistoricalDataPoint[] = [];
      const intervalMap: Record<TimeRange, number> = {
        '1h': 5 * 60 * 1000, // 5 minutes
        '6h': 30 * 60 * 1000, // 30 minutes
        '24h': 2 * 60 * 60 * 1000, // 2 hours
        '7d': 12 * 60 * 60 * 1000, // 12 hours
        '30d': 24 * 60 * 60 * 1000, // 24 hours
      };

      const points = timeRange === '1h' ? 12 : timeRange === '6h' ? 12 : timeRange === '24h' ? 12 : timeRange === '7d' ? 14 : 30;
      const interval = intervalMap[timeRange];

      for (let i = points - 1; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * interval);
        const point: HistoricalDataPoint = { timestamp };

        Object.entries(metrics.metrics).forEach(([key, value]) => {
          const trend = metrics.trends[key];
          if (trend) {
            // Generate realistic variation based on trend
            const variation = (Math.random() - 0.5) * trend.changePercent * 0.1;
            point[key] = value * (1 - (i / points) * (trend.changePercent / 100) + variation);
          } else {
            point[key] = value * (0.95 + Math.random() * 0.1);
          }
        });

        data.push(point);
      }

      setHistoricalData(data);
    };

    generateHistoricalData();
    const interval = setInterval(generateHistoricalData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [metrics, timeRange]);

  const handleChartTypeChange = (_event: React.MouseEvent<HTMLElement>, newType: ChartType | null) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value as TimeRange);
  };

  const formatTimestamp = (timestamp: Date): string => {
    const date = new Date(timestamp);
    switch (timeRange) {
      case '1h':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case '6h':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case '24h':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case '7d':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '30d':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleString();
    }
  };

  const chartData = useMemo(() => {
    return historicalData.map((point) => ({
      ...point,
      timestamp: formatTimestamp(point.timestamp),
      fullTimestamp: point.timestamp,
    }));
  }, [historicalData, timeRange]);

  const metricKeys = Object.keys(metrics.metrics);
  const colors = ['#0891b2', '#00d2ff', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={timeRange} onChange={handleTimeRangeChange}>
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="6h">Last 6 Hours</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
          <ToggleButtonGroup value={chartType} exclusive onChange={handleChartTypeChange} size="small">
            <ToggleButton value="area">Area</ToggleButton>
            <ToggleButton value="line">Line</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Chip label={`${historicalData.length} data points`} size="small" color="primary" variant="outlined" />
      </Box>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="timestamp"
            stroke="#666"
            style={{ fontSize: '0.75rem' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="#666" style={{ fontSize: '0.75rem' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
            formatter={(value: number) => [value.toLocaleString(undefined, { maximumFractionDigits: 2 }), '']}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
          {metricKeys.map((key, index) => {
            const name = key.replace(/([A-Z])/g, ' $1').trim();

            return chartType === 'area' ? (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.3}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
                name={name}
                animationDuration={300}
              />
            ) : (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
                name={name}
                animationDuration={300}
              />
            );
          })}
          {metricKeys.map((key, index) => {
            const trend = metrics.trends[key];
            if (trend && trend.direction === 'up') {
              return (
                <ReferenceLine
                  key={`ref-${key}`}
                  y={metrics.metrics[key] * 0.95}
                  stroke={colors[index % colors.length]}
                  strokeDasharray="5 5"
                  label={{ value: `${name} baseline`, position: 'insideTopRight' }}
                />
              );
            }
            return null;
          })}
        </ChartComponent>
      </ResponsiveContainer>

      {/* Trend Summary */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {Object.entries(metrics.trends).map(([key, trend]) => (
          <Chip
            key={key}
            label={`${key.replace(/([A-Z])/g, ' $1').trim()}: ${trend.changePercent > 0 ? '+' : ''}${trend.changePercent.toFixed(2)}%`}
            color={trend.direction === 'up' ? 'success' : trend.direction === 'down' ? 'error' : 'default'}
            size="small"
            variant="outlined"
          />
        ))}
      </Box>
    </Box>
  );
};

