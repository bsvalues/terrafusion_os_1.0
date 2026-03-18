// TFT-120 — Model retrain status widget
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface RetrainStatus {
  modelId: string;
  modelName: string;
  lastTrainedDate: string;
  retrainProgress: number;
  isRetraining: boolean;
  accuracyTrend: { date: string; accuracy: number }[];
}

interface RetrainStatusWidgetProps {
  status: RetrainStatus | null;
  loading?: boolean;
}

export function RetrainStatusWidget({ status, loading }: RetrainStatusWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Retrain Status</CardTitle></CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-3/4 rounded bg-primary/10" />
            <div className="h-2 rounded bg-primary/10" />
            <div className="h-16 rounded bg-primary/10" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Retrain Status</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No model selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{status.modelName}</CardTitle>
          <Badge variant={status.isRetraining ? 'warning' : 'success'}>
            {status.isRetraining ? 'Training' : 'Ready'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Retrain Progress</span>
            <span>{status.retrainProgress}%</span>
          </div>
          <Progress value={status.retrainProgress} variant={status.isRetraining ? 'quantum' : 'success'} />
        </div>

        <p className="text-xs text-muted-foreground">
          Last trained: {status.lastTrainedDate}
        </p>

        {status.accuracyTrend.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Accuracy Trend</p>
            <ResponsiveContainer width="100%" height={48}>
              <LineChart data={status.accuracyTrend}>
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
