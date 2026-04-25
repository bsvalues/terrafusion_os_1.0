import { useMemo } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { kMeansCluster } from '../utils/clustering';
import type { ClusterProfile } from '../utils/clustering';

function StatCell({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-[11px] font-mono font-semibold ${warn ? 'text-amber-300' : 'text-slate-200'}`}>
        {value}
      </span>
      <span className="text-[8px] text-slate-600 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function ClusterScatter({ clusters }: { clusters: ClusterProfile[] }) {
  const W = 300, H = 120;
  const PAD = { l: 32, r: 8, t: 8, b: 24 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  const allMembers = clusters.flatMap((c) => c.members.map((m) => ({ ...m, clusterId: c.id, color: c.color })));
  if (allMembers.length === 0) return null;

  const ratios = allMembers.map((m) => m.stats.medianRatio);
  const cods = allMembers.map((m) => m.stats.cod);
  const rMin = Math.min(...ratios), rMax = Math.max(...ratios);
  const cMin = Math.min(...cods), cMax = Math.max(...cods);
  const rRange = rMax - rMin || 0.01;
  const cRange = cMax - cMin || 0.01;

  const px = (r: number) => PAD.l + ((r - rMin) / rRange) * iW;
  const py = (c: number) => PAD.t + iH - ((c - cMin) / cRange) * iH;

  const parityX = px(1.0);
  const ticks = [0.90, 0.95, 1.0, 1.05, 1.10].filter((v) => v >= rMin - 0.02 && v <= rMax + 0.02);

  return (
    <svg width={W} height={H} className="overflow-visible">
      {/* IAAO band */}
      <rect
        x={px(0.90)} y={PAD.t}
        width={px(1.10) - px(0.90)} height={iH}
        fill="#22c55e" opacity={0.06}
      />
      {/* Parity line */}
      <line x1={parityX} y1={PAD.t} x2={parityX} y2={PAD.t + iH} stroke="#6b7280" strokeDasharray="3 2" strokeWidth={0.8} />
      {/* Axes */}
      <line x1={PAD.l} y1={PAD.t + iH} x2={PAD.l + iW} y2={PAD.t + iH} stroke="#374151" strokeWidth={0.5} />
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + iH} stroke="#374151" strokeWidth={0.5} />
      {/* X ticks */}
      {ticks.map((v) => (
        <text key={v} x={px(v)} y={H - 4} textAnchor="middle" fontSize={7} fill="#6b7280">
          {v.toFixed(2)}
        </text>
      ))}
      {/* Y axis label */}
      <text x={8} y={PAD.t + iH / 2} textAnchor="middle" fontSize={7} fill="#6b7280"
        transform={`rotate(-90, 8, ${PAD.t + iH / 2})`}>COD</text>
      {/* X axis label */}
      <text x={PAD.l + iW / 2} y={H - 1} textAnchor="middle" fontSize={7} fill="#6b7280">Median Ratio</text>
      {/* Points */}
      {allMembers.map((m) => (
        <circle
          key={m.neighborhoodCode}
          cx={px(m.stats.medianRatio)}
          cy={py(m.stats.cod)}
          r={3}
          fill={m.color}
          opacity={0.85}
          stroke="#0f172a"
          strokeWidth={0.5}
        />
      ))}
    </svg>
  );
}

function ClusterCard({ cluster, rank }: { cluster: ClusterProfile; rank: number }) {
  const passRate = cluster.iaaoPassRate;
  const passColor = passRate >= 0.80 ? 'text-emerald-400' : passRate >= 0.50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="border border-slate-700/60 rounded-md overflow-hidden mb-2">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderLeft: `3px solid ${cluster.color}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-200">{cluster.label}</span>
          <span className="text-[9px] text-slate-500">({cluster.members.length} nbhd{cluster.members.length !== 1 ? 's' : ''})</span>
        </div>
        <span className={`text-[10px] font-semibold ${passColor}`}>
          {(passRate * 100).toFixed(0)}% IAAO pass
        </span>
      </div>

      {/* Centroid stats */}
      <div className="flex justify-around px-3 py-1.5 bg-slate-900/30 border-b border-slate-800">
        <StatCell
          label="Median Ratio"
          value={cluster.centroid.ratio.toFixed(3)}
          warn={Math.abs(cluster.centroid.ratio - 1) > 0.10}
        />
        <StatCell
          label="COD"
          value={cluster.centroid.cod.toFixed(1)}
          warn={cluster.centroid.cod > 20}
        />
        <StatCell
          label="PRD"
          value={cluster.centroid.prd.toFixed(3)}
          warn={cluster.centroid.prd < 0.98 || cluster.centroid.prd > 1.03}
        />
      </div>

      {/* Action */}
      <div className="px-3 py-1.5 text-[9px] text-slate-400">
        → {cluster.action}
      </div>

      {/* Member list */}
      <div className="max-h-[88px] overflow-y-auto">
        {cluster.members.map((ns) => {
          const dev = Math.abs(ns.stats.medianRatio - 1);
          return (
            <div
              key={ns.neighborhoodCode}
              className="flex items-center justify-between px-3 py-0.5 border-t border-slate-800/50 hover:bg-slate-800/20"
            >
              <span className="text-[9px] text-slate-400 truncate max-w-[180px]">
                {ns.neighborhoodCode} · {ns.neighborhoodName}
              </span>
              <span className={`text-[9px] font-mono shrink-0 ml-2 ${dev > 0.10 ? 'text-red-400' : dev > 0.05 ? 'text-amber-400' : 'text-slate-400'}`}>
                {ns.stats.medianRatio.toFixed(3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ClusteringPanel() {
  const { neighborhoodStats, loadingStats } = useGeoForgeStore();

  const result = useMemo(
    () => kMeansCluster(neighborhoodStats.filter((ns) => ns.saleCount >= 3), 3, 50),
    [neighborhoodStats],
  );

  if (neighborhoodStats.length === 0) {
    return (
      <div className="p-4 text-slate-600 text-xs text-center flex items-center justify-center gap-2">
        {loadingStats ? <><span className="animate-spin inline-block text-terra-cyan">⟳</span> Loading…</> : 'Load neighborhood stats to run clustering.'}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-4 text-slate-600 text-xs text-center">
        Insufficient neighborhoods (need ≥ 3 with ≥ 3 sales).
      </div>
    );
  }

  const { clusters } = result;
  const critical = clusters.find((c) => c.label === 'Critical');
  const atRisk = clusters.find((c) => c.label === 'At-Risk');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Summary banner */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-slate-700/50">
        <div className="flex items-center gap-3 flex-wrap">
          {clusters.map((c) => (
            <div key={c.id} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-[10px] text-slate-300">{c.label}: <strong>{c.members.length}</strong></span>
            </div>
          ))}
          <span className="ml-auto text-[8px] text-slate-600">k=3 · normalized COD/ratio/PRD</span>
        </div>
        {(critical && critical.members.length > 0) && (
          <div className="mt-1.5 text-[9px] text-red-400 bg-red-950/20 rounded px-2 py-1">
            {critical.members.length} neighborhood{critical.members.length !== 1 ? 's' : ''} require mass appraisal adjustment before DOR certification.
          </div>
        )}
        {(!critical || critical.members.length === 0) && atRisk && atRisk.members.length > 0 && (
          <div className="mt-1.5 text-[9px] text-amber-400 bg-amber-950/20 rounded px-2 py-1">
            {atRisk.members.length} neighborhood{atRisk.members.length !== 1 ? 's' : ''} at risk — targeted review recommended.
          </div>
        )}
      </div>

      {/* Scatter */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800/50 flex justify-center">
        <ClusterScatter clusters={clusters} />
      </div>

      {/* Cluster cards */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {clusters.map((c, i) => (
          <ClusterCard key={c.id} cluster={c} rank={i} />
        ))}
        <p className="text-[8px] text-slate-700 pt-1 pb-2 text-center">
          K-means on normalized (ratio, COD, PRD) · min 3 qualified sales · {neighborhoodStats.length} neighborhoods loaded
        </p>
      </div>
    </div>
  );
}
