import { useState, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParcelFeatures {
  gla: string;       // gross living area (sqft)
  yearBuilt: string;
  lotSqft: string;
  baths: string;     // total baths (2.5 = full+half)
  garage: string;    // stalls
  salePrice: string; // only used for comps
  address: string;
}

type AdjLineKey = 'gla' | 'age' | 'lot' | 'bath' | 'garage';

interface AdjRates {
  gla: string;     // $/sqft GLA difference
  age: string;     // $/year effective age diff
  lot: string;     // $/sqft lot diff
  bath: string;    // $ per bath count diff
  garage: string;  // $ per garage stall diff
}

const INITIAL_RATES: AdjRates = {
  gla: '60',
  age: '500',
  lot: '2',
  bath: '5000',
  garage: '8000',
};

const EMPTY_FEATURES: ParcelFeatures = {
  gla: '', yearBuilt: '', lotSqft: '', baths: '', garage: '', salePrice: '', address: '',
};

const ADJ_LABELS: Record<AdjLineKey, string> = {
  gla: 'GLA (sqft)',
  age: 'Year Built',
  lot: 'Lot (sqft)',
  bath: 'Baths',
  garage: 'Garage Stalls',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function n(s: string): number { return parseFloat(s) || 0; }
function fmt(v: number) {
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function computeAdjustedPrice(
  subject: ParcelFeatures,
  comp: ParcelFeatures,
  rates: AdjRates,
): { lines: Record<AdjLineKey, number>; total: number; adjPrice: number } | null {
  const sp = n(comp.salePrice);
  if (sp <= 0) return null;

  const lines: Record<AdjLineKey, number> = {
    gla:    (n(subject.gla) - n(comp.gla)) * n(rates.gla),
    age:    (n(subject.yearBuilt) - n(comp.yearBuilt)) * n(rates.age),
    lot:    (n(subject.lotSqft) - n(comp.lotSqft)) * n(rates.lot),
    bath:   (n(subject.baths) - n(comp.baths)) * n(rates.bath),
    garage: (n(subject.garage) - n(comp.garage)) * n(rates.garage),
  };

  const total = Object.values(lines).reduce((s, v) => s + v, 0);
  return { lines, total, adjPrice: sp + total };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureInput({
  label, value, onChange, prefix,
}: { label: string; value: string; onChange: (v: string) => void; prefix?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[8px] text-slate-600 uppercase tracking-wide">{label}</label>
      <div className="flex items-center bg-slate-800 border border-slate-700 rounded overflow-hidden">
        {prefix && <span className="px-1 text-[9px] text-slate-500 border-r border-slate-700">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-1.5 py-1 text-[10px] text-slate-200 font-mono focus:outline-none"
          placeholder="—"
        />
      </div>
    </div>
  );
}

function RateRow({
  label, adjKey, rates, onChange,
}: { label: string; adjKey: AdjLineKey; rates: AdjRates; onChange: (k: AdjLineKey, v: string) => void }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[9px] text-slate-500 w-24 shrink-0">{label}</span>
      <div className="flex items-center bg-slate-800/60 border border-slate-700 rounded overflow-hidden w-24">
        <span className="px-1 text-[8px] text-slate-600 border-r border-slate-700">$/unit</span>
        <input
          type="number"
          value={rates[adjKey]}
          onChange={(e) => onChange(adjKey, e.target.value)}
          className="w-full bg-transparent px-1 py-0.5 text-[9px] text-slate-200 font-mono focus:outline-none"
        />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const MAX_COMPS = 5;

export function CompAdjGridPanel() {
  const [subject, setSubject] = useState<ParcelFeatures>({ ...EMPTY_FEATURES });
  const [comps, setComps] = useState<ParcelFeatures[]>([{ ...EMPTY_FEATURES }]);
  const [rates, setRates] = useState<AdjRates>({ ...INITIAL_RATES });
  const [showRates, setShowRates] = useState(false);

  function updateSubject(k: keyof ParcelFeatures, v: string) {
    setSubject((prev) => ({ ...prev, [k]: v }));
  }
  function updateComp(i: number, k: keyof ParcelFeatures, v: string) {
    setComps((prev) => prev.map((c, idx) => idx === i ? { ...c, [k]: v } : c));
  }
  function updateRate(k: AdjLineKey, v: string) {
    setRates((prev) => ({ ...prev, [k]: v }));
  }
  function addComp() {
    if (comps.length < MAX_COMPS) setComps((prev) => [...prev, { ...EMPTY_FEATURES }]);
  }
  function removeComp(i: number) {
    setComps((prev) => prev.filter((_, idx) => idx !== i));
  }

  const results = useMemo(
    () => comps.map((c) => computeAdjustedPrice(subject, c, rates)),
    [subject, comps, rates],
  );

  const validAdjPrices = results
    .map((r) => r?.adjPrice ?? null)
    .filter((v): v is number => v !== null && v > 0);

  const indication = validAdjPrices.length > 0
    ? validAdjPrices.reduce((s, v) => s + v, 0) / validAdjPrices.length
    : null;

  const subjectGla = n(subject.gla);
  const indicationPerSqft = indication && subjectGla > 0 ? indication / subjectGla : null;

  const FEATURES: { key: keyof ParcelFeatures; label: string; prefix?: string }[] = [
    { key: 'salePrice', label: 'Sale Price', prefix: '$' },
    { key: 'address', label: 'Address / ID' },
    { key: 'gla', label: 'GLA (sqft)' },
    { key: 'yearBuilt', label: 'Year Built' },
    { key: 'lotSqft', label: 'Lot (sqft)' },
    { key: 'baths', label: 'Baths' },
    { key: 'garage', label: 'Garage Stalls' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-slate-700/50 flex items-center justify-between">
        <div>
          <div className="text-[9px] text-slate-400">Manual comparable sales adjustment grid</div>
          {indication && (
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-sm font-bold text-terra-cyan">{fmt(indication)}</span>
              {indicationPerSqft && (
                <span className="text-[10px] text-slate-400">{fmt(indicationPerSqft)}/sqft</span>
              )}
              <span className="text-[8px] text-slate-600">({validAdjPrices.length} comp avg)</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowRates((v) => !v)}
          className={`text-[9px] px-2 py-1 rounded border transition-colors ${
            showRates ? 'border-terra-cyan/50 text-terra-cyan bg-terra-cyan/10' : 'border-slate-700 text-slate-500'
          }`}
        >
          {showRates ? 'Hide rates' : 'Edit rates'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Rates editor */}
        {showRates && (
          <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-900/40">
            <div className="text-[8px] text-slate-600 uppercase tracking-wider mb-1">Adjustment Rates</div>
            {(Object.keys(ADJ_LABELS) as AdjLineKey[]).map((k) => (
              <RateRow key={k} label={ADJ_LABELS[k]} adjKey={k} rates={rates} onChange={updateRate} />
            ))}
          </div>
        )}

        {/* Grid table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[10px]" style={{ minWidth: '520px' }}>
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-3 py-1.5 text-[8px] text-slate-600 uppercase tracking-wider font-normal w-28">
                  Feature
                </th>
                <th className="text-left px-2 py-1.5 text-[8px] text-terra-cyan uppercase tracking-wider font-semibold w-32">
                  Subject
                </th>
                {comps.map((_, i) => (
                  <th key={i} className="text-left px-2 py-1.5 text-[8px] text-slate-400 uppercase tracking-wider font-normal w-32">
                    <div className="flex items-center justify-between">
                      <span>Comp {i + 1}</span>
                      {comps.length > 1 && (
                        <button
                          onClick={() => removeComp(i)}
                          className="text-slate-700 hover:text-red-400 text-[10px] leading-none ml-1"
                        >×</button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map(({ key, label, prefix }) => (
                <tr key={key} className="border-b border-slate-800/40 hover:bg-slate-800/10">
                  <td className="px-3 py-1 text-[9px] text-slate-500">{label}</td>
                  <td className="px-2 py-1">
                    {key === 'salePrice' ? (
                      <span className="text-[9px] text-slate-600 italic">N/A</span>
                    ) : (
                      <div className="flex items-center bg-slate-800/60 border border-slate-700/80 rounded overflow-hidden">
                        {prefix && <span className="px-1 text-[8px] text-slate-600 border-r border-slate-700">{prefix}</span>}
                        <input
                          type={key === 'address' ? 'text' : 'number'}
                          value={(subject as Record<string, string>)[key]}
                          onChange={(e) => updateSubject(key, e.target.value)}
                          className="w-full bg-transparent px-1.5 py-0.5 text-[9px] text-terra-cyan font-mono focus:outline-none"
                          placeholder="—"
                        />
                      </div>
                    )}
                  </td>
                  {comps.map((comp, i) => (
                    <td key={i} className="px-2 py-1">
                      <div className="flex items-center bg-slate-800/40 border border-slate-700/60 rounded overflow-hidden">
                        {prefix && key === 'salePrice' && (
                          <span className="px-1 text-[8px] text-slate-600 border-r border-slate-700">{prefix}</span>
                        )}
                        <input
                          type={key === 'address' ? 'text' : 'number'}
                          value={(comp as Record<string, string>)[key]}
                          onChange={(e) => updateComp(i, key, e.target.value)}
                          className="w-full bg-transparent px-1.5 py-0.5 text-[9px] text-slate-300 font-mono focus:outline-none"
                          placeholder="—"
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}

              {/* Adjustment lines */}
              <tr className="border-b border-slate-700 bg-slate-900/30">
                <td colSpan={2 + comps.length} className="px-3 py-1 text-[8px] text-slate-600 uppercase tracking-wider">
                  Net Adjustments
                </td>
              </tr>
              {(Object.keys(ADJ_LABELS) as AdjLineKey[]).map((adjKey) => (
                <tr key={adjKey} className="border-b border-slate-800/30">
                  <td className="px-3 py-1 text-[9px] text-slate-600">
                    {ADJ_LABELS[adjKey]} <span className="text-[8px] text-slate-700">@ ${n(rates[adjKey]).toLocaleString()}/unit</span>
                  </td>
                  <td className="px-2 py-1" />
                  {results.map((r, i) => {
                    const adj = r?.lines[adjKey] ?? 0;
                    return (
                      <td key={i} className="px-2 py-1">
                        {r ? (
                          <span className={`font-mono text-[9px] ${adj > 0 ? 'text-emerald-400' : adj < 0 ? 'text-red-400' : 'text-slate-600'}`}>
                            {adj === 0 ? '—' : (adj > 0 ? '+' : '') + fmt(adj)}
                          </span>
                        ) : <span className="text-slate-700 text-[9px]">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Total adj + adj price */}
              <tr className="border-b border-slate-700 bg-slate-900/20">
                <td className="px-3 py-1.5 text-[9px] text-slate-400 font-semibold">Total Adj</td>
                <td />
                {results.map((r, i) => (
                  <td key={i} className="px-2 py-1.5">
                    {r ? (
                      <span className={`font-mono text-[9px] font-semibold ${r.total > 0 ? 'text-emerald-400' : r.total < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {r.total === 0 ? '—' : (r.total > 0 ? '+' : '') + fmt(r.total)}
                      </span>
                    ) : <span className="text-slate-700 text-[9px]">—</span>}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-600 bg-slate-800/30">
                <td className="px-3 py-2 text-[10px] text-slate-200 font-bold">Adj Sale Price</td>
                <td />
                {results.map((r, i) => (
                  <td key={i} className="px-2 py-2">
                    {r ? (
                      <span className="font-mono text-[10px] font-bold text-terra-cyan">{fmt(r.adjPrice)}</span>
                    ) : <span className="text-slate-700 text-[9px]">—</span>}
                  </td>
                ))}
              </tr>
              {subjectGla > 0 && (
                <tr className="border-b border-slate-800">
                  <td className="px-3 py-1 text-[9px] text-slate-500">$/sqft GLA</td>
                  <td />
                  {results.map((r, i) => (
                    <td key={i} className="px-2 py-1">
                      {r && subjectGla > 0 ? (
                        <span className="font-mono text-[9px] text-slate-400">{fmt(r.adjPrice / subjectGla)}</span>
                      ) : <span className="text-slate-700 text-[9px]">—</span>}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add comp button */}
        <div className="px-4 py-2 border-t border-slate-800/50">
          {comps.length < MAX_COMPS ? (
            <button
              onClick={addComp}
              className="text-[9px] text-slate-500 hover:text-terra-cyan border border-dashed border-slate-700 hover:border-terra-cyan/40 rounded px-3 py-1 transition-colors"
            >
              + Add comparable ({comps.length}/{MAX_COMPS})
            </button>
          ) : (
            <span className="text-[9px] text-slate-700">Maximum {MAX_COMPS} comparables</span>
          )}
        </div>

        {/* Value indication reconciliation */}
        {indication && (
          <div className="mx-4 mb-3 p-2.5 bg-terra-cyan/5 border border-terra-cyan/20 rounded">
            <div className="text-[8px] text-slate-500 uppercase tracking-wider mb-1">Value Indication · Sales Comparison Approach</div>
            <div className="flex items-baseline gap-3">
              <span className="text-base font-bold text-terra-cyan">{fmt(indication)}</span>
              {indicationPerSqft && (
                <span className="text-[10px] text-slate-400">{fmt(indicationPerSqft)}/sqft</span>
              )}
            </div>
            <div className="text-[8px] text-slate-600 mt-0.5">
              Simple average of {validAdjPrices.length} adjusted comparable sale{validAdjPrices.length !== 1 ? 's' : ''}. Apply assessor judgment for weighting.
            </div>
          </div>
        )}

        <p className="px-4 pb-3 text-[8px] text-slate-700">
          Adjustment rates reflect market-derived unit values. All values are estimates — final value conclusion requires assessor professional judgment per RCW 84.40.030.
        </p>
      </div>
    </div>
  );
}
