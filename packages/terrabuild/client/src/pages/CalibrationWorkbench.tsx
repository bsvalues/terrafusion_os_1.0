import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LiveDiagnosticsBar,
  AIFindingQueue,
  MatrixDiffView,
  MassAdjustmentControls,
  VersionTimeline,
  CalibrationMemoPanel,
  RevalAreaNavigator,
  AiCopilotBand,
  ParcelEvidenceViewer,
  AdjustmentSimulator,
  StratifiedEquityPanel,
  NeighborhoodMatrix,
} from "@/components/calibration";
import {
  CalibrationContext,
  useCalibrationContextState,
} from "@/hooks/calibration/useCalibrationContext";
import { useRatioProjection } from "@/hooks/calibration/useRatioProjection";
import type { ParcelSale } from "@/hooks/calibration/useRatioProjection";

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
    try {
      return (JSON.parse(raw) as Record<string, unknown>[]).map(normalizeCell);
    } catch {
      return [];
    }
  }
  return (raw as unknown as Record<string, unknown>[]).map(normalizeCell);
}

type PhDTab = "neighborhood" | "evidence" | "simulator" | "equity";

export default function CalibrationWorkbench() {
  const [activeDraftId, setActiveDraftId] = useState<number | null>(null);
  const [activePhDTab, setActivePhDTab] = useState<PhDTab>("neighborhood");
  const [simulatorAdjPct, setSimulatorAdjPct] = useState(0);

  // Shared calibration context
  const ctx = useCalibrationContextState(activeDraftId);

  // Fetch raw sale data for client-side projection
  const parcelEvidenceParams = new URLSearchParams();
  if (activeDraftId) parcelEvidenceParams.set("matrixVersionId", String(activeDraftId));
  if (ctx.selectedRevalArea) parcelEvidenceParams.set("revalArea", ctx.selectedRevalArea);
  if (ctx.selectedBuildingType)
    parcelEvidenceParams.set("buildingType", ctx.selectedBuildingType);

  const { data: evidenceData } = useQuery<{
    parcels: Array<{
      id: number;
      salePrice: number;
      assessedValue: number;
      ratio: number;
      valueQuintile: number;
      ageBand: number;
    }>;
  }>({
    queryKey: [
      "parcel-evidence-raw",
      activeDraftId,
      ctx.selectedRevalArea,
      ctx.selectedBuildingType,
    ],
    queryFn: () =>
      fetch(
        `/api/calibrationdiagnostic/parcel-evidence?${parcelEvidenceParams}`
      ).then((r) => r.json()),
    enabled: !!activeDraftId,
    staleTime: 30_000,
  });

  const sales: ParcelSale[] = useMemo(
    () =>
      (evidenceData?.parcels ?? []).map((p) => ({
        id: p.id,
        salePrice: p.salePrice,
        assessedValue: p.assessedValue,
        ratio: p.ratio,
        valueQuintile: p.valueQuintile,
        ageBand: p.ageBand,
      })),
    [evidenceData]
  );

  const { current, projected } = useRatioProjection(
    sales,
    simulatorAdjPct,
    ctx.excludedSaleIds
  );

  // Existing version queries
  const { data: draft } = useQuery<MatrixVersion>({
    queryKey: ["matrix-version", activeDraftId],
    queryFn: () =>
      fetch(`/api/matrixversion/${activeDraftId}`).then((r) => r.json()),
    enabled: !!activeDraftId,
  });

  const { data: versions } = useQuery<MatrixVersion[]>({
    queryKey: ["matrix-versions"],
    queryFn: () => fetch("/api/matrixversion").then((r) => r.json()),
  });

  const lockedVersion = versions?.find((v) => v.status === "LOCKED") ?? null;
  const draftCells = parseSnapshot(draft?.rateSnapshot ?? null);
  const buildingTypes = Array.from(new Set(draftCells.map((c) => c.buildingType))).sort();
  const revalAreas = Array.from(new Set(draftCells.map((c) => c.revalArea))).sort();

  const isSimulating = Math.abs(simulatorAdjPct) > 0.001;

  return (
    <CalibrationContext.Provider value={ctx}>
      <div className="flex h-full overflow-hidden">
        {/* Left sidebar: Reval Area Navigator */}
        {activeDraftId && (
          <div className="w-44 flex-shrink-0 border-r border-border overflow-y-auto">
            <RevalAreaNavigator matrixVersionId={activeDraftId} />
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-col flex-1 min-w-0 overflow-y-auto gap-4 p-4">
          {/* AI Co-pilot Band (draft-gated) */}
          {activeDraftId && activePhDTab !== "neighborhood" && (
            <AiCopilotBand
              current={current}
              projected={projected}
              adjustmentPct={simulatorAdjPct}
              isSimulating={isSimulating}
            />
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Left: PhD tabs + panels */}
            <div className="xl:col-span-2 space-y-4">
              {/* Tab bar — Neighborhood Study always available; others require a draft */}
              <Card>
                <CardHeader className="py-3 px-4 pb-0">
                  <div className="flex gap-1 text-xs flex-wrap">
                    {(["neighborhood", "evidence", "simulator", "equity"] as PhDTab[]).map(
                      (tab) => {
                        const requiresDraft =
                          tab === "evidence" || tab === "simulator" || tab === "equity";
                        const disabled = requiresDraft && !activeDraftId;
                        return (
                          <button
                            key={tab}
                            disabled={disabled}
                            title={
                              disabled ? "Select a draft version to use this tab" : undefined
                            }
                            className={`px-3 py-1.5 rounded-t transition-colors ${
                              activePhDTab === tab
                                ? "bg-primary text-primary-foreground"
                                : disabled
                                ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                            onClick={() => !disabled && setActivePhDTab(tab)}
                          >
                            {tab === "neighborhood"
                              ? "Neighborhood Study"
                              : tab === "evidence"
                              ? "Evidence & Outliers"
                              : tab === "simulator"
                              ? "Adjustment Simulator"
                              : "Stratified Equity"}
                          </button>
                        );
                      }
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 pb-4">
                  {activePhDTab === "neighborhood" && <NeighborhoodMatrix />}
                  {activePhDTab === "evidence" && activeDraftId && <ParcelEvidenceViewer />}
                  {activePhDTab === "simulator" && activeDraftId && (
                    <AdjustmentSimulator
                      matrixVersionId={activeDraftId}
                      current={current}
                      projected={projected}
                      onAdjustmentChange={setSimulatorAdjPct}
                    />
                  )}
                  {activePhDTab === "equity" && activeDraftId && <StratifiedEquityPanel />}
                  {(activePhDTab === "evidence" ||
                    activePhDTab === "simulator" ||
                    activePhDTab === "equity") &&
                    !activeDraftId && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Select or create a draft version on the right to use this tab.
                      </p>
                    )}
                </CardContent>
              </Card>

              {/* Draft-gated panels */}
              {activeDraftId && activePhDTab !== "neighborhood" && (
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
              )}
            </div>

            {/* Right: Version timeline + memo */}
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <VersionTimeline
                    activeDraftId={activeDraftId}
                    onDraftSelected={(id) => {
                      setActiveDraftId(id);
                      ctx.setMatrixVersionId(id);
                    }}
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
      </div>
    </CalibrationContext.Provider>
  );
}
