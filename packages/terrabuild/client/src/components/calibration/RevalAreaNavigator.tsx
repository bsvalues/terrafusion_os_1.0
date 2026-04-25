import { useQuery } from "@tanstack/react-query";
import { useCalibrationContext } from "@/hooks/calibration/useCalibrationContext";

interface AreaSummary {
  revalArea: string;
  buildingType: string;
  prd: number;
  prb: number;
  cod: number;
  saleCount: number;
  healthStatus: "GREEN" | "YELLOW" | "RED";
}

const HEALTH_DOT: Record<string, string> = {
  GREEN: "bg-green-500",
  YELLOW: "bg-yellow-400",
  RED: "bg-red-500",
};

interface Props {
  matrixVersionId: number;
}

export function RevalAreaNavigator({ matrixVersionId }: Props) {
  const { selectedRevalArea, selectedBuildingType, setSelectedRevalArea, setSelectedBuildingType } =
    useCalibrationContext();

  const { data: summaries = [] } = useQuery<AreaSummary[]>({
    queryKey: ["reval-area-summary", matrixVersionId],
    queryFn: () =>
      fetch(`/api/calibrationdiagnostic/reval-area-summary?matrixVersionId=${matrixVersionId}`)
        .then((r) => r.json()),
    staleTime: 30_000,
  });

  const grouped = summaries.reduce<Record<string, AreaSummary[]>>((acc, s) => {
    if (!acc[s.revalArea]) acc[s.revalArea] = [];
    acc[s.revalArea].push(s);
    return acc;
  }, {});

  function areaHealth(types: AreaSummary[]): string {
    if (types.some((t) => t.healthStatus === "RED")) return "RED";
    if (types.some((t) => t.healthStatus === "YELLOW")) return "YELLOW";
    return "GREEN";
  }

  return (
    <div className="flex flex-col gap-1 p-2 min-w-[160px]">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
        Reval Areas
      </p>

      {Object.entries(grouped).map(([area, types]) => {
        const areaSelected = selectedRevalArea === area && !selectedBuildingType;
        return (
          <div key={area}>
            <button
              className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded text-sm font-medium transition-colors ${
                areaSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => {
                setSelectedRevalArea(area);
                setSelectedBuildingType(null);
              }}
            >
              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${HEALTH_DOT[areaHealth(types)]}`} />
              {area}
            </button>

            <div className="ml-4 flex flex-col gap-0.5 mt-0.5">
              {types.map((t) => {
                const isSelected =
                  selectedRevalArea === area && selectedBuildingType === t.buildingType;
                return (
                  <button
                    key={t.buildingType}
                    className={`flex items-center gap-2 w-full text-left px-2 py-0.5 rounded text-xs transition-colors ${
                      isSelected
                        ? "bg-primary/80 text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                    onClick={() => {
                      setSelectedRevalArea(area);
                      setSelectedBuildingType(t.buildingType);
                    }}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${HEALTH_DOT[t.healthStatus]}`} />
                    {t.buildingType}
                    <span className="ml-auto opacity-60">{t.saleCount}s</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <hr className="my-2 border-border" />
      <button
        className={`text-xs px-2 py-1 rounded transition-colors ${
          !selectedRevalArea ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
        }`}
        onClick={() => {
          setSelectedRevalArea(null);
          setSelectedBuildingType(null);
        }}
      >
        County-Wide
      </button>
    </div>
  );
}
