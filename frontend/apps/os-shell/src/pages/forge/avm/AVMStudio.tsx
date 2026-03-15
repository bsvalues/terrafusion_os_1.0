/**
 * AVMStudio.tsx (TFR-063)
 *
 * AVM studio page. Model training status, validation metrics,
 * prediction pipeline status. Orchestrates AVM workflow UI.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';

interface AVMModel {
  id: string;
  name: string;
  version: string;
  status: 'training' | 'validating' | 'ready' | 'deployed' | 'retired';
  accuracy: number;
  medianError: number;
  lastTrained: string;
  propertyTypes: string[];
}

interface PipelineStage {
  name: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  duration?: string;
  recordsProcessed?: number;
}

interface TrainingMetric {
  epoch: number;
  trainLoss: number;
  valLoss: number;
}

const MODELS: AVMModel[] = [
  { id: 'avm1', name: 'SFR Primary', version: '3.2.1', status: 'deployed', accuracy: 94.2, medianError: 3.8, lastTrained: '2026-03-10', propertyTypes: ['Single Family'] },
  { id: 'avm2', name: 'Commercial Primary', version: '2.1.0', status: 'ready', accuracy: 91.5, medianError: 5.2, lastTrained: '2026-03-08', propertyTypes: ['Commercial', 'Office'] },
  { id: 'avm3', name: 'Multi-Family', version: '1.4.2', status: 'training', accuracy: 0, medianError: 0, lastTrained: '2026-03-14', propertyTypes: ['Multi-Family', 'Apartments'] },
  { id: 'avm4', name: 'Rural/Agricultural', version: '2.0.0', status: 'validating', accuracy: 88.1, medianError: 6.4, lastTrained: '2026-03-12', propertyTypes: ['Agricultural', 'Rural Residential'] },
];

const PIPELINE: PipelineStage[] = [
  { name: 'Data Extraction', status: 'complete', duration: '2m 14s', recordsProcessed: 89247 },
  { name: 'Feature Engineering', status: 'complete', duration: '4m 32s', recordsProcessed: 89247 },
  { name: 'Model Training', status: 'running', duration: '12m 45s', recordsProcessed: 71398 },
  { name: 'Validation', status: 'idle' },
  { name: 'Deployment', status: 'idle' },
];

const TRAINING_METRICS: TrainingMetric[] = Array.from({ length: 20 }, (_, i) => ({
  epoch: i + 1,
  trainLoss: 0.45 * Math.exp(-0.15 * i) + 0.02 + Math.random() * 0.01,
  valLoss: 0.5 * Math.exp(-0.12 * i) + 0.04 + Math.random() * 0.015,
}));

const statusColor = (status: string) => {
  const map: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    deployed: 'default', ready: 'secondary', training: 'outline', validating: 'outline', retired: 'destructive',
  };
  return map[status] || 'outline';
};

const pipelineColor = (status: string) => {
  const map: Record<string, string> = {
    complete: 'bg-green-500', running: 'bg-blue-500 animate-pulse', error: 'bg-red-500', idle: 'bg-gray-300',
  };
  return map[status] || 'bg-gray-300';
};

export function AVMStudio() {
  const [loading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">AVM Studio</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground">Loading AVM data...</span>
        </div>
      ) : (
        <>
          {/* Pipeline Status */}
          <Card>
            <CardHeader>
              <CardTitle>Prediction Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {PIPELINE.map((stage, i) => (
                  <React.Fragment key={stage.name}>
                    <div className="flex-1 text-center">
                      <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${pipelineColor(stage.status)}`} />
                      <div className="text-xs font-medium">{stage.name}</div>
                      {stage.duration && <div className="text-xs text-muted-foreground">{stage.duration}</div>}
                      {stage.recordsProcessed && <div className="text-xs text-muted-foreground">{stage.recordsProcessed.toLocaleString()} records</div>}
                    </div>
                    {i < PIPELINE.length - 1 && (
                      <div className={`h-0.5 flex-1 ${stage.status === 'complete' ? 'bg-green-300' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Models */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODELS.map(model => (
              <Card
                key={model.id}
                className={`cursor-pointer transition-shadow ${selectedModel === model.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
                onClick={() => setSelectedModel(model.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{model.name}</h3>
                    <Badge variant={statusColor(model.status)}>{model.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">v{model.version}</div>
                  {model.accuracy > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 rounded bg-gray-50">
                        <div className="text-lg font-bold">{model.accuracy}%</div>
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                      </div>
                      <div className="text-center p-2 rounded bg-gray-50">
                        <div className="text-lg font-bold">{model.medianError}%</div>
                        <div className="text-xs text-muted-foreground">Median Error</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Training in progress...
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {model.propertyTypes.map(t => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Training Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Training Loss Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={TRAINING_METRICS}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Loss', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => value.toFixed(4)} />
                  <Line type="monotone" dataKey="trainLoss" stroke="#3b82f6" strokeWidth={2} name="Training Loss" dot={false} />
                  <Line type="monotone" dataKey="valLoss" stroke="#ef4444" strokeWidth={2} name="Validation Loss" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Validation Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Metrics Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'MAPE', value: '4.2%' },
                  { label: 'RMSE', value: '$18,420' },
                  { label: 'R-squared', value: '0.932' },
                  { label: 'COD', value: '9.8' },
                  { label: 'PRD', value: '1.02' },
                ].map(m => (
                  <div key={m.label} className="text-center p-3 rounded bg-gray-50">
                    <div className="text-xs text-muted-foreground">{m.label}</div>
                    <div className="text-xl font-bold">{m.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default AVMStudio;
