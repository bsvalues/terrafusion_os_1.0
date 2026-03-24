// TFT-132 — Neighborhood trend card
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { NeighborhoodMetrics } from '@/types/realEstate';

interface NeighborhoodTrendCardProps {
  neighborhood: NeighborhoodMetrics;
  onClick?: (neighborhood: NeighborhoodMetrics) => void;
}

export function NeighborhoodTrendCard({ neighborhood, onClick }: NeighborhoodTrendCardProps) {
  const isPositive = neighborhood.priceChangePercent >= 0;

  return (
    <Card
      className={onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
      onClick={() => onClick?.(neighborhood)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{neighborhood.name}</CardTitle>
          <Badge variant={isPositive ? 'success' : 'error'}>
            {isPositive ? '+' : ''}{neighborhood.priceChangePercent.toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Median Value</p>
            <p className="font-semibold">${neighborhood.medianValue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sales Volume</p>
            <p className="font-semibold">{neighborhood.salesVolume}</p>
          </div>
          <div>
            <p className="text-muted-foreground">COD</p>
            <p className="font-semibold">{neighborhood.cod.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Parcels</p>
            <p className="font-semibold">{neighborhood.totalParcels.toLocaleString()}</p>
          </div>
        </div>

        {neighborhood.trendData.length > 0 && (
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={neighborhood.trendData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={isPositive ? 'hsl(var(--tf-success))' : 'hsl(var(--tf-error))'}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
