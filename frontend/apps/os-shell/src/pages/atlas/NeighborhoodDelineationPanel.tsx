/**
 * NeighborhoodDelineationPanel.tsx (Phase 17)
 *
 * Neighborhood boundary table with IAAO statistics.
 * Columns: code, name, parcel count, median ratio, COD, PRD, qualified badge.
 * Click row → selectNeighborhood for map highlight.
 * Summary: X of Y neighborhoods IAAO qualified.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAtlasSpatialStore } from '@/stores/atlasSpatialStore';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NeighborhoodDelineationPanel() {
  const neighborhoods = useAtlasSpatialStore((s) => s.neighborhoods);
  const selectedNeighborhood = useAtlasSpatialStore((s) => s.selectedNeighborhood);
  const selectNeighborhood = useAtlasSpatialStore((s) => s.selectNeighborhood);

  const qualifiedCount = neighborhoods.filter((n) => n.qualified).length;

  return (
    <div data-testid="neighborhood-delineation" className="space-y-4 p-4" style={{ color: 'hsl(var(--tf-fg))' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-accent))' }}>
          Neighborhood Delineation
        </h2>
        <div
          data-testid="iaao-summary"
          className="px-3 py-1 rounded text-sm"
          style={{
            background: 'hsl(var(--tf-surface) / 0.3)',
            border: '1px solid hsl(var(--tf-border) / 0.2)',
          }}
        >
          <span className="font-bold">{qualifiedCount}</span>
          <span style={{ color: 'hsl(var(--tf-muted))' }}> of </span>
          <span className="font-bold">{neighborhoods.length}</span>
          <span style={{ color: 'hsl(var(--tf-muted))' }}> IAAO Qualified</span>
        </div>
      </div>

      <Card data-material="bento">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
            Neighborhood Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table data-testid="neighborhood-table" className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.2)' }}>
                <th className="text-left py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Code</th>
                <th className="text-left py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Name</th>
                <th className="text-right py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Parcels</th>
                <th className="text-right py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Median Ratio</th>
                <th className="text-right py-2" style={{ color: 'hsl(var(--tf-muted))' }}>COD</th>
                <th className="text-right py-2" style={{ color: 'hsl(var(--tf-muted))' }}>PRD</th>
                <th className="text-left py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {neighborhoods.map((n) => (
                <tr
                  key={n.code}
                  onClick={() => selectNeighborhood(n.code)}
                  className="cursor-pointer transition-colors"
                  style={{
                    borderBottom: '1px solid hsl(var(--tf-border) / 0.1)',
                    background: selectedNeighborhood === n.code ? 'hsl(var(--tf-surface) / 0.3)' : undefined,
                  }}
                >
                  <td className="py-2 font-mono text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{n.code}</td>
                  <td className="py-2">{n.name}</td>
                  <td className="py-2 text-right font-mono">{n.parcelCount.toLocaleString()}</td>
                  <td className="py-2 text-right font-mono">{n.medianRatio.toFixed(3)}</td>
                  <td className="py-2 text-right font-mono">{n.cod.toFixed(1)}</td>
                  <td className="py-2 text-right font-mono">{n.prd.toFixed(2)}</td>
                  <td className="py-2">
                    <Badge variant={n.qualified ? 'default' : 'outline'}>
                      {n.qualified ? 'Qualified' : 'Not Qualified'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default NeighborhoodDelineationPanel;
