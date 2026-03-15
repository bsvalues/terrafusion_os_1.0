// TFT-141 — Property recommendation carousel
import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PropertyListing } from '@/types/realEstate';

interface PropertyRecommendationCarouselProps {
  properties: PropertyListing[];
  title?: string;
  onPropertyClick?: (property: PropertyListing) => void;
  loading?: boolean;
}

export function PropertyRecommendationCarousel({
  properties,
  title = 'Recommended Properties',
  onPropertyClick,
  loading,
}: PropertyRecommendationCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex gap-1">
            <button
              onClick={() => scroll('left')}
              className="rounded border px-2 py-1 text-xs hover:bg-muted"
              aria-label="Scroll left"
            >
              &larr;
            </button>
            <button
              onClick={() => scroll('right')}
              className="rounded border px-2 py-1 text-xs hover:bg-muted"
              aria-label="Scroll right"
            >
              &rarr;
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 w-64 shrink-0 animate-pulse rounded-lg bg-primary/10" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recommendations available</p>
        ) : (
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {properties.map((p) => (
              <div
                key={p.parcelId}
                className={`w-64 shrink-0 rounded-md border p-3 ${onPropertyClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                onClick={() => onPropertyClick?.(p)}
              >
                <p className="text-sm font-medium truncate">{p.address}</p>
                <p className="text-xs text-muted-foreground">{p.city}, {p.state}</p>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                  <div>
                    <p className="text-muted-foreground">Value</p>
                    <p className="font-semibold">${p.marketValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sq Ft</p>
                    <p className="font-semibold">{p.squareFeet.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-1">
                  <Badge variant="outline" className="text-[10px]">{p.propertyType}</Badge>
                  <Badge variant="outline" className="text-[10px]">{p.yearBuilt}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
