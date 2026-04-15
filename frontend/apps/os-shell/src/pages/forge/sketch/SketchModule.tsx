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

const SAMPLE_SKETCH: SketchData = {
  parcelId: '1-0001-100-0001-00',
  buildingId: 'B001',
  label: 'Main Residence',
  totalSqft: 2150,
  stories: 1,
  yearBuilt: 1998,
  segments: [
    { id: 's1', label: 'Main', points: [{ x: 50, y: 50 }, { x: 250, y: 50 }, { x: 250, y: 200 }, { x: 50, y: 200 }], sqft: 1600, type: 'main' },
    { id: 's2', label: 'Garage', points: [{ x: 250, y: 80 }, { x: 370, y: 80 }, { x: 370, y: 200 }, { x: 250, y: 200 }], sqft: 400, type: 'garage' },
    { id: 's3', label: 'Porch', points: [{ x: 100, y: 200 }, { x: 200, y: 200 }, { x: 200, y: 240 }, { x: 100, y: 240 }], sqft: 150, type: 'porch' },
  ],
};

const SEGMENT_COLORS: Record<string, string> = {
  main: '#3b82f6',
  garage: '#6366f1',
  porch: '#10b981',
  addition: '#f59e0b',
};

export function SketchModule({ parcelId }: SketchModuleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<'view' | 'build'>('view');
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [sketch] = useState<SketchData>(SAMPLE_SKETCH);
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
        <Badge variant="outline">{sketch.parcelId}</Badge>
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
          <span className="text-muted-foreground">Loading sketch data...</span>
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
