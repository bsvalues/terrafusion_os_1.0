import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { GeoForgeMap } from './GeoForgeMap';
import { GeoForgeCommandBar } from './GeoForgeCommandBar';
import { GeoForgeEquityRail } from './GeoForgeEquityRail';
import { NeighborhoodDetailPanel } from './panels/NeighborhoodDetailPanel';
import { SalesDrillDownPanel } from './panels/SalesDrillDownPanel';
import { DiagnosisPanel } from './panels/DiagnosisPanel';
import { YearTrendPanel } from './panels/YearTrendPanel';
import { AdjustmentWorkbenchPanel } from './panels/AdjustmentWorkbenchPanel';
import { ParcelBloomCard } from './ParcelBloomCard';
import { CertificationPanel } from './panels/CertificationPanel';
import { OutlierReviewPanel } from './panels/OutlierReviewPanel';
import { StratificationPanel } from './panels/StratificationPanel';
import { CompsPanel } from './panels/CompsPanel';
import { NeighborhoodRankingPanel } from './panels/NeighborhoodRankingPanel';
import { CountyHealthPanel } from './panels/CountyHealthPanel';
import { RemedyQueuePanel } from './panels/RemedyQueuePanel';
import { GeoForgeMapLegend } from './GeoForgeMapLegend';
import { GeoForgeHotkeyHelp } from './GeoForgeHotkeyHelp';
import { GeoForgeStatusTicker } from './GeoForgeStatusTicker';
import { Button } from '@/components/ui/button';
import type { NeighborhoodStat, SalePoint, RightDrawerPanel, GwrSurface } from './types/geoforge.types';

const PANEL_TITLES: Record<RightDrawerPanel, string> = {
  none: '',
  'neighborhood-detail': 'Neighborhood Detail',
  'sales-drilldown': 'Sales Drill-Down',
  diagnosis: 'AI Diagnosis',
  'year-trend': '5-Year Trend',
  workbench: 'Adjustment Workbench',
  certification: 'DOR Certification · WAC 458-53A',
  'outlier-review': 'Outlier Review',
  stratification: 'IAAO Stratification',
  comps: 'Auto-Comparables',
  ranking: 'Equity Ranking',
  'county-health': 'County Health Dashboard',
  'remedy-queue': 'Certification Remedy Queue',
};

export function GeoForgePage() {
  const [showHelp, setShowHelp] = useState(false);

  const {
    filter,
    rightDrawerPanel,
    closeDrawer,
    openDrawer,
    setNeighborhoodStats,
    setSalePoints,
    setLoadingStats,
    setLoadingSales,
    setGwrSurface,
    selectNeighborhood,
    selectedNeighborhoodCode,
    activeLayers,
    simulationDeltaMap,
    setBloomParcelId,
  } = useGeoForgeStore();

  // Global keyboard shortcuts (skip when an input/select/textarea is focused)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case 'Escape': closeDrawer(); setShowHelp(false); break;
        case '?': setShowHelp((v) => !v); break;
        case 'r': openDrawer('ranking'); break;
        case 'c': openDrawer('county-health'); break;
        case 's': openDrawer('stratification'); break;
        case 'o': openDrawer('outlier-review'); break;
        case 'w': openDrawer('workbench'); break;
        case 'y': openDrawer('certification'); break;
        case 'q': openDrawer('remedy-queue'); break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeDrawer, openDrawer]);

  const { data: statsData, isLoading: statsLoading } = useQuery<NeighborhoodStat[]>({
    queryKey: [
      'geoforge-nbhd-stats',
      filter.taxYear,
      filter.propertyClass,
      filter.saleDateStart,
      filter.saleDateEnd,
    ],
    queryFn: () => {
      const params = new URLSearchParams({ taxYear: String(filter.taxYear) });
      if (filter.propertyClass) params.set('propertyType', filter.propertyClass);
      if (filter.saleDateStart) params.set('saleDateStart', filter.saleDateStart);
      if (filter.saleDateEnd) params.set('saleDateEnd', filter.saleDateEnd);
      return apiFetchJson<NeighborhoodStat[]>(
        `/api/geoforge/ratio-study/neighborhood-stats?${params}`
      );
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: salesData, isLoading: salesLoading } = useQuery<SalePoint[]>({
    queryKey: ['geoforge-sales', filter.taxYear],
    queryFn: () =>
      apiFetchJson<SalePoint[]>(
        `/api/geoforge/ratio-study/sales?taxYear=${filter.taxYear}`
      ),
    staleTime: 1000 * 60 * 10,
  });

  const gwrEnabled = activeLayers.has('gwr');

  const { data: gwrData } = useQuery<GwrSurface>({
    queryKey: ['geoforge-gwr', filter.taxYear],
    queryFn: () =>
      apiFetchJson<GwrSurface>(`/api/geoforge/ratio-study/gwr?taxYear=${filter.taxYear}`),
    enabled: gwrEnabled,
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => { setLoadingStats(statsLoading); }, [statsLoading, setLoadingStats]);
  useEffect(() => { setLoadingSales(salesLoading); }, [salesLoading, setLoadingSales]);
  useEffect(() => { if (statsData) setNeighborhoodStats(statsData); }, [statsData, setNeighborhoodStats]);
  useEffect(() => { if (salesData) setSalePoints(salesData); }, [salesData, setSalePoints]);
  useEffect(() => { if (gwrData) setGwrSurface(gwrData); }, [gwrData, setGwrSurface]);

  const drawerOpen = rightDrawerPanel !== 'none';

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* Full-canvas map — always fills entire container */}
      <GeoForgeMap
        onNeighborhoodClick={(code) => selectNeighborhood(code)}
        onSaleClick={(parcelId) => setBloomParcelId(parcelId)}
      />

      {/* Command bar overlays the top of the map */}
      <GeoForgeCommandBar />

      {/* Status ticker — county-wide IAAO metrics, always visible below command bar */}
      <GeoForgeStatusTicker />

      {/* Right equity rail — always visible, 72px wide */}
      <GeoForgeEquityRail />

      {/* Right drawer — 480px, slides over map from right (left of the 72px rail) */}
      <div
        className={`absolute top-0 right-[72px] h-full w-[480px] z-20 flex flex-col
          bg-slate-950/95 backdrop-blur border-l border-slate-700
          transition-transform duration-300 ease-in-out
          ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {drawerOpen && (
          <>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 bg-slate-900/50 flex-shrink-0">
              <span className="text-sm font-semibold text-terra-cyan">
                {PANEL_TITLES[rightDrawerPanel]}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-white"
                onClick={closeDrawer}
              >
                ×
              </Button>
            </div>

            <div className="flex-1 overflow-hidden">
              {rightDrawerPanel === 'neighborhood-detail' && <NeighborhoodDetailPanel />}
              {rightDrawerPanel === 'sales-drilldown' && <SalesDrillDownPanel />}
              {rightDrawerPanel === 'diagnosis' && <DiagnosisPanel />}
              {rightDrawerPanel === 'year-trend' && <YearTrendPanel />}
              {rightDrawerPanel === 'workbench' && (
                <AdjustmentWorkbenchPanel
                  taxYear={filter.taxYear}
                  selectedNeighborhoodCode={selectedNeighborhoodCode}
                />
              )}
              {rightDrawerPanel === 'certification' && <CertificationPanel />}
              {rightDrawerPanel === 'outlier-review' && <OutlierReviewPanel />}
              {rightDrawerPanel === 'stratification' && <StratificationPanel />}
              {rightDrawerPanel === 'comps' && <CompsPanel />}
              {rightDrawerPanel === 'ranking' && <NeighborhoodRankingPanel />}
              {rightDrawerPanel === 'county-health' && <CountyHealthPanel />}
              {rightDrawerPanel === 'remedy-queue' && <RemedyQueuePanel />}
            </div>
          </>
        )}
      </div>

      {/* Simulation mode badge — floats below command bar on the left */}
      {simulationDeltaMap && Object.keys(simulationDeltaMap).length > 0 && (
        <div className="absolute top-[37px] left-2 z-30 flex items-center gap-1.5 bg-amber-950/90 backdrop-blur rounded px-2.5 py-1 text-xs text-amber-200 border border-amber-700/70">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          SIMULATION · {Object.keys(simulationDeltaMap).length} nbhd{Object.keys(simulationDeltaMap).length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Map legend — floating color key, bottom-right */}
      <GeoForgeMapLegend />

      {/* Hotkey help overlay */}
      {showHelp && <GeoForgeHotkeyHelp onClose={() => setShowHelp(false)} />}

      {/* Parcel bloom card — slides up from bottom */}
      <ParcelBloomCard />

      {/* Loading indicator — bottom left, floats over map */}
      {(statsLoading || salesLoading) && (
        <div className="absolute bottom-8 left-4 z-30 flex items-center gap-2 bg-slate-900/90 backdrop-blur rounded-md px-3 py-1.5 text-xs text-muted-foreground border border-slate-700">
          <span className="animate-spin inline-block text-terra-cyan">⟳</span>
          {statsLoading && !salesLoading ? 'Loading neighborhood stats…' : 'Loading sales…'}
        </div>
      )}
    </div>
  );
}
