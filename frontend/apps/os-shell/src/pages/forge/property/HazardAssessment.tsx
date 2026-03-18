import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HazardScore {
  category: string;
  score: number;
  maxScore: number;
  risk: 'low' | 'moderate' | 'high' | 'extreme';
  description: string;
}

interface MitigationSuggestion {
  hazardType: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  estimatedCost: string;
}

interface FullHazardData {
  parcelId: string;
  overallRiskScore: number;
  hazards: HazardScore[];
  mitigations: MitigationSuggestion[];
  mapUrl: string | null;
  lastAssessedDate: string;
}

interface HazardAssessmentProps {
  parcelId: string;
}

export function HazardAssessment({ parcelId }: HazardAssessmentProps) {
  const [data, setData] = useState<FullHazardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHazards = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/properties/${parcelId}/hazard-assessment`);
        if (!res.ok) throw new Error('Failed to fetch hazard assessment');
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if (parcelId) fetchHazards();
  }, [parcelId]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading hazard assessment...</div>;
  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
  if (!data) return null;

  const riskColor = (risk: string) => {
    switch (risk) {
      case 'extreme': return 'destructive' as const;
      case 'high': return 'destructive' as const;
      case 'moderate': return 'secondary' as const;
      case 'low': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive' as const;
      case 'medium': return 'secondary' as const;
      case 'low': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  const overallColor =
    data.overallRiskScore >= 75 ? 'text-red-600' :
    data.overallRiskScore >= 50 ? 'text-yellow-600' :
    data.overallRiskScore >= 25 ? 'text-blue-600' : 'text-green-600';

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hazard Assessment</h1>
          <p className="text-muted-foreground">
            Comprehensive hazard risk analysis with mitigation suggestions
          </p>
        </div>
        <Badge variant="outline">BIV-194</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-sm text-muted-foreground">Overall Risk Score</div>
            <div className={`text-4xl font-bold ${overallColor}`}>{data.overallRiskScore}</div>
            <div className="text-xs text-muted-foreground">out of 100</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-sm text-muted-foreground">Hazard Categories</div>
            <div className="text-4xl font-bold">{data.hazards.length}</div>
            <div className="text-xs text-muted-foreground">assessed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-sm text-muted-foreground">Last Assessed</div>
            <div className="text-lg font-bold">{data.lastAssessedDate}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="risks">
        <TabsList>
          <TabsTrigger value="risks">Risk Scores</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="mitigations">Mitigations</TabsTrigger>
        </TabsList>

        <TabsContent value="risks">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.hazards.map((hazard) => (
              <Card key={hazard.category}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{hazard.category}</CardTitle>
                    <Badge variant={riskColor(hazard.risk)}>{hazard.risk}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${(hazard.score / hazard.maxScore) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{hazard.score}/{hazard.maxScore}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{hazard.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="map">
          <Card>
            <CardContent className="pt-6">
              {data.mapUrl ? (
                <div className="aspect-video bg-muted rounded flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Map view loads from: {data.mapUrl}
                  </p>
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded flex items-center justify-center">
                  <p className="text-muted-foreground">No map data available for this parcel.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mitigations">
          <div className="space-y-3">
            {data.mitigations.map((m, i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={priorityColor(m.priority)}>{m.priority} priority</Badge>
                        <span className="text-sm text-muted-foreground">{m.hazardType}</span>
                      </div>
                      <p className="text-sm">{m.action}</p>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{m.estimatedCost}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {data.mitigations.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No mitigation suggestions for this parcel.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
