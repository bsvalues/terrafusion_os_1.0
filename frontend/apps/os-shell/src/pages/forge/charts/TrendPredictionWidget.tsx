import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

interface TrendPrediction {
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  forecast: Array<{ period: string; value: number }>;
  confidence: number;
  horizon: string;
}

interface TrendPredictionWidgetProps {
  prediction: TrendPrediction | null;
  loading?: boolean;
  error?: string | null;
}

export function TrendPredictionWidget({ prediction, loading, error }: TrendPredictionWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          Loading prediction...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-4 text-center text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (!prediction) return null;

  const directionIcon = prediction.direction === 'up' ? '\u2191' : prediction.direction === 'down' ? '\u2193' : '\u2194';
  const directionColor = prediction.direction === 'up' ? 'text-green-600' : prediction.direction === 'down' ? 'text-red-600' : 'text-yellow-600';
  const sparkColor = prediction.direction === 'up' ? '#16a34a' : prediction.direction === 'down' ? '#dc2626' : '#ca8a04';

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Trend Forecast ({prediction.horizon})</span>
          <Badge variant="outline" className="text-xs">BIV-133</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <span className={`text-2xl font-bold ${directionColor}`}>
              {directionIcon} {prediction.changePercent >= 0 ? '+' : ''}{prediction.changePercent.toFixed(1)}%
            </span>
            <div className="text-xs text-muted-foreground">
              {(prediction.confidence * 100).toFixed(0)}% confidence
            </div>
          </div>
          <div className="flex-1 h-[40px]">
            <ResponsiveContainer width="100%" height={40}>
              <LineChart data={prediction.forecast}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={sparkColor}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
