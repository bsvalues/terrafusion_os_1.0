import { useMemo, useState } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { SalePoint } from '../types/geoforge.types';

const DOCUMENTED_KEYWORDS = [
  'foreclosure', 'reo', 'bank', 'distressed', 'related party', 'estate',
  'partial interest', 'easement', 'eminent domain', 'condemnation',
  'non-market', 'assemblage', 'tear-down', 'tear down', 'contaminated',
  'leasehold', 'trade', 'donation', 'gift', 'government', 'exempt',
  'outlier', 'cod', 'price', 'ratio', 'time', 'invalid',
];

function isDocumented(decision: string): boolean {
  if (!decision || decision.trim().length < 3) return false;
  const lower = decision.toLowerCase();
  return DOCUMENTED_KEYWORDS.some((kw) => lower.includes(kw));
}

type FilterMode = 'all' | 'undocumented' | 'outlier';

function DecisionBadge({ decision }: { decision: string }) {
  const doc = isDocumented(decision);
  const empty = !decision || decision.trim().length < 3;
  if (empty)
    return <span className="text-[8px] text-red-400 bg-red-950/30 rounded px-1 shrink-0">MISSING</span>;
  if (!doc)
    return <span className="text-[8px] text-amber-400 bg-amber-950/20 rounded px-1 shrink-0">VAGUE</span>;
  return <span className="text-[8px] text-emerald-500/70 rounded px-1 shrink-0">OK</span>;
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function SaleRow({ sale, flagged, onFlag }: {
  sale: SalePoint;
  flagged: boolean;
  onFlag: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const doc = isDocumented(sale.qualificationDecision);

  return (
    <div
      className={`border-b border-slate-800/50 ${!doc ? 'bg-amber-950/5' : ''} ${flagged ? 'ring-1 ring-inset ring-amber-500/30' : ''}`}
    >
      <div
        className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-800/20"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-400 font-mono truncate">{sale.parcelId}</span>
            <span className="text-[8px] text-slate-600">{sale.saleDate?.slice(0, 7)}</span>
          </div>
          <div className="text-[8px] text-slate-500 truncate">
            {fmt(sale.salePrice)} · ratio {sale.ratio?.toFixed(3) ?? '—'} · {sale.neighborhoodCode}
          </div>
        </div>
        <DecisionBadge decision={sale.qualificationDecision} />
        <button
          onClick={(e) => { e.stopPropagation(); onFlag(); }}
          className={`text-[9px] shrink-0 rounded px-1.5 py-0.5 border transition-colors ${
            flagged
              ? 'border-amber-500/50 text-amber-400 bg-amber-950/30'
              : 'border-slate-700 text-slate-600 hover:text-amber-400 hover:border-amber-500/40'
          }`}
          title={flagged ? 'Flagged for supervisor review' : 'Flag for supervisor review'}
        >
          {flagged ? '⚑' : '⚐'}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-2 text-[9px] border-t border-slate-800/40 pt-1.5">
          <div className="text-slate-500 mb-0.5">Qualification decision:</div>
          <div className={`${isDocumented(sale.qualificationDecision) ? 'text-slate-300' : 'text-amber-300'} break-words`}>
            {sale.qualificationDecision?.trim() || <em className="text-red-400">No decision documented</em>}
          </div>
          <div className="flex gap-4 mt-1.5 text-slate-600">
            <span>AV {fmt(sale.assessedValue)}</span>
            <span>Class {sale.propertyClass}</span>
            <span>{sale.isOutlier ? 'Outlier-excluded' : 'Non-qualified'}</span>
          </div>
          {!isDocumented(sale.qualificationDecision) && (
            <div className="mt-1 text-amber-400/70">
              → IAAO requires written rationale. Document reason before DOR submission.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function QualDecisionPanel() {
  const { salePoints, filter } = useGeoForgeStore();
  const [filterMode, setFilterMode] = useState<FilterMode>('undocumented');
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const excluded = useMemo(
    () => salePoints.filter((s) => s.isOutlier || (s.qualificationDecision && s.qualificationDecision !== 'Qualified')),
    [salePoints],
  );

  const undocumented = useMemo(() => excluded.filter((s) => !isDocumented(s.qualificationDecision)), [excluded]);
  const outlierOnly = useMemo(() => excluded.filter((s) => s.isOutlier), [excluded]);

  const visible = useMemo(() => {
    let base = filterMode === 'undocumented' ? undocumented
      : filterMode === 'outlier' ? outlierOnly
      : excluded;
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter(
        (s) => s.parcelId.toLowerCase().includes(q) ||
          s.neighborhoodCode.toLowerCase().includes(q) ||
          (s.qualificationDecision ?? '').toLowerCase().includes(q),
      );
    }
    return base;
  }, [filterMode, excluded, undocumented, outlierOnly, search]);

  function toggleFlag(id: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const undocRate = excluded.length > 0 ? undocumented.length / excluded.length : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Summary */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-slate-700/50">
        <div className="flex items-center gap-3 mb-1.5">
          <span className={`text-[10px] font-semibold ${undocumented.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {undocumented.length} undocumented exclusion{undocumented.length !== 1 ? 's' : ''}
          </span>
          <span className="text-[9px] text-slate-500">of {excluded.length} total</span>
          <span className="ml-auto text-[8px] text-slate-600">{filter.taxYear}</span>
        </div>

        {undocumented.length > 0 && (
          <div className={`text-[9px] rounded px-2 py-1 mb-1.5 ${undocRate > 0.3 ? 'text-red-400 bg-red-950/20' : 'text-amber-400/80 bg-amber-950/15'}`}>
            {(undocRate * 100).toFixed(0)}% of exclusions lack documented rationale — IAAO requires written justification for each.
          </div>
        )}

        {flagged.size > 0 && (
          <div className="text-[9px] text-amber-400 mb-1.5">
            {flagged.size} sale{flagged.size !== 1 ? 's' : ''} flagged for supervisor review
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-1.5">
          {([
            ['undocumented', `Undocumented (${undocumented.length})`],
            ['all', `All excluded (${excluded.length})`],
            ['outlier', `Outlier (${outlierOnly.length})`],
          ] as [FilterMode, string][]).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                filterMode === mode
                  ? 'bg-terra-cyan/20 border-terra-cyan/50 text-terra-cyan'
                  : 'border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search parcel, neighborhood, decision…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-terra-cyan/40"
        />
      </div>

      {/* Sale list */}
      <div className="flex-1 overflow-y-auto">
        {salePoints.length === 0 ? (
          <div className="p-4 text-slate-600 text-xs text-center">Load sales data to review qualification decisions.</div>
        ) : visible.length === 0 ? (
          <div className="p-4 text-slate-500 text-xs text-center">
            {filterMode === 'undocumented' ? 'All exclusions are documented.' : 'No sales match the current filter.'}
          </div>
        ) : (
          <>
            <div className="px-3 py-1 text-[8px] text-slate-600 bg-slate-900/30 border-b border-slate-800">
              {visible.length} sale{visible.length !== 1 ? 's' : ''} · click to expand · ⚐ flag for supervisor
            </div>
            {visible.map((s) => (
              <SaleRow
                key={s.saleId}
                sale={s}
                flagged={flagged.has(s.saleId)}
                onFlag={() => toggleFlag(s.saleId)}
              />
            ))}
            <p className="px-3 py-2 text-[8px] text-slate-700">
              IAAO Standard on Ratio Studies §5.2: "Each excluded sale shall have a documented reason." WAC 458-53A-060.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
