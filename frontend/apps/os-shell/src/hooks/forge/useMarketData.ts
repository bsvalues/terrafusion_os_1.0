import { useQuery } from '@tanstack/react-query';

interface MarketMetrics {
  cod: number;
  prd: number;
  medianRatio: number;
  meanRatio: number;
  sampleSize: number;
}

interface MarketTrendPoint {
  period: string;
  medianValue: number;
  avgValue: number;
  salesCount: number;
}

interface MarketSegment {
  segment: string;
  medianValue: number;
  avgValue: number;
  salesCount: number;
  cod: number;
}

export function useMarketMetrics(neighborhood?: string) {
  return useQuery<MarketMetrics>({
    queryKey: ['marketMetrics', neighborhood],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (neighborhood) params.set('neighborhood', neighborhood);
      const res = await fetch(`/api/market/metrics?${params}`);
      if (!res.ok) throw new Error('Failed to fetch market metrics');
      return res.json();
    },
  });
}

export function useMarketTrends(options?: { neighborhood?: string; timeRange?: string }) {
  return useQuery<MarketTrendPoint[]>({
    queryKey: ['marketTrends', options?.neighborhood, options?.timeRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.neighborhood) params.set('neighborhood', options.neighborhood);
      if (options?.timeRange) params.set('timeRange', options.timeRange);
      const res = await fetch(`/api/market/trends?${params}`);
      if (!res.ok) throw new Error('Failed to fetch market trends');
      return res.json();
    },
  });
}

export function useMarketSegments() {
  return useQuery<MarketSegment[]>({
    queryKey: ['marketSegments'],
    queryFn: async () => {
      const res = await fetch('/api/market/segments');
      if (!res.ok) throw new Error('Failed to fetch market segments');
      return res.json();
    },
  });
}
