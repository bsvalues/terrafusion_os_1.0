/**
 * TerraPrint Module -- Live Atlas Print Packets
 * ===================================================================
 * Constitutional module of TerraAtlas (Article V Section 5.1).
 * Owns: printable Benton County GIS packets built from live Atlas evidence.
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
import { Separator } from '@/components/ui/separator';
import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileText,
  Globe,
  Layers3,
  Printer,
} from 'lucide-react';
import {
  atlasService,
  type LiveAtlasExportLayer,
  type ParcelLensRecord,
  type ParcelSpatialProfileResponse,
} from '@/services/atlasService';

type PaperSize = 'letter' | 'legal' | 'tabloid' | 'a3' | 'a4';
type Orientation = 'portrait' | 'landscape';

interface PrintTemplateProfile {
  id: string;
  name: string;
  description: string;
  paperSize: PaperSize;
  orientation: Orientation;
  sections: string[];
}

interface GeneratedPrintPacket {
  id: string;
  filename: string;
  createdAt: string;
  fileSizeLabel: string;
  targetLabel: string;
  source: string;
  downloadUrl: string;
}

const TEMPLATE_PROFILES: PrintTemplateProfile[] = [
  {
    id: 'field-card',
    name: 'Field Inspection Card',
    description: 'Parcel facts, selected layer context, and GIS workflow steps for field review.',
    paperSize: 'letter',
    orientation: 'landscape',
    sections: ['Parcel Facts', 'Layer Evidence', 'Spatial Workflow', 'Notes'],
  },
  {
    id: 'parcel-report',
    name: 'Full Parcel Report',
    description: 'Printable parcel evidence packet with valuation-facing GIS context.',
    paperSize: 'letter',
    orientation: 'portrait',
    sections: ['Parcel Facts', 'Value Summary', 'Layer Evidence', 'Spatial Workflow'],
  },
  {
    id: 'neighborhood-map',
    name: 'Neighborhood Map',
    description: 'County or neighborhood packet with live layer and ArcGIS query lineage.',
    paperSize: 'tabloid',
    orientation: 'landscape',
    sections: ['Map Context', 'Layer Evidence', 'ArcGIS Links', 'Routing'],
  },
];

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCurrency(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Unavailable';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPrintPacketHtml(input: {
  title: string;
  template: PrintTemplateProfile;
  layer: LiveAtlasExportLayer;
  packetTarget: string;
  parcelRecord: ParcelLensRecord | null;
  spatialProfile: ParcelSpatialProfileResponse | null;
  generatedAt: Date;
}) {
  const { title, template, layer, packetTarget, parcelRecord, spatialProfile, generatedAt } = input;
  const generatedLabel = generatedAt.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const layerCount =
    typeof layer.featureCount === 'number' ? layer.featureCount.toLocaleString() : 'Unavailable';
  const spatialSteps = spatialProfile?.steps ?? [];

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: "Segoe UI", Arial, sans-serif; margin: 32px; color: #0f172a; }
      h1, h2, h3 { margin: 0 0 8px; }
      h1 { font-size: 24px; }
      h2 { font-size: 18px; margin-top: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
      p, li { line-height: 1.5; }
      ul { padding-left: 18px; }
      .meta { color: #475569; font-size: 13px; margin-bottom: 16px; }
      .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-top: 16px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .label { color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
      .value { font-size: 14px; font-weight: 600; }
      .muted { color: #64748b; }
      @media print { body { margin: 16px; } }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p class="meta">TerraAtlas live print packet · Benton County, Washington · Generated ${escapeHtml(generatedLabel)}</p>

    <div class="card">
      <div class="grid">
        <div>
          <div class="label">Target</div>
          <div class="value">${escapeHtml(packetTarget)}</div>
        </div>
        <div>
          <div class="label">Template</div>
          <div class="value">${escapeHtml(template.name)}</div>
        </div>
        <div>
          <div class="label">Paper / Orientation</div>
          <div class="value">${escapeHtml(template.paperSize.toUpperCase())} / ${escapeHtml(template.orientation)}</div>
        </div>
        <div>
          <div class="label">Sections</div>
          <div class="value">${escapeHtml(template.sections.join(', '))}</div>
        </div>
      </div>
    </div>

    ${
      parcelRecord
        ? `<h2>Parcel Facts</h2>
    <div class="card">
      <div class="grid">
        <div><div class="label">Parcel ID</div><div class="value">${escapeHtml(parcelRecord.parcelId)}</div></div>
        <div><div class="label">Address</div><div class="value">${escapeHtml(parcelRecord.address || 'Unavailable')}</div></div>
        <div><div class="label">Owner</div><div class="value">${escapeHtml(parcelRecord.owner || 'Unavailable')}</div></div>
        <div><div class="label">Assessed Value</div><div class="value">${escapeHtml(formatCurrency(parcelRecord.assessedValue))}</div></div>
        <div><div class="label">Land Use</div><div class="value">${escapeHtml(parcelRecord.landUse || 'Unavailable')}</div></div>
        <div><div class="label">Zoning</div><div class="value">${escapeHtml(parcelRecord.zoning || 'Unavailable')}</div></div>
        <div><div class="label">Acreage</div><div class="value">${escapeHtml(parcelRecord.acreage?.toString() ?? 'Unavailable')}</div></div>
        <div><div class="label">Source</div><div class="value">${escapeHtml(parcelRecord.source)}</div></div>
      </div>
      <p class="muted">ArcGIS parcel query: <a href="${escapeHtml(parcelRecord.queryUrl)}">${escapeHtml(parcelRecord.queryUrl)}</a></p>
    </div>`
        : ''
    }

    <h2>Layer Evidence</h2>
    <div class="card">
      <div class="grid">
        <div><div class="label">Layer</div><div class="value">${escapeHtml(layer.name)}</div></div>
        <div><div class="label">Geometry Type</div><div class="value">${escapeHtml(layer.geometryType ?? 'Unknown')}</div></div>
        <div><div class="label">Feature Count</div><div class="value">${escapeHtml(layerCount)}</div></div>
        <div><div class="label">Fields</div><div class="value">${escapeHtml(layer.fields.slice(0, 12).join(', ') || 'Unavailable')}</div></div>
      </div>
      <p class="muted">Layer source: ${escapeHtml(layer.source)}</p>
      <p class="muted">Service URL: <a href="${escapeHtml(layer.serviceUrl)}">${escapeHtml(layer.serviceUrl)}</a></p>
      <p class="muted">Query URL: <a href="${escapeHtml(layer.queryUrl)}">${escapeHtml(layer.queryUrl)}</a></p>
    </div>

    <h2>Spatial Workflow</h2>
    <div class="card">
      ${
        spatialSteps.length > 0
          ? `<ul>${spatialSteps
              .map(
                (step) =>
                  `<li><strong>${escapeHtml(step.title)}</strong>: ${escapeHtml(step.description)}</li>`,
              )
              .join('')}</ul>`
          : '<p>No parcel-specific spatial workflow was available. This packet remains county GIS evidence only.</p>'
      }
      ${
        spatialProfile
          ? `<p class="muted">Workflow source: ${escapeHtml(spatialProfile.source)}</p>`
          : ''
      }
    </div>

    <h2>Routing</h2>
    <div class="card">
      <p>Atlas generated this printable evidence packet from live Benton GIS sources. Parcel corrections stay in Workbench, and any valuation action still routes to TerraForge after GIS verification.</p>
    </div>
  </body>
</html>`;
}

export default function TerraPrintModule() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATE_PROFILES[0].id);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('');
  const [paperSize, setPaperSize] = useState<PaperSize>(TEMPLATE_PROFILES[0].paperSize);
  const [orientation, setOrientation] = useState<Orientation>(TEMPLATE_PROFILES[0].orientation);
  const [parcelId, setParcelId] = useState('');
  const [title, setTitle] = useState('');
  const [layers, setLayers] = useState<LiveAtlasExportLayer[]>([]);
  const [loadingLayers, setLoadingLayers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedPrintPacket[]>([]);
  const [packetState, setPacketState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; filename: string; downloadUrl: string; targetLabel: string }
    | { status: 'error'; error: string }
  >({ status: 'idle' });

  useEffect(() => {
    let cancelled = false;

    async function loadLiveLayers() {
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

    void loadLiveLayers();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTemplate = useMemo(
    () => TEMPLATE_PROFILES.find((template) => template.id === selectedTemplateId) ?? TEMPLATE_PROFILES[0],
    [selectedTemplateId],
  );

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.id === selectedLayerId) ?? null,
    [layers, selectedLayerId],
  );

  const handleTemplateChange = useCallback((templateId: string) => {
    const template = TEMPLATE_PROFILES.find((entry) => entry.id === templateId);
    if (!template) return;
    setSelectedTemplateId(templateId);
    setPaperSize(template.paperSize);
    setOrientation(template.orientation);
  }, []);

  const handleGeneratePacket = useCallback(async () => {
    if (!selectedLayer) return;
    setPacketState({ status: 'loading' });

    try {
      const trimmedParcelId = parcelId.trim();
      let parcelRecord: ParcelLensRecord | null = null;
      let spatialProfile: ParcelSpatialProfileResponse | null = null;

      if (trimmedParcelId) {
        const [parcelResult, spatialResult] = await Promise.allSettled([
          atlasService.getParcelLensRecord(trimmedParcelId),
          atlasService.getParcelSpatialProfile(trimmedParcelId),
        ]);

        if (parcelResult.status === 'rejected') {
          throw parcelResult.reason instanceof Error
            ? parcelResult.reason
            : new Error('Parcel record failed to load from Atlas.');
        }

        parcelRecord = parcelResult.value;
        spatialProfile = spatialResult.status === 'fulfilled' ? spatialResult.value : null;
      }

      const generatedAt = new Date();
      const packetTarget = trimmedParcelId ? `Parcel ${trimmedParcelId}` : `County GIS review · ${selectedLayer.name}`;
      const packetTitle =
        title.trim() ||
        `${selectedTemplate.name} - ${trimmedParcelId || selectedLayer.name} - Benton County`;
      const filename = `${slugify(packetTitle)}.html`;
      const html = buildPrintPacketHtml({
        title: packetTitle,
        template: { ...selectedTemplate, paperSize, orientation },
        layer: selectedLayer,
        packetTarget,
        parcelRecord,
        spatialProfile,
        generatedAt,
      });
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);

      setPacketState({ status: 'success', filename, downloadUrl, targetLabel: packetTarget });
      setHistory((current) => [
        {
          id: `${selectedLayer.id}-${generatedAt.getTime()}`,
          filename,
          createdAt: generatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          fileSizeLabel: formatBytes(blob.size),
          targetLabel: packetTarget,
          source: selectedLayer.source,
          downloadUrl,
        },
        ...current,
      ]);
    } catch (error) {
      setPacketState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Live print packet generation failed.',
      });
    }
  }, [orientation, paperSize, parcelId, selectedLayer, selectedTemplate, title]);

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
          <Printer style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={28} />
          TerraPrint
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Live Benton print packets — real Atlas layer inventory, optional live parcel facts, no simulated queue.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-4'>
          <Card
            data-testid='terraprint-governed-brief'
            style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}
          >
            <CardHeader className='pb-2'>
              <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Globe size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Live Print Posture
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                TerraPrint now builds printable packets from live Benton layer configs and live parcel evidence. The old queued and rendering job theater has been removed.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='rounded-lg border px-3 py-2 text-xs' style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-muted))' }}>
                Print packets are emitted as downloadable HTML files so Atlas only offers output it can generate truthfully today.
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
                <FileText size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Print Templates
              </CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                Template profiles are product configuration only. The packet data still comes from live Atlas sources.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {TEMPLATE_PROFILES.map((template) => {
                  const isSelected = selectedTemplateId === template.id;
                  return (
                    <button
                      key={template.id}
                      type='button'
                      onClick={() => handleTemplateChange(template.id)}
                      className='text-left p-4 rounded-lg transition-colors'
                      style={{
                        background: isSelected ? 'hsl(var(--tf-suite-atlas) / 0.08)' : 'hsl(var(--tf-bg))',
                        border: `1px solid ${isSelected ? 'hsl(var(--tf-suite-atlas) / 0.4)' : 'hsl(var(--tf-border))'}`,
                      }}
                    >
                      <p className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{template.name}</p>
                      <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>{template.description}</p>
                      <div className='flex items-center gap-2 mt-2 flex-wrap'>
                        <Badge variant='outline' className='text-xs' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                          {template.paperSize.toUpperCase()}
                        </Badge>
                        <Badge variant='outline' className='text-xs' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                          {template.orientation}
                        </Badge>
                        <Badge variant='outline' className='text-xs' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                          {template.sections.length} sections
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Layers3 size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
                Generated Print Packets
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {history.length === 0 ? (
                <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                  No live TerraPrint packet has been generated in this session yet.
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
                        {entry.targetLabel} · {entry.fileSizeLabel} · {entry.createdAt}
                      </p>
                    </div>
                    <Button asChild variant='ghost' size='sm'>
                      <a href={entry.downloadUrl} download={entry.filename} aria-label={`Download ${entry.filename}`}>
                        <Download size={14} />
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
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Print Settings</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Report Title</label>
                <Input
                  placeholder='Optional title override'
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className='mt-1'
                  style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                />
              </div>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Parcel ID (optional)</label>
                <Input
                  placeholder='e.g. 104841000002000'
                  value={parcelId}
                  onChange={(event) => setParcelId(event.target.value)}
                  className='mt-1 font-mono'
                  style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                />
              </div>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Live Layer</label>
                <Select value={selectedLayerId} onValueChange={setSelectedLayerId}>
                  <SelectTrigger className='mt-1' style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                    <SelectValue placeholder={loadingLayers ? 'Loading live layers…' : 'Select layer'} />
                  </SelectTrigger>
                  <SelectContent>
                    {layers.map((layer) => (
                      <SelectItem key={layer.id} value={layer.id}>
                        {layer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadError && (
                  <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-error-hs) 60%)' }}>
                    {loadError}
                  </p>
                )}
              </div>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Paper Size</label>
                <Select value={paperSize} onValueChange={(value) => setPaperSize(value as PaperSize)}>
                  <SelectTrigger className='mt-1' style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='letter'>Letter (8.5 × 11)</SelectItem>
                    <SelectItem value='legal'>Legal (8.5 × 14)</SelectItem>
                    <SelectItem value='tabloid'>Tabloid (11 × 17)</SelectItem>
                    <SelectItem value='a3'>A3 (297 × 420mm)</SelectItem>
                    <SelectItem value='a4'>A4 (210 × 297mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Orientation</label>
                <Select value={orientation} onValueChange={(value) => setOrientation(value as Orientation)}>
                  <SelectTrigger className='mt-1' style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='portrait'>Portrait</SelectItem>
                    <SelectItem value='landscape'>Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator style={{ background: 'hsl(var(--tf-border))' }} className='my-2' />
              <div>
                <p className='text-xs mb-2' style={{ color: 'hsl(var(--tf-muted))' }}>Template Sections</p>
                <div className='flex flex-wrap gap-1'>
                  {selectedTemplate.sections.map((section) => (
                    <Badge key={section} variant='outline' className='text-xs' style={{ background: 'hsl(var(--tf-suite-atlas) / 0.1)', color: 'hsl(var(--tf-suite-atlas))', borderColor: 'hsl(var(--tf-suite-atlas) / 0.3)' }}>
                      {section}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedLayer && (
                <div className='rounded-lg border p-3 text-sm space-y-2' style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg))' }}>
                  <p style={{ color: 'hsl(var(--tf-fg))' }}>
                    Ready to print {selectedLayer.name}
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
                onClick={handleGeneratePacket}
                disabled={!selectedLayer || loadingLayers || packetState.status === 'loading'}
                fullWidth
                loading={packetState.status === 'loading'}
                leftIcon={<Printer size={14} />}
              >
                {packetState.status === 'loading' ? 'Generating Live Print Packet…' : 'Generate Live Print Packet'}
              </TactileButton>

              {packetState.status === 'success' && (
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
                      Live print packet ready
                    </p>
                  </div>
                  <p style={{ color: 'hsl(var(--tf-fg))' }}>
                    {packetState.filename}
                  </p>
                  <p style={{ color: 'hsl(var(--tf-muted))' }}>
                    Target: {packetState.targetLabel}
                  </p>
                  <Button asChild variant='outline' size='sm'>
                    <a href={packetState.downloadUrl} download={packetState.filename}>
                      Download Print Packet
                    </a>
                  </Button>
                </div>
              )}

              {packetState.status === 'error' && (
                <div
                  className='rounded-lg border p-3 text-sm'
                  style={{
                    borderColor: 'hsl(var(--tf-suite-dossier) / 0.35)',
                    color: 'hsl(var(--tf-suite-dossier))',
                  }}
                >
                  {packetState.error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
