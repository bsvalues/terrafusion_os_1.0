/**
 * TerraSketch Module -- Parcel Sketch & Geometry Editing
 * ===================================================================
 * Constitutional module of TerraAtlas (Article V Section 5.1).
 * Owns: Parcel boundary editing, sketch tools, geometry validation.
 */

import { useCallback, useMemo, useState } from 'react';
import { invokeTool } from '@/api/pilotApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TactileButton } from '@/ui/materials';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { usePropertyStore } from '@/stores/propertyStore';
import {
  Crosshair, Pencil, Square, Circle, Move, Undo2, Redo2, Trash2,
  Save, Download, CheckCircle2, AlertTriangle, Ruler, Bot,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type SketchTool = 'select' | 'polygon' | 'rectangle' | 'circle' | 'line' | 'point' | 'move';

interface GeometryBrief {
  narrative: string;
  boundaryNote: string;
  routingNote: string;
}

interface SketchVertex {
  id: string;
  x: number;
  y: number;
  label?: string;
}

interface SketchHistory {
  action: string;
  timestamp: string;
  user: string;
}

interface ValidationResult {
  valid: boolean;
  area: number;
  perimeter: number;
  vertexCount: number;
  warnings: string[];
}

/* -------------------------------------------------------------------------- */
/* Tool definitions                                                            */
/* -------------------------------------------------------------------------- */

const SKETCH_TOOLS: { id: SketchTool; label: string; icon: typeof Pencil }[] = [
  { id: 'select', label: 'Select', icon: Crosshair },
  { id: 'polygon', label: 'Polygon', icon: Pencil },
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'line', label: 'Line', icon: Ruler },
  { id: 'move', label: 'Move', icon: Move },
];

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function TerraSketchModule() {
  const activeParcel = usePropertyStore((state) => state.activeParcel);
  const [activeTool, setActiveTool] = useState<SketchTool>('select');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [geoBrief, setGeoBrief] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; result?: GeometryBrief; correlationId?: string; error?: string }>({ status: 'idle' });
  const parcelId = activeParcel?.parcelId ?? '';
  const hasActiveParcel = parcelId.length > 0;
  const vertices = useMemo<SketchVertex[]>(() => [], [parcelId]);
  const history = useMemo<SketchHistory[]>(() => [], [parcelId]);
  const validation = useMemo<ValidationResult>(() => ({
    valid: false,
    area: 0,
    perimeter: 0,
    vertexCount: 0,
    warnings: [
      hasActiveParcel
        ? 'Governed boundary geometry is not available for this active parcel.'
        : 'Select an active parcel before boundary editing.',
    ],
  }), [hasActiveParcel]);
  const hasBoundaryGeometry = vertices.length > 0 && validation.vertexCount > 0;
  const canAnalyzeGeometry = hasActiveParcel && hasBoundaryGeometry;
  const canPersistGeometry = hasActiveParcel && hasBoundaryGeometry && validation.valid;

  const handleAnalyzeGeometry = useCallback(async () => {
    if (geoBrief.status === 'loading') return;
    if (!hasActiveParcel) {
      setGeoBrief({ status: 'error', error: 'Select an active parcel before geometry analysis.' });
      return;
    }
    if (!hasBoundaryGeometry) {
      setGeoBrief({ status: 'error', error: 'Governed boundary geometry is required before analysis.' });
      return;
    }
    setGeoBrief({ status: 'loading' });
    try {
      const resp = await invokeTool({
        toolId: 'analyze_sketch_geometry',
        args: {
          parcelId,
          vertexCount: vertices.length,
          area: validation.area,
          perimeter: validation.perimeter,
          warnings: validation.warnings,
        },
      });
      if (resp.success && resp.result) {
        const parsed = typeof resp.result.output === 'string'
          ? JSON.parse(resp.result.output) as GeometryBrief
          : resp.result.output as GeometryBrief;
        setGeoBrief({
          status: 'success',
          result: {
            narrative: parsed.narrative ?? 'No governed geometry analyst narrative returned.',
            boundaryNote: parsed.boundaryNote ?? 'No governed boundary finding returned.',
            routingNote: parsed.routingNote ?? 'No governed routing disposition returned.',
          },
          correlationId: resp.correlationId,
        });
      } else {
        setGeoBrief({ status: 'error', error: 'No result from AI analyst.' });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setGeoBrief({ status: 'error', error: msg });
    }
  }, [parcelId, vertices, validation, geoBrief.status, hasActiveParcel, hasBoundaryGeometry]);

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
          <Crosshair style={{ color: 'hsl(var(--tf-suite-atlas))' }} size={28} />
          TerraSketch
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Parcel geometry editing — active parcel boundary evidence required
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Toolbox */}
        <div className='space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Drawing Tools</CardTitle>
            </CardHeader>
            <CardContent className='space-y-1'>
              {SKETCH_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = tool.id === activeTool;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <Icon size={16} style={{ color: isActive ? 'hsl(var(--tf-suite-atlas))' : 'hsl(var(--tf-muted))' }} />
                    <span className='text-sm' style={{ color: isActive ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))' }}>
                      {tool.label}
                    </span>
                  </button>
                );
              })}
              <Separator style={{ background: 'hsl(var(--tf-border))' }} className='my-2' />
              <div className='flex items-center gap-2'>
                <Button variant='ghost' size='sm' title='Undo'><Undo2 size={14} /></Button>
                <Button variant='ghost' size='sm' title='Redo'><Redo2 size={14} /></Button>
                <Button variant='ghost' size='sm' title='Delete selected'><Trash2 size={14} /></Button>
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Options</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <label className='flex items-center justify-between'>
                <span className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Snap to vertices</span>
                <input type='checkbox' checked={snapEnabled} onChange={(e) => setSnapEnabled(e.target.checked)} />
              </label>
              <label className='flex items-center justify-between'>
                <span className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Show grid</span>
                <input type='checkbox' checked={gridEnabled} onChange={(e) => setGridEnabled(e.target.checked)} />
              </label>
              <div>
                <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Target Parcel</span>
                <Input
                  value={parcelId || 'No active parcel selected'}
                  readOnly
                  className='mt-1 font-mono text-sm'
                  style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}
                />
                <p className='mt-1 text-xs' style={{ color: 'hsl(var(--tf-muted) / 0.7)' }}>
                  Parcel context comes from the Property Workbench.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sketch Canvas */}
        <div className='lg:col-span-2'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardContent className='p-0'>
              {/* Canvas toolbar */}
              <div className='flex items-center justify-between p-3' style={{ borderBottom: '1px solid hsl(var(--tf-border))' }}>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' style={{ background: 'hsl(var(--tf-suite-atlas) / 0.1)', color: 'hsl(var(--tf-suite-atlas))', borderColor: 'hsl(var(--tf-suite-atlas) / 0.3)' }}>
                    {activeTool}
                  </Badge>
                  {snapEnabled && (
                    <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>SNAP</Badge>
                  )}
                  {gridEnabled && (
                    <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>GRID</Badge>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <TactileButton size='sm' leftIcon={<Save size={14} />} disabled={!canPersistGeometry}>
                    Save
                  </TactileButton>
                  <TactileButton variant='secondary' size='sm' leftIcon={<Download size={14} />} disabled={!canPersistGeometry}>
                    Export
                  </TactileButton>
                </div>
              </div>
              {/* Canvas area */}
              <div className='relative h-[480px] flex items-center justify-center' style={{ background: 'hsl(var(--tf-bg))' }}>
                <div className='text-center space-y-3'>
                  <Crosshair className='mx-auto' size={64} style={{ color: 'hsl(var(--tf-suite-atlas) / 0.3)' }} />
                  <p style={{ color: 'hsl(var(--tf-muted))' }} className='text-lg'>
                    {hasBoundaryGeometry ? 'Sketch Canvas' : 'Governed Geometry Required'}
                  </p>
                  <p style={{ color: 'hsl(var(--tf-muted) / 0.6)' }} className='text-sm'>
                    {hasActiveParcel ? `Parcel ${parcelId} · ${vertices.length} governed vertices` : 'No active parcel selected'}
                  </p>
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-muted) / 0.5)' }}>
                    {hasBoundaryGeometry
                      ? 'Boundary geometry available for editing.'
                      : 'Load active parcel boundary evidence before editing, saving, or export.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Vertices, Validation, History */}
        <div className='space-y-4'>
          {/* Validation */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                {hasBoundaryGeometry && validation.valid ? (
                  <CheckCircle2 size={16} style={{ color: 'hsl(var(--tf-success-hs) 45%)' }} />
                ) : (
                  <AlertTriangle size={16} style={{ color: 'hsl(var(--tf-error-hs) 60%)' }} />
                )}
                Validation
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {[
                ['Status', hasBoundaryGeometry ? (validation.valid ? 'Valid Geometry' : 'Invalid') : 'Unavailable'],
                ['Area', hasBoundaryGeometry ? `${validation.area.toLocaleString()} sq ft` : 'Unavailable'],
                ['Perimeter', hasBoundaryGeometry ? `${validation.perimeter.toLocaleString()} ft` : 'Unavailable'],
                ['Vertices', hasBoundaryGeometry ? validation.vertexCount.toString() : 'Unavailable'],
              ].map(([label, value]) => (
                <div key={label} className='flex justify-between py-0.5'>
                  <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{label}</span>
                  <span className='text-xs font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{value}</span>
                </div>
              ))}
              {validation.warnings.map((w, i) => (
                <div key={i} className='flex items-start gap-1.5 p-2 rounded' style={{ background: 'hsl(38 92% 50% / 0.1)' }}>
                  <AlertTriangle size={12} style={{ color: 'hsl(var(--tf-warning-hs) 50%)' }} className='mt-0.5 shrink-0' />
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-warning-hs) 50%)' }}>{w}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Vertex Table */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Vertices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-1'>
                {vertices.length > 0 ? (
                  vertices.map((v) => (
                    <div key={v.id} className='flex items-center justify-between py-1 px-2 rounded' style={{ background: 'hsl(var(--tf-bg))' }}>
                      <span className='text-xs font-mono font-bold' style={{ color: 'hsl(var(--tf-suite-atlas))' }}>{v.label}</span>
                      <span className='text-xs font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {v.y.toFixed(4)}, {v.x.toFixed(4)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className='rounded p-2 text-xs' style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-muted))' }}>
                    No governed vertices available for this parcel.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit History */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Edit History</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {history.length > 0 ? (
                history.map((h, i) => (
                  <div key={i} className='py-1' style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.3)' }}>
                    <p className='text-xs' style={{ color: 'hsl(var(--tf-fg))' }}>{h.action}</p>
                    <p className='text-xs' style={{ color: 'hsl(var(--tf-muted) / 0.6)' }}>
                      {h.timestamp} · {h.user}
                    </p>
                  </div>
                ))
              ) : (
                <div className='rounded p-2 text-xs' style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-muted))' }}>
                  No governed edit events recorded for this parcel.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Governed AI Geometry Brief */}
      <Card
        data-testid='terrasketch-governed-brief'
        style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-suite-atlas) / 0.3)' }}
      >
        <CardHeader className='pb-2'>
          <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
            <Bot size={16} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
            AI Geometry Analyst
          </CardTitle>
          <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
            Governed routing — analyze_sketch_geometry
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <Button
            size='sm'
            onClick={handleAnalyzeGeometry}
            disabled={geoBrief.status === 'loading' || !canAnalyzeGeometry}
            style={{ background: 'hsl(var(--tf-suite-atlas) / 0.15)', color: 'hsl(var(--tf-suite-atlas))', border: '1px solid hsl(var(--tf-suite-atlas) / 0.3)' }}
          >
            {geoBrief.status === 'loading' ? 'Analyzing…' : 'Analyze Geometry'}
          </Button>
          {!canAnalyzeGeometry && (
            <p className='text-xs' style={{ color: 'hsl(var(--tf-muted) / 0.7)' }}>
              Geometry analysis opens after active parcel boundary evidence is present.
            </p>
          )}
          {geoBrief.status === 'success' && geoBrief.result && (
            <div className='space-y-2 text-sm'>
              <p style={{ color: 'hsl(var(--tf-fg))' }}>{geoBrief.result.narrative}</p>
              <p style={{ color: 'hsl(var(--tf-muted))' }}><strong>Boundary:</strong> {geoBrief.result.boundaryNote}</p>
              <p style={{ color: 'hsl(var(--tf-muted))' }}><strong>Routing:</strong> {geoBrief.result.routingNote}</p>
              {geoBrief.correlationId && (
                <p className='text-xs font-mono' style={{ color: 'hsl(var(--tf-muted) / 0.5)' }}>corr: {geoBrief.correlationId}</p>
              )}
            </div>
          )}
          {geoBrief.status === 'error' && (
            <p className='text-sm' style={{ color: 'hsl(var(--tf-error-hs) 60%)' }}>{geoBrief.error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
