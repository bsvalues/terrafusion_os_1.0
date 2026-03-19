/**
 * SpatialDiagnosticsPanel.tsx (Phase 17)
 *
 * Summary of spatial autocorrelation metrics:
 * Moran's I, interpretation, p-value, hotspot/coldspot counts,
 * autocorrelation status, total parcels.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAtlasSpatialStore } from '@/stores/atlasSpatialStore';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpatialDiagnosticsPanel() {
  const diagnostics = useAtlasSpatialStore((s) => s.diagnostics);

  if (!diagnostics) {
    return (
      <div data-testid="spatial-diagnostics" className="p-4">
        <span style={{ color: 'hsl(var(--tf-muted))' }}>No diagnostics data available</span>
      </div>
    );
  }

  const interpretationColor = (() => {
    switch (diagnostics.moransIInterpretation) {
      case 'clustered': return 'hsl(var(--tf-warning, 40 90% 60%))';
      case 'dispersed': return 'hsl(var(--tf-info, 210 90% 60%))';
      default: return 'hsl(var(--tf-muted))';
    }
  })();

  return (
    <div data-testid="spatial-diagnostics" className="space-y-4 p-4" style={{ color: 'hsl(var(--tf-fg))' }}>
      <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-accent))' }}>
        Spatial Diagnostics
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Moran's I */}
        <Card data-material="bento">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Moran's I</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{diagnostics.moransI.toFixed(2)}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" style={{ color: interpretationColor, borderColor: interpretationColor }}>
                {diagnostics.moransIInterpretation}
              </Badge>
            </div>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-muted))' }}>
              Values near +1 indicate clustering; near -1 indicate dispersion
            </p>
          </CardContent>
        </Card>

        {/* P-Value */}
        <Card data-material="bento">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>P-Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{diagnostics.moransIPValue.toFixed(3)}</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-muted))' }}>
              {diagnostics.moransIPValue < 0.05 ? 'Statistically significant' : 'Not significant'}
            </p>
          </CardContent>
        </Card>

        {/* Autocorrelation Status */}
        <Card data-material="bento">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={diagnostics.spatiallyAutocorrelated ? 'default' : 'outline'}>
              {diagnostics.spatiallyAutocorrelated ? 'Spatially Autocorrelated' : 'No Autocorrelation'}
            </Badge>
            <p className="text-xs mt-2" style={{ color: 'hsl(var(--tf-muted))' }}>
              {diagnostics.totalParcels.toLocaleString()} total parcels analyzed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hotspot / Coldspot */}
      <div className="grid grid-cols-2 gap-4">
        <Card data-material="bento">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Hotspots (Getis-Ord G*)</CardTitle>
          </CardHeader>
          <CardContent>
            <p data-testid="hotspot-count" className="text-2xl font-bold font-mono" style={{ color: 'hsl(var(--tf-error, 0 80% 60%))' }}>
              {diagnostics.hotspotCount}
            </p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-muted))' }}>
              Neighborhoods with statistically significant high residuals
            </p>
          </CardContent>
        </Card>

        <Card data-material="bento">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Coldspots (Getis-Ord G*)</CardTitle>
          </CardHeader>
          <CardContent>
            <p data-testid="coldspot-count" className="text-2xl font-bold font-mono" style={{ color: 'hsl(var(--tf-info, 210 80% 60%))' }}>
              {diagnostics.coldspotCount}
            </p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--tf-muted))' }}>
              Neighborhoods with statistically significant low residuals
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SpatialDiagnosticsPanel;
