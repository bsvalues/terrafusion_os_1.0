import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { Button } from '@/components/ui/button';
import type { DiagnosisResult } from '../types/geoforge.types';

const SEV_STYLES: Record<string, { border: string; badge: string; dot: string }> = {
  ok: {
    border: 'border-green-800',
    badge: 'bg-green-950 text-green-300',
    dot: 'bg-green-400',
  },
  watch: {
    border: 'border-yellow-800',
    badge: 'bg-yellow-950 text-yellow-300',
    dot: 'bg-yellow-400',
  },
  critical: {
    border: 'border-red-800',
    badge: 'bg-red-950 text-red-300',
    dot: 'bg-red-400',
  },
};

const CAT_LABELS: Record<string, string> = {
  data_quality: 'Data Quality',
  stratification: 'Stratification',
  outliers: 'Outliers',
  external: 'External Factor',
};

export function DiagnosisPanel() {
  const { selectedNeighborhoodCode, filter, setDiagnosis, diagnosis, openDrawer } = useGeoForgeStore();

  const { data, isLoading } = useQuery<DiagnosisResult>({
    queryKey: ['geoforge-diagnosis', filter.taxYear, selectedNeighborhoodCode],
    queryFn: () =>
      apiFetchJson<DiagnosisResult>(
        `/geoforge/ratio-study/diagnosis?taxYear=${filter.taxYear}&neighborhoodCode=${selectedNeighborhoodCode}`
      ),
    enabled: !!selectedNeighborhoodCode,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (data) setDiagnosis(data);
  }, [data, setDiagnosis]);

  if (!selectedNeighborhoodCode) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        Select a neighborhood to run AI diagnosis.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        <div className="flex items-center gap-2">
          <span className="animate-spin inline-block">⟳</span>
          Running diagnosis…
        </div>
      </div>
    );
  }

  const d = diagnosis ?? data;
  if (!d) return null;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      <div>
        <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          Issues Found
        </h4>
        <div className="flex flex-col gap-2">
          {d.categories.map((cat, i) => {
            const sev = cat.severity as 'ok' | 'watch' | 'critical';
            const st = SEV_STYLES[sev] ?? SEV_STYLES.ok;
            return (
              <div key={i} className={`border rounded-md p-3 ${st.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${st.badge}`}>
                    {sev}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase">
                    {CAT_LABELS[cat.category] ?? cat.category}
                  </span>
                </div>
                <p className="text-sm text-white font-medium leading-tight">{cat.headline}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{cat.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      {d.peers.length > 0 && (
        <div>
          <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Closest Peer Neighborhoods
          </h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-slate-700">
                <th className="text-left py-1 pr-2">Nbhd</th>
                <th className="text-right py-1 px-2">Median</th>
                <th className="text-right py-1 px-2">COD</th>
                <th className="text-right py-1 pl-2">Δ vs Here</th>
              </tr>
            </thead>
            <tbody>
              {d.peers.map((p) => (
                <tr key={p.neighborhoodCode} className="border-b border-slate-800">
                  <td className="py-1.5 pr-2 text-slate-300">{p.neighborhoodCode}</td>
                  <td className="py-1.5 px-2 text-right font-mono">
                    {p.medianRatio.toFixed(3)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono">{p.cod.toFixed(1)}</td>
                  <td
                    className={`py-1.5 pl-2 text-right font-mono ${
                      p.delta > 0.01
                        ? 'text-red-400'
                        : p.delta < -0.01
                        ? 'text-blue-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {p.delta > 0 ? '+' : ''}
                    {p.delta.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {d.dataQualityFlags.length > 0 && (
        <div>
          <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Quality Flags
          </h4>
          <div className="flex flex-wrap gap-1">
            {d.dataQualityFlags.map((f) => (
              <span
                key={f}
                className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Workbench CTA */}
      <div className="sticky bottom-0 -mx-4 -mb-4 px-4 py-3 bg-slate-950/95 backdrop-blur border-t border-slate-800">
        <Button
          className="w-full h-8 text-xs bg-amber-700/30 hover:bg-amber-700/50 text-amber-200 border border-amber-700/50"
          variant="outline"
          onClick={() => openDrawer('workbench')}
        >
          Open Adjustment Workbench →
        </Button>
      </div>
    </div>
  );
}
