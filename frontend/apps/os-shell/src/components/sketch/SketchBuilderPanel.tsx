// TerraFusion OS — Tier 1: Basic Sketch Builder
// Harvested from terra-forge-rebuild
// Orthogonal wall drawing tool with snap-to-grid, area computation, component tagging

import { useState, useRef, useCallback, useEffect } from "react";
import {
  MousePointer2, Minus, Eraser, Tag, Undo2, Redo2,
  Grid3x3, Save, Calculator, ZoomIn, ZoomOut, RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import type {
  WallSegment, ComponentArea, ComponentType, SketchToolId,
  MeasurementMethod,
} from "@/types/sketch";

interface SketchBuilderPanelProps {
  onSave: (data: Record<string, unknown>, method: MeasurementMethod) => void;
  saving: boolean;
  currentGLA?: number;
}

const COMPONENT_TYPES: { value: ComponentType; label: string; color: string }[] = [
  { value: "living", label: "Living", color: "hsl(var(--primary))" },
  { value: "garage", label: "Garage", color: "hsl(var(--chart-2))" },
  { value: "porch", label: "Porch", color: "hsl(var(--chart-3))" },
  { value: "deck", label: "Deck", color: "hsl(var(--chart-4))" },
  { value: "basement", label: "Basement", color: "hsl(var(--chart-5))" },
  { value: "outbuilding", label: "Outbuilding", color: "hsl(var(--chart-1))" },
];

const GRID_SIZE = 20; // pixels per grid unit (1 foot)

export function SketchBuilderPanel({ onSave, saving, currentGLA }: SketchBuilderPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [segments, setSegments] = useState<WallSegment[]>([]);
  const [components, setComponents] = useState<ComponentArea[]>([]);
  const [activeTool, setActiveTool] = useState<SketchToolId>("wall");
  const [snapGrid, setSnapGrid] = useState(true);
  const [snapOrtho, setSnapOrtho] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [segmentLength, setSegmentLength] = useState("");
  const [tagType, setTagType] = useState<ComponentType>("living");
  const [history, setHistory] = useState<WallSegment[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Snap position to grid
  const snap = useCallback((x: number, y: number): { x: number; y: number } => {
    if (!snapGrid) return { x, y };
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
    };
  }, [snapGrid]);

  // Enforce orthogonal constraint
  const orthoConstrain = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
    if (!snapOrtho) return end;
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    return dx > dy
      ? { x: end.x, y: start.y }
      : { x: start.x, y: end.y };
  }, [snapOrtho]);

  // Push state to history
  const pushHistory = useCallback((newSegments: WallSegment[]) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newSegments]);
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setSegments(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setSegments(history[historyIndex + 1]);
    }
  };

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "hsla(var(--muted-foreground) / 0.1)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += GRID_SIZE * zoom) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += GRID_SIZE * zoom) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Segments
    segments.forEach((seg) => {
      ctx.beginPath();
      ctx.moveTo(seg.startX * zoom, seg.startY * zoom);
      ctx.lineTo(seg.endX * zoom, seg.endY * zoom);
      ctx.strokeStyle = seg.id === selectedSegment
        ? "hsl(var(--primary))"
        : "hsl(var(--foreground))";
      ctx.lineWidth = seg.id === selectedSegment ? 3 : 2;
      ctx.stroke();

      // Length label
      const midX = (seg.startX + seg.endX) / 2 * zoom;
      const midY = (seg.startY + seg.endY) / 2 * zoom;
      ctx.font = "10px system-ui";
      ctx.fillStyle = "hsl(var(--primary))";
      ctx.textAlign = "center";
      ctx.fillText(`${seg.length.toFixed(1)}'`, midX, midY - 6);
    });

    // Drawing preview
    if (drawingStart && activeTool === "wall") {
      const endPoint = orthoConstrain(drawingStart, snap(mousePos.x, mousePos.y));
      ctx.beginPath();
      ctx.moveTo(drawingStart.x * zoom, drawingStart.y * zoom);
      ctx.lineTo(endPoint.x * zoom, endPoint.y * zoom);
      ctx.strokeStyle = "hsl(var(--primary) / 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [segments, drawingStart, mousePos, zoom, activeTool, selectedSegment, snap, orthoConstrain]);

  // Canvas mouse handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const pos = snap(
      (e.clientX - rect.left) / zoom,
      (e.clientY - rect.top) / zoom
    );

    if (activeTool === "wall") {
      if (!drawingStart) {
        setDrawingStart(pos);
      } else {
        const endPoint = orthoConstrain(drawingStart, pos);
        const dx = endPoint.x - drawingStart.x;
        const dy = endPoint.y - drawingStart.y;
        const pixelLength = Math.sqrt(dx * dx + dy * dy);
        const feetLength = pixelLength / GRID_SIZE;

        if (feetLength > 0.5) {
          const newSeg: WallSegment = {
            id: crypto.randomUUID(),
            startX: drawingStart.x,
            startY: drawingStart.y,
            endX: endPoint.x,
            endY: endPoint.y,
            length: Math.round(feetLength * 10) / 10,
            method: "pencil_draw",
            locked: false,
            estimated: false,
          };
          const newSegments = [...segments, newSeg];
          setSegments(newSegments);
          pushHistory(newSegments);
          setDrawingStart(endPoint); // chain walls
        }
      }
    } else if (activeTool === "select") {
      const nearest = segments.find((seg) => {
        const dist = pointToSegmentDist(pos.x, pos.y, seg);
        return dist < 10;
      });
      setSelectedSegment(nearest?.id ?? null);
      if (nearest) setSegmentLength(nearest.length.toString());
    } else if (activeTool === "erase") {
      const nearest = segments.find((seg) => {
        return pointToSegmentDist(pos.x, pos.y, seg) < 10;
      });
      if (nearest) {
        const newSegments = segments.filter((s) => s.id !== nearest.id);
        setSegments(newSegments);
        pushHistory(newSegments);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    });
  };

  const handleCanvasDoubleClick = () => {
    setDrawingStart(null);
  };

  // Update segment length from input
  const updateSelectedLength = () => {
    if (!selectedSegment || !segmentLength) return;
    const len = parseFloat(segmentLength);
    if (isNaN(len) || len <= 0) return;

    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== selectedSegment) return seg;
        const dx = seg.endX - seg.startX;
        const dy = seg.endY - seg.startY;
        const currentLen = Math.sqrt(dx * dx + dy * dy);
        const scale = (len * GRID_SIZE) / currentLen;
        return {
          ...seg,
          endX: seg.startX + dx * scale,
          endY: seg.startY + dy * scale,
          length: len,
          locked: true,
        };
      })
    );
  };

  // Compute total area from closed polygon (shoelace formula)
  const computeArea = (): number => {
    if (segments.length < 3) return 0;
    const points = segments.map((s) => ({ x: s.startX / GRID_SIZE, y: s.startY / GRID_SIZE }));
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  };

  const totalArea = computeArea();
  const delta = currentGLA ? totalArea - currentGLA : null;

  const handleSave = () => {
    onSave(
      {
        _sketchMode: "sketch",
        segments: segments.map(({ id, startX, startY, endX, endY, length, method, locked, estimated, label }) => ({
          id, startX, startY, endX, endY, length, method, locked, estimated, label,
        })),
        components,
        closedPolygon: segments.length >= 3,
        derivedGLA: Math.round(totalArea),
        derivedPerimeter: segments.reduce((sum, s) => sum + s.length, 0),
        componentBreakdown: {},
      },
      "pencil_draw"
    );
  };

  const tools: { id: SketchToolId; icon: React.ReactNode; label: string }[] = [
    { id: "select", icon: <MousePointer2 className="w-4 h-4" />, label: "Select" },
    { id: "wall", icon: <Minus className="w-4 h-4" />, label: "Wall" },
    { id: "erase", icon: <Eraser className="w-4 h-4" />, label: "Erase" },
    { id: "tag_component", icon: <Tag className="w-4 h-4" />, label: "Tag" },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="border-border/50">
        <CardContent className="p-2 flex items-center gap-1 flex-wrap">
          {tools.map((t) => (
            <Toggle
              key={t.id}
              pressed={activeTool === t.id}
              onPressedChange={() => {
                setActiveTool(t.id);
                setDrawingStart(null);
              }}
              size="sm"
              className="text-xs gap-1"
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </Toggle>
          ))}

          <div className="h-6 w-px bg-border mx-1" />

          <Toggle pressed={snapGrid} onPressedChange={setSnapGrid} size="sm" className="text-xs gap-1">
            <Grid3x3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grid</span>
          </Toggle>
          <Toggle pressed={snapOrtho} onPressedChange={setSnapOrtho} size="sm" className="text-xs gap-1">
            90°
          </Toggle>

          <div className="h-6 w-px bg-border mx-1" />

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo}>
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo}>
            <Redo2 className="w-3.5 h-3.5" />
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            setSegments([]);
            setComponents([]);
            setDrawingStart(null);
            setHistory([[]]);
            setHistoryIndex(0);
          }}>
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card className="border-border/50 overflow-hidden">
        <div className="relative bg-background">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full cursor-crosshair touch-none"
            style={{ aspectRatio: "3/2" }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onDoubleClick={handleCanvasDoubleClick}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              const rect = canvasRef.current!.getBoundingClientRect();
              const pos = snap(
                (touch.clientX - rect.left) / zoom,
                (touch.clientY - rect.top) / zoom
              );
              if (activeTool === "wall") {
                if (!drawingStart) {
                  setDrawingStart(pos);
                } else {
                  handleCanvasMouseDown({
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                  } as React.MouseEvent<HTMLCanvasElement>);
                }
              }
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              setMousePos({
                x: (touch.clientX - canvasRef.current!.getBoundingClientRect().left) / zoom,
                y: (touch.clientY - canvasRef.current!.getBoundingClientRect().top) / zoom,
              });
            }}
          />

          {/* Drawing hint */}
          {activeTool === "wall" && (
            <div className="absolute top-2 left-2 text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded">
              {drawingStart ? "Click to place wall · Double-click to end chain" : "Click to start drawing walls"}
            </div>
          )}
        </div>
      </Card>

      {/* Selected Segment Editor */}
      {selectedSegment && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-end gap-3">
            <div className="flex-1">
              <Label className="text-[10px] text-muted-foreground">Wall Length (ft)</Label>
              <Input
                type="number"
                value={segmentLength}
                onChange={(e) => setSegmentLength(e.target.value)}
                onBlur={updateSelectedLength}
                onKeyDown={(e) => e.key === "Enter" && updateSelectedLength()}
                className="h-8 text-xs"
              />
            </div>
            <Badge variant="outline" className="text-[9px] mb-1">
              {segments.find((s) => s.id === selectedSegment)?.locked ? "🔒 Locked" : "Measured"}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Component Tagger */}
      {activeTool === "tag_component" && (
        <Card className="border-border/50">
          <CardContent className="p-3">
            <Label className="text-xs text-muted-foreground mb-2 block">Tag enclosed area as:</Label>
            <div className="flex flex-wrap gap-1.5">
              {COMPONENT_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setTagType(ct.value)}
                  className={`px-2.5 py-1 rounded text-[10px] border transition-colors ${
                    tagType === ct.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 text-muted-foreground"
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Area Summary */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  GLA: {Math.round(totalArea).toLocaleString()} sqft
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {segments.length} walls · {segments.reduce((s, w) => s + w.length, 0).toFixed(0)}' perimeter
                </p>
                {delta !== null && (
                  <p className={`text-[10px] ${Math.abs(delta) / (currentGLA || 1) > 0.15 ? "text-destructive" : "text-muted-foreground"}`}>
                    Δ {delta > 0 ? "+" : ""}{Math.round(delta).toLocaleString()} sqft from record
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving || segments.length === 0} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Saving..." : "Save Sketch"}
      </Button>
    </div>
  );
}

// ── Geometry Helpers ──────────────────────────────────────────────
function pointToSegmentDist(px: number, py: number, seg: WallSegment): number {
  const dx = seg.endX - seg.startX;
  const dy = seg.endY - seg.startY;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - seg.startX) ** 2 + (py - seg.startY) ** 2);
  let t = ((px - seg.startX) * dx + (py - seg.startY) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const nearX = seg.startX + t * dx;
  const nearY = seg.startY + t * dy;
  return Math.sqrt((px - nearX) ** 2 + (py - nearY) ** 2);
}
