import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { BIVARIATE_GRID } from './utils/choropleths';
import { LISA_LEGEND } from './utils/spatialStats';

const RATIO_LEGEND = [
  { label: '> 1.15', color: '#ef4444', sub: 'Over-assessed' },
  { label: '1.05–1.15', color: '#fb923c', sub: '' },
  { label: '0.95–1.05', color: '#4ade80', sub: 'Parity' },
  { label: '0.85–0.95', color: '#93c5fd', sub: '' },
  { label: '< 0.85', color: '#60a5fa', sub: 'Under-assessed' },
];

const YOY_LEGEND = [
  { label: '> +10%', color: '#15803d' },
  { label: '+5–10%', color: '#22c55e' },
  { label: '0–5%', color: '#86efac' },
  { label: '-5–0%', color: '#93c5fd' },
  { label: '< -5%', color: '#3b82f6' },
];

const MKT_LEGEND = [
  { label: '> +10% sale price', color: '#15803d' },
  { label: '+5–10%', color: '#22c55e' },
  { label: '0–5%', color: '#86efac' },
  { label: '-5–0%', color: '#fca5a5' },
  { label: '< -5%', color: '#f87171' },
];

const COD_LEGEND = [
  { label: '≤ 10',  color: '#22c55e', sub: 'Excellent' },
  { label: '10–15', color: '#84cc16', sub: '' },
  { label: '15–20', color: '#eab308', sub: 'IAAO max' },
  { label: '20–25', color: '#f97316', sub: '' },
  { label: '> 25',  color: '#ef4444', sub: 'Critical' },
];

const PRD_LEGEND = [
  { label: '0.98–1.03',     color: '#22c55e', sub: 'IAAO pass' },
  { label: '0.95–0.98',     color: '#eab308', sub: '' },
  { label: '1.03–1.06',     color: '#eab308', sub: '' },
  { label: '< 0.95 / > 1.06', color: '#ef4444', sub: 'Fail' },
];

const PRB_LEGEND = [
  { label: '|PRB| ≤ 0.05', color: '#22c55e', sub: 'Pass' },
  { label: '0.05–0.10',    color: '#eab308', sub: '' },
  { label: '0.10–0.15',    color: '#f97316', sub: '' },
  { label: '> 0.15',       color: '#ef4444', sub: 'Regressivity' },
];

const DRIFT_LEGEND = [
  { label: '> +0.04 (rising)', color: '#00FFFF', sub: 'Assessments catching up' },
  { label: '+0.01–+0.04', color: '#38bdf8', sub: '' },
  { label: '±0.01 (stable)', color: '#64748b', sub: '' },
  { label: '-0.04–-0.01', color: '#fb923c', sub: '' },
  { label: '< -0.04 (falling)', color: '#f87171', sub: 'Market outpacing' },
];

function Swatch({ color, shape = 'square' }: { color: string; shape?: 'square' | 'circle' }) {
  return (
    <span
      style={{ backgroundColor: color }}
      className={`inline-block w-2.5 h-2.5 shrink-0 ${shape === 'circle' ? 'rounded-full' : 'rounded-[2px]'}`}
    />
  );
}

export function GeoForgeMapLegend() {
  const { activeLayers, choroMode, lisaMode } = useGeoForgeStore();

  const showRatio = activeLayers.has('choropleth') || activeLayers.has('sale-scatter') || activeLayers.has('neighborhood-poly');

  const isBivariate = choroMode === 'bivariate';
  const choroLegend = choroMode === 'cod' ? COD_LEGEND
    : choroMode === 'prd' ? PRD_LEGEND
    : choroMode === 'prb' ? PRB_LEGEND
    : RATIO_LEGEND;
  const choroTitle = choroMode === 'cod' ? 'COD'
    : choroMode === 'prd' ? 'PRD'
    : choroMode === 'prb' ? 'PRB'
    : choroMode === 'bivariate' ? 'Ratio × COD'
    : 'Ratio';
  const showYoy   = activeLayers.has('yoy-change');
  const showMkt   = activeLayers.has('market-trend');
  const showDrift  = activeLayers.has('ratio-drift');
  const showCliffs = activeLayers.has('ratio-cliffs');

  if (!showRatio && !showYoy && !showMkt && !showDrift && !showCliffs && !lisaMode) return null;

  return (
    <div className="absolute bottom-8 right-[80px] z-20 flex flex-col gap-1.5">
      {showRatio && lisaMode && (
        <div className="bg-slate-950/90 backdrop-blur border border-rose-800/60 rounded-md px-2.5 py-2 min-w-[160px]">
          <p className="text-[8px] text-rose-400 uppercase tracking-wider mb-1.5">LISA Spatial Clusters</p>
          {LISA_LEGEND.map(({ quadrant, color, label, sub }) => (
            <div key={quadrant} className="flex items-center gap-1.5 mb-0.5">
              <Swatch color={color} />
              <div>
                <span className="text-[9px] text-slate-300 font-mono">{label}</span>
                {sub && <span className="ml-1 text-[8px] text-slate-600">{sub}</span>}
              </div>
            </div>
          ))}
          <p className="text-[7px] text-slate-700 mt-1.5">p ≈ 0.32 significance threshold</p>
        </div>
      )}

      {showRatio && !isBivariate && !lisaMode && (
        <div className="bg-slate-950/90 backdrop-blur border border-slate-800 rounded-md px-2.5 py-2 min-w-[130px]">
          <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-1.5">{choroTitle}</p>
          {choroLegend.map(({ label, color, sub }) => (
            <div key={label} className="flex items-center gap-1.5 mb-0.5">
              <Swatch color={color} />
              <span className="text-[9px] text-slate-300 font-mono">{label}</span>
              {sub && <span className="text-[8px] text-slate-600">{sub}</span>}
            </div>
          ))}
        </div>
      )}

      {showRatio && isBivariate && !lisaMode && (
        <div className="bg-slate-950/90 backdrop-blur border border-slate-800 rounded-md px-2.5 py-2">
          <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-1.5">Ratio × COD</p>
          {/* 3×3 bivariate grid */}
          <div className="flex gap-0.5 mb-0.5">
            {['≤12', '12-20', '>20'].map(label => (
              <span key={label} className="flex-1 text-center text-[6px] text-slate-600 font-mono">{label}</span>
            ))}
          </div>
          {BIVARIATE_GRID.map((row, ri) => {
            const rowLabel = ri === 0 ? '<0.90' : ri === 1 ? '0.90–1.10' : '>1.10';
            const rowSub   = ri === 0 ? 'Under' : ri === 1 ? 'Parity' : 'Over';
            return (
              <div key={ri} className="flex items-center gap-0.5 mb-0.5">
                <span className="w-[38px] text-right text-[6px] text-slate-600 font-mono shrink-0">{rowLabel}</span>
                {row.map((color, ci) => (
                  <span
                    key={ci}
                    className="flex-1 h-3 rounded-[2px]"
                    style={{ backgroundColor: color }}
                    title={`${rowSub} ratio, ${ci === 0 ? 'uniform' : ci === 1 ? 'moderate' : 'scattered'} COD`}
                  />
                ))}
                <span className="text-[6px] text-slate-600 ml-0.5 w-8 shrink-0">{rowSub}</span>
              </div>
            );
          })}
          <div className="flex justify-end mt-0.5">
            <span className="text-[6px] text-slate-700">← COD →</span>
          </div>
          <div className="mt-1 space-y-0.5 text-[7px] text-slate-600">
            <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-[1px]" style={{ backgroundColor: '#4a148c' }} />Purple = under + scattered (worst)</div>
            <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-[1px]" style={{ backgroundColor: '#880e4f' }} />Maroon = over + scattered</div>
            <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-[1px]" style={{ backgroundColor: '#4caf50' }} />Green = parity + uniform (best)</div>
          </div>
        </div>
      )}

      {showYoy && (
        <div className="bg-slate-950/90 backdrop-blur border border-slate-800 rounded-md px-2.5 py-2 min-w-[130px]">
          <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-1.5">YoY ΔAV</p>
          {YOY_LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 mb-0.5">
              <Swatch color={color} shape="circle" />
              <span className="text-[9px] text-slate-300 font-mono">{label}</span>
            </div>
          ))}
        </div>
      )}

      {showMkt && (
        <div className="bg-slate-950/90 backdrop-blur border border-slate-800 rounded-md px-2.5 py-2 min-w-[140px]">
          <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-1.5">Market Trend (Sale Price)</p>
          {MKT_LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 mb-0.5">
              <Swatch color={color} shape="circle" />
              <span className="text-[9px] text-slate-300 font-mono">{label}</span>
            </div>
          ))}
        </div>
      )}

      {showCliffs && (
        <div className="bg-slate-950/90 backdrop-blur border border-slate-800 rounded-md px-2.5 py-2 min-w-[150px]">
          <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-1.5">Ratio Cliff (Δ between adjacent nbhds)</p>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="inline-block w-5 h-0.5 bg-red-400 shrink-0" />
            <span className="text-[9px] text-slate-300 font-mono">&gt; 0.15 critical</span>
          </div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="inline-block w-5 h-0.5 bg-orange-400 shrink-0" />
            <span className="text-[9px] text-slate-300 font-mono">0.08–0.15 warning</span>
          </div>
          <p className="text-[8px] text-slate-600 mt-1">Only nbhds within 3 mi shown · line width = Δ magnitude</p>
        </div>
      )}

      {showDrift && (
        <div className="bg-slate-950/90 backdrop-blur border border-slate-800 rounded-md px-2.5 py-2 min-w-[160px]">
          <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-1.5">Ratio Drift (YoY Δ)</p>
          {DRIFT_LEGEND.map(({ label, color, sub }) => (
            <div key={label} className="flex items-center gap-1.5 mb-0.5">
              <Swatch color={color} shape="circle" />
              <div>
                <span className="text-[9px] text-slate-300 font-mono">{label}</span>
                {sub && <span className="ml-1 text-[8px] text-slate-600">{sub}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
