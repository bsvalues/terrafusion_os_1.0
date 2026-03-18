/**
 * ParcelComparison (TFR-107) — Side-by-side parcel attributes with diff highlighting.
 * Up to 4 parcels compared simultaneously.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ParcelData {
  parcelId: string;
  address: string;
  sqft: number;
  lotSize: number;
  yearBuilt: number;
  quality: string;
  condition: string;
  bedrooms: number;
  bathrooms: number;
  assessedValue: number;
  salePrice?: number;
  saleDate?: string;
  neighborhood: string;
  zoning: string;
}

const ATTRIBUTES: { key: keyof ParcelData; label: string; format?: (v: unknown) => string }[] = [
  { key: 'address', label: 'Address' },
  { key: 'sqft', label: 'Living Area (sqft)', format: (v) => Number(v).toLocaleString() },
  { key: 'lotSize', label: 'Lot Size (sqft)', format: (v) => Number(v).toLocaleString() },
  { key: 'yearBuilt', label: 'Year Built' },
  { key: 'quality', label: 'Quality Grade' },
  { key: 'condition', label: 'Condition' },
  { key: 'bedrooms', label: 'Bedrooms' },
  { key: 'bathrooms', label: 'Bathrooms' },
  { key: 'neighborhood', label: 'Neighborhood' },
  { key: 'zoning', label: 'Zoning' },
  { key: 'assessedValue', label: 'Assessed Value', format: (v) => `$${Number(v).toLocaleString()}` },
  { key: 'salePrice', label: 'Last Sale Price', format: (v) => v ? `$${Number(v).toLocaleString()}` : 'N/A' },
  { key: 'saleDate', label: 'Sale Date', format: (v) => v ? String(v) : 'N/A' },
];

export function ParcelComparison() {
  const [parcelIds, setParcelIds] = useState<string[]>(['', '']);
  const [parcels, setParcels] = useState<ParcelData[]>([]);
  const [loading, setLoading] = useState(false);

  const addSlot = () => {
    if (parcelIds.length < 4) setParcelIds([...parcelIds, '']);
  };

  const updateId = (index: number, value: string) => {
    setParcelIds(prev => prev.map((id, i) => i === index ? value : id));
  };

  const compare = async () => {
    const ids = parcelIds.filter(Boolean);
    if (ids.length < 2) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        ids.map(async id => {
          const res = await fetch(`/api/properties/${id}`);
          if (!res.ok) throw new Error(`Failed to fetch ${id}`);
          return res.json();
        })
      );
      setParcels(results);
    } catch {
      setParcels([]);
    } finally {
      setLoading(false);
    }
  };

  const isDiff = (attr: keyof ParcelData) => {
    if (parcels.length < 2) return false;
    const vals = parcels.map(p => String(p[attr] ?? ''));
    return new Set(vals).size > 1;
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parcel Comparison</h1>
        <Badge variant="outline">Up to 4 parcels</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Select Parcels</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            {parcelIds.map((id, i) => (
              <Input key={i} value={id} onChange={e => updateId(i, e.target.value)} placeholder={`Parcel ${i + 1}`} />
            ))}
          </div>
          <div className="flex gap-3">
            {parcelIds.length < 4 && <Button variant="outline" onClick={addSlot}>+ Add Parcel</Button>}
            <Button onClick={compare} disabled={loading || parcelIds.filter(Boolean).length < 2}>
              {loading ? 'Loading...' : 'Compare'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {parcels.length >= 2 && (
        <Card>
          <CardHeader><CardTitle>Comparison</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 w-40">Attribute</th>
                  {parcels.map(p => (
                    <th key={p.parcelId} className="text-left p-2">{p.parcelId}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ATTRIBUTES.map(attr => {
                  const hasDiff = isDiff(attr.key);
                  return (
                    <tr key={attr.key} className={`border-b ${hasDiff ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
                      <td className="p-2 font-medium">{attr.label}</td>
                      {parcels.map(p => (
                        <td key={p.parcelId} className="p-2">
                          {attr.format ? attr.format(p[attr.key]) : String(p[attr.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
