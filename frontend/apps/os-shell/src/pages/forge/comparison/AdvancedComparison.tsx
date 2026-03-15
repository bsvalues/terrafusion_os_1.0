import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PropertyAttributes {
  parcelId: string;
  apn: string;
  address: string;
  propertyType: string;
  yearBuilt: number;
  sqft: number;
  lotSize: number;
  bedrooms: number;
  bathrooms: number;
  assessedValue: number;
  marketValue: number;
  condition: string;
  quality: string;
  neighborhood: string;
}

interface AdvancedComparisonProps {
  parcelIdA: string;
  parcelIdB: string;
}

export function AdvancedComparison({ parcelIdA, parcelIdB }: AdvancedComparisonProps) {
  const [propA, setPropA] = useState<PropertyAttributes | null>(null);
  const [propB, setPropB] = useState<PropertyAttributes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoth = async () => {
      setLoading(true);
      setError(null);
      try {
        const [resA, resB] = await Promise.all([
          fetch(`/api/properties/${parcelIdA}`),
          fetch(`/api/properties/${parcelIdB}`),
        ]);
        if (!resA.ok || !resB.ok) throw new Error('Failed to fetch properties');
        setPropA(await resA.json());
        setPropB(await resB.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if (parcelIdA && parcelIdB) fetchBoth();
  }, [parcelIdA, parcelIdB]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading comparison...</div>;
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
  if (!propA || !propB) return null;

  const rows: Array<{ label: string; a: string; b: string; diff: boolean }> = [
    { label: 'APN', a: propA.apn, b: propB.apn, diff: propA.apn !== propB.apn },
    { label: 'Address', a: propA.address, b: propB.address, diff: propA.address !== propB.address },
    { label: 'Property Type', a: propA.propertyType, b: propB.propertyType, diff: propA.propertyType !== propB.propertyType },
    { label: 'Year Built', a: String(propA.yearBuilt), b: String(propB.yearBuilt), diff: propA.yearBuilt !== propB.yearBuilt },
    { label: 'Sqft', a: propA.sqft.toLocaleString(), b: propB.sqft.toLocaleString(), diff: propA.sqft !== propB.sqft },
    { label: 'Lot Size', a: propA.lotSize.toLocaleString(), b: propB.lotSize.toLocaleString(), diff: propA.lotSize !== propB.lotSize },
    { label: 'Bedrooms', a: String(propA.bedrooms), b: String(propB.bedrooms), diff: propA.bedrooms !== propB.bedrooms },
    { label: 'Bathrooms', a: String(propA.bathrooms), b: String(propB.bathrooms), diff: propA.bathrooms !== propB.bathrooms },
    { label: 'Condition', a: propA.condition, b: propB.condition, diff: propA.condition !== propB.condition },
    { label: 'Quality', a: propA.quality, b: propB.quality, diff: propA.quality !== propB.quality },
    { label: 'Neighborhood', a: propA.neighborhood, b: propB.neighborhood, diff: propA.neighborhood !== propB.neighborhood },
    { label: 'Assessed Value', a: `$${propA.assessedValue.toLocaleString()}`, b: `$${propB.assessedValue.toLocaleString()}`, diff: propA.assessedValue !== propB.assessedValue },
    { label: 'Market Value', a: `$${propA.marketValue.toLocaleString()}`, b: `$${propB.marketValue.toLocaleString()}`, diff: propA.marketValue !== propB.marketValue },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Property Comparison</h1>
          <p className="text-muted-foreground">Side-by-side attribute comparison with diff highlighting</p>
        </div>
        <Badge variant="outline">BIV-108</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-3 border-b font-semibold text-sm">
            <div className="p-3">Attribute</div>
            <div className="p-3 border-l">{propA.address}</div>
            <div className="p-3 border-l">{propB.address}</div>
          </div>
          {rows.map((row) => (
            <div key={row.label} className={`grid grid-cols-3 border-b text-sm ${row.diff ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}>
              <div className="p-3 font-medium text-muted-foreground">{row.label}</div>
              <div className={`p-3 border-l ${row.diff ? 'font-semibold' : ''}`}>{row.a}</div>
              <div className={`p-3 border-l ${row.diff ? 'font-semibold' : ''}`}>{row.b}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
