// TerraFusion OS — Plan Trace: PDF overlay with scale + polygon tracing
// Harvested from terra-forge-rebuild
// Tier: Plan-assisted geometry capture with provenance

import { useState, useRef, useCallback } from "react";
import {
  FileUp, Ruler, PenTool, Save, Calculator, ZoomIn, ZoomOut,
  RotateCcw, AlertTriangle, FileImage,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PlanSourceType, ScaleMethod, PlanProvenance, ComponentType } from "@/types/sketch";

interface PlanTracePanelProps {
  onSave: (data: Record<string, unknown>) => void;
  saving: boolean;
  currentGLA?: number;
}

interface TracePoint {
  x: number;
  y: number;
}

const SOURCE_TYPES: { value: PlanSourceType; label: string }[] = [
  { value: "permit_packet", label: "Permit Packet" },
  { value: "mls", label: "MLS Listing" },
  { value: "builder", label: "Builder Plans" },
  { value: "assessor_archive", label: "Assessor Archive" },
  { value: "autocad_export", label: "AutoCAD Export" },
  { value: "other", label: "Other" },
];

export function PlanTracePanel({ onSave, saving, currentGLA }: PlanTracePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plan image state
  const [planImage, setPlanImage] = useState<HTMLImageElement | null>(null);
  const [planFileName, setPlanFileName] = useState("");
  const [pdfPlaceholder, setPdfPlaceholder] = useState(false);

  // Scale state
  const [scaleMode, setScaleMode] = useState<"none" | "setting" | "set">("none");
  const [scalePoint1, setScalePoint1] = useState<TracePoint | null>(null);
  const [scalePoint2, setScalePoint2] = useState<TracePoint | null>(null);
  const [scaleKnownDist, setScaleKnownDist] = useState("");
  const [scalePixelsPerFoot, setScalePixelsPerFoot] = useState(0);
  const [scaleMethod] = useState<ScaleMethod>("two_point");

  // Trace state
  const [tracing, setTracing] = useState(false);
  const [tracePoints, setTracePoints] = useState<TracePoint[]>([]);
  const [zoom, setZoom] = useState(1);

  // Provenance
  const [sourceType, setSourceType] = useState<PlanSourceType>("permit_packet");

  // Component tagging
  const [componentType] = useState<ComponentType>("living");

  // Handle plan upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPlanFileName(file.name);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          setPlanImage(img);
          drawPlan(img);
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      // PDF: mark as placeholder (production would use pdf.js to render pages)
      setPdfPlaceholder(true);
    }
  };

  const drawPlan = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 400;
    ctx.clearRect(0, 0, 600, 400);

    // Draw plan image scaled to fit
    const scale = Math.min(600 / img.width, 400 / img.height) * zoom;
    const x = (600 - img.width * scale) / 2;
    const y = (400 - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

    // Draw scale points
    if (scalePoint1) drawPoint(ctx, scalePoint1, "hsl(142, 76%, 36%)");
    if (scalePoint2) drawPoint(ctx, scalePoint2, "hsl(142, 76%, 36%)");
    if (scalePoint1 && scalePoint2) {
      ctx.beginPath();
      ctx.moveTo(scalePoint1.x, scalePoint1.y);
      ctx.lineTo(scalePoint2.x, scalePoint2.y);
      ctx.strokeStyle = "hsl(142, 76%, 36%)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw trace polygon
    if (tracePoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(tracePoints[0].x, tracePoints[0].y);
      tracePoints.forEach((p) => ctx.lineTo(p.x, p.y));
      if (tracePoints.length > 2) {
        ctx.closePath();
        ctx.fillStyle = "hsla(var(--primary) / 0.15)";
        ctx.fill();
      }
      ctx.strokeStyle = "hsl(var(--primary))";
      ctx.lineWidth = 2;
      ctx.stroke();

      tracePoints.forEach((p) => drawPoint(ctx, p, "hsl(var(--primary))"));
    }
  }, [zoom, scalePoint1, scalePoint2, tracePoints]);

  // Re-render when state changes
  const redraw = useCallback(() => {
    if (planImage) drawPlan(planImage);
  }, [planImage, drawPlan]);

  // Canvas click handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (scaleMode === "setting") {
      if (!scalePoint1) {
        setScalePoint1({ x, y });
      } else if (!scalePoint2) {
        setScalePoint2({ x, y });
      }
      setTimeout(redraw, 0);
      return;
    }

    if (tracing) {
      setTracePoints((prev) => [...prev, { x, y }]);
      setTimeout(redraw, 0);
    }
  };

  // Compute scale
  const applyScale = () => {
    if (!scalePoint1 || !scalePoint2 || !scaleKnownDist) return;
    const px = Math.sqrt(
      (scalePoint2.x - scalePoint1.x) ** 2 +
      (scalePoint2.y - scalePoint1.y) ** 2
    );
    const dist = parseFloat(scaleKnownDist);
    if (dist <= 0) return;
    setScalePixelsPerFoot(px / dist);
    setScaleMode("set");
  };

  // Compute traced area (shoelace formula)
  const computeTracedArea = (): number => {
    if (tracePoints.length < 3 || scalePixelsPerFoot <= 0) return 0;
    let area = 0;
    for (let i = 0; i < tracePoints.length; i++) {
      const j = (i + 1) % tracePoints.length;
      area += tracePoints[i].x * tracePoints[j].y;
      area -= tracePoints[j].x * tracePoints[i].y;
    }
    const pixelArea = Math.abs(area / 2);
    return pixelArea / (scalePixelsPerFoot * scalePixelsPerFoot);
  };

  const tracedArea = computeTracedArea();
  const delta = currentGLA ? tracedArea - currentGLA : null;
  const deltaPct = currentGLA && currentGLA > 0 ? ((tracedArea - currentGLA) / currentGLA) * 100 : null;

  const computePerimeter = (): number => {
    if (tracePoints.length < 2 || scalePixelsPerFoot <= 0) return 0;
    let perim = 0;
    for (let i = 0; i < tracePoints.length; i++) {
      const j = (i + 1) % tracePoints.length;
      const dx = tracePoints[j].x - tracePoints[i].x;
      const dy = tracePoints[j].y - tracePoints[i].y;
      perim += Math.sqrt(dx * dx + dy * dy);
    }
    return perim / scalePixelsPerFoot;
  };

  const handleSave = () => {
    const provenance: PlanProvenance = {
      source: sourceType,
      fileHash: planFileName, // In production: actual SHA-256
      scaleMethod,
      scaleValue: scalePixelsPerFoot,
      scaleUnit: "feet",
    };

    onSave({
      _sketchMode: "plan_trace",
      tracePoints,
      derivedGLA: Math.round(tracedArea),
      derivedPerimeter: computePerimeter(),
      componentType,
      planProvenance: provenance,
      closedPolygon: tracePoints.length >= 3,
      segments: [],
      components: [{ id: crypto.randomUUID(), type: componentType, label: componentType, polygon: tracePoints, area: tracedArea }],
      componentBreakdown: { [componentType]: Math.round(tracedArea) },
    });
  };

  return (
    <div className="space-y-4">
      {/* Plan Upload */}
      {!planImage && !pdfPlaceholder ? (
        <Card className="border-dashed border-2 border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-8 text-center">
            <label className="cursor-pointer block">
              <FileUp className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Upload a plan image or PDF</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Supports: PNG, JPG, PDF (first page)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Plan Source */}
          <Card className="border-border/50">
            <CardContent className="p-3 flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-[10px] text-muted-foreground">Plan Source</Label>
                <Select value={sourceType} onValueChange={(v) => setSourceType(v as PlanSourceType)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="text-[9px] mb-1">{planFileName}</Badge>
            </CardContent>
          </Card>

          {/* Scale Tool */}
          <Card className={`border-border/50 ${scaleMode === "set" ? "border-chart-5/30" : ""}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Scale Calibration
                {scaleMode === "set" && (
                  <Badge variant="outline" className="text-[9px] bg-chart-5/10 text-chart-5 border-chart-5/30">
                    ✓ Set
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scaleMode === "none" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setScaleMode("setting");
                    setScalePoint1(null);
                    setScalePoint2(null);
                  }}
                  className="w-full"
                >
                  <Ruler className="w-3.5 h-3.5 mr-1" />
                  Set 2-Point Scale
                </Button>
              )}

              {scaleMode === "setting" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {!scalePoint1
                      ? "① Click first point of known distance on the plan"
                      : !scalePoint2
                      ? "② Click second point of known distance"
                      : "③ Enter the real-world distance between the two points"}
                  </p>
                  {scalePoint1 && scalePoint2 && (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-[10px]">Known Distance (ft)</Label>
                        <Input
                          type="number"
                          value={scaleKnownDist}
                          onChange={(e) => setScaleKnownDist(e.target.value)}
                          className="h-8 text-xs"
                          placeholder="e.g. 40"
                        />
                      </div>
                      <Button size="sm" onClick={applyScale}>
                        Apply Scale
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {scaleMode === "set" && (
                <p className="text-xs text-muted-foreground">
                  Scale: {scalePixelsPerFoot.toFixed(1)} px/ft · Method: {scaleMethod}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Canvas or PDF Placeholder */}
          {pdfPlaceholder && !planImage ? (
            <Card className="border-border/50 overflow-hidden">
              <div className="flex flex-col items-center justify-center gap-3 py-12 bg-background" style={{ aspectRatio: "3/2" }}>
                <FileImage className="w-16 h-16 opacity-60" />
                <p className="text-sm text-muted-foreground">
                  PDF loaded: <span className="font-medium text-foreground">{planFileName}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">Render via pdf.js in production</p>
              </div>
            </Card>
          ) : (
            <Card className="border-border/50 overflow-hidden">
              <div className="relative bg-background">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  className="w-full cursor-crosshair touch-none"
                  style={{ aspectRatio: "3/2" }}
                  onClick={handleCanvasClick}
                />

                {/* Zoom controls */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => { setZoom((z) => Math.min(z + 0.2, 3)); setTimeout(redraw, 0); }}>
                    <ZoomIn className="w-3 h-3" />
                  </Button>
                  <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => { setZoom((z) => Math.max(z - 0.2, 0.4)); setTimeout(redraw, 0); }}>
                    <ZoomOut className="w-3 h-3" />
                  </Button>
                </div>

                {/* Status hint */}
                <div className="absolute top-2 left-2 text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded">
                  {scaleMode === "setting"
                    ? "Click to set scale points"
                    : tracing
                    ? `Tracing: ${tracePoints.length} points · Click to add · Double-click to close`
                    : scaleMode === "set"
                    ? "Ready to trace"
                    : "Set scale first"}
                </div>
              </div>
            </Card>
          )}

          {/* Trace Controls */}
          {scaleMode === "set" && (
            <div className="flex gap-2">
              <Button
                variant={tracing ? "secondary" : "default"}
                size="sm"
                className="flex-1"
                onClick={() => setTracing(!tracing)}
              >
                <PenTool className="w-3.5 h-3.5 mr-1" />
                {tracing ? "Pause Tracing" : "Start Tracing"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTracePoints([]);
                  setTracing(false);
                  setTimeout(redraw, 0);
                }}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            </div>
          )}

          {/* Area Result */}
          {tracedArea > 0 && (
            <Card className="border-border/50 bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Traced Area: {Math.round(tracedArea).toLocaleString()} sq ft
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Perimeter: {computePerimeter().toFixed(0)}' · {tracePoints.length} vertices
                      </p>
                      {delta !== null && (
                        <p className={`text-[10px] ${Math.abs(deltaPct ?? 0) > 15 ? "text-destructive" : "text-muted-foreground"}`}>
                          Δ {delta > 0 ? "+" : ""}{Math.round(delta).toLocaleString()} sq ft
                          ({deltaPct ? `${deltaPct > 0 ? "+" : ""}${deltaPct.toFixed(1)}%` : ""})
                          {Math.abs(deltaPct ?? 0) > 15 && (
                            <span className="ml-1">
                              <AlertTriangle className="w-3 h-3 inline" /> Review Required
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px]">
                    {sourceType.replace("_", " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save */}
          <Button onClick={handleSave} disabled={saving || tracedArea === 0} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Plan Trace"}
          </Button>
        </>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────
function drawPoint(ctx: CanvasRenderingContext2D, p: TracePoint, color: string) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.stroke();
}
