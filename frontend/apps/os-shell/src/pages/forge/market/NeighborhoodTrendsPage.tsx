// TFT-152 — Neighborhood trends page
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { NeighborhoodTrendsGrid } from '@/components/forge/NeighborhoodTrendsGrid';
import type { NeighborhoodMetrics } from '@/types/realEstate';
import { getNeighborhoods } from '@/services/forge/neighborhoodClientService';

export function NeighborhoodTrendsPage() {
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getNeighborhoods()
      .then(setNeighborhoods)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Neighborhood Trends</h1>
      <p className="text-sm text-muted-foreground">
        Trend analysis across all neighborhoods
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <NeighborhoodTrendsGrid
        neighborhoods={neighborhoods}
        loading={loading}
        onNeighborhoodClick={(n) => {
          // Navigate to neighborhood detail — can be wired to router
          console.log('Navigate to neighborhood:', n.neighborhoodId);
        }}
      />
    </div>
  );
}
