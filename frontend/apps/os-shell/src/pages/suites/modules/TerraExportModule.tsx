/**
 * TerraExport Module -- Live Atlas Export
 * ===================================================================
 * Constitutional module of TerraAtlas (Article V Section 5.1).
 * Owns: live Benton ArcGIS layer export with truthful download lineage.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TactileButton } from '@/ui/materials';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowUpRight,
  CheckCircle2,
  Database,
  Download,
  FileDown,
  Globe,
  Layers3,
} from 'lucide-react';
import {
  atlasService,
  type AtlasExportFormat,
  type AtlasLayerExportArtifact,
  type LiveAtlasExportLayer,
} from '@/services/atlasService';

interface ExportHistoryEntry {
  id: string;
  layerName: string;
  format: AtlasExportFormat;
  featureCount: number;
  createdAt: string;
  fileSizeLabel: string;
  filename: string;
  source: string;
  downloadUrl: string;
}

const FORMAT_INFO: Record<
  AtlasExportFormat,
  { label: string; description: string; extension: string }
> = {
  geojson: {
    label: 'GeoJSON',
    description: 'Full ArcGIS geometry plus all returned attributes in GeoJSON.',
    extension: '.geojson',
  },
  csv: {
    label: 'CSV',
    description: 'Attribute export with a geometry_json column for the live layer geometry.',
    extension: '.csv',
  },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TerraExportModule() {
  const [layers, setLayers] = useState<LiveAtlasExportLayer[]>([]);
  const [loadingLayers, setLoadingLayers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('');
  const [format, setFormat] = useState<AtlasExportFormat>('geojson');
  const [exportName, setExportName] = useState('');
  const [exportState, setExportState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; artifact: AtlasLayerExportArtifact; downloadUrl: string }
    | { status: 'error'; error: string }
  >({ status: 'idle' });
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadLayers() {
      setLoadingLayers(true);
      setLoadError(null);
      try {
        const liveLayers = await atlasService.getLiveExportLayers();
        if (cancelled) return;
        setLayers(liveLayers);
        setSelectedLayerId((current) => current || liveLayers[0]?.id || '');
      } catch (error) {
        if (cancelled) return;
        setLayers([]);
        setLoadError(error instanceof Error ? error.message : 'Atlas layer inventory failed to load.');
      } finally {
        if (!cancelled) setLoadingLayers(false);
      }
    }

    void loadLayers();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedLayerId) ?? null,
    [layers, selectedLayerId],
  );

  const handleExport = useCallback(async () => {
    if (!selectedLayer) return;
    setExportState({ status: 'loading' });

    try {
      const artifact = await atlasService.exportAtlasLayer(selectedLayer, format);
      const downloadUrl = URL.createObjectURL(artifact.blob);
      const filename = exportName.trim()
        ? `${exportName.trim().replace(/[^a-zA-Z0-9-_]+/g, '-')}${FORMAT_INFO[format].extension}`
        : artifact.filename;

      setExportState({ status: 'success', artifact: { ...artifact, filename }, downloadUrl });
      setHistory((current) => [
        {
          id: `${selectedLayer.id}-${Date.now()}`,
          layerName: selectedLayer.name,
          format,
          featureCount: artifact.featureCount,
          createdAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          fileSizeLabel: formatBytes(artifact.blob.size),
          filename,
          source: artifact.source,
          downloadUrl,
        },
        ...current,
      ]);
    } catch (error) {
      setExportState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Live Atlas export failed.',
      });
    }
  }, [exportName, format, selectedLayer]);

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
          <Download style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={28} />
          TerraExport
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Live Benton layer export — real ArcGIS inventory, real download artifacts, no simulated job queue.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-4'>
          <Card
            data-testid='terraexport-governed-brief'
            style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}
          >
            <CardHeader className='pb-2'>
              <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Globe size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Live Export Posture
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                TerraExport now operates only on live Benton ArcGIS layer configs and emits real downloadable files. Unsupported fake formats and simulated queue states were removed.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='rounded-lg border px-3 py-2 text-xs' style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-muted))' }}>
                Available formats are limited to what Atlas can generate truthfully today: GeoJSON and CSV.
              </div>
              {selectedLayer && (
                <div
                  className='rounded-lg border p-3 text-sm space-y-2'
                  style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}
                >
                  <p style={{ color: 'hsl(var(--tf-fg))' }}>
                    Selected layer: {selectedLayer.name}
                  </p>
                  <p style={{ color: 'hsl(var(--tf-muted))' }}>
                    Feature count: {typeof selectedLayer.featureCount === 'number'
                      ? selectedLayer.featureCount.toLocaleString()
                      : 'Unavailable from live service'}
                  </p>
                  <p style={{ color: 'hsl(var(--tf-muted))' }}>
                    Fields: {selectedLayer.fields.length}
                  </p>
                  <a
                    href={selectedLayer.queryUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex items-center gap-1 text-sm'
                    style={{ color: 'hsl(var(--tf-suite-atlas))' }}
                  >
                    Open live ArcGIS query
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Layers3 size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Live Layer Inventory
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                Select a Benton layer to export directly from the live Atlas ArcGIS inventory.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              {loadingLayers ? (
                <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Loading live Benton export layers…
                </p>
              ) : loadError ? (
                <div
                  className='rounded-lg border p-3 text-sm'
                  style={{ borderColor: 'hsl(var(--tf-suite-dossier) / 0.4)', color: 'hsl(var(--tf-suite-dossier))' }}
                >
                  {loadError}
                </div>
              ) : (
                layers.map((layer) => {
                  const isSelected = selectedLayerId === layer.id;
                  return (
                    <button
                      key={layer.id}
                      type='button'
                      onClick={() => setSelectedLayerId(layer.id)}
                      className='w-full rounded-lg border p-3 text-left transition-colors'
                      style={{
                        borderColor: isSelected ? 'rgba(32,212,200,0.4)' : 'hsl(var(--tf-border))',
                        background: isSelected ? 'rgba(32,212,200,0.08)' : 'hsl(var(--tf-bg))',
                      }}
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <div>
                          <p className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                            {layer.name}
                          </p>
                          <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>
                            {layer.geometryType ?? 'Unknown geometry'} · {layer.fields.length} fields
                          </p>
                        </div>
                        <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                          {typeof layer.featureCount === 'number'
                            ? `${layer.featureCount.toLocaleString()} features`
                            : 'Live count unavailable'}
                        </Badge>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Database size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Export History
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {history.length === 0 ? (
                <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  No live Atlas export has been generated in this session yet.
                </p>
              ) : (
                history.map((entry) => (
                  <div
                    key={entry.id}
                    className='flex items-center justify-between gap-3 rounded-lg border p-3'
                    style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}
                  >
                    <div>
                      <p className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                        {entry.filename}
                      </p>
                      <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {entry.layerName} · {entry.featureCount.toLocaleString()} features · {entry.fileSizeLabel} · {entry.createdAt}
                      </p>
                    </div>
                    <Button asChild variant='ghost' size='sm'>
                      <a href={entry.downloadUrl} download={entry.filename} aria-label={`Download ${entry.filename}`}>
                        <FileDown size={14} />
                      </a>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className='space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>
                Export Settings
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Export Name
                </label>
                <Input
                  placeholder='Optional file prefix'
                  value={exportName}
                  onChange={(event) => setExportName(event.target.value)}
                  className='mt-1'
                  style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                />
              </div>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                  Format
                </label>
                <Select value={format} onValueChange={(value) => setFormat(value as AtlasExportFormat)}>
                  <SelectTrigger className='mt-1' style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FORMAT_INFO).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-muted) / 0.7)' }}>
                  {FORMAT_INFO[format].description}
                </p>
              </div>

              {selectedLayer && (
                <div className='rounded-lg border p-3 text-sm space-y-2' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}>
                  <p style={{ color: 'hsl(var(--tf-fg))' }}>
                    Ready to export {selectedLayer.name}
                  </p>
                  <p style={{ color: 'hsl(var(--tf-muted))' }}>
                    Source: {selectedLayer.source}
                  </p>
                  <p style={{ color: 'hsl(var(--tf-muted))' }}>
                    Service: {selectedLayer.serviceUrl}
                  </p>
                </div>
              )}

              <TactileButton
                onClick={handleExport}
                disabled={!selectedLayer || loadingLayers || exportState.status === 'loading'}
                fullWidth
                loading={exportState.status === 'loading'}
                leftIcon={<Download size={14} />}
              >
                {exportState.status === 'loading' ? 'Generating Live Export…' : 'Generate Live Export'}
              </TactileButton>

              {exportState.status === 'success' && (
                <div
                  className='rounded-lg border p-3 text-sm space-y-2'
                  style={{
                    borderColor: 'hsl(var(--tf-success-hs) 45% / 0.35)',
                    background: 'hsl(var(--tf-success-hs) 45% / 0.08)',
                  }}
                >
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 size={14} style={{ color: 'hsl(var(--tf-success-hs) 45%)' }} />
                    <p style={{ color: 'hsl(var(--tf-success-hs) 45%)' }}>
                      Live export ready
                    </p>
                  </div>
                  <p style={{ color: 'hsl(var(--tf-fg))' }}>
                    {exportState.artifact.filename} · {exportState.artifact.featureCount.toLocaleString()} features
                  </p>
                  <Button asChild variant='outline' size='sm'>
                    <a href={exportState.downloadUrl} download={exportState.artifact.filename}>
                      Download Export
                    </a>
                  </Button>
                </div>
              )}

              {exportState.status === 'error' && (
                <div
                  className='rounded-lg border p-3 text-sm'
                  style={{
                    borderColor: 'hsl(var(--tf-suite-dossier) / 0.35)',
                    color: 'hsl(var(--tf-suite-dossier))',
                  }}
                >
                  {exportState.error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
