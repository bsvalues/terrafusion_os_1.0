import { useMemo } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { computeMoransI } from '../utils/spatialStats';
import { computeEquityIndex } from '../utils/equityIndex';
import { bootstrapMedianCI } from '../utils/bootstrap';

function Row({ label, value, status }: { label: string; value: string; status?: 'pass' | 'fail' | 'warn' | null }) {
  const statusEl = status === 'pass'
    ? <span className="text-emerald-400 text-[9px] font-bold ml-1">PASS</span>
    : status === 'fail'
      ? <span className="text-red-400 text-[9px] font-bold ml-1">FAIL</span>
      : status === 'warn'
        ? <span className="text-amber-400 text-[9px] font-bold ml-1">WATCH</span>
        : null;
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
      <span className="text-[10px] text-slate-400">{label}</span>
      <span className="text-[10px] font-mono text-white">{value}{statusEl}</span>
    </div>
  );
}

function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const color =
    grade === 'A' ? '#4ade80' :
    grade === 'B' ? '#86efac' :
    grade === 'C' ? '#fbbf24' :
    grade === 'D' ? '#f97316' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <span className="text-4xl font-black font-mono" style={{ color }}>{grade}</span>
      <div>
        <div className="text-[9px] text-slate-500">County Equity Index</div>
        <div className="text-xl font-mono font-bold text-white">{score}<span className="text-slate-500 text-sm">/100</span></div>
      </div>
    </div>
  );
}

function MiniBar({ value, min, max, lo, hi, good }: { value: number; min: number; max: number; lo: number; hi: number; good: boolean }) {
  const span = max - min;
  const toP = (v: number) => `${Math.max(0, Math.min(100, ((v - min) / span) * 100))}%`;
  const ciW = `${Math.max(0, Math.min(100, ((hi - lo) / span) * 100))}%`;
  return (
    <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mt-0.5">
      <div className="absolute h-full opacity-30 rounded-full" style={{
        left: toP(lo), width: ciW,
        backgroundColor: good ? '#4ade80' : '#ef4444',
      }} />
      <div className="absolute top-0 h-full w-0.5 bg-white/70" style={{ left: toP(value) }} />
    </div>
  );
}

export function NeighborhoodScorecardPanel() {
  const { selectedNeighborhoodCode, neighborhoodStats, salePoints, filter } = useGeoForgeStore();

  const ns = useMemo(
    () => neighborhoodStats.find((n) => n.neighborhoodCode === selectedNeighborhoodCode) ?? null,
    [neighborhoodStats, selectedNeighborhoodCode],
  );

  const moransI = useMemo(() => computeMoransI(neighborhoodStats), [neighborhoodStats]);

  const ci = useMemo(() => {
    if (!selectedNeighborhoodCode) return null;
    const ratios = salePoints
      .filter((s) => s.neighborhoodCode === selectedNeighborhoodCode && !s.isOutlier && s.ratio > 0)
      .map((s) => s.ratio);
    return bootstrapMedianCI(ratios);
  }, [salePoints, selectedNeighborhoodCode]);

  const eqi = useMemo(() => {
    if (!ns) return null;
    const totalSales = neighborhoodStats.reduce((s, n) => s + n.saleCount, 0);
    const wAvg = (fn: (n: typeof neighborhoodStats[0]) => number) => {
      const tot = totalSales;
      if (tot === 0) return 0;
      return neighborhoodStats.reduce((s, n) => s + fn(n) * n.saleCount, 0) / tot;
    };
    return computeEquityIndex({
      cwMed: wAvg((n) => n.stats.medianRatio),
      cwCod: wAvg((n) => n.stats.cod),
      cwPrd: wAvg((n) => n.stats.prd),
      passRate: neighborhoodStats.filter((n) =>
        n.stats.medianRatio >= 0.90 && n.stats.medianRatio <= 1.10 &&
        n.stats.cod <= 20 && n.stats.prd >= 0.98 && n.stats.prd <= 1.03
      ).length / neighborhoodStats.length,
      moransI: moransI?.I ?? 0,
      totalSales,
      totalNbhds: neighborhoodStats.length,
    });
  }, [ns, neighborhoodStats, moransI]);

  if (!ns) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Select a neighborhood on the map to view its scorecard.
      </div>
    );
  }

  const { stats, neighborhoodCode, neighborhoodName, saleCount } = ns;
  const { medianRatio, cod, prd, prb } = stats;

  const medPass = medianRatio >= 0.90 && medianRatio <= 1.10;
  const codPass = cod <= 20;
  const prdPass = prd >= 0.98 && prd <= 1.03;
  const iaaoPass = medPass && codPass && prdPass;

  const medStatus = medianRatio >= 0.90 && medianRatio <= 1.10 ? 'pass' : 'fail';
  const codStatus = cod <= 20 ? 'pass' : cod <= 25 ? 'warn' : 'fail';
  const prdStatus = prd >= 0.98 && prd <= 1.03 ? 'pass' : 'warn';

  const ratioColor =
    medianRatio >= 0.95 && medianRatio <= 1.05 ? '#4ade80' :
    medianRatio >= 0.90 && medianRatio <= 1.10 ? '#fbbf24' : '#ef4444';

  const printDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/60">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest">
              {filter.taxYear} Ratio Study Neighborhood Scorecard
            </div>
            <div className="text-lg font-bold text-white mt-0.5 font-mono">{neighborhoodCode}</div>
            <div className="text-sm text-slate-400">{neighborhoodName}</div>
          </div>
          <div className={`text-right px-3 py-1.5 rounded border ${iaaoPass
            ? 'border-emerald-700/50 bg-emerald-900/20'
            : 'border-red-700/50 bg-red-900/20'
          }`}>
            <div className="text-[8px] text-slate-500 uppercase tracking-wider">IAAO</div>
            <div className={`text-base font-bold ${iaaoPass ? 'text-emerald-400' : 'text-red-400'}`}>
              {iaaoPass ? 'COMPLIANT' : 'NON-COMPLIANT'}
            </div>
          </div>
        </div>
      </div>

      {/* County EQI (contextual) */}
      {eqi && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <GradeBadge grade={eqi.grade} score={eqi.score} />
          <div className="text-[9px] text-slate-500 text-right">
            County-wide<br />equity grade
          </div>
        </div>
      )}

      {/* Core Ratio Study Stats */}
      <div className="border border-slate-700/60 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-slate-800/40 text-[9px] text-slate-500 uppercase tracking-wider">
          IAAO Ratio Study · WAC 458-53A
        </div>
        <div className="px-3 pb-2">
          <Row label="Qualified sales" value={String(saleCount)} />
          <div className="py-1 border-b border-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Median ratio</span>
              <span className="text-[10px] font-mono font-bold" style={{ color: ratioColor }}>
                {medianRatio.toFixed(3)}
                {medPass
                  ? <span className="text-emerald-400 text-[9px] ml-1">PASS</span>
                  : <span className="text-red-400 text-[9px] ml-1">FAIL</span>
                }
              </span>
            </div>
            {ci && (
              <>
                <MiniBar value={medianRatio} min={0.70} max={1.30} lo={ci.lo} hi={ci.hi} good={!ci.definitelyNonCompliant} />
                <div className="text-[8px] text-slate-600 mt-0.5">
                  95% CI [{ci.lo.toFixed(3)}, {ci.hi.toFixed(3)}] · {ci.definitelyNonCompliant ? 'statistically non-compliant' : ci.uncertain ? 'uncertain' : 'statistically compliant'}
                </div>
              </>
            )}
          </div>
          <Row label="COD (uniformity)" value={cod.toFixed(1)} status={codStatus} />
          <Row label="PRD (vertical equity)" value={prd.toFixed(3)} status={prdStatus} />
          {prb !== undefined && (
            <Row label="PRB (price-related bias)" value={prb.toFixed(4)} />
          )}
          <Row label="Mean ratio" value={stats.mean.toFixed(3)} />
          <Row label="Std deviation" value={stats.stdDev.toFixed(3)} />
          <Row label="Ratio range" value={`${stats.min.toFixed(3)} – ${stats.max.toFixed(3)}`} />
        </div>
      </div>

      {/* Quintile breakdown */}
      {stats.q1Ratio > 0 && (
        <div className="border border-slate-700/60 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-slate-800/40 text-[9px] text-slate-500 uppercase tracking-wider">
            Value Quintile Ratios (Q1 Low → Q5 High)
          </div>
          <div className="px-3 pb-2">
            {[
              { label: 'Q1 (lowest value)', value: stats.q1Ratio },
              { label: 'Q2', value: stats.q2Ratio },
              { label: 'Q3 (median)', value: stats.q3Ratio },
              { label: 'Q4', value: stats.q4Ratio },
              { label: 'Q5 (highest value)', value: stats.q5Ratio },
            ].filter((q) => q.value > 0).map((q) => {
              const qColor = q.value >= 0.95 && q.value <= 1.05 ? '#4ade80' : q.value >= 0.90 && q.value <= 1.10 ? '#fbbf24' : '#ef4444';
              return (
                <div key={q.label} className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-[10px] text-slate-400">{q.label}</span>
                  <span className="text-[10px] font-mono" style={{ color: qColor }}>{q.value.toFixed(3)}</span>
                </div>
              );
            })}
            {stats.q5Ratio > 0 && stats.q1Ratio > 0 && (
              <div className="text-[9px] text-slate-500 pt-1.5">
                Q5/Q1 ratio:{' '}
                <span className={stats.q5Ratio / stats.q1Ratio < 0.95 ? 'text-red-400' : stats.q5Ratio / stats.q1Ratio > 1.05 ? 'text-blue-400' : 'text-emerald-400'}>
                  {(stats.q5Ratio / stats.q1Ratio).toFixed(3)}{' '}
                  ({stats.q5Ratio / stats.q1Ratio < 0.95 ? 'regressive' : stats.q5Ratio / stats.q1Ratio > 1.05 ? 'progressive' : 'uniform'})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spatial context */}
      {moransI && (
        <div className="border border-slate-700/60 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-slate-800/40 text-[9px] text-slate-500 uppercase tracking-wider">
            County Spatial Context
          </div>
          <div className="px-3 pb-2">
            <Row label="Global Moran's I" value={moransI.I.toFixed(3)} />
            <Row
              label="Spatial clustering"
              value={moransI.interpretation}
              status={moransI.warning ? 'fail' : null}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-[8px] text-slate-700 border-t border-slate-800 pt-2">
        DRAFT scorecard · Generated {printDate} by TerraFusion GeoForge<br />
        WAC 458-53A · IAAO Standard on Ratio Studies · Not a final certification<br />
        Use hotkey M to generate the full county narrative memo.
      </div>
    </div>
  );
}
