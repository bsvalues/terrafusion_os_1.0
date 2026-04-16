/**
 * SketchModule.tsx (TFR-072)
 *
 * Sketch page — two modes:
 *   View: Canvas-based building sketch viewer (pan/zoom/segment display).
 *   Build: 3-tier interactive builder (Measurement Plan, Sketch Builder, Plan Trace).
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SketchModule as SketchBuilder } from '@/components/sketch';
import { addObservation } from '@/services/fieldStoreV2';
import type { SketchObservation } from '@/components/sketch';

interface SketchData {
  parcelId: string;
  buildingId: string;
  label: string;
  totalSqft: number;
  stories: number;
  yearBuilt: number;
  segments: SketchSegment[];
}

interface SketchSegment {
  id: string;
  label: string;
  points: Array<{ x: number; y: number }>;
  sqft: number;
  type: 'main' | 'garage' | 'porch' | 'addition';
}

interface SketchModuleProps {
  parcelId?: string;
}

// ── API response shape ────────────────────────────────────────────
interface ApiSketchSegment {
  id: string;
  label: string;
  typeCode: string | null;
  sqft: number;
  conditionCode: string | null;
  length: number | null;
  width: number | null;
  yearBuilt: number | null;
  numStories: number | null;
  hasSketchCommands: boolean;
}

interface ApiBuilding {
  buildingId: string;
  label: string;
  typeCode: string | null;
  isPrimary: boolean;
  totalSqft: number;
  yearBuilt: number;
  segments: ApiSketchSegment[];
}

interface ApiSketchResult {
  parcelNumber: string;
  sketchUrl: string | null;
  buildings: ApiBuilding[];
}

// ── Segment type inference from PACS type codes ───────────────────
const SEGMENT_TYPE_MAP: Record<string, SketchSegment['type']> = {
  HOS: 'main', GLA: 'main', LVA: 'main', LVG: 'main',
  GAR: 'garage', CTG: 'garage', BG: 'garage',
  POR: 'porch', DEC: 'porch', SCR: 'porch',
  ADD: 'addition', REM: 'addition',
};

function inferSegmentType(typeCode: string | null, idx: number): SketchSegment['type'] {
  if (typeCode && SEGMENT_TYPE_MAP[typeCode.toUpperCase()]) return SEGMENT_TYPE_MAP[typeCode.toUpperCase()];
  const fallback: SketchSegment['type'][] = ['main', 'garage', 'porch', 'addition'];
  return fallback[Math.min(idx, 3)];
}

// ── Layout builder: auto-positions segments from area/dimensions ──
function mapApiToSketchData(parcelId: string, building: ApiBuilding): SketchData {
  const SCALE = 1.2;
  const GAP = 8;
  const CANVAS_W = 480;
  let cursor = { x: 20, y: 20 };
  let rowMaxH = 0;

  const segments: SketchSegment[] = building.segments.map((seg, i) => {
    const sqft = seg.sqft || 0;
    let w: number, h: number;
    if (seg.width && seg.length) {
      w = Math.max(seg.width * SCALE, 30);
      h = Math.max(seg.length * SCALE, 20);
    } else if (sqft > 0) {
      const aspect = i === 0 ? 1.5 : 1.1;
      w = Math.max(Math.sqrt(sqft * aspect) * SCALE * 0.65, 30);
      h = Math.max((sqft / Math.sqrt(sqft * aspect)) * SCALE * 0.65, 20);
    } else {
      w = 60; h = 40;
    }
    if (cursor.x + w > CANVAS_W) {
      cursor = { x: 20, y: cursor.y + rowMaxH + GAP };
      rowMaxH = 0;
    }
    const x0 = cursor.x, y0 = cursor.y;
    rowMaxH = Math.max(rowMaxH, h);
    cursor = { x: cursor.x + w + GAP, y: cursor.y };
    return {
      id: seg.id,
      label: seg.label,
      points: [{ x: x0, y: y0 }, { x: x0 + w, y: y0 }, { x: x0 + w, y: y0 + h }, { x: x0, y: y0 + h }],
      sqft,
      type: inferSegmentType(seg.typeCode, i),
    };
  });

  return {
    parcelId,
    buildingId: building.buildingId,
    label: building.label,
    totalSqft: building.totalSqft,
    stories: 1,
    yearBuilt: building.yearBuilt || 0,
    segments,
  };
}

const PLACEHOLDER_SKETCH: SketchData = {
  parcelId: '',
  buildingId: '',
  label: 'No sketch data',
  totalSqft: 0,
  stories: 1,
  yearBuilt: 0,
  segments: [],
};

const SEGMENT_COLORS: Record<string, string> = {
  main: '#3b82f6',
  garage: '#6366f1',
  porch: '#10b981',
  addition: '#f59e0b',
};

const API_BASE = `http://localhost:${(globalThis as Record<string, unknown>).TF_API_PORT ?? 5046}`;

export function SketchModule({ parcelId }: SketchModuleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<'view' | 'build'>('view');
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [sketch, setSketch] = useState<SketchData>(PLACEHOLDER_SKETCH);
  const [sketchImageUrl, setSketchImageUrl] = useState<string | null>(null);
  const [apiData, setApiData] = useState<ApiSketchResult | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const drawSketch = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < 500; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 400);
      ctx.stroke();
    }
    for (let y = 0; y < 400; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(500, y);
      ctx.stroke();
    }

    // Draw segments
    sketch.segments.forEach(seg => {
      const color = SEGMENT_COLORS[seg.type] || '#94a3b8';
      const isSelected = selectedSegment === seg.id;

      ctx.fillStyle = isSelected ? `${color}40` : `${color}20`;
      ctx.strokeStyle = isSelected ? color : `${color}80`;
      ctx.lineWidth = isSelected ? 3 : 1.5;

      ctx.beginPath();
      seg.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Label
      const cx = seg.points.reduce((s, p) => s + p.x, 0) / seg.points.length;
      const cy = seg.points.reduce((s, p) => s + p.y, 0) / seg.points.length;
      ctx.fillStyle = '#1e293b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(seg.label, cx, cy - 6);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${seg.sqft} sq ft`, cx, cy + 8);
    });

    // Dimensions
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    const mainSeg = sketch.segments[0];
    if (mainSeg) {
      const minX = Math.min(...mainSeg.points.map(p => p.x));
      const maxX = Math.max(...mainSeg.points.map(p => p.x));
      const minY = Math.min(...mainSeg.points.map(p => p.y));
      const maxY = Math.max(...mainSeg.points.map(p => p.y));

      ctx.beginPath();
      ctx.moveTo(minX, maxY + 15);
      ctx.lineTo(maxX, maxY + 15);
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${maxX - minX}'`, (minX + maxX) / 2, maxY + 25);
    }
    ctx.setLineDash([]);

    ctx.restore();
  }, [sketch, zoom, panOffset, selectedSegment]);

  useEffect(() => {
    drawSketch();
  }, [drawSketch]);

  // ── Fetch real sketch data from backend ──────────────────────────
  useEffect(() => {
    if (!parcelId) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/properties/parcel/${encodeURIComponent(parcelId)}/sketch`)
      .then(async r => {
        if (!r.ok) throw new Error(`Sketch fetch failed: ${r.status}`);
        return r.json() as Promise<ApiSketchResult>;
      })
      .then(data => {
        setApiData(data);
        setSketchImageUrl(data.sketchUrl ?? null);
        const primary = data.buildings.find(b => b.isPrimary) ?? data.buildings[0];
        if (primary) setSketch(mapApiToSketchData(parcelId, primary));
      })
      .catch(err => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [parcelId]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => { setZoom(1); setPanOffset({ x: 0, y: 0 }); };

  const handleSaveObservation = useCallback(async (obs: SketchObservation) => {
    await addObservation({
      assignmentId: obs.parcelId,
      parcelId: obs.parcelId,
      type: obs.type as 'measurement',
      timestamp: obs.timestamp,
      latitude: obs.latitude,
      longitude: obs.longitude,
      data: obs.data,
    });
  }, []);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Building Sketch</h1>
        <div className="flex items-center gap-2">
          {sketch.totalSqft > 0 && (
            <Badge variant="secondary" className="font-mono">{sketch.totalSqft.toLocaleString()} sq ft</Badge>
          )}
          <Badge variant="outline">{parcelId ?? sketch.parcelId}</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'view' | 'build')}>
        <TabsList>
          <TabsTrigger value="view">View</TabsTrigger>
          <TabsTrigger value="build">Build / Measure</TabsTrigger>
        </TabsList>

        <TabsContent value="build" className="mt-4">
          {parcelId ? (
            <SketchBuilder
              parcelId={parcelId}
              currentGLA={apiData?.buildings?.find(b => b.isPrimary)?.totalSqft
                ?? apiData?.buildings?.[0]?.totalSqft}
              onBack={() => setActiveTab('view')}
              onSaveObservation={handleSaveObservation}
            />
          ) : (
            <div className="p-6 text-center text-muted-foreground text-sm">Select a parcel to use the sketch builder.</div>
          )}
        </TabsContent>

        <TabsContent value="view" className="mt-4">
      {error && (
        <div className="p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground">Loading sketch data…</span>
        </div>
      ) : sketchImageUrl ? (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground bg-muted/40 rounded px-3 py-1.5">
            Scanned sketch on file — {sketch.label} · {sketch.totalSqft > 0 ? `${sketch.totalSqft.toLocaleString()} sq ft` : 'area unknown'}
          </div>
          <img
            src={sketchImageUrl}
            alt={`Parcel sketch for ${parcelId}`}
            className="w-full max-h-[500px] object-contain rounded border bg-white"
            onError={() => setSketchImageUrl(null)}
          />
        </div>
      ) : sketch.segments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <span className="text-sm">No PACS sketch data on record for this parcel.</span>
          <span className="text-xs">Use the Build tab to create a new sketch.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{sketch.label}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={handleZoomOut}>-</Button>
                    <Button size="sm" variant="outline" onClick={handleReset}>{Math.round(zoom * 100)}%</Button>
                    <Button size="sm" variant="outline" onClick={handleZoomIn}>+</Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  className="w-full border rounded cursor-grab active:cursor-grabbing bg-white"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Building Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sq Ft</span>
                  <span className="font-mono font-bold">{sketch.totalSqft.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stories</span>
                  <span className="font-mono">{sketch.stories}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year Built</span>
                  <span className="font-mono">{sketch.yearBuilt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Building ID</span>
                  <span className="font-mono">{sketch.buildingId}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sketch.segments.map(seg => (
                  <div
                    key={seg.id}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer border ${
                      selectedSegment === seg.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedSegment(selectedSegment === seg.id ? null : seg.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: SEGMENT_COLORS[seg.type] }}
                      />
                      <span className="text-sm font-medium">{seg.label}</span>
                    </div>
                    <span className="text-sm font-mono">{seg.sqft} sq ft</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      </TabsContent>
      </Tabs>
    </div>
  );
}

export default SketchModule;
