/**
 * CostRatioAnalysis.tsx (TFR-100)
 *
 * Shows cost-to-sale ratios by property type, neighborhood.
 * Charts + summary stats. No domain math in component.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, ReferenceLine,
  Cell,
} from 'recharts';

interface RatioByType {
  propertyType: string;
  medianRatio: number;
  cod: number;
  sampleCount: number;
  withinRange: boolean;
}

interface RatioByNeighborhood {
  neighborhood: string;
  medianRatio: number;
  cod: number;
  sampleCount: number;
}

interface RatioScatterPoint {
  salePrice: number;
  assessedValue: number;
  ratio: number;
  propertyType: string;
}

const RATIOS_BY_TYPE: RatioByType[] = [
  { propertyType: 'Single Family', medianRatio: 0.96, cod: 8.2, sampleCount: 1245, withinRange: true },
  { propertyType: 'Multi-Family', medianRatio: 0.93, cod: 11.4, sampleCount: 87, withinRange: true },
  { propertyType: 'Commercial', medianRatio: 0.91, cod: 14.8, sampleCount: 124, withinRange: true },
  { propertyType: 'Industrial', medianRatio: 0.88, cod: 16.2, sampleCount: 42, withinRange: false },
  { propertyType: 'Vacant Land', medianRatio: 0.94, cod: 19.5, sampleCount: 156, withinRange: false },
];

const RATIOS_BY_NEIGHBORHOOD: RatioByNeighborhood[] = [
  { neighborhood: 'Downtown', medianRatio: 0.97, cod: 7.8, sampleCount: 234 },
  { neighborhood: 'West Richland', medianRatio: 0.95, cod: 9.1, sampleCount: 312 },
  { neighborhood: 'South Ridge', medianRatio: 0.93, cod: 10.4, sampleCount: 198 },
  { neighborhood: 'Badger Mountain', medianRatio: 0.98, cod: 6.5, sampleCount: 156 },
  { neighborhood: 'Horn Rapids', medianRatio: 0.92, cod: 11.2, sampleCount: 89 },
  { neighborhood: 'Canyon Lakes', medianRatio: 0.96, cod: 8.9, sampleCount: 145 },
  { neighborhood: 'Country Estates', medianRatio: 0.89, cod: 14.3, sampleCount: 67 },
];

const SCATTER_DATA: RatioScatterPoint[] = Array.from({ length: 80 }, () => {
  const salePrice = 150000 + Math.random() * 450000;
  const ratio = 0.85 + Math.random() * 0.25;
  return {
    salePrice,
    assessedValue: salePrice * ratio,
    ratio,
    propertyType: ['Single Family', 'Commercial', 'Multi-Family'][Math.floor(Math.random() * 3)],
  };
});

export function CostRatioAnalysis() {
  const [loading] = useState(false);

  const overallMedian = 0.95;
  const overallCOD = 9.8;
  const totalSamples = RATIOS_BY_TYPE.reduce((s, r) => s + r.sampleCount, 0);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Cost Ratio Analysis</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground">Loading ratio data...</span>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{overallMedian.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Overall Median Ratio</div>
                <Badge variant="default" className="mt-1">Within IAAO Standard</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{overallCOD}</div>
                <div className="text-sm text-muted-foreground">Overall COD</div>
                <Badge variant="default" className="mt-1">Good Uniformity</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{totalSamples.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Sales Samples</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">1.02</div>
                <div className="text-sm text-muted-foreground">PRD</div>
                <Badge variant="default" className="mt-1">No Regressivity</Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Ratio by Property Type */}
            <Card>
              <CardHeader>
                <CardTitle>Median Ratio by Property Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={RATIOS_BY_TYPE} margin={{ left: 10, right: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="propertyType" angle={-15} textAnchor="end" height={50} />
                    <YAxis domain={[0.8, 1.1]} />
                    <Tooltip formatter={(value: number) => value.toFixed(3)} />
                    <ReferenceLine y={0.90} stroke="#ef4444" strokeDasharray="3 3" label="Min" />
                    <ReferenceLine y={1.10} stroke="#ef4444" strokeDasharray="3 3" label="Max" />
                    <ReferenceLine y={1.00} stroke="#6366f1" strokeDasharray="3 3" label="Target" />
                    <Bar dataKey="medianRatio" name="Median Ratio" radius={[4, 4, 0, 0]}>
                      {RATIOS_BY_TYPE.map((entry, index) => (
                        <Cell key={index} fill={entry.withinRange ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Ratio Scatter */}
            <Card>
              <CardHeader>
                <CardTitle>Assessed vs Sale Price</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{ left: 10, right: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      dataKey="salePrice"
                      name="Sale Price"
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      label={{ value: 'Sale Price', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="assessedValue"
                      name="Assessed"
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      label={{ value: 'Assessed Value', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Scatter data={SCATTER_DATA} fill="#3b82f6" fillOpacity={0.5} r={3} />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Ratio by Neighborhood */}
          <Card>
            <CardHeader>
              <CardTitle>Ratios by Neighborhood</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Neighborhood</th>
                    <th className="text-right py-2">Median Ratio</th>
                    <th className="text-right py-2">COD</th>
                    <th className="text-right py-2">Samples</th>
                    <th className="text-center py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {RATIOS_BY_NEIGHBORHOOD.map(n => (
                    <tr key={n.neighborhood} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-medium">{n.neighborhood}</td>
                      <td className="py-2 text-right font-mono">{n.medianRatio.toFixed(3)}</td>
                      <td className="py-2 text-right font-mono">{n.cod.toFixed(1)}</td>
                      <td className="py-2 text-right">{n.sampleCount}</td>
                      <td className="py-2 text-center">
                        <Badge variant={n.cod <= 15 ? 'default' : 'destructive'}>
                          {n.cod <= 10 ? 'Excellent' : n.cod <= 15 ? 'Acceptable' : 'Review'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* IAAO Standards Reference */}
          <Card>
            <CardHeader>
              <CardTitle>IAAO Standards Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 rounded bg-gray-50">
                  <div className="font-medium">Median Ratio</div>
                  <div className="text-muted-foreground">Target: 0.90 - 1.10</div>
                  <div className="text-muted-foreground">Current: {overallMedian.toFixed(2)}</div>
                </div>
                <div className="p-3 rounded bg-gray-50">
                  <div className="font-medium">COD (Uniformity)</div>
                  <div className="text-muted-foreground">SFR: 5-15 | Commercial: 5-20</div>
                  <div className="text-muted-foreground">Current: {overallCOD}</div>
                </div>
                <div className="p-3 rounded bg-gray-50">
                  <div className="font-medium">PRD (Equity)</div>
                  <div className="text-muted-foreground">Target: 0.98 - 1.03</div>
                  <div className="text-muted-foreground">Current: 1.02</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default CostRatioAnalysis;
