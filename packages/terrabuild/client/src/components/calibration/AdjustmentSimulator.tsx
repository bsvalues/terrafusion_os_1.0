import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useCalibrationContext } from "@/hooks/calibration/useCalibrationContext";
import type { RatioProjection } from "@/hooks/calibration/useRatioProjection";

interface Props {
  matrixVersionId: number;
  current: RatioProjection;
  projected: RatioProjection;
  onAdjustmentChange: (pct: number) => void;
}

const IAAO_OK = (prd: number, prb: number, cod: number) =>
  prd >= 0.98 && prd <= 1.03 && Math.abs(prb) <= 0.05 && cod <= 15;

export function AdjustmentSimulator({
  matrixVersionId,
  current,
  projected,
  onAdjustmentChange,
}: Props) {
  const { selectedRevalArea, selectedBuildingType, excludedSaleIds, clearAdjustments } =
    useCalibrationContext();

  const [inputMode, setInputMode] = useState<"pct" | "flat" | "targetPrd">("pct");
  const [adjustmentInput, setAdjustmentInput] = useState("");
  const [appraiserNote, setAppraiserNote] = useState("");
  const [showAuditPreview, setShowAuditPreview] = useState(false);

  const pct = parseFloat(adjustmentInput) || 0;

  const handleInputChange = useCallback(
    (value: string) => {
      setAdjustmentInput(value);
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) onAdjustmentChange(parsed);
    },
    [onAdjustmentChange]
  );

  const applyMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/matrixversion/${matrixVersionId}/apply-adjustment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revalArea: selectedRevalArea,
          buildingType: selectedBuildingType,
          adjustmentPct: pct,
          excludedSaleIds,
          appraiserNote,
          iaaoReference: "IAAO Standard on Ratio Studies §6",
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      setAdjustmentInput("");
      setShowAuditPreview(false);
      setAppraiserNote("");
      clearAdjustments();
      onAdjustmentChange(0);
    },
  });

  const isCompliant = IAAO_OK(projected.prd, projected.prb, projected.cod);
  const isActive = Math.abs(pct) > 0.001;

  return (
    <div className="flex flex-col gap-4">
      {/* Input mode tabs */}
      <div className="flex gap-1 text-xs">
        {(["pct", "flat", "targetPrd"] as const).map((mode) => (
          <button
            key={mode}
            className={`px-3 py-1.5 rounded transition-colors ${
              inputMode === mode
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
            onClick={() => setInputMode(mode)}
          >
            {mode === "pct" ? "% Adjustment" : mode === "flat" ? "Flat Rate" : "Target PRD"}
          </button>
        ))}
      </div>

      {/* Rate input */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground w-32">
          {inputMode === "pct"
            ? "Adjustment %"
            : inputMode === "flat"
            ? "Rate ($/sqft)"
            : "Target PRD"}
        </label>
        <input
          type="number"
          step={inputMode === "pct" ? "0.1" : inputMode === "flat" ? "0.5" : "0.001"}
          value={adjustmentInput}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={
            inputMode === "pct" ? "e.g. -6.5" : inputMode === "flat" ? "e.g. 85.00" : "e.g. 1.00"
          }
          className="w-36 px-3 py-1.5 text-sm rounded border border-border bg-background font-mono"
        />
        {inputMode === "pct" && <span className="text-sm text-muted-foreground">%</span>}
      </div>

      {/* Live projection */}
      {isActive && (
        <div className="rounded border border-border p-3 bg-muted/20 flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Projected Stats ({selectedRevalArea ?? "County-Wide"} /{" "}
            {selectedBuildingType ?? "All Types"})
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "PRD",
                curr: current.prd,
                proj: projected.prd,
                ok: projected.prd >= 0.98 && projected.prd <= 1.03,
              },
              {
                label: "PRB",
                curr: current.prb,
                proj: projected.prb,
                ok: Math.abs(projected.prb) <= 0.05,
              },
              {
                label: "COD",
                curr: current.cod,
                proj: projected.cod,
                ok: projected.cod <= 15,
              },
              {
                label: "Median",
                curr: current.medianRatio,
                proj: projected.medianRatio,
                ok: projected.medianRatio >= 0.95 && projected.medianRatio <= 1.05,
              },
            ].map(({ label, curr, proj, ok }) => (
              <div key={label} className="flex flex-col">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-mono text-muted-foreground">{curr.toFixed(3)}</span>
                <span
                  className={`text-sm font-mono font-bold ${ok ? "text-green-400" : "text-red-400"}`}
                >
                  → {proj.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {isCompliant
              ? "✓ All IAAO metrics within standard after adjustment."
              : "⚠ One or more metrics remain outside IAAO standard. Document override note."}
          </p>
        </div>
      )}

      {/* Apply button / audit preview */}
      {isActive && (
        <div className="flex flex-col gap-2">
          {!showAuditPreview ? (
            <button
              className="w-full py-2 text-sm font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setShowAuditPreview(true)}
            >
              Apply Adjustment…
            </button>
          ) : (
            <div className="rounded border border-border p-3 flex flex-col gap-3 bg-muted/10">
              <p className="text-xs font-semibold">Audit Trail Preview</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  Area: <strong>{selectedRevalArea ?? "County-Wide"}</strong> | Type:{" "}
                  <strong>{selectedBuildingType ?? "All"}</strong>
                </div>
                <div>
                  Adjustment:{" "}
                  <strong>
                    {pct > 0 ? "+" : ""}
                    {pct.toFixed(3)}%
                  </strong>
                </div>
                <div>IAAO: Standard on Ratio Studies §6</div>
                <div>Excluded sales: {excludedSaleIds.length}</div>
              </div>
              <textarea
                value={appraiserNote}
                onChange={(e) => setAppraiserNote(e.target.value)}
                placeholder={
                  isCompliant
                    ? "Optional appraiser note…"
                    : "Override note required (metrics not in range)…"
                }
                rows={3}
                className="w-full px-3 py-2 text-xs rounded border border-border bg-background resize-none"
              />
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 text-sm font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  disabled={(!isCompliant && !appraiserNote.trim()) || applyMutation.isPending}
                  onClick={() => applyMutation.mutate()}
                >
                  {applyMutation.isPending ? "Applying…" : "Confirm & Apply"}
                </button>
                <button
                  className="px-4 py-2 text-sm rounded bg-muted hover:bg-muted/80"
                  onClick={() => setShowAuditPreview(false)}
                >
                  Cancel
                </button>
              </div>
              {applyMutation.isError && (
                <p className="text-xs text-red-400">Apply failed. Check console.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
