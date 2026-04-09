/**
 * Market Trend Card Component
 * 
 * Displays a single market trend with its value, trend direction, and confidence level
 * in an informative card format.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  Clock, 
  Target
} from 'lucide-react';

interface MarketTrendCardProps {
  metric: string;
  timeframe: string;
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  className?: string;
}

export function MarketTrendCard({
  metric,
  timeframe,
  value,
  trend,
  confidence,
  className = '',
}: MarketTrendCardProps) {
  // Format the trend for display
  const formatTrendValue = () => {
    const absValue = Math.abs(value);
    return `${value >= 0 ? '+' : '-'}${absValue.toFixed(1)}%`;
  };
  
  // Get badge color based on trend
  const getBadgeVariant = () => {
    if (trend === 'increasing') return 'success';
    if (trend === 'decreasing') return 'destructive';
    return 'secondary';
  };
  
  // Get trend icon
  const getTrendIcon = () => {
    if (trend === 'increasing') return <TrendingUp className="h-4 w-4" />;
    if (trend === 'decreasing') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };
  
  // Convert the metric name to a display-friendly format
  const formatMetricName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Format the timeframe for display
  const formatTimeframe = (timeframe: string) => {
    if (timeframe === '1year') return 'Past Year';
    if (timeframe === '6months') return 'Past 6 Months';
    if (timeframe === '3months') return 'Past 3 Months';
    if (timeframe === '1month') return 'Past Month';
    return timeframe;
  };
  
  // Convert confidence to percentage
  const confidencePercent = Math.round(confidence * 100);
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-medium">
              {formatMetricName(metric)}
            </CardTitle>
          </div>
          <Badge variant={getBadgeVariant() as any}>
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <span>{formatTrendValue()}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            <span>{formatTimeframe(timeframe)}</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="flex items-center">
                <Target className="mr-1 h-4 w-4" />
                <span>Confidence</span>
              </span>
              <span className="font-medium">{confidencePercent}%</span>
            </div>
            <Progress value={confidencePercent} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}