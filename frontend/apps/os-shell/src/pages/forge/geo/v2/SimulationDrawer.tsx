import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { simulateMassAdjust, type SimulateResult } from './v2Api';

interface SimulationDrawerProps {
  open: boolean;
  taxYear: number;
  selectedNbhd: string | null;
  onClose: () => void;
  onResult: (result: SimulateResult) => void;
}

export function SimulationDrawer({ open, taxYear, selectedNbhd, onClose, onResult }: SimulationDrawerProps) {
  const [pct, setPct] = useState(0);
  const [scope, setScope] = useState<'neighborhood' | 'class' | 'county'>(
    selectedNbhd ? 'neighborhood' : 'county'
  );

  useEffect(() => {
    if (!selectedNbhd && scope === 'neighborhood') setScope('county');
  }, [selectedNbhd]);

  const { mutate, isPending, data, error } = useMutation<SimulateResult, Error>({
    mutationFn: () =>
      simulateMassAdjust({
        taxYear,
        scope,
        neighborhoodCode: scope === 'neighborhood' ? selectedNbhd : null,
        adjustmentPct: pct,
      }),
    onSuccess: (result) => onResult(result),
  });

  if (!open) return null;

  const deltaLabel = pct > 0 ? `+${pct}%` : `${pct}%`;
  const neededPct = data ? data.neededPct : null;

  return (
    <div className="gf2-sim-drawer">
      <div className="gf2-sim-drawer__header">
        <span className="gf2-sim-drawer__title">Adjustment Simulation</span>
        <button className="gf2-sim-drawer__close" onClick={onClose} aria-label="Close simulation drawer">×</button>
      </div>

      <div className="gf2-sim-drawer__body">

        <div className="gf2-sim-field">
          <label className="gf2-sim-label">Scope</label>
          <select
            className="gf2-sim-select"
            value={scope}
            onChange={(e) => setScope(e.target.value as typeof scope)}
          >
            {selectedNbhd && <option value="neighborhood">Nbhd {selectedNbhd}</option>}
            <option value="county">All County (SFR)</option>
            <option value="class">By Class</option>
          </select>
        </div>

        <div className="gf2-sim-field">
          <label className="gf2-sim-label">
            Adjustment&nbsp;
            <span className={`gf2-sim-pct-badge ${pct < 0 ? 'gf2-sim-pct-badge--neg' : pct > 0 ? 'gf2-sim-pct-badge--pos' : ''}`}>
              {deltaLabel}
            </span>
          </label>
          <input
            type="range"
            min={-30}
            max={30}
            step={0.5}
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="gf2-sim-slider"
          />
          <div className="gf2-sim-range-labels">
            <span>−30%</span>
            <input
              type="number"
              min={-50}
              max={50}
              step={0.1}
              value={pct}
              onChange={(e) => setPct(Math.min(30, Math.max(-30, Number(e.target.value))))}
              className="gf2-sim-number"
            />
            <span>+30%</span>
          </div>
        </div>

        {neededPct !== null && (
          <div className="gf2-sim-hint">
            AI recommendation: <strong>{neededPct > 0 ? '+' : ''}{neededPct}%</strong> needed to reach parity
          </div>
        )}

        <button
          className="gf2-sim-run-btn"
          onClick={() => mutate()}
          disabled={isPending || pct === 0}
        >
          {isPending ? 'Simulating…' : `Run Simulation at ${deltaLabel}`}
        </button>

        {error && (
          <div className="gf2-sim-error">
            {error.message}
          </div>
        )}

        {data && (
          <div className="gf2-sim-results">
            <div className="gf2-sim-results__eyebrow">Projected outcome · {data.parcelCount} parcels</div>

            <div className="gf2-sim-stat-row">
              <SimStat label="Before" value={data.current.medianRatio.toFixed(4)} />
              <SimStat label="After" value={data.projected.medianRatio.toFixed(4)}
                tone={data.iaaoPass ? 'pass' : 'fail'} />
              <SimStat label="COD" value={data.projected.cod.toFixed(1)}
                tone={data.projected.cod <= 20 ? 'pass' : 'fail'} />
            </div>

            <div className={`gf2-sim-iaao-badge ${data.iaaoPass ? 'gf2-sim-iaao-badge--pass' : 'gf2-sim-iaao-badge--fail'}`}>
              {data.iaaoPass
                ? `✓ Projected ratio ${data.projected.medianRatio.toFixed(4)} is within IAAO bounds`
                : `✗ Projected ratio ${data.projected.medianRatio.toFixed(4)} outside IAAO bounds — adjust further`
              }
            </div>

            <div className="gf2-sim-delta">
              Δ median ratio: {data.deltaMedianRatio > 0 ? '+' : ''}{data.deltaMedianRatio.toFixed(4)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SimStat({ label, value, tone }: { label: string; value: string; tone?: 'pass' | 'fail' }) {
  return (
    <div className="gf2-sim-stat">
      <div className="gf2-sim-stat__label">{label}</div>
      <div className={`gf2-sim-stat__value ${tone === 'pass' ? 'gf2-sim-stat__value--pass' : tone === 'fail' ? 'gf2-sim-stat__value--fail' : ''}`}>
        {value}
      </div>
    </div>
  );
}
