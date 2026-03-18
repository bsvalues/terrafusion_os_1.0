import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EnrichmentData {
  weather: { avgTemp: number; annualPrecipitation: number; snowfall: number } | null;
  climate: { zone: string; riskCategory: string; projectedChange: string } | null;
  demographic: { medianIncome: number; population: number; growthRate: number } | null;
  environmental: { airQuality: string; noiseLevel: string; greenScore: number } | null;
}

interface PropertyEnrichmentWidgetProps {
  parcelId: string;
}

export function PropertyEnrichmentWidget({ parcelId }: PropertyEnrichmentWidgetProps) {
  const [data, setData] = useState<EnrichmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrichment = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/properties/${parcelId}/enrichment`);
        if (!res.ok) throw new Error('Failed to fetch enrichment data');
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if (parcelId) fetchEnrichment();
  }, [parcelId]);

  if (loading) return <div className="p-4 text-muted-foreground">Loading enrichment data...</div>;
  if (error) return <div className="p-4 text-destructive">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Property Enrichment</h2>
        <Badge variant="outline">BIV-104</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.weather && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Weather</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Row label="Avg Temperature" value={`${data.weather.avgTemp}°F`} />
              <Row label="Annual Precipitation" value={`${data.weather.annualPrecipitation}"`} />
              <Row label="Annual Snowfall" value={`${data.weather.snowfall}"`} />
            </CardContent>
          </Card>
        )}

        {data.climate && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Climate</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Row label="Zone" value={data.climate.zone} />
              <Row label="Risk Category" value={data.climate.riskCategory} />
              <Row label="Projected Change" value={data.climate.projectedChange} />
            </CardContent>
          </Card>
        )}

        {data.demographic && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Demographics</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Row label="Median Income" value={`$${data.demographic.medianIncome.toLocaleString()}`} />
              <Row label="Population" value={data.demographic.population.toLocaleString()} />
              <Row label="Growth Rate" value={`${data.demographic.growthRate}%`} />
            </CardContent>
          </Card>
        )}

        {data.environmental && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Environmental</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Row label="Air Quality" value={data.environmental.airQuality} />
              <Row label="Noise Level" value={data.environmental.noiseLevel} />
              <Row label="Green Score" value={`${data.environmental.greenScore}/100`} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
