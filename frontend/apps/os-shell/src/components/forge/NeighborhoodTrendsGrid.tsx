// TFT-133 — Grid of NeighborhoodTrendCards
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { NeighborhoodTrendCard } from './NeighborhoodTrendCard';
import type { NeighborhoodMetrics } from '@/types/realEstate';

interface NeighborhoodTrendsGridProps {
  neighborhoods: NeighborhoodMetrics[];
  loading?: boolean;
  onNeighborhoodClick?: (neighborhood: NeighborhoodMetrics) => void;
}

export function NeighborhoodTrendsGrid({
  neighborhoods,
  loading,
  onNeighborhoodClick,
}: NeighborhoodTrendsGridProps) {
  const [filter, setFilter] = useState('');

  const filtered = neighborhoods.filter((n) =>
    n.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <Input placeholder="Filter neighborhoods..." className="mb-4" disabled />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-primary/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Input
        placeholder="Filter neighborhoods..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No neighborhoods match your filter
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((n) => (
            <NeighborhoodTrendCard
              key={n.neighborhoodId}
              neighborhood={n}
              onClick={onNeighborhoodClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
