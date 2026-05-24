import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useTerraGamaStore } from './terraGamaStore';

type TerraGamaTab = 'spatial' | 'neighborhoods' | 'variance' | 'coverage';

const tabs: Array<{ key: TerraGamaTab; label: string }> = [
  { key: 'spatial', label: 'Spatial Signal' },
  { key: 'neighborhoods', label: 'Neighborhoods' },
  { key: 'variance', label: 'Variance' },
  { key: 'coverage', label: 'County Coverage' },
];

function fmtInt(value: number | null | undefined): string {
  return Number.isFinite(value) ? (value as number).toLocaleString() : '-';
}

function fmtNumber(value: number | null | undefined, digits: number): string {
  return Number.isFinite(value) ? (value as number).toFixed(digits) : '-';
}

function fmtCurrency(value: number | null | undefined): string {
  return Number.isFinite(value)
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value as number)
    : '-';
}

function fmtPercent(value: number | null | undefined, digits = 1): string {
  return Number.isFinite(value) ? `${(value as number).toFixed(digits)}%` : '-';
}

export default function TerraGamaPage() {
  const [activeTab, setActiveTab] = useState<TerraGamaTab>('spatial');
  const {
    taxYear,
    loading,
    error,
    countyScope,
    countyStats,
    neighborhoods,
    spatial,
    variance,
    stats,
    source,
    fetchRuntimeData,
  } = useTerraGamaStore((state) => ({
    taxYear: state.taxYear,
    loading: state.loading,
    error: state.error,
    countyScope: state.countyScope,
    countyStats: state.countyStats,
    neighborhoods: state.neighborhoods,
    spatial: state.spatial,
    variance: state.variance,
    stats: state.stats,
    source: state.source,
    fetchRuntimeData: state.fetchRuntimeData,
  }));

  useEffect(() => {
    void fetchRuntimeData(taxYear);
  }, [fetchRuntimeData, taxYear]);

  const topNeighborhoods = useMemo(
    () => [...neighborhoods].sort((a, b) => b.sale_count - a.sale_count).slice(0, 8),
    [neighborhoods],
  );
  const varianceNeighborhoods = useMemo(
    () => [...(variance?.neighborhoods ?? [])].slice(0, 8),
    [variance?.neighborhoods],
  );

  return (
    <div data-testid="terra-gama" className="h-full overflow-auto bg-slate-950 text-slate-100">
      <div className="space-y-5 p-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-normal">TerraGAMA</h1>
              <Badge variant="secondary">Live API</Badge>
              <Badge variant="outline">Tax Year {taxYear}</Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-300">
              Geospatial automated mass appraisal diagnostics using TerraForge county stats,
              neighborhood ratio snapshots, Moran's I, and neighborhood variance decomposition.
            </p>
          </div>
          <div className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">
            County scope: {countyScope.countyId ?? 'none'}
          </div>
        </header>

        {error && (
          <Card data-material="bento" className="border-amber-500/40 bg-amber-500/10">
            <CardHeader>
              <CardTitle className="text-sm">
                {source ? 'Partial Live Spatial Analytics' : 'Live Spatial Analytics Unavailable'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-100">{error}</CardContent>
          </Card>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="TerraGAMA stats">
          {[
            { label: 'Parcels', value: loading ? '...' : fmtInt(stats.parcels) },
            { label: 'Neighborhoods', value: loading ? '...' : fmtInt(stats.neighborhoods) },
            { label: 'Geocoded Sales', value: loading ? '...' : fmtInt(stats.geocodedSales) },
            { label: "Moran's I", value: loading ? '...' : fmtNumber(stats.moransI, 4) },
            { label: 'ICC', value: loading ? '...' : fmtNumber(stats.icc, 4) },
          ].map((item) => (
            <Card key={item.label} data-material="bento" className="border-slate-800 bg-slate-900">
              <CardContent className="p-4">
                <div className="text-xs uppercase text-slate-400">{item.label}</div>
                <div className="mt-1 font-mono text-2xl font-semibold text-white">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="TerraGAMA views">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md border px-3 py-2 text-sm transition ${
                activeTab === tab.key
                  ? 'border-cyan-400 bg-cyan-400/15 text-cyan-100'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'spatial' && (
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card data-material="bento" className="border-slate-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="text-base">Moran's I Spatial Autocorrelation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Metric label="Moran's I" value={fmtNumber(spatial?.moransI, 4)} />
                  <Metric label="Expected I" value={fmtNumber(spatial?.expectedI, 4)} />
                  <Metric label="z-score" value={fmtNumber(spatial?.zScore, 3)} />
                  <Metric
                    label="p-value"
                    value={
                      Number.isFinite(spatial?.pValue) && (spatial?.pValue ?? 1) < 0.001
                        ? '<0.001'
                        : fmtNumber(spatial?.pValue, 4)
                    }
                  />
                </div>
                <div
                  className={`rounded-md border px-3 py-2 text-sm ${
                    spatial?.significantClustering
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                  }`}
                >
                  {spatial?.interpretation ?? spatial?.error ?? 'Spatial autocorrelation has not loaded yet.'}
                </div>
              </CardContent>
            </Card>

            <Card data-material="bento" className="border-slate-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="text-base">Geocoding Coverage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Metric label="Qualified sales" value={fmtInt(spatial?.sampleSize)} />
                <Metric label="Sales with centroids" value={fmtInt(spatial?.sampleWithCoords)} />
                <Metric label="k-nearest neighbors" value={fmtInt(spatial?.kNeighbors)} />
                <Metric label="Top neighborhood" value={topNeighborhoods[0]?.neighborhood_code ?? '-'} />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'neighborhoods' && (
          <Card data-material="bento" className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-base">Neighborhood Ratio Snapshots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      <th className="py-2">Neighborhood</th>
                      <th className="py-2">Sales</th>
                      <th className="py-2">Median Ratio</th>
                      <th className="py-2">COD</th>
                      <th className="py-2">PRD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topNeighborhoods.map((row) => (
                      <tr key={row.neighborhood_code} className="border-t border-slate-800">
                        <td className="py-2 font-medium text-white">{row.neighborhood_code}</td>
                        <td className="py-2 font-mono">{fmtInt(row.sale_count)}</td>
                        <td className="py-2 font-mono">{fmtNumber(row.median_ratio, 3)}</td>
                        <td className="py-2 font-mono">{fmtNumber(row.cod, 1)}</td>
                        <td className="py-2 font-mono">{fmtNumber(row.prd, 3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'variance' && (
          <Card data-material="bento" className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-base">Neighborhood Variance Decomposition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric label="ICC" value={fmtNumber(variance?.icc, 4)} />
                <Metric label="Sample" value={fmtInt(variance?.totalSampleSize ?? variance?.sampleSize)} />
                <Metric label="Neighborhoods" value={fmtInt(variance?.neighborhoodCount)} />
                <Metric label="SS Total" value={fmtNumber(variance?.ssTotal, 2)} />
              </div>
              <p className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                {variance?.interpretation ?? variance?.error ?? 'Variance decomposition has not loaded yet.'}
              </p>
              <div className="grid gap-2">
                {varianceNeighborhoods.map((row) => (
                  <div
                    key={row.neighborhood}
                    className="grid gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm sm:grid-cols-5"
                  >
                    <span className="font-medium text-white">{row.neighborhood}</span>
                    <span>n={fmtInt(row.count)}</span>
                    <span>median {fmtNumber(row.medianRatio, 3)}</span>
                    <span>mean {fmtNumber(row.meanRatio, 3)}</span>
                    <span>delta {fmtNumber(row.deviationFromGrandMean, 3)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'coverage' && (
          <Card data-material="bento" className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-base">County Assessment Coverage</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Average assessed" value={fmtCurrency(countyStats?.averageAssessedValue)} />
              <Metric label="Assessed this year" value={fmtInt(countyStats?.assessedThisYear)} />
              <Metric label="Pending assessments" value={fmtInt(countyStats?.pendingAssessments)} />
              <Metric label="Completion" value={fmtPercent(countyStats?.assessmentCompletionPercent)} />
            </CardContent>
          </Card>
        )}

        {source && (
          <p className="text-xs text-slate-400">
            Source: {source}
          </p>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
      <div className="text-xs uppercase text-slate-400">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
