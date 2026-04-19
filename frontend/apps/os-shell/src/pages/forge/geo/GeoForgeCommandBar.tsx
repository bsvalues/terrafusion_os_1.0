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
  const { filter, setFilter, activeLayers, toggleLayer, openDrawer, rightDrawerPanel } = useGeoForgeStore();
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

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

      <div className="ml-auto flex gap-1">
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
