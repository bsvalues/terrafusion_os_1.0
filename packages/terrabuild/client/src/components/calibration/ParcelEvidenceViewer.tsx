import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useCalibrationContext } from "@/hooks/calibration/useCalibrationContext";

interface ParcelData {
  id: number;
  parcelId: string;
  saleDate: string;
  salePrice: number;
  assessedValue: number;
  ratio: number;
  isOutlierIqr: boolean;
  aiClassification: string | null;
  isExcluded: boolean;
  valueQuintile: number;
  ageBand: number;
}

interface EvidenceResponse {
  medianRatio: number;
  cod: number;
  saleCount: number;
  outlierCount: number;
  parcels: ParcelData[];
}

const QUARTER_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

function getQuarterColor(dateStr: string): string {
  const month = new Date(dateStr).getMonth();
  return QUARTER_COLORS[Math.floor(month / 3)];
}

const AI_CLASS_LABEL: Record<string, string> = {
  ESTATE_SALE: "Estate/below-market",
  RENOVATION: "Unreported renovation",
  RELATED_PARTY: "Related-party/non-arm's-length",
  NEW_CONSTRUCTION: "New construction lag",
};

export function ParcelEvidenceViewer() {
  const {
    matrixVersionId,
    selectedRevalArea,
    selectedBuildingType,
    excludedSaleIds,
    addExclusion,
  } = useCalibrationContext();

  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  if (matrixVersionId) params.set("matrixVersionId", String(matrixVersionId));
  if (selectedRevalArea) params.set("revalArea", selectedRevalArea);
  if (selectedBuildingType) params.set("buildingType", selectedBuildingType);

  const { data, isLoading } = useQuery<EvidenceResponse>({
    queryKey: ["parcel-evidence", matrixVersionId, selectedRevalArea, selectedBuildingType],
    queryFn: () =>
      fetch(`/api/calibrationdiagnostic/parcel-evidence?${params}`).then((r) => r.json()),
    enabled: !!matrixVersionId,
    staleTime: 30_000,
  });

  const exclusionMutation = useMutation({
    mutationFn: (req: {
      saleRecordId: number;
      dispositionType: string;
      appraiserNote?: string;
    }) =>
      fetch("/api/calibrationdiagnostic/outlier-exclusions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matrixVersionId,
          saleRecordId: req.saleRecordId,
          dispositionType: req.dispositionType,
          appraiserNote: req.appraiserNote ?? null,
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcel-evidence"] });
    },
  });

  if (!matrixVersionId)
    return <p className="text-sm text-muted-foreground p-4">Select a matrix version.</p>;
  if (isLoading)
    return <p className="text-sm text-muted-foreground p-4">Loading evidence…</p>;
  if (!data) return null;

  const active = data.parcels.filter(
    (p) => !excludedSaleIds.includes(p.id) && !p.isExcluded
  );
  const excluded = data.parcels.filter(
    (p) => excludedSaleIds.includes(p.id) || p.isExcluded
  );
  const outliers = data.parcels.filter((p) => p.isOutlierIqr);

  const scatterData = active.map((p) => ({
    x: p.salePrice / 1000,
    y: p.ratio,
    id: p.id,
    color: getQuarterColor(p.saleDate),
    isOutlier: p.isOutlierIqr,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Summary stats */}
      <div className="flex gap-6 text-sm flex-wrap">
        {[
          { label: "Median Ratio", value: data.medianRatio.toFixed(3) },
          { label: "COD", value: `${data.cod.toFixed(1)}%` },
          { label: "Sales", value: active.length },
          { label: "Outliers (IQR)", value: data.outlierCount },
          { label: "Excluded", value: excluded.length },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="font-mono font-semibold">{value}</span>
          </div>
        ))}
      </div>

      {/* Scatter plot */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 16, left: 0 }}>
            <XAxis
              dataKey="x"
              name="Sale Price"
              unit="k"
              label={{ value: "Sale Price ($k)", position: "insideBottom", offset: -8, fontSize: 10 }}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              dataKey="y"
              name="Ratio"
              domain={[0.7, 1.3]}
              label={{ value: "Ratio", angle: -90, position: "insideLeft", fontSize: 10 }}
              tick={{ fontSize: 10 }}
            />
            <ReferenceLine y={1.0} stroke="#888" strokeDasharray="4 2" />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === "x" ? [`$${value}k`, "Sale Price"] : [value.toFixed(4), "Ratio"]
              }
            />
            <Scatter data={scatterData}>
              {scatterData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isOutlier ? "#ef4444" : entry.color}
                  stroke={entry.isOutlier ? "#b91c1c" : "none"}
                  strokeWidth={entry.isOutlier ? 2 : 0}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Outlier cards */}
      {outliers.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            IQR Outliers ({outliers.length})
          </p>
          {outliers.map((p) => {
            const isEx = excludedSaleIds.includes(p.id) || p.isExcluded;
            return (
              <div
                key={p.id}
                className={`rounded border p-3 text-sm flex flex-col gap-2 ${
                  isEx ? "opacity-50 border-dashed" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold">{p.parcelId}</span>
                  <span className="text-xs text-muted-foreground">
                    Ratio: {p.ratio.toFixed(4)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex gap-4 flex-wrap">
                  <span>SP: ${p.salePrice.toLocaleString()}</span>
                  <span>AV: ${p.assessedValue.toLocaleString()}</span>
                  <span>{p.saleDate}</span>
                  {p.aiClassification && (
                    <span className="text-yellow-400">
                      AI: {AI_CLASS_LABEL[p.aiClassification] ?? p.aiClassification}
                    </span>
                  )}
                </div>
                {!isEx && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-400/30 hover:bg-red-500/30"
                      onClick={() => {
                        addExclusion(p.id);
                        exclusionMutation.mutate({
                          saleRecordId: p.id,
                          dispositionType: "EXCLUDED",
                          appraiserNote: "Excluded from study",
                        });
                      }}
                    >
                      Exclude from Study
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400 border border-orange-400/30 hover:bg-orange-500/30"
                      onClick={() => {
                        addExclusion(p.id);
                        exclusionMutation.mutate({
                          saleRecordId: p.id,
                          dispositionType: "FLAGGED_DATA",
                          appraiserNote: "Data problem — flagged to workbench",
                        });
                      }}
                    >
                      Flag as Data Problem
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                      onClick={() =>
                        exclusionMutation.mutate({
                          saleRecordId: p.id,
                          dispositionType: "ACCEPTED",
                          appraiserNote: "Accepted as valid sale",
                        })
                      }
                    >
                      Accept as Valid
                    </button>
                  </div>
                )}
                {isEx && (
                  <p className="text-xs text-muted-foreground italic">Excluded from study</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
