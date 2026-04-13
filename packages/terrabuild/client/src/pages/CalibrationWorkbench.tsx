import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LiveDiagnosticsBar,
  AIFindingQueue,
  MatrixDiffView,
  MassAdjustmentControls,
  VersionTimeline,
  CalibrationMemoPanel,
} from "@/components/calibration";

interface RateCell { buildingType: string; revalArea: string; baseRate: number; }

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

export default function CalibrationWorkbench() {
  const [activeDraftId, setActiveDraftId] = useState<number | null>(null);

  const { data: draft } = useQuery<MatrixVersion>({
    queryKey: ["matrix-version", activeDraftId],
    queryFn: () => fetch(`/api/matrixversion/${activeDraftId}`).then((r) => r.json()),
    enabled: !!activeDraftId,
  });

  const { data: versions } = useQuery<MatrixVersion[]>({
    queryKey: ["matrix-versions"],
    queryFn: () => fetch("/api/matrixversion").then((r) => r.json()),
  });

  const lockedVersion = versions?.find((v) => v.status === "LOCKED") ?? null;

  const draftCells = parseSnapshot(draft?.rateSnapshot ?? null);

  const buildingTypes = Array.from(
    new Set(draftCells.map((c) => c.buildingType))
  ).sort();

  const revalAreas = Array.from(
    new Set(draftCells.map((c) => c.revalArea))
  ).sort();

  return (
    <div className="flex flex-col h-full gap-4 p-4 overflow-y-auto">
      {/* Live diagnostics bar — always visible */}
      <LiveDiagnosticsBar />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left column: AI findings + mass adjustments */}
        <div className="xl:col-span-2 space-y-4">
          {activeDraftId ? (
            <>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <AIFindingQueue matrixVersionId={activeDraftId} />
                </CardContent>
              </Card>

              <MatrixDiffView
                lockedVersionId={lockedVersion?.id ?? null}
                draftVersionId={activeDraftId}
              />

              {buildingTypes.length > 0 && (
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">Mass Adjustment Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 px-4">
                    <MassAdjustmentControls
                      draftVersionId={activeDraftId}
                      buildingTypes={buildingTypes}
                      revalAreas={revalAreas}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                Select or create a draft version on the right to begin calibration.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Version timeline + memo */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <VersionTimeline
                activeDraftId={activeDraftId}
                onDraftSelected={setActiveDraftId}
              />
            </CardContent>
          </Card>

          {activeDraftId && (
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Calibration Memo (SOP §5.3)</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 px-4">
                <CalibrationMemoPanel matrixVersionId={activeDraftId} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
