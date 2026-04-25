/**
 * DepreciationCurveEditor.tsx (TFR-050)
 *
 * Visual depreciation curve editor with Recharts.
 * Control points for physical, functional, external depreciation.
 * Save to backend. No math in component.
 */

import React, { useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface DepreciationPoint {
  age: number;
  physical: number;
  functional: number;
  external: number;
  total: number;
}

interface DepreciationCurveEditorProps {
  countyId?: string;
  buildingType?: string;
}

const DEFAULT_CURVE: DepreciationPoint[] = [
  { age: 0, physical: 0, functional: 0, external: 0, total: 0 },
  { age: 5, physical: 5, functional: 2, external: 0, total: 7 },
  { age: 10, physical: 12, functional: 4, external: 1, total: 17 },
  { age: 15, physical: 20, functional: 7, external: 2, total: 29 },
  { age: 20, physical: 30, functional: 10, external: 3, total: 43 },
  { age: 25, physical: 38, functional: 13, external: 4, total: 55 },
  { age: 30, physical: 46, functional: 16, external: 5, total: 67 },
  { age: 40, physical: 58, functional: 20, external: 6, total: 84 },
  { age: 50, physical: 68, functional: 22, external: 7, total: 97 },
  { age: 60, physical: 75, functional: 23, external: 7, total: 100 },
];

export function DepreciationCurveEditor({
  countyId = 'benton',
  buildingType = 'Single Family Residential',
}: DepreciationCurveEditorProps) {
  const [curveData, setCurveData] = useState<DepreciationPoint[]>(DEFAULT_CURVE);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePointUpdate = useCallback((index: number, field: 'physical' | 'functional' | 'external', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
    setCurveData(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: numValue,
        total: field === 'physical'
          ? numValue + updated[index].functional + updated[index].external
          : field === 'functional'
            ? updated[index].physical + numValue + updated[index].external
            : updated[index].physical + updated[index].functional + numValue,
      };
      return updated;
    });
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/depreciation-curves/${countyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingType, points: curveData }),
      });
      if (!response.ok) throw new Error('Failed to save depreciation curve');
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [curveData, countyId, buildingType]);

  const selectedPoint = selectedPointIndex !== null ? curveData[selectedPointIndex] : null;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Depreciation Curve Editor</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{buildingType}</Badge>
          {dirty && <Badge variant="secondary">Unsaved Changes</Badge>}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Depreciation Curves by Age</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={curveData} onClick={(e) => {
              if (e && e.activeTooltipIndex !== undefined) {
                setSelectedPointIndex(e.activeTooltipIndex);
              }
            }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" label={{ value: 'Effective Age (years)', position: 'insideBottom', offset: -5 }} />
              <YAxis domain={[0, 100]} label={{ value: 'Depreciation %', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="physical" stroke="#ef4444" strokeWidth={2} name="Physical" dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="functional" stroke="#f59e0b" strokeWidth={2} name="Functional" dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="external" stroke="#6366f1" strokeWidth={2} name="External" dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="total" stroke="#1e293b" strokeWidth={2} strokeDasharray="5 5" name="Total" dot={{ r: 3 }} />
              <ReferenceLine y={100} stroke="#dc2626" strokeDasharray="3 3" label="Max" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Control Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Age</th>
                    <th className="text-right py-2 px-2">Physical %</th>
                    <th className="text-right py-2 px-2">Functional %</th>
                    <th className="text-right py-2 px-2">External %</th>
                    <th className="text-right py-2 px-2">Total %</th>
                  </tr>
                </thead>
                <tbody>
                  {curveData.map((point, idx) => (
                    <tr
                      key={point.age}
                      className={`border-b cursor-pointer ${selectedPointIndex === idx ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => setSelectedPointIndex(idx)}
                    >
                      <td className="py-2 px-2 font-medium">{point.age} yr</td>
                      <td className="py-2 px-2 text-right text-red-600">{point.physical}%</td>
                      <td className="py-2 px-2 text-right text-amber-600">{point.functional}%</td>
                      <td className="py-2 px-2 text-right text-indigo-600">{point.external}%</td>
                      <td className="py-2 px-2 text-right font-semibold">{point.total}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedPoint ? `Edit Point: Age ${selectedPoint.age}` : 'Select a Point'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPoint && selectedPointIndex !== null ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Physical Depreciation %</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={selectedPoint.physical}
                    onChange={(e) => handlePointUpdate(selectedPointIndex, 'physical', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Functional Depreciation %</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={selectedPoint.functional}
                    onChange={(e) => handlePointUpdate(selectedPointIndex, 'functional', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">External Depreciation %</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={selectedPoint.external}
                    onChange={(e) => handlePointUpdate(selectedPointIndex, 'external', e.target.value)}
                  />
                </div>
                <div className="pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Total: </span>
                  <span className="font-bold">{selectedPoint.total}%</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Click a row or chart point to edit
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled>
          Save Curve
        </Button>
      </div>
    </div>
  );
}

export default DepreciationCurveEditor;
