import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { computeMoransI } from '../utils/spatialStats';
import { computeEquityIndex } from '../utils/equityIndex';
import { computeLevyParity } from '../utils/levyParity';
import {
  exportNeighborhoodStats,
  exportSalePoints,
  exportLevyParity,
  exportEQIReport,
} from '../utils/exportData';
import type { YoyChangePoint } from '../types/geoforge.types';

function ExportButton({
  label,
  sub,
  onClick,
  disabled,
}: {
  label: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [clicked, setClicked] = useState(false);
  function handle() {
    onClick();
    setClicked(true);
    setTimeout(() => setClicked(false), 1800);
  }
  return (
    <button
      disabled={disabled || clicked}
      onClick={handle}
      className="w-full flex items-start gap-3 px-3 py-2.5 rounded border border-slate-700/50
        bg-slate-800/30 hover:bg-slate-700/40 disabled:opacity-40 disabled:cursor-not-allowed
        transition-colors text-left group"
    >
      <span className="text-slate-400 group-hover:text-terra-cyan text-lg leading-none mt-0.5">↓</span>
      <div>
        <div className="text-[11px] font-semibold text-slate-200 group-hover:text-white">
          {clicked ? '✓ Downloading…' : label}
        </div>
        <div className="text-[9px] text-slate-500">{sub}</div>
      </div>
    </button>
  );
}

export function ExportPanel() {
  const { neighborhoodStats, salePoints, filter } = useGeoForgeStore();
  const [county] = useState('Benton');

  const { data: avData } = useQuery<YoyChangePoint[]>({
    queryKey: ['geoforge-av-change', filter.taxYear],
    queryFn: () =>
      apiFetchJson<YoyChangePoint[]>(
        `/geoforge/neighborhoods/av-change?taxYear=${filter.taxYear}`
      ),
    staleTime: 1000 * 60 * 10,
  });

  const moransI = useMemo(() => computeMoransI(neighborhoodStats), [neighborhoodStats]);

  const eqi = useMemo(() => {
    const total = neighborhoodStats.reduce((s, n) => s + n.saleCount, 0);
    if (neighborhoodStats.length === 0 || total === 0) return null;
    const wAvg = (fn: (n: typeof neighborhoodStats[0]) => number) =>
      neighborhoodStats.reduce((s, n) => s + fn(n) * n.saleCount, 0) / total;
    const cwMed = wAvg((n) => n.stats.medianRatio);
    const cwCod = wAvg((n) => n.stats.cod);
    const cwPrd = wAvg((n) => n.stats.prd);
    const passing = neighborhoodStats.filter(
      (n) => n.stats.medianRatio >= 0.90 && n.stats.medianRatio <= 1.10 &&
        n.stats.cod <= 20 && n.stats.prd >= 0.98 && n.stats.prd <= 1.03
    );
    return computeEquityIndex({
      cwMed, cwCod, cwPrd,
      passRate: passing.length / neighborhoodStats.length,
      moransI: moransI?.I ?? 0,
      totalSales: total,
      totalNbhds: neighborhoodStats.length,
    });
  }, [neighborhoodStats, moransI]);

  const levySummary = useMemo(
    () => computeLevyParity(neighborhoodStats, avData ?? [], null),
    [neighborhoodStats, avData],
  );

  const hasStats = neighborhoodStats.length > 0;
  const hasSales = salePoints.length > 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      <div className="text-[10px] text-slate-400 leading-relaxed">
        Export {filter.taxYear} ratio study data for DOR submission, Excel analysis, or peer review.
        Files are UTF-8 CSV with BOM for Excel compatibility.
      </div>

      {/* Data summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800/40 rounded p-2 text-center">
          <div className="text-lg font-mono font-bold text-white">{neighborhoodStats.length}</div>
          <div className="text-[9px] text-slate-500">Neighborhoods</div>
        </div>
        <div className="bg-slate-800/40 rounded p-2 text-center">
          <div className="text-lg font-mono font-bold text-white">{salePoints.length.toLocaleString()}</div>
          <div className="text-[9px] text-slate-500">Total sales</div>
        </div>
        <div className="bg-slate-800/40 rounded p-2 text-center">
          {eqi
            ? <div className="text-lg font-mono font-bold" style={{ color: eqi.color }}>{eqi.score}</div>
            : <div className="text-lg font-mono font-bold text-slate-600">—</div>
          }
          <div className="text-[9px] text-slate-500">EQI score</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Ratio Study</div>

        <ExportButton
          label="Neighborhood Ratio Study · CSV"
          sub={`${neighborhoodStats.length} neighborhoods · median ratio, COD, PRD, PRB, IAAO pass`}
          disabled={!hasStats}
          onClick={() => exportNeighborhoodStats(neighborhoodStats, filter.taxYear, county)}
        />

        <ExportButton
          label="Sale Points · CSV"
          sub={`${salePoints.length} sales · ratio, sale price, AV, qualification decision, lat/lng`}
          disabled={!hasSales}
          onClick={() => exportSalePoints(salePoints, filter.taxYear, county)}
        />
      </div>

      <div className="space-y-2">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Equity Analysis</div>

        <ExportButton
          label="County Equity Index Report · CSV"
          sub="EQI score, grade, component breakdown"
          disabled={!eqi}
          onClick={() => eqi && exportEQIReport(eqi, neighborhoodStats, filter.taxYear, county)}
        />

        <ExportButton
          label="Levy Parity Analysis · CSV"
          sub="AV share, true MV share, burden shift % per neighborhood"
          disabled={!levySummary}
          onClick={() => levySummary && exportLevyParity(levySummary, filter.taxYear, county)}
        />
      </div>

      <div className="space-y-2">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider">DOR Certification</div>
        <div className="px-3 py-2 rounded border border-terra-cyan/20 bg-terra-cyan/5 text-[10px] text-slate-400">
          Use hotkey <kbd className="bg-slate-800 border border-slate-600 rounded px-1 font-mono text-[9px]">M</kbd> to
          generate the full DOR WAC 458-53A narrative memo (plain text, copy-to-clipboard).
        </div>
      </div>

      <div className="text-[8px] text-slate-700 border-t border-slate-800 pt-2">
        TerraFusion GeoForge · {county} County · {filter.taxYear} Tax Year<br />
        WAC 458-53A · IAAO Standard on Ratio Studies
      </div>
    </div>
  );
}
