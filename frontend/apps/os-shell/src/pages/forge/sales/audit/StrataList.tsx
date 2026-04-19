import React from 'react';
import type { StratumDiagnosisSummary } from '../../../../services/forge/salesAuditApi';

const DIAGNOSIS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  DATA_PROBLEM:    { bg: 'bg-red-950',     text: 'text-red-400',    label: 'DATA'       },
  MODEL_DRIFT:     { bg: 'bg-purple-950',  text: 'text-purple-400', label: 'MODEL DRIFT'},
  OUTLIER_CLUSTER: { bg: 'bg-amber-950',   text: 'text-amber-400',  label: 'OUTLIER'    },
  MARKET_SHIFT:    { bg: 'bg-cyan-950',    text: 'text-cyan-400',   label: 'MARKET'     },
  EXTERNAL_FACTOR: { bg: 'bg-slate-800',   text: 'text-slate-400',  label: 'EXTERNAL'   },
  FLAG_FOR_REVIEW: { bg: 'bg-slate-800',   text: 'text-slate-400',  label: 'REVIEW'     },
};

interface StrataRowProps {
  s: StratumDiagnosisSummary;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

function StrataRow({ s, selectedKey, onSelect }: StrataRowProps) {
  const isSelected = s.stratumKey === selectedKey;
  const style = s.primaryDiagnosis ? DIAGNOSIS_STYLE[s.primaryDiagnosis] : null;

  return (
    <button
      onClick={() => onSelect(s.stratumKey)}
      className={[
        'w-full text-left px-3 py-2 border-b border-slate-800/50',
        'hover:bg-slate-800 transition-colors',
        isSelected ? 'bg-slate-800 border-l-2 border-l-cyan-500' : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-sm text-slate-200 font-medium truncate">{s.stratumKey}</span>
        {style && (
          <span className={`shrink-0 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
            {style.label}
          </span>
        )}
      </div>
      <div className="text-[10px] text-slate-600 mt-0.5">
        {s.confidence != null ? `${Math.round(s.confidence * 100)}% confidence` : 'no diagnosis'}
        {s.isStale ? ' · stale' : ''}
      </div>
    </button>
  );
}

interface StrataListProps {
  strata: StratumDiagnosisSummary[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  loading?: boolean;
}

export function StrataList({ strata, selectedKey, onSelect, loading }: StrataListProps) {
  const failing = strata.filter((s) => s.primaryDiagnosis && s.primaryDiagnosis !== 'PASSING');
  const passing = strata.filter((s) => !s.primaryDiagnosis || s.primaryDiagnosis === 'PASSING');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
        Loading strata…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {failing.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-red-500 bg-slate-950 border-b border-slate-800 sticky top-0">
            Failing ({failing.length})
          </div>
          {failing.map(s => <StrataRow key={s.stratumKey} s={s} selectedKey={selectedKey} onSelect={onSelect} />)}
        </>
      )}
      {passing.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-500 bg-slate-950 border-b border-slate-800 sticky top-0">
            Passing ({passing.length})
          </div>
          {passing.map(s => <StrataRow key={s.stratumKey} s={s} selectedKey={selectedKey} onSelect={onSelect} />)}
        </>
      )}
    </div>
  );
}
