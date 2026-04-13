import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  draftVersionId: number;
  buildingTypes: string[];
  revalAreas: string[];
}

type AdjustmentMode = "percent" | "flat";
type AdjustmentScope = "all" | "type" | "area" | "type_area";

interface AdjustmentPayload {
  scope: AdjustmentScope;
  buildingType?: string;
  revalArea?: string;
  mode: AdjustmentMode;
  value: number;
}

export function MassAdjustmentControls({ draftVersionId, buildingTypes, revalAreas }: Props) {
  const qc = useQueryClient();
  const [scope, setScope] = useState<AdjustmentScope>("all");
  const [buildingType, setBuildingType] = useState<string>("");
  const [revalArea, setRevalArea] = useState<string>("");
  const [mode, setMode] = useState<AdjustmentMode>("percent");
  const [value, setValue] = useState<string>("");
  const [flatWarning, setFlatWarning] = useState(false);

  const apply = useMutation({
    mutationFn: (payload: AdjustmentPayload) =>
      fetch(`/api/matrixversion/${draftVersionId}/rates`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => {
        if (!r.ok) throw new Error("Adjustment failed");
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matrix-version", draftVersionId] });
      qc.invalidateQueries({ queryKey: ["calibration-summary"] });
      setValue("");
    },
  });

  function handleModeChange(m: AdjustmentMode) {
    setMode(m);
    setFlatWarning(m === "flat");
  }

  function handleApply() {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const payload: AdjustmentPayload = {
      scope,
      mode,
      value: num,
      ...(scope === "type" || scope === "type_area" ? { buildingType } : {}),
      ...(scope === "area" || scope === "type_area" ? { revalArea } : {}),
    };
    apply.mutate(payload);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Scope</Label>
          <Select value={scope} onValueChange={(v) => setScope(v as AdjustmentScope)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types · all areas</SelectItem>
              <SelectItem value="type">Selected type · all areas</SelectItem>
              <SelectItem value="area">All types · selected area</SelectItem>
              <SelectItem value="type_area">Selected type · selected area</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Adjustment Mode</Label>
          <Select value={mode} onValueChange={(v) => handleModeChange(v as AdjustmentMode)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">% of current rate (preferred)</SelectItem>
              <SelectItem value="flat">$/sqft flat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(scope === "type" || scope === "type_area") && (
        <div className="space-y-1">
          <Label className="text-xs">Building Type</Label>
          <Select value={buildingType} onValueChange={setBuildingType}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select type…" />
            </SelectTrigger>
            <SelectContent>
              {buildingTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(scope === "area" || scope === "type_area") && (
        <div className="space-y-1">
          <Label className="text-xs">Reval Area</Label>
          <Select value={revalArea} onValueChange={setRevalArea}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select area…" />
            </SelectTrigger>
            <SelectContent>
              {revalAreas.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {flatWarning && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">
            Flat $/sqft adjustments may introduce Scale Effect regressivity (Benton Method SOP §2.2).
            Use % mode unless a specific flat-rate correction is required.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">{mode === "percent" ? "Adjustment %" : "Flat $/sqft"}</Label>
          <Input
            type="number"
            step={mode === "percent" ? "0.1" : "0.01"}
            placeholder={mode === "percent" ? "e.g. +12.5 or -5" : "e.g. 2.50"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 text-xs font-mono"
          />
        </div>
        <Button
          size="sm"
          onClick={handleApply}
          disabled={
            apply.isPending ||
            !value ||
            isNaN(parseFloat(value)) ||
            ((scope === "type" || scope === "type_area") && !buildingType) ||
            ((scope === "area" || scope === "type_area") && !revalArea)
          }
        >
          {apply.isPending ? "Applying…" : "Apply to Draft"}
        </Button>
      </div>

      {apply.isError && (
        <p className="text-xs text-destructive">{(apply.error as Error).message}</p>
      )}
      {apply.isSuccess && (
        <p className="text-xs text-green-500">Adjustment applied. Live diagnostics updating…</p>
      )}
    </div>
  );
}
