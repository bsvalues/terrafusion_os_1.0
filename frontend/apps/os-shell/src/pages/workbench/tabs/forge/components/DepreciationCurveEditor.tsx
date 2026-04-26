/**
 * DepreciationCurveEditor.tsx (TFR-050)
 *
 * Visual depreciation curve editor with Recharts.
 * Control points for physical, functional, external depreciation.
 * Save to backend. No math in component.
 */

import React, { useState, useCallback, useEffect } from 'react';
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

function isDepreciationPoint(value: unknown): value is DepreciationPoint {
  if (!value || typeof value !== 'object') return false;
  const point = value as Record<string, unknown>;
  return ['age', 'physical', 'functional', 'external', 'total'].every((field) => (
    typeof point[field] === 'number' && Number.isFinite(point[field])
  ));
}

function readCurvePoints(payload: unknown): DepreciationPoint[] {
  if (Array.isArray(payload)) return payload.filter(isDepreciationPoint);
  if (!payload || typeof payload !== 'object') return [];

  const points = (payload as Record<string, unknown>).points;
  return Array.isArray(points) ? points.filter(isDepreciationPoint) : [];
}

export function DepreciationCurveEditor({
  countyId = 'benton',
  buildingType = 'Single Family Residential',
}: DepreciationCurveEditorProps) {
  const [curveData, setCurveData] = useState<DepreciationPoint[]>([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadCurve = async () => {
      setLoading(true);
      setError(null);
      setSelectedPointIndex(null);
      try {
        const query = new URLSearchParams({ buildingType });
        const response = await fetch(`/api/depreciation-curves/${encodeURIComponent(countyId)}?${query.toString()}`);
        if (!response.ok) throw new Error(`Failed to load depreciation curve: ${response.statusText}`);
        const points = readCurvePoints(await response.json());
        if (!active) return;
        setCurveData(points);
        setDirty(false);
      } catch (loadError) {
        if (!active) return;
        setCurveData([]);
        setError(loadError instanceof Error ? loadError.message : 'Depreciation curve unavailable.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadCurve();

    return () => {
      active = false;
    };
  }, [buildingType, countyId]);

  const handlePointUpdate = useCallback((index: number, field: 'physical' | 'functional' | 'external', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
    setCurveData(prev => {
      const updated = [...prev];
      const physical = field === 'physical' ? numValue : updated[index].physical;
      const functional = field === 'functional' ? numValue : updated[index].functional;
      const external = field === 'external' ? numValue : updated[index].external;
      updated[index] = {
        ...updated[index],
        physical,
        functional,
        external,
        total: Math.min(100, physical + functional + external),
      };
      return updated;
    });
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (curveData.length === 0) {
      setError('No depreciation curve points were returned by the API.');
      return;
    }

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
          {loading && <Badge variant="secondary">Loading</Badge>}
          {dirty && <Badge variant="secondary">Unsaved Changes</Badge>}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {!loading && !error && curveData.length === 0 && (
        <div className="p-3 rounded text-sm border" style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-muted))' }}>
          No depreciation curve points were returned for this county and building type.
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
        <Button onClick={handleSave} disabled={saving || !dirty || curveData.length === 0}>
          {saving ? 'Saving...' : 'Save Curve'}
        </Button>
      </div>
    </div>
  );
}

export default DepreciationCurveEditor;
