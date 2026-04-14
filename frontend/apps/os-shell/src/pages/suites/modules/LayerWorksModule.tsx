/**
 * LayerWorks Module -- Advanced Layer Management & Spatial Analysis
 * ===================================================================
 * Constitutional module of TerraAtlas (Article V Section 5.1).
 * Owns: Layer composition, opacity control, spatial analysis overlays.
 */

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TactileButton } from '@/ui/materials';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Layers, Eye, EyeOff, BarChart3, Activity, ChevronUp, ChevronDown, Palette } from 'lucide-react';
import { atlasService, type MapLayer } from '@/services/atlasService';

/* -------------------------------------------------------------------------- */
/* Layer group + analysis types                                                */
/* -------------------------------------------------------------------------- */

interface LayerGroup {
  id: string;
  label: string;
  layers: MapLayer[];
  expanded: boolean;
}

interface SpatialAnalysis {
  id: string;
  name: string;
  description: string;
  status: 'ready' | 'running' | 'complete';
  layers: string[];
  result?: string;
}

const MOCK_ANALYSES: SpatialAnalysis[] = [
  { id: 'flood-risk', name: 'Flood Risk Overlay', description: 'Intersect parcels with FEMA flood zones', status: 'complete', layers: ['parcels', 'flood'], result: '2,341 parcels in flood zones' },
  { id: 'zoning-conflict', name: 'Zoning Conflict Detection', description: 'Find parcels with incompatible land use vs zoning', status: 'complete', layers: ['parcels', 'zoning'], result: '87 potential conflicts' },
  { id: 'fire-proximity', name: 'Wildfire Proximity Analysis', description: 'Buffer wildfire risk zones by 500ft', status: 'ready', layers: ['parcels', 'fire'] },
  { id: 'slope-build', name: 'Buildable Slope Analysis', description: 'Identify parcels with >15% slope constraints', status: 'ready', layers: ['parcels', 'slope'] },
  { id: 'wetland-impact', name: 'Wetland Impact Assessment', description: 'Parcels intersecting NWI wetland boundaries', status: 'complete', layers: ['parcels', 'wetlands'], result: '156 parcels with wetland overlap' },
];

const CATEGORY_LABELS: Record<string, string> = {
  base: 'Base Layers',
  overlay: 'Overlays',
  analysis: 'Analysis Layers',
};

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function LayerWorksModule() {
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [groups, setGroups] = useState<LayerGroup[]>([]);
  const [analyses, setAnalyses] = useState<SpatialAnalysis[]>(MOCK_ANALYSES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await atlasService.getLayers();
        if (!cancelled) {
          setLayers(data);
          const grouped: Record<string, MapLayer[]> = {};
          for (const l of data) {
            (grouped[l.category] ??= []).push(l);
          }
          setGroups(
            Object.entries(grouped).map(([cat, lrs]) => ({
              id: cat,
              label: CATEGORY_LABELS[cat] ?? cat,
              layers: lrs,
              expanded: true,
            }))
          );
        }
      } catch {
        // layer catalog is Post-R1 — show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const toggleLayer = useCallback((id: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)));
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        layers: g.layers.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)),
      }))
    );
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, expanded: !g.expanded } : g)));
  }, []);

  const setOpacity = useCallback((layerId: string, opacity: number) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, opacity } : l)));
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        layers: g.layers.map((l) => (l.id === layerId ? { ...l, opacity } : l)),
      }))
    );
  }, []);

  const runAnalysis = useCallback((analysisId: string) => {
    setAnalyses((prev) =>
      prev.map((a) =>
        a.id === analysisId ? { ...a, status: 'running' as const } : a
      )
    );
    setTimeout(() => {
      setAnalyses((prev) =>
        prev.map((a) =>
          a.id === analysisId
            ? { ...a, status: 'complete' as const, result: `Analysis complete — ${Math.floor(Math.random() * 2000 + 100)} features affected` }
            : a
        )
      );
    }, 1500);
  }, []);

  const enabledCount = layers.filter((l) => l.enabled).length;

  if (loading) {
    return (
      <div className='p-6 flex items-center justify-center min-h-[400px]'>
        <p style={{ color: 'hsl(var(--tf-muted))' }}>Loading LayerWorks...</p>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
          <Layers style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={28} />
          LayerWorks
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Advanced layer management &amp; spatial analysis — {enabledCount} of {layers.length} layers active
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Layer Manager */}
        <div className='lg:col-span-2 space-y-4'>
          {groups.map((group) => (
            <Card key={group.id} style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
              <CardHeader className='pb-2'>
                <button onClick={() => toggleGroup(group.id)} className='flex items-center justify-between w-full'>
                  <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>{group.label}</CardTitle>
                  {group.expanded ? <ChevronUp size={16} style={{ color: 'hsl(var(--tf-muted))' }} /> : <ChevronDown size={16} style={{ color: 'hsl(var(--tf-muted))' }} />}
                </button>
                <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                  {group.layers.filter((l) => l.enabled).length} of {group.layers.length} enabled
                </CardDescription>
              </CardHeader>
              {group.expanded && (
                <CardContent className='space-y-2'>
                  {group.layers.map((layer) => (
                    <div
                      key={layer.id}
                      className='flex items-center gap-3 p-3 rounded-lg'
                      style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))' }}
                    >
                      <Switch checked={layer.enabled} onCheckedChange={() => toggleLayer(layer.id)} />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          {layer.enabled ? (
                            <Eye size={14} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                          ) : (
                            <EyeOff size={14} style={{ color: 'hsl(var(--tf-muted) / 0.5)' }} />
                          )}
                          <p className='text-sm font-medium truncate' style={{ color: 'hsl(var(--tf-fg))' }}>{layer.name}</p>
                          {layer.features && (
                            <Badge variant='outline' className='text-xs' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                              {layer.features.toLocaleString()} features
                            </Badge>
                          )}
                        </div>
                        <p className='text-xs mt-0.5' style={{ color: 'hsl(var(--tf-muted))' }}>Source: {layer.source}</p>
                      </div>
                      {/* Opacity control */}
                      <div className='flex items-center gap-2 shrink-0'>
                        <Palette size={12} style={{ color: 'hsl(var(--tf-muted))' }} />
                        <input
                          type='range'
                          min={0}
                          max={100}
                          value={layer.opacity}
                          onChange={(e) => setOpacity(layer.id, Number(e.target.value))}
                          className='w-20 accent-current'
                          style={{ color: 'hsl(var(--tf-suite-atlas))' }}
                        />
                        <span className='text-xs w-8 text-right' style={{ color: 'hsl(var(--tf-muted))' }}>{layer.opacity}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Spatial Analysis */}
        <div className='space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <BarChart3 size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Spatial Analysis
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                Run geospatial queries across active layers
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className='p-3 rounded-lg space-y-2'
                  style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))' }}
                >
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{analysis.name}</p>
                    <Badge
                      variant='outline'
                      style={{
                        background: analysis.status === 'complete'
                          ? 'hsl(var(--tf-success-hs) 45% / 0.15)'
                          : analysis.status === 'running'
                          ? 'hsl(var(--tf-warning-hs) 50% / 0.15)'
                          : 'hsl(var(--tf-muted) / 0.1)',
                        color: analysis.status === 'complete'
                          ? 'hsl(var(--tf-success-hs) 45%)'
                          : analysis.status === 'running'
                          ? 'hsl(var(--tf-warning-hs) 50%)'
                          : 'hsl(var(--tf-muted))',
                        borderColor: analysis.status === 'complete'
                          ? 'hsl(142 71% 45% / 0.3)'
                          : analysis.status === 'running'
                          ? 'hsl(38 92% 50% / 0.3)'
                          : 'hsl(var(--tf-border))',
                      }}
                    >
                      {analysis.status}
                    </Badge>
                  </div>
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{analysis.description}</p>
                  <div className='flex items-center gap-1'>
                    {analysis.layers.map((lid) => (
                      <Badge key={lid} variant='outline' className='text-xs' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                        {lid}
                      </Badge>
                    ))}
                  </div>
                  {analysis.result && (
                    <p className='text-xs font-medium' style={{ color: 'hsl(var(--tf-suite-atlas))' }}>
                      {analysis.result}
                    </p>
                  )}
                  {analysis.status === 'ready' && (
                    <TactileButton size='sm' onClick={() => runAnalysis(analysis.id)} fullWidth leftIcon={<Activity size={14} />}>
                      Run Analysis
                    </TactileButton>
                  )}
                  {analysis.status === 'running' && (
                    <div className='flex items-center gap-2'>
                      <div className='h-1 flex-1 rounded-full overflow-hidden' style={{ background: 'hsl(var(--tf-border))' }}>
                        <div className='h-full rounded-full animate-pulse' style={{ width: '60%', background: 'hsl(var(--tf-warning-hs) 50%)' }} />
                      </div>
                      <span className='text-xs' style={{ color: 'hsl(var(--tf-warning-hs) 50%)' }}>Processing...</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Layer Stats */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Layer Statistics</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {[
                ['Total Layers', layers.length.toString()],
                ['Active Layers', enabledCount.toString()],
                ['Total Features', layers.reduce((sum, l) => sum + (l.features ?? 0), 0).toLocaleString()],
                ['Data Sources', [...new Set(layers.map((l) => l.source))].length.toString()],
              ].map(([label, value]) => (
                <div key={label} className='flex justify-between py-1' style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.5)' }}>
                  <span className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>{label}</span>
                  <span className='text-sm font-mono font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
