import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RecommendedProperty {
  parcelId: string;
  apn: string;
  address: string;
  salePrice: number;
  saleDate: string;
  sqft: number;
  similarity: number;
}

interface RecommendationCarouselProps {
  parcelId: string;
  onSelectProperty?: (parcelId: string) => void;
}

export function RecommendationCarousel({ parcelId, onSelectProperty }: RecommendationCarouselProps) {
  const [recommendations, setRecommendations] = useState<RecommendedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRecs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/properties/${parcelId}/recommendations`);
        if (!res.ok) throw new Error('Failed to fetch recommendations');
        setRecommendations(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if (parcelId) fetchRecs();
  }, [parcelId]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (loading) return <div className="p-4 text-muted-foreground">Loading recommendations...</div>;
  if (error) return <div className="p-4 text-destructive">{error}</div>;
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">AI-Suggested Comparables</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => scroll('left')}>
            &larr;
          </Button>
          <Button variant="outline" size="sm" onClick={() => scroll('right')}>
            &rarr;
          </Button>
          <Badge variant="outline">BIV-124</Badge>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {recommendations.map((rec) => (
          <Card
            key={rec.parcelId}
            className="min-w-[280px] flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow"
            style={{ scrollSnapAlign: 'start' }}
            onClick={() => onSelectProperty?.(rec.parcelId)}
          >
            <CardContent className="pt-4 space-y-2">
              <div className="text-sm font-medium">{rec.address}</div>
              <div className="text-xs text-muted-foreground font-mono">{rec.apn}</div>
              <div className="flex justify-between text-sm">
                <span>${rec.salePrice.toLocaleString()}</span>
                <span>{rec.saleDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{rec.sqft.toLocaleString()} sqft</span>
                <Badge variant="secondary">{(rec.similarity * 100).toFixed(0)}% match</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
