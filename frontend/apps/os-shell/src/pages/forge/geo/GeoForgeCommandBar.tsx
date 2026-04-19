import { useMemo } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MapLayer } from './types/geoforge.types';

const LAYER_TOGGLES: { layer: MapLayer; label: string }[] = [
  { layer: 'choropleth', label: 'Nbhd' },
  { layer: 'sale-scatter', label: 'Sales' },
  { layer: 'kde', label: 'KDE' },
  { layer: 'gwr', label: 'GWR' },
  { layer: 'ai-cluster', label: 'Clusters' },
];

export function GeoForgeCommandBar() {
  const {
    filter, setFilter, activeLayers, toggleLayer, openDrawer, rightDrawerPanel,
    salePoints, selectedMonth, setSelectedMonth,
  } = useGeoForgeStore();
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  const saleMonths = useMemo(() => {
    const months = new Set<string>();
    for (const sp of salePoints) {
      const m = sp.saleDate?.slice(0, 7);
      if (m) months.add(m);
    }
    return Array.from(months).sort().reverse();
  }, [salePoints]);

  return (
    <div className="absolute top-0 left-0 right-[72px] z-10 flex items-center gap-2 px-3 py-2 bg-slate-950/90 backdrop-blur border-b border-slate-800">
      <span className="text-terra-cyan font-bold text-sm tracking-widest mr-1">
        GEOFORGE
      </span>

      <Select
        value={String(filter.taxYear)}
        onValueChange={(v) => setFilter({ taxYear: Number(v) })}
      >
        <SelectTrigger className="w-24 h-7 text-xs bg-slate-900 border-slate-700 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700">
          {years.map((y) => (
            <SelectItem key={y} value={String(y)} className="text-xs text-white">
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-1 ml-1">
        {LAYER_TOGGLES.map(({ layer, label }) => (
          <Button
            key={layer}
            size="sm"
            variant={activeLayers.has(layer) ? 'default' : 'outline'}
            className={`h-7 text-[11px] px-2 ${
              activeLayers.has(layer)
                ? 'bg-terra-cyan/20 text-terra-cyan border-terra-cyan/40 hover:bg-terra-cyan/30'
                : 'text-slate-400 border-slate-700 hover:text-white'
            }`}
            onClick={() => toggleLayer(layer)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Month filter — only shown when sale points are loaded */}
        {saleMonths.length > 0 && (
          <Select
            value={selectedMonth ?? '__all__'}
            onValueChange={(v) => setSelectedMonth(v === '__all__' ? null : v)}
          >
            <SelectTrigger className="w-[100px] h-7 text-xs bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="All months" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 max-h-48">
              <SelectItem value="__all__" className="text-xs text-slate-400">All months</SelectItem>
              {saleMonths.map((m) => (
                <SelectItem key={m} value={m} className="text-xs text-white font-mono">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          size="sm"
          variant={rightDrawerPanel === 'outlier-review' ? 'default' : 'outline'}
          className={`h-7 text-[11px] px-2 ${
            rightDrawerPanel === 'outlier-review'
              ? 'bg-orange-800/40 text-orange-300 border-orange-700/60 hover:bg-orange-800/60'
              : 'text-slate-400 border-slate-700 hover:text-white'
          }`}
          onClick={() => openDrawer('outlier-review')}
        >
          Outliers
        </Button>
        <Button
          size="sm"
          variant={rightDrawerPanel === 'workbench' ? 'default' : 'outline'}
          className={`h-7 text-[11px] px-2 ${
            rightDrawerPanel === 'workbench'
              ? 'bg-amber-700/40 text-amber-300 border-amber-700/60 hover:bg-amber-700/60'
              : 'text-slate-400 border-slate-700 hover:text-white'
          }`}
          onClick={() => openDrawer('workbench')}
        >
          Workbench
        </Button>
        <Button
          size="sm"
          variant={rightDrawerPanel === 'certification' ? 'default' : 'outline'}
          className={`h-7 text-[11px] px-2 ${
            rightDrawerPanel === 'certification'
              ? 'bg-emerald-800/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-800/60'
              : 'text-slate-400 border-slate-700 hover:text-white'
          }`}
          onClick={() => openDrawer('certification')}
        >
          Certify
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px] px-2 text-slate-400 border-slate-700 hover:text-white"
          onClick={() =>
            window.open(
              `/api/geoforge/ratio-study/export?taxYear=${filter.taxYear}`,
              '_blank'
            )
          }
        >
          GeoJSON ↗
        </Button>
      </div>
    </div>
  );
}
