// TFT-135 — Natural hazard risk component
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { HazardRisk, RiskLevel } from '@/types/realEstate';

interface NaturalHazardRiskProps {
  hazardRisk: HazardRisk | null;
  loading?: boolean;
}

const riskConfig: Record<RiskLevel, { variant: 'success' | 'warning' | 'error' | 'destructive'; label: string }> = {
  low: { variant: 'success', label: 'Low' },
  moderate: { variant: 'warning', label: 'Moderate' },
  high: { variant: 'error', label: 'High' },
  'very-high': { variant: 'destructive', label: 'Very High' },
};

export function NaturalHazardRisk({ hazardRisk, loading }: NaturalHazardRiskProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Natural Hazard Risk</CardTitle></CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-primary/10" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hazardRisk) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">Natural Hazard Risk</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hazard data available</p>
        </CardContent>
      </Card>
    );
  }

  const hazards = [
    { type: 'Flood', risk: hazardRisk.floodRisk, zone: hazardRisk.floodZone },
    { type: 'Wildfire', risk: hazardRisk.wildfireRisk },
    { type: 'Earthquake', risk: hazardRisk.earthquakeRisk },
    { type: 'Landslide', risk: hazardRisk.landslideRisk },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Natural Hazard Risk</CardTitle>
          <Badge variant={riskConfig[hazardRisk.overallRisk].variant}>
            Overall: {riskConfig[hazardRisk.overallRisk].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {hazards.map((h) => {
          const config = riskConfig[h.risk];
          const detail = hazardRisk.details.find(
            (d) => d.hazardType.toLowerCase() === h.type.toLowerCase()
          );
          const isExpanded = expanded === h.type;

          return (
            <div key={h.type} className="rounded-md border">
              <button
                className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50"
                onClick={() => setExpanded(isExpanded ? null : h.type)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{h.type}</span>
                  {'zone' in h && h.zone && (
                    <span className="text-xs text-muted-foreground">Zone: {h.zone}</span>
                  )}
                </div>
                <Badge variant={config.variant}>{config.label}</Badge>
              </button>
              {isExpanded && detail && (
                <div className="border-t px-3 py-2 text-xs text-muted-foreground space-y-1">
                  <p>{detail.description}</p>
                  {detail.mitigationNotes && (
                    <p className="italic">Mitigation: {detail.mitigationNotes}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground pt-1">
          Last assessed: {hazardRisk.lastAssessedDate}
        </p>
      </CardContent>
    </Card>
  );
}
