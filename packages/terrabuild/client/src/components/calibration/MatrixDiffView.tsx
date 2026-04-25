import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RateCell {
  buildingType: string;
  revalArea: string;
  baseRate: number;
}

interface MatrixVersion {
  id: number;
  version: string;
  status: string;
  rateSnapshot: RateCell[] | string | null;
}

function normalizeCell(c: Record<string, unknown>): RateCell {
  return {
    buildingType: (c.buildingType ?? c.BuildingType) as string,
    revalArea: (c.revalArea ?? c.RevalArea) as string,
    baseRate: (c.baseRate ?? c.BaseRate) as number,
  };
}

function parseSnapshot(raw: RateCell[] | string | null): RateCell[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return (JSON.parse(raw) as Record<string, unknown>[]).map(normalizeCell); } catch { return []; }
  }
  return (raw as unknown as Record<string, unknown>[]).map(normalizeCell);
}

interface Props {
  lockedVersionId: number | null;
  draftVersionId: number;
}

function diff(locked: number | undefined, draft: number | undefined): "changed" | "pending" | "same" {
  if (locked === undefined) return "pending";
  if (draft === undefined) return "pending";
  if (Math.abs(locked - draft) > 0.001) return "changed";
  return "same";
}

function buildIndex(cells: RateCell[]): Record<string, Record<string, number>> {
  const idx: Record<string, Record<string, number>> = {};
  for (const c of cells) {
    if (!idx[c.buildingType]) idx[c.buildingType] = {};
    idx[c.buildingType][c.revalArea] = c.baseRate;
  }
  return idx;
}

export function MatrixDiffView({ lockedVersionId, draftVersionId }: Props) {
  const { data: draft } = useQuery<MatrixVersion>({
    queryKey: ["matrix-version", draftVersionId],
    queryFn: () => fetch(`/api/matrixversion/${draftVersionId}`).then((r) => r.json()),
    enabled: !!draftVersionId,
  });

  const { data: locked } = useQuery<MatrixVersion>({
    queryKey: ["matrix-version", lockedVersionId],
    queryFn: () => fetch(`/api/matrixversion/${lockedVersionId}`).then((r) => r.json()),
    enabled: !!lockedVersionId,
  });

  const draftCells = parseSnapshot(draft?.rateSnapshot ?? null);
  if (!draft || draftCells.length === 0) {
    return <div className="h-32 bg-muted animate-pulse rounded" />;
  }

  const draftIdx = buildIndex(draftCells);
  const lockedIdx = locked?.rateSnapshot ? buildIndex(parseSnapshot(locked.rateSnapshot)) : {};

  const buildingTypes = Array.from(new Set(draftCells.map((c) => c.buildingType))).sort();
  const revalAreas = Array.from(new Set(draftCells.map((c) => c.revalArea))).sort();

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-6">
          <CardTitle className="text-sm">Matrix Diff</CardTitle>
          <span className="text-xs text-muted-foreground">
            {locked ? `Locked: v${locked.version}` : "No locked version"}
            {" → "}
            <span className="text-foreground">Draft: v{draft.version}</span>
          </span>
          <div className="flex gap-3 text-xs ml-auto">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-green-700 inline-block" /> Changed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-yellow-700 inline-block" /> Pending
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 overflow-x-auto">
        <table className="text-xs font-mono w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left pr-4 py-1 text-muted-foreground font-normal">Type</th>
              {revalAreas.map((area) => (
                <th key={area} className="px-2 py-1 text-muted-foreground font-normal text-right">
                  {area}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {buildingTypes.map((bt) => (
              <tr key={bt} className="border-t border-muted/30">
                <td className="pr-4 py-1 text-muted-foreground">{bt}</td>
                {revalAreas.map((area) => {
                  const draftRate = draftIdx[bt]?.[area];
                  const lockedRate = lockedIdx[bt]?.[area];
                  const state = diff(lockedRate, draftRate);

                  return (
                    <td
                      key={area}
                      className={[
                        "px-2 py-1 text-right rounded",
                        state === "changed" ? "bg-green-900/40 text-green-300" : "",
                        state === "pending" ? "bg-yellow-900/30 text-yellow-300" : "",
                      ].join(" ")}
                      title={
                        lockedRate !== undefined
                          ? `Locked: $${lockedRate.toFixed(2)} → Draft: $${draftRate?.toFixed(2) ?? "—"}`
                          : undefined
                      }
                    >
                      {draftRate !== undefined ? `$${draftRate.toFixed(2)}` : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
