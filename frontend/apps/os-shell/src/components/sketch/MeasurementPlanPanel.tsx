// TerraFusion OS — Tier 0: Measurement + Photo Plan
// Harvested from terra-forge-rebuild
// Lightweight exterior measurement capture with auto-footprint estimation

import { useState } from "react";
import { Plus, Trash2, Save, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MeasurementEntry, MeasurementPlanPayload } from "@/types/sketch";

interface MeasurementPlanPanelProps {
  onSave: (data: Record<string, unknown>) => void;
  saving: boolean;
  currentGLA?: number;
}

type FootprintShape = "rectangular" | "l_shape" | "t_shape" | "custom";

const SIDE_OPTIONS = [
  { value: "front", label: "Front" },
  { value: "rear", label: "Rear" },
  { value: "left", label: "Left Side" },
  { value: "right", label: "Right Side" },
  { value: "custom", label: "Custom" },
];

export function MeasurementPlanPanel({ onSave, saving, currentGLA }: MeasurementPlanPanelProps) {
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([
    { id: crypto.randomUUID(), side: "front", length: 0 },
    { id: crypto.randomUUID(), side: "left", length: 0 },
  ]);
  const [shape, setShape] = useState<FootprintShape>("rectangular");
  const [notes, setNotes] = useState("");

  const addMeasurement = () => {
    setMeasurements((prev) => [
      ...prev,
      { id: crypto.randomUUID(), side: "custom", length: 0 },
    ]);
  };

  const removeMeasurement = (id: string) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMeasurement = (id: string, field: keyof MeasurementEntry, value: string | number) => {
    setMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  // Auto-estimate area based on shape + measurements
  const estimateArea = (): number => {
    const filled = measurements.filter((m) => m.length > 0);
    if (filled.length < 2) return 0;

    if (shape === "rectangular") {
      const front = filled.find((m) => m.side === "front")?.length || filled[0]?.length || 0;
      const side = filled.find((m) => m.side === "left" || m.side === "right")?.length || filled[1]?.length || 0;
      return front * side;
    }

    if (shape === "l_shape") {
      const sorted = filled.map((m) => m.length).sort((a, b) => b - a);
      if (sorted.length >= 4) {
        return sorted[0] * sorted[1] - sorted[2] * sorted[3];
      }
      if (sorted.length >= 2) return sorted[0] * sorted[1] * 0.75;
    }

    if (shape === "t_shape") {
      const sorted = filled.map((m) => m.length).sort((a, b) => b - a);
      if (sorted.length >= 2) return sorted[0] * sorted[1] * 0.8;
    }

    // Custom: rough average
    const lengths = filled.map((m) => m.length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    return avg * avg;
  };

  const area = estimateArea();
  const delta = currentGLA ? area - currentGLA : null;
  const deltaPct = currentGLA && currentGLA > 0 ? ((area - currentGLA) / currentGLA) * 100 : null;

  const handleSave = () => {
    const payload: MeasurementPlanPayload = {
      measurements: measurements.filter((m) => m.length > 0),
      footprintShape: shape,
      estimatedArea: Math.round(area),
      notes,
      confidence: "medium",
      method: "manual_entry",
    };
    onSave({
      ...payload,
      _sketchMode: "measurement",
      derivedGLA: Math.round(area),
    });
  };

  return (
    <div className="space-y-4">
      {/* Shape Selector */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Footprint Shape</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {(["rectangular", "l_shape", "t_shape", "custom"] as FootprintShape[]).map((s) => (
              <button
                key={s}
                onClick={() => setShape(s)}
                className={`p-3 rounded-lg border text-center text-xs transition-colors ${
                  shape === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:border-primary/30"
                }`}
              >
                <div className="text-xl mb-1">
                  {s === "rectangular" && "▬"}
                  {s === "l_shape" && "⌐"}
                  {s === "t_shape" && "⊤"}
                  {s === "custom" && "◇"}
                </div>
                {s.replace("_", "-")}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Measurements */}
      <Card className="border-border/50">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Exterior Measurements</CardTitle>
          <Button variant="ghost" size="sm" onClick={addMeasurement}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {measurements.map((m) => (
            <div key={m.id} className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-[10px] text-muted-foreground">Side</Label>
                <Select
                  value={m.side}
                  onValueChange={(v) => updateMeasurement(m.id, "side", v)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIDE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Label className="text-[10px] text-muted-foreground">Length (ft)</Label>
                <Input
                  type="number"
                  value={m.length || ""}
                  onChange={(e) => updateMeasurement(m.id, "length", Number(e.target.value))}
                  className="h-9 text-xs"
                  placeholder="0"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={() => removeMeasurement(m.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}

          {/* Notes */}
          <Textarea
            placeholder="Wall annotations (e.g., 'front wall includes 8ft garage setback')..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-xs mt-2"
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Area Estimate */}
      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Est. Area: {Math.round(area).toLocaleString()} sq ft
                </p>
                {delta !== null && (
                  <p className={`text-[10px] ${Math.abs(deltaPct ?? 0) > 15 ? "text-destructive" : "text-muted-foreground"}`}>
                    Δ {delta > 0 ? "+" : ""}{Math.round(delta).toLocaleString()} sq ft
                    ({deltaPct !== null ? `${deltaPct > 0 ? "+" : ""}${deltaPct.toFixed(1)}%` : ""})
                    {Math.abs(deltaPct ?? 0) > 15 && " ⚠️ Review Required"}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-[9px]">
              {shape.replace("_", "-")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving || area === 0} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Saving..." : "Save Measurement Plan"}
      </Button>
    </div>
  );
}
