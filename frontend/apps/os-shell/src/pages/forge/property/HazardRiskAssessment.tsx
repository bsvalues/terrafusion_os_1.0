import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HazardData {
  floodZone: { zone: string; risk: string; femaPanel: string };
  wildfire: { risk: string; score: number; fireHistory: number };
  earthquake: { zone: string; magnitude: number; probability: string };
  landslide: { risk: string; slope: number };
}

interface HazardRiskAssessmentProps {
  parcelId: string;
}

export function HazardRiskAssessment({ parcelId }: HazardRiskAssessmentProps) {
  const [data, setData] = useState<HazardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHazards = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/properties/${parcelId}/hazards`);
        if (!res.ok) throw new Error('Failed to fetch hazard data');
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if (parcelId) fetchHazards();
  }, [parcelId]);

  if (loading) return <div className="p-4 text-muted-foreground">Loading hazard assessment...</div>;
  if (error) return <div className="p-4 text-destructive">{error}</div>;
  if (!data) return null;

  const riskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'destructive' as const;
      case 'moderate': return 'secondary' as const;
      case 'low': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Hazard Risk Assessment</h2>
        <Badge variant="outline">BIV-107</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Flood Zone</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zone</span>
              <span className="font-medium">{data.floodZone.zone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Risk Level</span>
              <Badge variant={riskColor(data.floodZone.risk)}>{data.floodZone.risk}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">FEMA Panel</span>
              <span>{data.floodZone.femaPanel}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Wildfire</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Risk Level</span>
              <Badge variant={riskColor(data.wildfire.risk)}>{data.wildfire.risk}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Score</span>
              <span>{data.wildfire.score}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fire History (5yr)</span>
              <span>{data.wildfire.fireHistory} incidents</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Earthquake</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zone</span>
              <span className="font-medium">{data.earthquake.zone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Magnitude</span>
              <span>{data.earthquake.magnitude.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Probability</span>
              <span>{data.earthquake.probability}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Landslide</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Risk Level</span>
              <Badge variant={riskColor(data.landslide.risk)}>{data.landslide.risk}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slope</span>
              <span>{data.landslide.slope}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
