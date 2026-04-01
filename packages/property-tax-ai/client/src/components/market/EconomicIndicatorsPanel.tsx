/**
 * Economic Indicators Panel Component
 * 
 * Displays a collection of economic indicators in a responsive grid layout.
 * Includes a loading state and error handling.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { EconomicIndicatorCard } from './EconomicIndicatorCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface EconomicIndicator {
  name: string;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
  significance: number;
}

interface EconomicIndicatorsPanelProps {
  propertyId: string;
  region?: string;
  className?: string;
}

export function EconomicIndicatorsPanel({ 
  propertyId, 
  region, 
  className = '' 
}: EconomicIndicatorsPanelProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['economicIndicators', region || propertyId],
    queryFn: async () => {
      // Use region if provided, otherwise fetch indicators for the property's region
      const endpoint = region 
        ? `/api/market/economic-indicators?region=${encodeURIComponent(region)}` 
        : `/api/market/economic-indicators/property/${propertyId}`;
        
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to load economic indicators');
      }
      
      const data = await response.json();
      
      // Handle case where we get full economic data (with topFactors)
      if (data.topFactors) {
        return data.topFactors;
      }
      
      // Handle case where we get array of indicators directly
      return data;
    },
    enabled: !!propertyId || !!region
  });
  
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {[1, 2, 3].map((index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-12 w-full" />
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
            : 'An error occurred while loading economic indicators'}
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
          No economic indicator data is available for this {region ? 'region' : 'property'}.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {data.map((indicator: EconomicIndicator, index: number) => (
        <EconomicIndicatorCard
          key={`${indicator.name}-${index}`}
          name={indicator.name}
          value={indicator.value}
          impact={indicator.impact}
          significance={indicator.significance}
        />
      ))}
    </div>
  );
}