// TFT-114 — Smart comp tray
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SalesComp } from '@/types/realEstate';
import { getSuggestedComps } from '@/services/forge/propertyComparisonClientService';

interface SmartCompTrayProps {
  parcelId: string;
  onAccept?: (comp: SalesComp) => void;
  onReject?: (comp: SalesComp) => void;
}

export function SmartCompTray({ parcelId, onAccept, onReject }: SmartCompTrayProps) {
  const [comps, setComps] = useState<SalesComp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getSuggestedComps(parcelId)
      .then(setComps)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [parcelId]);

  const handleDragStart = (e: React.DragEvent, comp: SalesComp) => {
    e.dataTransfer.setData('application/json', JSON.stringify(comp));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Suggested Comps</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded bg-primary/10" />
            ))}
          </div>
        ) : comps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No suggestions available</p>
        ) : (
          <ul className="space-y-2">
            {comps.map((comp) => (
              <li
                key={comp.compId}
                draggable
                onDragStart={(e) => handleDragStart(e, comp)}
                className="cursor-grab rounded-md border p-3 hover:bg-muted/50 active:cursor-grabbing"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{comp.address}</p>
                    <p className="text-xs text-muted-foreground">
                      ${comp.salePrice.toLocaleString()} | {comp.saleDate}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {(comp.similarityScore * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => onAccept?.(comp)}
                    className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onReject?.(comp)}
                    className="rounded bg-muted px-3 py-1 text-xs hover:bg-muted/80"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
