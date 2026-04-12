import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

/**
 * Benton County Reval Area Cost Heatmap
 *
 * Displays building costs by Reval Area (PACS Cycle field, numbered 1–6).
 * Data source: /api/benchmarking/regional-costs?county=Benton
 *
 * Reval Areas are Benton County's cost-cycle zones, not compass directions.
 * No statewide or national comparison data is available or shown.
 */

interface RevalAreaCost {
  revalArea: string;
  avgRate: number;
  minRate: number;
  maxRate: number;
  count: number;
}

const REVAL_AREAS = [
  { id: 'Reval 1', label: 'Reval 1 — Kennewick (Urban Core)',       factor: 1.00 },
  { id: 'Reval 2', label: 'Reval 2 — West Richland / Badger Mtn',   factor: 1.05 },
  { id: 'Reval 3', label: 'Reval 3 — North Richland / Horn Rapids',  factor: 1.10 },
  { id: 'Reval 4', label: 'Reval 4 — East Benton / Benton City',     factor: 0.95 },
  { id: 'Reval 5', label: 'Reval 5 — Prosser / Wine Country',         factor: 0.90 },
  { id: 'Reval 6', label: 'Reval 6 — Rural / Agricultural Lands',    factor: 0.82 },
];

// Color scale: low (blue) → mid (green) → high (orange)
const COLOR_SCALE = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

function getBarColor(value: number, min: number, max: number): string {
  if (max === min) return COLOR_SCALE[0];
  const t = (value - min) / (max - min);
  const idx = Math.min(Math.floor(t * COLOR_SCALE.length), COLOR_SCALE.length - 1);
  return COLOR_SCALE[idx];
}

const RegionalHeatmap: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'avgRate' | 'minRate' | 'maxRate'>('avgRate');

  const { data: apiData, isLoading, error } = useQuery({
    queryKey: ['/api/benchmarking/regional-costs', 'Benton'],
    queryFn: async () => {
      const response = await fetch('/api/benchmarking/regional-costs?county=Benton');
      if (!response.ok) {
        throw new Error('Failed to fetch Reval Area cost data');
      }
      return response.json() as Promise<{ regionalCosts: RevalAreaCost[] }>;
    },
    retry: 1,
  });

  // Merge API data with canonical Reval Area labels; fall back to factor-based placeholder
  const chartData: Array<{ label: string; value: number; count: number }> = REVAL_AREAS.map(ra => {
    const apiRow = apiData?.regionalCosts?.find(r => r.revalArea === ra.id);
    return {
      label: ra.id,
      value: apiRow ? apiRow[selectedMetric] : 0,
      count: apiRow?.count ?? 0,
    };
  });

  const values = chartData.map(d => d.value).filter(v => v > 0);
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 0;

  const metricLabels = {
    avgRate: 'Average Rate ($/sqft)',
    minRate: 'Min Rate ($/sqft)',
    maxRate: 'Max Rate ($/sqft)',
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Benton County Reval Area Cost Heatmap</CardTitle>
        <CardDescription>
          Building cost rates by Reval Area (PACS Cycle field) — Benton County only
        </CardDescription>

        <div className="flex flex-col gap-4 sm:flex-row mt-2">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Metric</label>
            <Select
              value={selectedMetric}
              onValueChange={(v) => setSelectedMetric(v as typeof selectedMetric)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="avgRate">Average Rate</SelectItem>
                <SelectItem value="minRate">Minimum Rate</SelectItem>
                <SelectItem value="maxRate">Maximum Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load Reval Area cost data. Please try again.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                {metricLabels[selectedMetric]} — sourced from Benton County cost matrix (11 building types × 6 Reval Areas)
              </p>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 20, bottom: 70 }}
                barSize={40}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  angle={-35}
                  textAnchor="end"
                  height={80}
                  tickMargin={10}
                  label={{ value: 'Reval Area (Cycle)', position: 'insideBottom', offset: -60 }}
                />
                <YAxis
                  tickFormatter={(v) => `$${v.toFixed(0)}`}
                  width={70}
                  label={{ value: '$/sqft', angle: -90, position: 'insideLeft', offset: 10 }}
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}/sqft`, metricLabels[selectedMetric]]}
                  labelFormatter={(label) => {
                    const ra = REVAL_AREAS.find(r => r.id === label);
                    return ra ? ra.label : label;
                  }}
                />
                <Bar dataKey="value" name={metricLabels[selectedMetric]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.value > 0 ? getBarColor(entry.value, minVal, maxVal) : '#e5e7eb'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Reval Area labels */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REVAL_AREAS.map(ra => {
                const row = chartData.find(d => d.label === ra.id);
                return (
                  <div
                    key={ra.id}
                    className="p-3 rounded-md border text-sm"
                    style={{ borderLeftColor: row && row.value > 0 ? getBarColor(row.value, minVal, maxVal) : '#e5e7eb', borderLeftWidth: 4 }}
                  >
                    <div className="font-medium">{ra.id}</div>
                    <div className="text-xs text-muted-foreground">{ra.label.split('—')[1]?.trim()}</div>
                    {row && row.value > 0 ? (
                      <div className="font-semibold mt-1">${row.value.toFixed(2)}/sqft</div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-1">No data</div>
                    )}
                    {row && row.count > 0 && (
                      <div className="text-xs text-muted-foreground">{row.count} building types</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Color legend */}
            <div className="mt-4">
              <div className="text-sm font-medium mb-1">Cost Range</div>
              <div className="flex h-4 rounded overflow-hidden">
                {COLOR_SCALE.map((color, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                <span>${minVal.toFixed(2)}</span>
                <span>Lower → Higher $/sqft</span>
                <span>${maxVal.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RegionalHeatmap;
