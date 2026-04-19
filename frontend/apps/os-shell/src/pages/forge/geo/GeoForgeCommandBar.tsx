import { useMemo, useState, useEffect, useRef } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiFetchJson } from '@/lib/apiBase';
import type { MapLayer, ParcelSearchResult, PriceBand } from './types/geoforge.types';

const PROPERTY_CLASSES = [
  { label: 'All classes', value: '' },
  { label: 'Residential', value: 'RES' },
  { label: 'Commercial', value: 'COM' },
  { label: 'Agricultural', value: 'AG' },
  { label: 'Industrial', value: 'IND' },
  { label: 'Timber', value: 'TIM' },
];

const PRICE_BANDS: { label: string; value: PriceBand }[] = [
  { label: 'All prices', value: null },
  { label: '< $200k', value: '0-200' },
  { label: '$200k–$400k', value: '200-400' },
  { label: '$400k–$700k', value: '400-700' },
  { label: '> $700k', value: '700+' },
];

const LAYER_TOGGLES: { layer: MapLayer; label: string }[] = [
  { layer: 'choropleth', label: 'Nbhd' },
  { layer: 'neighborhood-poly', label: 'Poly' },
  { layer: 'sale-scatter', label: 'Sales' },
  { layer: 'parcel-polygons', label: 'Parcels' },
  { layer: 'yoy-change', label: 'YoY ΔAV' },
  { layer: 'market-trend', label: 'Mkt Trend' },
  { layer: 'kde', label: 'KDE' },
  { layer: 'gwr', label: 'GWR' },
  { layer: 'ai-cluster', label: 'Clusters' },
];

export function GeoForgeCommandBar() {
  const {
    filter, setFilter, activeLayers, toggleLayer, openDrawer, rightDrawerPanel,
    salePoints, selectedMonth, setSelectedMonth,
    priceBand, setPriceBand,
    setBloomParcelId, setFlyTarget,
  } = useGeoForgeStore();

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  // Month options — sorted chronologically (oldest first) for the dropdown display, desc for UX
  const saleMonths = useMemo(() => {
    const months = new Set<string>();
    for (const sp of salePoints) {
      const m = sp.saleDate?.slice(0, 7);
      if (m) months.add(m);
    }
    return Array.from(months).sort().reverse();
  }, [salePoints]);

  // Time-lapse animation
  const [isPlaying, setIsPlaying] = useState(false);
  const playIdxRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  function startPlay() {
    const chrono = [...saleMonths].reverse();
    if (!chrono.length) return;
    playIdxRef.current = 0;
    setSelectedMonth(chrono[0]);
    setIsPlaying(true);
  }

  function stopPlay() {
    clearInterval(intervalRef.current);
    setIsPlaying(false);
  }

  useEffect(() => {
    if (!isPlaying) { clearInterval(intervalRef.current); return; }
    const chrono = [...saleMonths].reverse();
    intervalRef.current = setInterval(() => {
      playIdxRef.current += 1;
      if (playIdxRef.current >= chrono.length) {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
        return;
      }
      setSelectedMonth(chrono[playIdxRef.current]);
    }, 900);
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Also stop if user manually clears selectedMonth while playing
  useEffect(() => {
    if (!selectedMonth && isPlaying) stopPlay();
  }, [selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parcel search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ParcelSearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.length < 3) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const results = await apiFetchJson<ParcelSearchResult[]>(
          `/api/geoforge/parcel/search?q=${encodeURIComponent(searchQuery)}&taxYear=${filter.taxYear}`
        );
        setSearchResults(results);
      } catch { setSearchResults([]); }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, filter.taxYear]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function selectParcel(r: ParcelSearchResult) {
    setSearchQuery('');
    setSearchResults([]);
    setBloomParcelId(r.parcelNumber);
    if (r.lat && r.lng) setFlyTarget({ lat: r.lat, lng: r.lng });
  }

  return (
    <div className="absolute top-0 left-0 right-[72px] z-10 flex items-center gap-2 px-3 py-2 bg-slate-950/90 backdrop-blur border-b border-slate-800">
      <span className="text-terra-cyan font-bold text-sm tracking-widest shrink-0">
        GEOFORGE
      </span>

      <Select
        value={String(filter.taxYear)}
        onValueChange={(v) => setFilter({ taxYear: Number(v) })}
      >
        <SelectTrigger className="w-24 h-7 text-xs bg-slate-900 border-slate-700 text-white shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700">
          {years.map((y) => (
            <SelectItem key={y} value={String(y)} className="text-xs text-white">{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filter.propertyClass ?? ''}
        onValueChange={(v) => setFilter({ propertyClass: v || undefined })}
      >
        <SelectTrigger className="w-[100px] h-7 text-xs bg-slate-900 border-slate-700 text-white shrink-0">
          <SelectValue placeholder="All classes" />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700">
          {PROPERTY_CLASSES.map(({ label, value }) => (
            <SelectItem key={value} value={value} className="text-xs text-white">{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-1">
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

      {/* Parcel search */}
      <div ref={searchRef} className="relative">
        {searchOpen ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && (setSearchOpen(false), setSearchQuery(''), setSearchResults([]))}
              placeholder="Parcel # or address…"
              className="h-7 w-48 text-xs bg-slate-900 border border-slate-600 text-white rounded px-2 outline-none focus:border-terra-cyan/60"
            />
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
              className="text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] px-2 text-slate-400 border-slate-700 hover:text-white"
            onClick={() => setSearchOpen(true)}
            title="Search parcel"
          >
            ⌕
          </Button>
        )}

        {/* Results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-8 left-0 z-50 w-72 bg-slate-900 border border-slate-700 rounded shadow-xl overflow-hidden">
            {searchResults.map((r) => (
              <button
                key={r.parcelNumber}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 border-b border-slate-800 last:border-0"
                onClick={() => selectParcel(r)}
              >
                <div className="text-terra-cyan font-mono text-[11px]">{r.parcelNumber}</div>
                <div className="text-slate-400 text-[10px] truncate">{r.address}</div>
                <div className="text-slate-600 text-[9px]">
                  {r.neighborhood} · AV ${(r.assessedValue / 1000).toFixed(0)}k
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Price band filter */}
        {activeLayers.has('sale-scatter') && (
          <Select
            value={priceBand ?? '__all__'}
            onValueChange={(v) => setPriceBand(v === '__all__' ? null : v as PriceBand)}
          >
            <SelectTrigger className="w-[110px] h-7 text-xs bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="All prices" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {PRICE_BANDS.map(({ label, value }) => (
                <SelectItem key={value ?? '__all__'} value={value ?? '__all__'} className="text-xs text-white">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Month filter */}
        {saleMonths.length > 0 && (
          <Select
            value={selectedMonth ?? '__all__'}
            onValueChange={(v) => { stopPlay(); setSelectedMonth(v === '__all__' ? null : v); }}
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

        {/* Time-lapse play/stop */}
        {saleMonths.length > 1 && (
          <Button
            size="sm"
            variant="outline"
            className={`h-7 text-[11px] px-2 ${
              isPlaying
                ? 'bg-sky-900/40 text-sky-300 border-sky-700/60 hover:bg-sky-800/60'
                : 'text-slate-400 border-slate-700 hover:text-white'
            }`}
            onClick={isPlaying ? stopPlay : startPlay}
            title={isPlaying ? 'Stop time-lapse' : 'Play time-lapse (oldest → newest)'}
          >
            {isPlaying ? '⬛' : '▶'}
          </Button>
        )}

        <Button
          size="sm"
          variant={rightDrawerPanel === 'stratification' ? 'default' : 'outline'}
          className={`h-7 text-[11px] px-2 ${
            rightDrawerPanel === 'stratification'
              ? 'bg-violet-800/40 text-violet-300 border-violet-700/60 hover:bg-violet-800/60'
              : 'text-slate-400 border-slate-700 hover:text-white'
          }`}
          onClick={() => openDrawer('stratification')}
        >
          Strata
        </Button>
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
          variant={rightDrawerPanel === 'ranking' ? 'default' : 'outline'}
          className={`h-7 text-[11px] px-2 ${
            rightDrawerPanel === 'ranking'
              ? 'bg-fuchsia-800/40 text-fuchsia-300 border-fuchsia-700/60 hover:bg-fuchsia-800/60'
              : 'text-slate-400 border-slate-700 hover:text-white'
          }`}
          onClick={() => openDrawer('ranking')}
          title="Equity ranking — all neighborhoods sorted by worst deviation"
        >
          Rank
        </Button>
        <Button
          size="sm"
          variant={rightDrawerPanel === 'county-health' ? 'default' : 'outline'}
          className={`h-7 text-[11px] px-2 ${
            rightDrawerPanel === 'county-health'
              ? 'bg-sky-800/40 text-sky-300 border-sky-700/60 hover:bg-sky-700/60'
              : 'text-slate-400 border-slate-700 hover:text-white'
          }`}
          onClick={() => openDrawer('county-health')}
          title="County health dashboard"
        >
          County
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px] px-2 text-slate-400 border-slate-700 hover:text-white"
          onClick={() => window.open(`/api/geoforge/ratio-study/csv?taxYear=${filter.taxYear}`, '_blank')}
          title="Download ratio study as CSV"
        >
          CSV ↗
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px] px-2 text-slate-400 border-slate-700 hover:text-white"
          onClick={() => window.open(`/api/geoforge/ratio-study/export?taxYear=${filter.taxYear}`, '_blank')}
        >
          GeoJSON ↗
        </Button>
      </div>
    </div>
  );
}
