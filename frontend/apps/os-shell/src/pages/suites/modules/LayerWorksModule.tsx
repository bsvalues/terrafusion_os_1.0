/**
 * LayerWorks Module -- Live layer composition and overlay workflow
 * ===================================================================
 * Constitutional module of TerraAtlas (Article V Section 5.1).
 * Owns: layer composition, opacity control, and real overlay workflow assembly.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { invokeTool } from '@/api/pilotApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Layers, Eye, EyeOff, Link2, Network, Radar, ExternalLink } from 'lucide-react';
import {
  atlasService,
  type LayerConfigsResponse,
  type MapLayer,
  type ParcelSpatialProfileResponse,
} from '@/services/atlasService';

type AuditMetric = 'boundary' | 'uniformity' | 'zoning';

interface LayerWorksModuleProps {
  initialParcelId?: string;
  autoLoadParcelProfile?: boolean;
  embedded?: boolean;
}

interface LayerAuditSummary {
  narrative: string;
  hotspotCount: number;
  recommendedAction: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  base: 'Base Geometry',
  overlay: 'Overlay Services',
  analysis: 'Analysis Services',
};

export default function LayerWorksModule({
  initialParcelId = '',
  autoLoadParcelProfile = false,
  embedded = false,
}: LayerWorksModuleProps = {}) {
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [layerConfigs, setLayerConfigs] = useState<LayerConfigsResponse | null>(null);
  const [profileParcelId, setProfileParcelId] = useState(initialParcelId.trim());
  const [spatialProfile, setSpatialProfile] = useState<ParcelSpatialProfileResponse | null>(null);
  const [profileState, setProfileState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [auditMetric, setAuditMetric] = useState<AuditMetric>('boundary');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [layerAudit, setLayerAudit] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    result?: LayerAuditSummary;
    correlationId?: string;
    error?: string;
  }>({ status: 'idle' });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [layerData, configData] = await Promise.all([
          atlasService.getLayers(),
          atlasService.getLayerConfigs(),
        ]);
        if (!cancelled) {
          setLayers(layerData);
          setLayerConfigs(configData);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'LayerWorks could not load live Atlas layer services.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const groupedLayers = useMemo(
    () => ({
      base: layers.filter((layer) => layer.category === 'base'),
      overlay: layers.filter((layer) => layer.category === 'overlay'),
      analysis: layers.filter((layer) => layer.category === 'analysis'),
    }),
    [layers],
  );

  const enabledCount = layers.filter((layer) => layer.enabled).length;

  const toggleLayer = useCallback((id: string) => {
    setLayers((current) => current.map((layer) => (layer.id === id ? { ...layer, enabled: !layer.enabled } : layer)));
  }, []);

  const setOpacity = useCallback((layerId: string, opacity: number) => {
    setLayers((current) => current.map((layer) => (layer.id === layerId ? { ...layer, opacity } : layer)));
  }, []);

  const loadParcelSpatialProfile = useCallback(async (parcelIdToLoad: string) => {
    const nextParcelId = parcelIdToLoad.trim();
    if (!nextParcelId) return;
    setProfileState('loading');
    setProfileError(null);
    try {
      const profile = await atlasService.getParcelSpatialProfile(nextParcelId);
      setSpatialProfile(profile);
      setProfileState('success');
    } catch (error) {
      setSpatialProfile(null);
      setProfileState('error');
      setProfileError(error instanceof Error ? error.message : 'Could not load live parcel spatial profile.');
    }
  }, []);

  useEffect(() => {
    const nextParcelId = initialParcelId.trim();
    if (!nextParcelId) return;
    setProfileParcelId(nextParcelId);
    if (autoLoadParcelProfile) {
      void loadParcelSpatialProfile(nextParcelId);
    }
  }, [autoLoadParcelProfile, initialParcelId, loadParcelSpatialProfile]);

  const runGovernedLayerAudit = useCallback(async () => {
    setLayerAudit({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'explain_spatial_anomaly',
        params: {
          county: 'benton',
          geographyType: 'layer',
          anomalyMetric: auditMetric,
        },
      });

      if (response.success && response.result) {
        const parsed = typeof response.result.output === 'string'
          ? JSON.parse(response.result.output) as LayerAuditSummary
          : response.result.output as LayerAuditSummary;
        setLayerAudit({ status: 'success', result: parsed, correlationId: response.correlationId });
      } else {
        setLayerAudit({
          status: 'error',
          correlationId: response.correlationId,
          error: response.error?.message || 'Failed to explain layer anomaly.',
        });
      }
    } catch (error) {
      setLayerAudit({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: error instanceof Error ? error.message : 'Failed to explain layer anomaly.',
      });
    }
  }, [auditMetric]);

  const runParcelSpatialProfile = useCallback(async () => {
    await loadParcelSpatialProfile(profileParcelId);
  }, [loadParcelSpatialProfile, profileParcelId]);

  const containerClassName = embedded ? 'space-y-4' : 'p-6 space-y-6';
  const loadingClassName = embedded ? 'py-6 flex items-center justify-center min-h-[220px]' : 'p-6 flex items-center justify-center min-h-[400px]';

  if (loading) {
    return (
      <div className={loadingClassName} data-testid='layerworks-module'>
        <p style={{ color: 'hsl(var(--tf-muted))' }}>Loading LayerWorks from live Atlas services...</p>
      </div>
    );
  }

  return (
    <div className={containerClassName} data-testid='layerworks-module' data-embedded={embedded ? 'true' : undefined}>
      <div>
        <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
          <Layers style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={28} />
          LayerWorks
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Live Benton ArcGIS layer composition and overlay workflow assembly. This module now uses real layer services and real parcel overlay workflow endpoints only.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.9fr)] gap-6'>
        <div className='space-y-4'>
          {loadError && (
            <Card data-testid='layerworks-layer-load-error' style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-suite-dossier) / 0.4)' }}>
              <CardHeader>
                <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>
                  Layer Catalog Status
                </CardTitle>
                <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                  Parcel workflow remains available while Atlas reports the layer catalog failure.
                </CardDescription>
              </CardHeader>
              <CardContent className='text-sm' style={{ color: 'hsl(var(--tf-suite-dossier))' }}>
                {loadError}
              </CardContent>
            </Card>
          )}

          {!loadError && (['base', 'overlay', 'analysis'] as const).map((category) => (
            <Card key={category} style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
              <CardHeader className='pb-2'>
                <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>
                  {CATEGORY_LABELS[category]}
                </CardTitle>
                <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                  {groupedLayers[category].filter((layer) => layer.enabled).length} of {groupedLayers[category].length} enabled
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-2'>
                {groupedLayers[category].map((layer) => (
                  <div
                    key={layer.id}
                    className='flex items-center gap-3 rounded-lg p-3'
                    style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))' }}
                  >
                    <Switch checked={layer.enabled} onCheckedChange={() => toggleLayer(layer.id)} />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        {layer.enabled ? (
                          <Eye size={14} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                        ) : (
                          <EyeOff size={14} style={{ color: 'hsl(var(--tf-muted) / 0.5)' }} />
                        )}
                        <p className='truncate text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                          {layer.name}
                        </p>
                      </div>
                      <p className='mt-1 text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {layer.source}
                        {layer.type ? ` · ${layer.type}` : ''}
                      </p>
                      {layer.url && (
                        <a
                          href={layer.url}
                          target='_blank'
                          rel='noreferrer'
                          className='mt-2 inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline'
                          style={{ color: 'hsl(var(--tf-suite-atlas))' }}
                        >
                          Open live ArcGIS service
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <div className='flex items-center gap-2 shrink-0'>
                      <input
                        type='range'
                        min={0}
                        max={100}
                        value={Math.round(layer.opacity)}
                        onChange={(event) => setOpacity(layer.id, Number(event.target.value))}
                        className='w-20 accent-current'
                        style={{ color: 'hsl(var(--tf-suite-atlas))' }}
                      />
                      <span className='w-8 text-right text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {Math.round(layer.opacity)}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Card data-testid='layerworks-parcel-spatial-profile' style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Radar size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Live Overlay Recipes
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                Real Benton ArcGIS layer configuration endpoints. No simulated analysis queue remains here.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {layerConfigs?.layers.map((config) => (
                <div
                  key={config.Id ?? config.Name}
                  className='rounded-lg p-3'
                  style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))' }}
                >
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <p className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                        {config.Name}
                      </p>
                      <p className='mt-1 text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {config.GeometryType ?? 'unknown'} · {(config.SpatialCapabilities ?? []).join(', ')}
                      </p>
                    </div>
                    {config.queryUrl && (
                      <a
                        href={config.queryUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline'
                        style={{ color: 'hsl(var(--tf-suite-atlas))' }}
                      >
                        Query URL
                        <Link2 size={12} />
                      </a>
                    )}
                  </div>
                  {config.Fields && config.Fields.length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-1'>
                      {config.Fields.slice(0, 6).map((field) => (
                        <Badge key={field} variant='outline' className='text-[11px]' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                          {field}
                        </Badge>
                      ))}
                      {config.Fields.length > 6 && (
                        <Badge variant='outline' className='text-[11px]' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                          +{config.Fields.length - 6} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className='space-y-4'>
          <Card data-testid='layerworks-governed-brief' style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>
                Governed Layer Audit
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                Use Atlas to explain layer conflicts and geometry drift. Route county calibration to TerraForge and parcel corrections to Workbench.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <label className='space-y-1 text-sm'>
                <span className='block text-xs font-medium uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Audit Metric
                </span>
                <select
                  value={auditMetric}
                  onChange={(event) => setAuditMetric(event.target.value as AuditMetric)}
                  className='w-full rounded-md border border-border bg-background px-3 py-2 text-sm'
                >
                  <option value='boundary'>Boundary Mismatch</option>
                  <option value='uniformity'>Uniformity Drift</option>
                  <option value='zoning'>Zoning Conflict</option>
                </select>
              </label>
              <Button type='button' onClick={runGovernedLayerAudit}>
                {layerAudit.status === 'loading' ? 'Running Audit…' : 'Explain Layer Anomaly'}
              </Button>

              {layerAudit.status === 'success' && layerAudit.result && (
                <div className='rounded-lg border p-3 text-sm' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}>
                  <p style={{ color: 'hsl(var(--tf-fg))' }}>{layerAudit.result.narrative}</p>
                  <p className='mt-2' style={{ color: 'hsl(var(--tf-muted))' }}>Hotspots: {layerAudit.result.hotspotCount}</p>
                  <p className='mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>{layerAudit.result.recommendedAction}</p>
                  {layerAudit.correlationId && (
                    <p className='mt-2 font-mono text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                      Correlation: {layerAudit.correlationId}
                    </p>
                  )}
                </div>
              )}

              {layerAudit.status === 'error' && (
                <div className='rounded-lg border p-3 text-sm' style={{ borderColor: 'hsl(var(--tf-suite-dossier) / 0.4)', color: 'hsl(var(--tf-suite-dossier))' }}>
                  {layerAudit.error}
                </div>
              )}
            </CardContent>
          </Card>

          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Network size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Parcel Spatial Profile
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                Real overlay workflow for one parcel. LayerWorks assembles the live intersection steps; Workbench still owns actual parcel repair.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex gap-2'>
                <Input
                  value={profileParcelId}
                  onChange={(event) => setProfileParcelId(event.target.value)}
                  placeholder='Parcel ID'
                  style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                />
                <Button type='button' onClick={runParcelSpatialProfile}>
                  {profileState === 'loading' ? 'Loading…' : 'Load Workflow'}
                </Button>
              </div>

              {profileState === 'error' && profileError && (
                <div className='rounded-lg border p-3 text-sm' style={{ borderColor: 'hsl(var(--tf-suite-dossier) / 0.4)', color: 'hsl(var(--tf-suite-dossier))' }}>
                  {profileError}
                </div>
              )}

              {spatialProfile && (
                <div className='space-y-3'>
                  <div className='rounded-lg border p-3 text-sm' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}>
                    <p style={{ color: 'hsl(var(--tf-fg))' }}>
                      Workflow: {spatialProfile.workflow} for {spatialProfile.parcelId}
                    </p>
                    <p className='mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>
                      {spatialProfile.source}
                    </p>
                  </div>

                  {spatialProfile.steps.map((step) => (
                    <div
                      key={step.step}
                      className='rounded-lg p-3'
                      style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))' }}
                    >
                      <p className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                        Step {step.step}: {step.action}
                      </p>
                      {step.url && (
                        <a
                          href={step.url}
                          target='_blank'
                          rel='noreferrer'
                          className='mt-2 inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline'
                          style={{ color: 'hsl(var(--tf-suite-atlas))' }}
                        >
                          Open live query
                          <ExternalLink size={12} />
                        </a>
                      )}
                      {step.overlayCount && (
                        <p className='mt-2 text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                          Overlay count: {step.overlayCount}
                        </p>
                      )}
                      {step.overlays && step.overlays.length > 0 && (
                        <div className='mt-2 space-y-2'>
                          {step.overlays.slice(0, 6).map((overlay) => (
                            <div key={overlay.layerId} className='rounded border border-white/10 p-2 text-xs'>
                              <p style={{ color: 'hsl(var(--tf-fg))' }}>{overlay.layerName}</p>
                              <p className='mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>{overlay.note}</p>
                            </div>
                          ))}
                          {step.overlays.length > 6 && (
                            <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                              +{step.overlays.length - 6} more live overlay queries available
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className='rounded-lg border p-3 text-xs' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-muted))' }}>
                    Expected outputs: {Object.keys(spatialProfile.expectedResults).join(', ')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>
                Layer Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {[
                ['Total Layers', layers.length.toString()],
                ['Active Layers', enabledCount.toString()],
                ['Recipe Count', (layerConfigs?.count ?? 0).toString()],
                ['Data Sources', [...new Set(layers.map((layer) => layer.source))].length.toString()],
              ].map(([label, value]) => (
                <div key={label} className='flex justify-between py-1' style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.5)' }}>
                  <span className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>{label}</span>
                  <span className='text-sm font-mono font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{value}</span>
                </div>
              ))}
              <p className='pt-2 text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                LayerWorks now uses live Benton ArcGIS layer metadata and live parcel overlay workflow assembly only. No simulated analysis jobs remain.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
