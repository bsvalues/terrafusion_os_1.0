/**
 * CostScheduleEditor.tsx (TFR-049)
 *
 * Editable table for cost schedule entries (building type, quality grade, base cost/sqft).
 * Save calls backend. Validated inputs. No domain math in component.
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CostScheduleEntry {
  id: string;
  buildingType: string;
  qualityGrade: string;
  baseCostPerSqft: number;
  effectiveDate: string;
  isDirty: boolean;
}

interface CostScheduleEditorProps {
  countyId?: string;
  taxYear?: number;
}

export function CostScheduleEditor({ countyId = 'benton', taxYear = 2026 }: CostScheduleEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<CostScheduleEntry[]>([
    { id: '1', buildingType: 'Single Family Residential', qualityGrade: 'Average', baseCostPerSqft: 145.00, effectiveDate: '2026-01-01', isDirty: false },
    { id: '2', buildingType: 'Single Family Residential', qualityGrade: 'Good', baseCostPerSqft: 185.00, effectiveDate: '2026-01-01', isDirty: false },
    { id: '3', buildingType: 'Single Family Residential', qualityGrade: 'Excellent', baseCostPerSqft: 245.00, effectiveDate: '2026-01-01', isDirty: false },
    { id: '4', buildingType: 'Multi-Family', qualityGrade: 'Average', baseCostPerSqft: 125.00, effectiveDate: '2026-01-01', isDirty: false },
    { id: '5', buildingType: 'Commercial', qualityGrade: 'Average', baseCostPerSqft: 165.00, effectiveDate: '2026-01-01', isDirty: false },
    { id: '6', buildingType: 'Industrial', qualityGrade: 'Average', baseCostPerSqft: 95.00, effectiveDate: '2026-01-01', isDirty: false },
  ]);

  const handleCostChange = useCallback((id: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, baseCostPerSqft: numValue, isDirty: true } : e
    ));
  }, []);

  const handleQualityChange = useCallback((id: string, value: string) => {
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, qualityGrade: value, isDirty: true } : e
    ));
  }, []);

  const handleSave = useCallback(async () => {
    const dirtyEntries = entries.filter(e => e.isDirty);
    if (dirtyEntries.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/cost-schedules/${countyId}/${taxYear}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: dirtyEntries }),
      });
      if (!response.ok) throw new Error('Failed to save cost schedule');
      setEntries(prev => prev.map(e => ({ ...e, isDirty: false })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [entries, countyId, taxYear]);

  const hasDirtyEntries = entries.some(e => e.isDirty);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cost Schedule Editor</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Tax Year {taxYear}</Badge>
          <Badge variant="outline">{countyId.charAt(0).toUpperCase() + countyId.slice(1)} County</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Schedule Entries</span>
            <Button
              onClick={handleSave}
              disabled={!hasDirtyEntries || saving}
              size="sm"
            >
              {saving ? 'Saving...' : `Save Changes (${entries.filter(e => e.isDirty).length})`}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-muted-foreground">Loading cost schedule...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Building Type</th>
                    <th className="text-left py-3 px-2 font-medium">Quality Grade</th>
                    <th className="text-right py-3 px-2 font-medium">Base Cost / sqft</th>
                    <th className="text-left py-3 px-2 font-medium">Effective Date</th>
                    <th className="text-center py-3 px-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className={`border-b ${entry.isDirty ? 'bg-yellow-50' : ''}`}>
                      <td className="py-2 px-2 font-medium">{entry.buildingType}</td>
                      <td className="py-2 px-2">
                        <Input
                          value={entry.qualityGrade}
                          onChange={(e) => handleQualityChange(entry.id, e.target.value)}
                          className="h-8 w-32"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          value={entry.baseCostPerSqft}
                          onChange={(e) => handleCostChange(entry.id, e.target.value)}
                          className="h-8 w-28 text-right"
                        />
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{entry.effectiveDate}</td>
                      <td className="py-2 px-2 text-center">
                        {entry.isDirty ? (
                          <Badge variant="secondary">Modified</Badge>
                        ) : (
                          <Badge variant="outline">Saved</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CostScheduleEditor;
