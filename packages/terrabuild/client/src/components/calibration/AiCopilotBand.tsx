import type { RatioProjection } from "@/hooks/calibration/useRatioProjection";

interface Props {
  current: RatioProjection;
  projected: RatioProjection;
  adjustmentPct: number;
  isSimulating: boolean;
}

const IAAO = { prdLo: 0.98, prdHi: 1.03, prbMax: 0.05, codMax: 15 };

function metricColor(value: number, lo: number, hi: number): string {
  if (value < lo || value > hi) return "text-red-500";
  const range = hi - lo;
  const margin = Math.min(value - lo, hi - value) / (range / 2);
  if (margin < 0.2) return "text-yellow-400";
  return "text-green-400";
}

function absColor(value: number, max: number): string {
  if (Math.abs(value) > max) return "text-red-500";
  if (Math.abs(value) > max * 0.8) return "text-yellow-400";
  return "text-green-400";
}

function aiNarrative(
  current: RatioProjection,
  isSimulating: boolean,
  adjPct: number,
  projected: RatioProjection
): string {
  if (!isSimulating) {
    const prdOk = current.prd >= IAAO.prdLo && current.prd <= IAAO.prdHi;
    const codOk = current.cod <= IAAO.codMax;
    const prbOk = Math.abs(current.prb) <= IAAO.prbMax;
    if (prdOk && codOk && prbOk)
      return `All IAAO metrics within standard. Study appears equitable with ${current.saleCount} sales.`;
    const issues: string[] = [];
    if (!prdOk)
      issues.push(
        `PRD ${current.prd.toFixed(3)} indicates ${current.prd > 1.03 ? "regressivity" : "progressivity"}`
      );
    if (!codOk) issues.push(`COD ${current.cod.toFixed(1)}% exceeds 15% threshold — high variability`);
    if (!prbOk)
      issues.push(
        `PRB ${current.prb.toFixed(3)} ${current.prb > 0 ? "favors high-value" : "favors low-value"} properties`
      );
    return issues.join(". ") + ".";
  }
  const ok =
    projected.prd >= IAAO.prdLo &&
    projected.prd <= IAAO.prdHi &&
    Math.abs(projected.prb) <= IAAO.prbMax &&
    projected.cod <= IAAO.codMax;
  return ok
    ? `Simulation: ${adjPct > 0 ? "+" : ""}${adjPct.toFixed(2)}% adjustment achieves IAAO compliance. Recommend proceeding.`
    : `Simulation: ${adjPct > 0 ? "+" : ""}${adjPct.toFixed(2)}% adjustment does not fully achieve compliance. Review metrics below.`;
}

function MetricPair({
  label,
  current,
  projected,
  lo,
  hi,
  isAbs = false,
}: {
  label: string;
  current: number;
  projected: number;
  lo: number;
  hi: number;
  isAbs?: boolean;
}) {
  const currColor = isAbs ? absColor(current, hi) : metricColor(current, lo, hi);
  const projColor = isAbs ? absColor(projected, hi) : metricColor(projected, lo, hi);
  const delta = projected - current;
  return (
    <div className="flex flex-col items-center min-w-[80px]">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-lg font-mono font-bold ${currColor}`}>{current.toFixed(3)}</span>
      <span className={`text-xs font-mono ${projColor}`}>
        → {projected.toFixed(3)}{" "}
        <span className={delta < 0 ? "text-green-400" : "text-red-400"}>
          ({delta >= 0 ? "+" : ""}
          {delta.toFixed(3)})
        </span>
      </span>
    </div>
  );
}

export function AiCopilotBand({ current, projected, adjustmentPct, isSimulating }: Props) {
  const narrative = aiNarrative(current, isSimulating, adjustmentPct, projected);

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        {isSimulating && (
          <span className="text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded-full animate-pulse">
            LIVE SIMULATION
          </span>
        )}

        {isSimulating ? (
          <>
            <MetricPair
              label="PRD"
              current={current.prd}
              projected={projected.prd}
              lo={IAAO.prdLo}
              hi={IAAO.prdHi}
            />
            <MetricPair
              label="PRB"
              current={current.prb}
              projected={projected.prb}
              lo={-IAAO.prbMax}
              hi={IAAO.prbMax}
              isAbs
            />
            <MetricPair
              label="COD"
              current={current.cod}
              projected={projected.cod}
              lo={0}
              hi={IAAO.codMax}
            />
            <MetricPair
              label="Median"
              current={current.medianRatio}
              projected={projected.medianRatio}
              lo={0.95}
              hi={1.05}
            />
          </>
        ) : (
          <div className="flex gap-6 flex-wrap">
            {[
              { label: "PRD", value: current.prd, color: metricColor(current.prd, IAAO.prdLo, IAAO.prdHi) },
              { label: "PRB", value: current.prb, color: absColor(current.prb, IAAO.prbMax) },
              { label: "COD", value: current.cod, color: metricColor(current.cod, 0, IAAO.codMax) },
              {
                label: "Median",
                value: current.medianRatio,
                color: metricColor(current.medianRatio, 0.95, 1.05),
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-xl font-mono font-bold ${color}`}>{value.toFixed(3)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="ml-auto text-xs text-muted-foreground max-w-xs text-right hidden lg:block">
          {narrative}
        </div>
      </div>
      <p className="text-xs text-muted-foreground lg:hidden">{narrative}</p>
    </div>
  );
}
