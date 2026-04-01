/**
 * Market Trends Panel Component
 * 
 * Displays a collection of market trends in a responsive grid layout.
 * Includes a loading state and error handling.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MarketTrendCard } from './MarketTrendCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface MarketTrend {
  metric: string;
  timeframe: string;
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
}

interface MarketTrendsPanelProps {
  propertyId: string;
  region?: string;
  className?: string;
}

export function MarketTrendsPanel({ 
  propertyId, 
  region, 
  className = '' 
}: MarketTrendsPanelProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['marketTrends', region || propertyId],
    queryFn: async () => {
      // Use region if provided, otherwise fetch trends for the property's region
      const endpoint = region 
        ? `/api/market/trends?region=${encodeURIComponent(region)}` 
        : `/api/market/trends/property/${propertyId}`;
        
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to load market trends');
      }
      
      return response.json() as Promise<MarketTrend[]>;
    },
    enabled: !!propertyId || !!region
  });
  
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {[1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error 
            ? error.message 
            : 'An error occurred while loading market trends'}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>
          No market trend data is available for this {region ? 'region' : 'property'}.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {data.map((trend, index) => (
        <MarketTrendCard
          key={`${trend.metric}-${trend.timeframe}-${index}`}
          metric={trend.metric}
          timeframe={trend.timeframe}
          value={trend.value}
          trend={trend.trend}
          confidence={trend.confidence}
        />
      ))}
    </div>
  );
}