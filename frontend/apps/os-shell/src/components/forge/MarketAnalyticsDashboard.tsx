// TFT-139 — Market analytics dashboard
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MarketSegment } from '@/types/realEstate';
import { getMarketSegments } from '@/services/forge/marketTrendsClientService';

export function MarketAnalyticsDashboard() {
  const [segments, setSegments] = useState<MarketSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMarketSegments()
      .then(setSegments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Market Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-primary/10" />
            ))}
          </div>
        ) : segments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No market data available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {segments.map((seg) => {
              const priceUp = seg.priceChangePercent >= 0;
              return (
                <div key={seg.segmentId} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{seg.name}</span>
                    <Badge variant="outline" className="text-[10px]">{seg.propertyType}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div>
                      <p className="text-muted-foreground">Median Value</p>
                      <p className="font-semibold">${seg.medianValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Median Sale</p>
                      <p className="font-semibold">${seg.medianSalePrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg DOM</p>
                      <p className="font-semibold">{seg.averageDaysOnMarket}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Inventory</p>
                      <p className="font-semibold">{seg.inventoryCount}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={priceUp ? 'success' : 'error'} className="text-[10px]">
                      Price {priceUp ? '+' : ''}{seg.priceChangePercent.toFixed(1)}%
                    </Badge>
                    <Badge
                      variant={seg.volumeChangePercent >= 0 ? 'success' : 'error'}
                      className="text-[10px]"
                    >
                      Vol {seg.volumeChangePercent >= 0 ? '+' : ''}{seg.volumeChangePercent.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
