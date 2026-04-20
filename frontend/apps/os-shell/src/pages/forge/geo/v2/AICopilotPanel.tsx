import { useState } from 'react';
import type { AuditRankedRow } from './v2Api';

interface AICopilotPanelProps {
  selectedNbhd: string | null;
  auditRow: AuditRankedRow | null;
  countyMedianRatio: number | null;
  countyCod: number | null;
  onSimulate: (pct: number) => void;
}

export function AICopilotPanel({
  selectedNbhd,
  auditRow,
  countyMedianRatio,
  countyCod,
  onSimulate,
}: AICopilotPanelProps) {
  const [nlInput, setNlInput] = useState('');

  return (
    <div className="gf2-copilot">
      <div className="gf2-copilot__header">
        <span className="gf2-copilot__label">AI Copilot</span>
        {selectedNbhd && auditRow && (
          <span className={`gf2-copilot__grade gf2-grade-chip gf2-grade-chip--${auditRow.grade}`}>
            {auditRow.grade}
          </span>
        )}
        <span className="gf2-copilot__version">v2.1</span>
      </div>

      <div className="gf2-copilot__body">
        {selectedNbhd && auditRow ? (
          <NeighborhoodAdvisory row={auditRow} onSimulate={onSimulate} />
        ) : (
          <CountySummary medianRatio={countyMedianRatio} cod={countyCod} />
        )}
      </div>

      <form
        className="gf2-copilot__inputbar"
        onSubmit={(e) => { e.preventDefault(); setNlInput(''); }}
      >
        <span className="gf2-copilot__prompt">›</span>
        <input
          className="gf2-copilot__input"
          value={nlInput}
          onChange={(e) => setNlInput(e.target.value)}
          placeholder={
            selectedNbhd
              ? `Ask about nbhd ${selectedNbhd}…`
              : 'Ask about the county, a neighborhood, or a parcel…'
          }
          aria-label="AI Copilot query input"
        />
      </form>
    </div>
  );
}

function NeighborhoodAdvisory({ row, onSimulate }: { row: AuditRankedRow; onSimulate: (pct: number) => void }) {
  const neededPct = row.medianRatio > 0
    ? Math.round((1.0 - row.medianRatio) / row.medianRatio * 100 * 10) / 10
    : 0;

  return (
    <div className="gf2-copilot__advisory">
      <div className="gf2-copilot__diag-card">
        <div className="gf2-copilot__diag-cause">
          {row.primaryCause.replace(/_/g, ' ')}
        </div>
        <div className="gf2-copilot__diag-evidence">
          med {row.medianRatio.toFixed(4)} · COD {row.cod.toFixed(1)} · n={row.saleCount}
        </div>
        <div className="gf2-copilot__diag-action">{row.actionLine}</div>
      </div>

      {row.hypotheses.length > 1 && (
        <div className="gf2-copilot__hyps">
          {row.hypotheses.slice(1, 3).map((h) => (
            <div key={h.cause} className="gf2-copilot__hyp">
              <span className="gf2-copilot__hyp-tag">{h.cause.replace(/_/g, ' ')}</span>
              <span className="gf2-copilot__hyp-text">{h.action}</span>
            </div>
          ))}
        </div>
      )}

      {neededPct !== 0 && (
        <button
          type="button"
          className="gf2-copilot__sim-cta"
          onClick={() => onSimulate(neededPct)}
          title={`Pre-fill simulation with recommended ${neededPct > 0 ? '+' : ''}${neededPct}% adjustment`}
        >
          → Simulate recommended {neededPct > 0 ? '+' : ''}{neededPct}%
        </button>
      )}
    </div>
  );
}

function CountySummary({ medianRatio, cod }: { medianRatio: number | null; cod: number | null }) {
  const pass = medianRatio !== null && medianRatio >= 0.90 && medianRatio <= 1.10;

  return (
    <div className="gf2-copilot__county-summary">
      <div className="gf2-copilot__county-stat">
        <span className="gf2-copilot__county-label">County median ratio</span>
        <span className={`gf2-copilot__county-val ${pass ? 'gf2-copilot__county-val--pass' : 'gf2-copilot__county-val--fail'}`}>
          {medianRatio !== null ? medianRatio.toFixed(4) : '—'}
        </span>
      </div>
      <div className="gf2-copilot__county-stat">
        <span className="gf2-copilot__county-label">Weighted COD</span>
        <span className={`gf2-copilot__county-val ${cod === null ? '' : cod <= 20 ? 'gf2-copilot__county-val--pass' : 'gf2-copilot__county-val--fail'}`}>
          {cod !== null ? cod.toFixed(1) : '—'}
        </span>
      </div>
      <div className="gf2-copilot__hint">
        Select a neighborhood from the audit queue to see diagnosis and recommended action.
      </div>
    </div>
  );
}
