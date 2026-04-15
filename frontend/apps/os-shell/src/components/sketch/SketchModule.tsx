// TerraFusion OS — Sketch Module
// Harvested from terra-forge-rebuild
// Main container for all sketch tiers: Measurement Plan, Sketch Builder, Plan Trace
// Decoupled from Supabase: uses onSaveObservation callback for persistence

import { useState } from "react";
import { Ruler, PenTool, FileImage, ArrowLeft, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { SketchMode, ConfidenceLevel, MeasurementMethod } from "@/types/sketch";
import { MeasurementPlanPanel } from "./MeasurementPlanPanel";
import { SketchBuilderPanel } from "./SketchBuilderPanel";
import { PlanTracePanel } from "./PlanTracePanel";

export interface SketchObservation {
  parcelId: string;
  type: "measurement";
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  data: Record<string, unknown>;
}

interface SketchModuleProps {
  parcelId: string;
  currentGLA?: number;
  onBack: () => void;
  onSaveObservation: (observation: SketchObservation) => Promise<void>;
}

export function SketchModule({ parcelId, currentGLA, onBack, onSaveObservation }: SketchModuleProps) {
  const [activeMode, setActiveMode] = useState<SketchMode>("measurement");
  const [saving, setSaving] = useState(false);

  const saveSketchObservation = async (data: Record<string, unknown>, method: MeasurementMethod, confidence: ConfidenceLevel) => {
    setSaving(true);
    try {
      const loc = await getLocation();

      // Compute GLA delta if we have a record value
      const derivedGLA = (data.derivedGLA ?? data.estimatedArea ?? 0) as number;
      const glaDelta = currentGLA ? derivedGLA - currentGLA : undefined;
      const glaDeltaPct = currentGLA && currentGLA > 0 ? ((derivedGLA - currentGLA) / currentGLA) * 100 : undefined;
      const flaggedForReview = Math.abs(glaDeltaPct ?? 0) > 15;

      await onSaveObservation({
        parcelId,
        type: "measurement",
        timestamp: new Date().toISOString(),
        latitude: loc.lat,
        longitude: loc.lng,
        data: {
          ...data,
          _sketchObservation: true,
          method,
          confidence,
          glaDeltaFromRecord: glaDelta,
          glaDeltaPct,
          flaggedForReview,
        },
      });

      toast.success("Sketch saved", {
        description: flaggedForReview
          ? `⚠️ GLA differs by ${Math.abs(glaDeltaPct ?? 0).toFixed(1)}% — flagged for review`
          : `${derivedGLA.toLocaleString()} sq ft recorded`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to save sketch", { description: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4"
      style={{
        color: 'hsl(var(--tf-text))',
        background: 'transparent',
        /* Re-anchor shadcn tokens to TF values so child text-muted-foreground resolves visibly */
        ['--muted-foreground' as string]: 'hsl(var(--tf-text) / 0.65)',
        ['--foreground' as string]: 'hsl(var(--tf-text))',
        ['--card' as string]: 'hsl(var(--tf-surface))',
        ['--border' as string]: 'hsl(var(--tf-border))',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>Building Sketch</h2>
          <p className="text-xs" style={{ color: 'hsl(var(--tf-text) / 0.65)' }}>
            Capture geometry as defensible evidence for the record
          </p>
        </div>
        {currentGLA && (
          <Badge variant="outline" className="text-xs">
            Record GLA: {currentGLA.toLocaleString()} sf
          </Badge>
        )}
      </div>

      {/* Info Banner */}
      <Card
        className="border-primary/20"
        style={{ background: 'hsl(var(--tf-surface) / 0.7)', border: '1px solid hsl(var(--tf-accent) / 0.25)' }}
      >
        <CardContent className="p-3 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--tf-accent))' }} />
          <p className="text-xs" style={{ color: 'hsl(var(--tf-text) / 0.72)' }}>
            Sketches are saved as field observations.
            GLA differences &gt;15% are automatically flagged for supervisor review.
          </p>
        </CardContent>
      </Card>

      {/* Mode Tabs */}
      <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as SketchMode)}>
        <TabsList className="w-full grid grid-cols-3" style={{ background: 'hsl(var(--tf-surface) / 0.6)' }}>
          <TabsTrigger value="measurement" className="text-xs flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5" />
            Measure
          </TabsTrigger>
          <TabsTrigger value="sketch" className="text-xs flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5" />
            Sketch
          </TabsTrigger>
          <TabsTrigger value="plan_trace" className="text-xs flex items-center gap-1.5">
            <FileImage className="w-3.5 h-3.5" />
            Plan Trace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="measurement" className="mt-4">
          <MeasurementPlanPanel
            onSave={(data) => saveSketchObservation(data, "manual_entry", "medium")}
            saving={saving}
            currentGLA={currentGLA}
          />
        </TabsContent>

        <TabsContent value="sketch" className="mt-4">
          <SketchBuilderPanel
            onSave={(data, method) => {
              const segs = data.segments as unknown[];
              saveSketchObservation(data, method, segs && segs.length > 6 ? "high" : "medium");
            }}
            saving={saving}
            currentGLA={currentGLA}
          />
        </TabsContent>

        <TabsContent value="plan_trace" className="mt-4">
          <PlanTracePanel
            onSave={(data) => {
              const prov = data.planProvenance as { scaleMethod?: string } | undefined;
              const method = prov ? "plan_trace_vector" as MeasurementMethod : "plan_trace_raster" as MeasurementMethod;
              const confidence: ConfidenceLevel = prov?.scaleMethod === "embedded" ? "high" : "medium";
              saveSketchObservation(data, method, confidence);
            }}
            saving={saving}
            currentGLA={currentGLA}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────
function getLocation(): Promise<{ lat: number | null; lng: number | null }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: null, lng: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { timeout: 5000, enableHighAccuracy: true }
    );
  });
}
