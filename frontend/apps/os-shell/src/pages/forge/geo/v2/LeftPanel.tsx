// frontend/apps/os-shell/src/pages/forge/geo/v2/LeftPanel.tsx
import { useState } from 'react';
import type { AuditRankedRow } from './v2Api';

export type V2LayerId = 'nbhd' | 'parcels' | 'outliers';

const LAYER_GROUPS: { heading: string; layers: { id: V2LayerId; label: string }[] }[] = [
  {
    heading: 'Base',
    layers: [
      { id: 'nbhd',     label: 'Neighborhood Bounds' },
      { id: 'parcels',  label: 'Parcel Fill' },
      { id: 'outliers', label: 'Outlier Highlights' },
    ],
  },
];

// Analysis and Evidence layers are future — shown as coming-soon chips
const FUTURE_LAYERS = [
  'GWR Surface', 'LISA Clusters', 'Drift Vectors',
  'FEMA Flood Zones', 'School Districts', 'Road Noise',
];

interface Props {
  auditRows: AuditRankedRow[];
  auditLoading: boolean;
  selectedNbhd: string | null;
  onNbhdSelect: (code: string) => void;
  visibleLayers: Set<V2LayerId>;
  onLayerToggle: (id: V2LayerId) => void;
}

export function LeftPanel({
  auditRows,
  auditLoading,
  selectedNbhd,
  onNbhdSelect,
  visibleLayers,
  onLayerToggle,
}: Props) {
  const [tab, setTab] = useState<'layers' | 'queue'>('queue');

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-700/60 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-700/60 flex-shrink-0">
        {(['queue', 'layers'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-[11px] font-semibold uppercase tracking-widest transition-colors
              ${tab === t
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900/40'
                : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t === 'queue' ? 'Queue' : 'Layers'}
          </button>
        ))}
      </div>

      {/* Queue tab */}
      {tab === 'queue' && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2 border-b border-slate-800">
            <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500">AI-ranked · Impact × Severity</div>
          </div>
          {auditLoading && (
            <div className="px-3 py-4 text-[11px] text-slate-500 animate-pulse">Scoring neighborhoods…</div>
          )}
          {auditRows.map((row) => (
            <QueueRow
              key={row.neighborhoodCode}
              row={row}
              selected={row.neighborhoodCode === selectedNbhd}
              onClick={() => onNbhdSelect(row.neighborhoodCode)}
            />
          ))}
          {!auditLoading && auditRows.length === 0 && (
            <div className="px-3 py-4 text-[11px] text-slate-500">No audit findings.</div>
          )}
        </div>
      )}

      {/* Layers tab */}
      {tab === 'layers' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {LAYER_GROUPS.map((group) => (
            <div key={group.heading}>
              <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">{group.heading}</div>
              <div className="space-y-1">
                {group.layers.map((layer) => (
                  <label
                    key={layer.id}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={visibleLayers.has(layer.id)}
                      onChange={() => onLayerToggle(layer.id)}
                      className="accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-[12px] text-slate-300 group-hover:text-slate-100 transition-colors">
                      {layer.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">Analysis + Evidence</div>
            <div className="space-y-1.5">
              {FUTURE_LAYERS.map((name) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-600">{name}</span>
                  <span className="text-[9px] font-bold tracking-widest uppercase text-slate-700 border border-slate-700 rounded px-1">soon</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Queue row sub-component ───────────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60',
  B: 'bg-teal-900/60 text-teal-300 border-teal-700/60',
  C: 'bg-amber-900/60 text-amber-300 border-amber-700/60',
  D: 'bg-orange-900/60 text-orange-300 border-orange-700/60',
  F: 'bg-red-900/60 text-red-300 border-red-700/60',
  N: 'bg-slate-800/60 text-slate-400 border-slate-700/60',
};

function QueueRow({
  row,
  selected,
  onClick,
}: {
  row: AuditRankedRow;
  selected: boolean;
  onClick: () => void;
}) {
  const gradeClass = GRADE_COLORS[row.grade] ?? GRADE_COLORS.N;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 border-b border-slate-800/60 flex gap-2.5 transition-colors
        ${selected ? 'bg-slate-800/80' : 'hover:bg-slate-900/60'}`}
    >
      <span className={`flex-shrink-0 w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center border ${gradeClass}`}>
        {row.grade}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-slate-200 truncate">{row.neighborhoodCode}</div>
        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
          med {row.medianRatio.toFixed(3)} · cod {row.cod.toFixed(1)} · n={row.saleCount}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5 truncate">{row.primaryCause.replace(/_/g, ' ')}</div>
      </div>
    </button>
  );
}
