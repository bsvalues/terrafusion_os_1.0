// frontend/apps/os-shell/src/pages/forge/geo/v2/SimulatePanel.tsx
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { simulateMassAdjust, type SimulateResult } from './v2Api';
import { useMapCtx } from './mapContext';

type Scope = 'neighborhood' | 'class' | 'county';

interface Props {
  onResult: (r: SimulateResult | null) => void;
}

function fmt(v: number, dec = 3): string {
  return v.toFixed(dec);
}

export function SimulatePanel({ onResult }: Props) {
  const taxYear      = useGeoForgeStore((s) => s.filter.taxYear);
  const selectedNbhd = useGeoForgeStore((s) => s.selectedNeighborhoodCode);
  const setMapCtx    = useMapCtx((s) => s.set);
  const resetMapCtx  = useMapCtx((s) => s.reset);

  const [scope, setScope] = useState<Scope>(selectedNbhd ? 'neighborhood' : 'county');
  const [pct, setPct]     = useState(0);

  const ctrlRef = useRef<AbortController | null>(null);

  useEffect(() => () => { ctrlRef.current?.abort(); }, []);

  // Reset scope to county when nbhd deselected
  useEffect(() => {
    if (!selectedNbhd && scope === 'neighborhood') setScope('county');
  }, [selectedNbhd, scope]);

  const mutation = useMutation<SimulateResult, Error, AbortSignal>({
    mutationFn: (signal) =>
      simulateMassAdjust(
        {
          taxYear,
          scope,
          neighborhoodCode: scope === 'neighborhood' ? selectedNbhd : null,
          adjustmentPct: pct,
        },
        signal,
      ),
    onSuccess: (result) => {
      onResult(result);
      setMapCtx({ mode: 'sim-delta', label: `Simulation · ${pct > 0 ? '+' : ''}${pct}%` });
    },
  });

  function handleRun() {
    ctrlRef.current?.abort();
    ctrlRef.current = new AbortController();
    mutation.mutate(ctrlRef.current.signal);
  }

  function handleClear() {
    mutation.reset();
    onResult(null);
    resetMapCtx();
    setPct(0);
  }

  const result = mutation.data;

  return (
    <div className="p-4 space-y-5 text-sm">
      <div>
        <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">Adjustment Studio</div>
        <div className="text-xs text-slate-400">
          Model the impact of a mass adjustment before committing. IAAO thresholds enforced.
        </div>
      </div>

      {/* Scope */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Scope</label>
        <div className="flex gap-2 flex-wrap">
          {(['neighborhood', 'county', 'class'] as Scope[]).map((s) => {
            const disabled = s === 'neighborhood' && !selectedNbhd;
            return (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => setScope(s)}
                className={`px-3 py-1 text-xs rounded border transition-colors
                  ${scope === s
                    ? 'bg-slate-700 border-slate-500 text-cyan-400'
                    : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:text-slate-200'}
                  ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {s === 'neighborhood'
                  ? (selectedNbhd ? `NBH-${selectedNbhd}` : 'Neighborhood')
                  : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            );
          })}
        </div>
        {scope === 'neighborhood' && !selectedNbhd && (
          <p className="text-[11px] text-amber-400 mt-1">Select a neighborhood from the queue first.</p>
        )}
      </div>

      {/* Slider */}
      <div>
        <label className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Adjustment</span>
          <span className={`text-sm font-mono font-bold ${pct > 0 ? 'text-amber-400' : pct < 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
            {pct > 0 ? '+' : ''}{pct}%
          </span>
        </label>
        <input
          type="range"
          min={-30}
          max={30}
          step={0.5}
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="w-full accent-cyan-400"
          aria-label="Adjustment percentage"
        />
        <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
          <span>−30%</span>
          <span>0</span>
          <span>+30%</span>
        </div>
      </div>

      {/* Run button */}
      <button
        type="button"
        onClick={handleRun}
        disabled={mutation.isPending || (scope === 'neighborhood' && !selectedNbhd) || pct === 0}
        className="w-full py-2 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-cyan-400 transition-colors"
      >
        {mutation.isPending ? 'Computing…' : 'Run Simulation'}
      </button>

      {/* Error */}
      {mutation.isError && (
        <p className="text-xs text-red-400">{mutation.error.message}</p>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          <div className="border-t border-slate-700/60 pt-3">
            <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">
              Projected Results — {result.parcelCount.toLocaleString()} parcels
            </div>

            {/* Before / After table */}
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div />
              <div className="text-[10px] text-slate-500 uppercase">Before</div>
              <div className="text-[10px] text-slate-500 uppercase">After</div>

              <div className="text-[11px] text-slate-400 text-left">Median Ratio</div>
              <div className="font-mono text-[12px] text-slate-300">{fmt(result.current.medianRatio)}</div>
              <div className={`font-mono text-[12px] font-semibold ${result.projected.medianRatio >= 0.90 && result.projected.medianRatio <= 1.10 ? 'text-cyan-400' : 'text-red-400'}`}>
                {fmt(result.projected.medianRatio)}
              </div>

              <div className="text-[11px] text-slate-400 text-left">COD</div>
              <div className="font-mono text-[12px] text-slate-300">{fmt(result.current.cod, 1)}</div>
              <div className={`font-mono text-[12px] font-semibold ${result.projected.cod <= 20 ? 'text-cyan-400' : 'text-red-400'}`}>
                {fmt(result.projected.cod, 1)}
              </div>

              <div className="text-[11px] text-slate-400 text-left">Mean</div>
              <div className="font-mono text-[12px] text-slate-300">{fmt(result.current.mean)}</div>
              <div className="font-mono text-[12px] text-slate-300">{fmt(result.projected.mean)}</div>
            </div>

            {/* IAAO verdict */}
            <div className={`rounded px-3 py-2 text-xs font-semibold text-center border
              ${result.iaaoPass
                ? 'bg-cyan-950/40 border-cyan-700/40 text-cyan-300'
                : 'bg-red-950/40 border-red-700/40 text-red-300'}`}>
              {result.iaaoPass
                ? '✓ IAAO PASS — Median ratio within 0.90–1.10'
                : '✗ IAAO FAIL — Outside compliance thresholds'}
            </div>

            {/* Delta + needed */}
            <div className="mt-2 text-[11px] text-slate-500 text-center">
              Δ ratio {result.deltaMedianRatio >= 0 ? '+' : ''}{fmt(result.deltaMedianRatio)} · needed {result.neededPct > 0 ? '+' : ''}{fmt(result.neededPct, 1)}% for 1.000
            </div>
          </div>

          {/* Clear / Map context note */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-600 italic">Map updated — parcels show sim delta</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
