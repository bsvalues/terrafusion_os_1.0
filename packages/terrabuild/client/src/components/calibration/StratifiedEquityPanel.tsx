import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useCalibrationContext } from "@/hooks/calibration/useCalibrationContext";

interface StratumCell {
  quintile: number;
  ageBand: number;
  medianRatio: number;
  cod: number;
  saleCount: number;
}

const AGE_BAND_LABELS = ["Pre-1960", "1960-1980", "1980-2000", "2000-2015", "Post-2015"];
const QUINTILE_LABELS = ["Q1 (low)", "Q2", "Q3", "Q4", "Q5 (high)"];

function ratioColor(ratio: number): string {
  if (ratio > 1.15) return "bg-red-700 text-white";
  if (ratio > 1.10) return "bg-orange-500 text-white";
  if (ratio > 1.05) return "bg-yellow-400 text-black";
  if (ratio >= 0.97) return "bg-green-500 text-white";
  if (ratio >= 0.90) return "bg-sky-400 text-black";
  return "bg-blue-700 text-white";
}

function projectedRatio(ratio: number, adjustmentPct: number): number {
  return ratio * (1 + adjustmentPct / 100);
}

export function StratifiedEquityPanel() {
  const { matrixVersionId, selectedRevalArea, selectedBuildingType, proposedAdjustments } =
    useCalibrationContext();

  const [showAfter, setShowAfter] = useState(false);

  const params = new URLSearchParams();
  if (matrixVersionId) params.set("matrixVersionId", String(matrixVersionId));
  if (selectedRevalArea) params.set("revalArea", selectedRevalArea);
  if (selectedBuildingType) params.set("buildingType", selectedBuildingType);

  const { data: cells = [], isLoading } = useQuery<StratumCell[]>({
    queryKey: ["stratified-equity", matrixVersionId, selectedRevalArea, selectedBuildingType],
    queryFn: () =>
      fetch(`/api/calibrationdiagnostic/stratified-equity?${params}`).then((r) => r.json()),
    enabled: !!matrixVersionId,
    staleTime: 30_000,
  });

  const hasSimulation = Object.keys(proposedAdjustments).length > 0;
  const adjKey = `${selectedRevalArea ?? ""}:${selectedBuildingType ?? ""}`;
  const adjPct = proposedAdjustments[adjKey] ?? 0;

  function getCell(q: number, ab: number): StratumCell | undefined {
    return cells.find((c) => c.quintile === q && c.ageBand === ab);
  }

  function displayRatio(cell: StratumCell): number {
    return showAfter && hasSimulation
      ? projectedRatio(cell.medianRatio, adjPct)
      : cell.medianRatio;
  }

  if (!matrixVersionId) return null;
  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading equity data…</p>;

  const worstCell = [...cells].sort(
    (a, b) => Math.abs(b.medianRatio - 1) - Math.abs(a.medianRatio - 1)
  )[0];
  const equitableCells = cells.filter(
    (c) => c.medianRatio >= 0.97 && c.medianRatio <= 1.03
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Before/After toggle */}
      {hasSimulation && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">View:</span>
          <button
            className={`px-3 py-1 rounded ${!showAfter ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setShowAfter(false)}
          >
            Before
          </button>
          <button
            className={`px-3 py-1 rounded ${showAfter ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setShowAfter(true)}
          >
            After ({adjPct > 0 ? "+" : ""}
            {adjPct.toFixed(1)}%)
          </button>
        </div>
      )}

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs w-full">
          <thead>
            <tr>
              <th className="p-1 text-left text-muted-foreground font-normal w-24">
                Age \ Value
              </th>
              {QUINTILE_LABELS.map((q) => (
                <th key={q} className="p-1 text-center text-muted-foreground font-normal">
                  {q}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AGE_BAND_LABELS.map((label, abIdx) => {
              const ab = abIdx + 1;
              return (
                <tr key={ab}>
                  <td className="p-1 text-muted-foreground font-normal">{label}</td>
                  {QUINTILE_LABELS.map((_, qIdx) => {
                    const q = qIdx + 1;
                    const cell = getCell(q, ab);
                    if (!cell) {
                      return (
                        <td key={q} className="p-1 text-center">
                          <div className="h-12 rounded bg-muted/20 flex items-center justify-center text-muted-foreground">
                            —
                          </div>
                        </td>
                      );
                    }
                    const ratio = displayRatio(cell);
                    return (
                      <td key={q} className="p-1">
                        <div
                          className={`h-12 rounded flex flex-col items-center justify-center ${ratioColor(ratio)}`}
                        >
                          <span className="font-mono font-bold">{ratio.toFixed(3)}</span>
                          <span className="opacity-70 text-[10px]">{cell.saleCount}s</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Color scale legend */}
      <div className="flex gap-2 text-xs items-center flex-wrap">
        <span className="text-muted-foreground">Scale:</span>
        {[
          { label: ">1.15 Over-assessed", cls: "bg-red-700 text-white" },
          { label: "1.10-1.15", cls: "bg-orange-500 text-white" },
          { label: "1.05-1.10", cls: "bg-yellow-400 text-black" },
          { label: "0.97-1.03 IAAO", cls: "bg-green-500 text-white" },
          { label: "<0.97 Under-assessed", cls: "bg-blue-700 text-white" },
        ].map(({ label, cls }) => (
          <span key={label} className={`px-2 py-0.5 rounded text-[10px] ${cls}`}>
            {label}
          </span>
        ))}
      </div>

      {/* AI insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {worstCell && (
          <div className="rounded border border-border p-3 text-xs">
            <p className="font-semibold mb-1">Pattern Classification</p>
            <p className="text-muted-foreground">
              {worstCell.medianRatio > 1.05
                ? `Regressivity confirmed — Q${worstCell.quintile}/${
                    AGE_BAND_LABELS[worstCell.ageBand - 1]
                  } is worst stratum at ${worstCell.medianRatio.toFixed(3)}.`
                : worstCell.medianRatio < 0.95
                ? `Progressivity detected — Q${worstCell.quintile}/${
                    AGE_BAND_LABELS[worstCell.ageBand - 1]
                  } is under-assessed at ${worstCell.medianRatio.toFixed(3)}.`
                : "No significant regressivity or progressivity detected in this study set."}
            </p>
          </div>
        )}
        <div className="rounded border border-border p-3 text-xs">
          <p className="font-semibold mb-1">Interaction Alert</p>
          <p className="text-muted-foreground">
            {cells.filter((c) => c.ageBand === 1 && c.medianRatio > 1.05).length > 0
              ? "Pre-1960 homes show over-assessment across multiple value quintiles — age × value interaction present. Consider age-banded adjustment."
              : "No significant age × value interaction detected in current study set."}
          </p>
        </div>
        {equitableCells.length > 0 && (
          <div className="rounded border border-border p-3 text-xs">
            <p className="font-semibold mb-1">Clean Strata</p>
            <p className="text-muted-foreground">
              {equitableCells.length} strata within IAAO target range (0.97–1.03).
              {equitableCells.filter((c) => c.ageBand === 5).length > 0
                ? " Post-2015 new construction is equitable — do not adjust."
                : ""}
            </p>
          </div>
        )}
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 text-xs pt-1">
        <button
          className="px-3 py-1.5 rounded border border-border hover:bg-muted"
          onClick={() => alert("DOR export — connect to /api/calibrationdiagnostic/export-dor")}
        >
          DOR Ratio Study Package
        </button>
        <button
          className="px-3 py-1.5 rounded border border-border hover:bg-muted"
          onClick={() => {
            const csv = [
              "quintile,ageBand,medianRatio,cod,saleCount",
              ...cells.map(
                (c) => `${c.quintile},${c.ageBand},${c.medianRatio},${c.cod},${c.saleCount}`
              ),
            ].join("\n");
            const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = "strata.csv";
            a.click();
          }}
        >
          Strata CSV
        </button>
      </div>
    </div>
  );
}
