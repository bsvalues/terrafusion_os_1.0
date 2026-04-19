import { useState, useMemo, useRef } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { computeMoransI } from '../utils/spatialStats';
import { computeEquityIndex } from '../utils/equityIndex';
import { generateDorMemo } from '../utils/dorMemo';

function todayStr(): string {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function DorMemoPanel() {
  const { neighborhoodStats, filter } = useGeoForgeStore();
  const [assessorName, setAssessorName] = useState('');
  const [county, setCounty] = useState('Benton');
  const [memo, setMemo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

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
      (n) => n.stats.medianRatio >= 0.90 && n.stats.medianRatio <= 1.10 && n.stats.cod <= 20 && n.stats.prd >= 0.98 && n.stats.prd <= 1.03
    );
    return computeEquityIndex({
      cwMed, cwCod, cwPrd,
      passRate: passing.length / neighborhoodStats.length,
      moransI: moransI?.I ?? 0,
      totalSales: total,
      totalNbhds: neighborhoodStats.length,
    });
  }, [neighborhoodStats, moransI]);

  const hasData = neighborhoodStats.length > 0;

  function handleGenerate() {
    const text = generateDorMemo({
      taxYear: filter.taxYear,
      county,
      assessorName: assessorName.trim() || 'Assessor',
      generatedDate: todayStr(),
      neighborhoodStats,
      eqi,
      moransI,
    });
    setMemo(text);
    setCopied(false);
  }

  function handleCopy() {
    if (!memo) return;
    navigator.clipboard.writeText(memo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Config */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700/50 space-y-3">
        <div className="text-[10px] text-slate-400 leading-relaxed">
          Generates a draft WAC 458-53A ratio study narrative for DOR certification.
          Based on live {filter.taxYear} GeoForge statistics. Review carefully before submission.
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">County</label>
            <input
              type="text"
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-terra-cyan"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">Assessor name</label>
            <input
              type="text"
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-terra-cyan"
              placeholder="Your name"
              value={assessorName}
              onChange={(e) => setAssessorName(e.target.value)}
            />
          </div>
        </div>

        {/* Stats summary pre-flight */}
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-slate-500">
            {neighborhoodStats.length} nbhds ·{' '}
            {neighborhoodStats.reduce((s, n) => s + n.saleCount, 0).toLocaleString()} sales
          </span>
          {eqi && (
            <span className="font-mono font-bold" style={{ color: eqi.color }}>
              EQI {eqi.score} / {eqi.grade}
            </span>
          )}
          {moransI && (
            <span className="font-mono text-slate-400">
              I={moransI.I.toFixed(3)}
              {moransI.warning && <span className="text-amber-400 ml-1">⚠</span>}
            </span>
          )}
        </div>

        <button
          disabled={!hasData}
          onClick={handleGenerate}
          className="w-full py-2 rounded bg-terra-cyan/10 border border-terra-cyan/30 text-terra-cyan text-sm font-semibold
            hover:bg-terra-cyan/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generate Draft Memo
        </button>
      </div>

      {/* Memo output */}
      {memo ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-700/50 flex-shrink-0">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">
              Draft — not a final certification
            </span>
            <button
              onClick={handleCopy}
              className="text-[10px] px-2 py-0.5 rounded border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <textarea
            ref={textRef}
            readOnly
            value={memo}
            className="flex-1 w-full bg-slate-950 text-[9px] font-mono text-slate-300 p-3 resize-none focus:outline-none leading-[1.5]"
            spellCheck={false}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-700 text-xs">
          Configure and generate to see the draft memo
        </div>
      )}
    </div>
  );
}
