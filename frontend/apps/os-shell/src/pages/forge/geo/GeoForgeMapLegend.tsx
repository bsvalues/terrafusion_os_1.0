import { useGeoForgeStore } from '@/stores/geoForgeStore';

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

function Swatch({ color, shape = 'square' }: { color: string; shape?: 'square' | 'circle' }) {
  return (
    <span
      style={{ backgroundColor: color }}
      className={`inline-block w-2.5 h-2.5 shrink-0 ${shape === 'circle' ? 'rounded-full' : 'rounded-[2px]'}`}
    />
  );
}

export function GeoForgeMapLegend() {
  const { activeLayers } = useGeoForgeStore();

  const showRatio = activeLayers.has('choropleth') || activeLayers.has('sale-scatter') || activeLayers.has('neighborhood-poly');
  const showYoy   = activeLayers.has('yoy-change');

  if (!showRatio && !showYoy) return null;

  return (
    <div className="absolute bottom-8 right-[80px] z-20 flex flex-col gap-1.5">
      {showRatio && (
        <div className="bg-slate-950/90 backdrop-blur border border-slate-800 rounded-md px-2.5 py-2 min-w-[130px]">
          <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-1.5">Ratio</p>
          {RATIO_LEGEND.map(({ label, color, sub }) => (
            <div key={label} className="flex items-center gap-1.5 mb-0.5">
              <Swatch color={color} />
              <span className="text-[9px] text-slate-300 font-mono">{label}</span>
              {sub && <span className="text-[8px] text-slate-600">{sub}</span>}
            </div>
          ))}
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
    </div>
  );
}
