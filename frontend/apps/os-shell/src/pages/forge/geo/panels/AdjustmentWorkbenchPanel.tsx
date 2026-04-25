import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { useAuthContext } from '@/auth/useAuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  AdjustmentSet,
  AdjustmentProposal,
  AdjustmentKind,
  AdjustmentScope,
  RecommendResult,
} from '../types/geoforge.types';

function SimRatioPreview({ proposals }: { proposals: AdjustmentProposal[] }) {
  const { neighborhoodStats } = useGeoForgeStore();

  const rows = useMemo(() => {
    const pctProps = proposals.filter(
      (p) => p.kind === 'PercentOfAV' && p.scope === 'Neighborhood' && p.targetNeighborhoodCode,
    );
    if (pctProps.length === 0) return [];

    const byCode: Record<string, number> = {};
    for (const p of pctProps) {
      byCode[p.targetNeighborhoodCode!] = (byCode[p.targetNeighborhoodCode!] ?? 0) + p.magnitude;
    }

    return Object.entries(byCode)
      .map(([code, totalMag]) => {
        const ns = neighborhoodStats.find((n) => n.neighborhoodCode === code);
        if (!ns) return null;
        const origMedian = ns.stats.medianRatio;
        const adjMedian = origMedian * (1 + totalMag / 100);
        return { code, totalMag, origMedian, adjMedian, cod: ns.stats.cod };
      })
      .filter(Boolean) as { code: string; totalMag: number; origMedian: number; adjMedian: number; cod: number }[];
  }, [proposals, neighborhoodStats]);

  if (rows.length === 0) return null;

  return (
    <div className="shrink-0 px-3 py-2 border-b border-slate-800 bg-slate-950/50">
      <h4 className="text-[8px] text-slate-500 uppercase tracking-wider mb-2">
        Post-Adjustment Ratio Preview
      </h4>
      <table className="w-full text-[9px]">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left text-slate-600 py-0.5 font-normal">Nbhd</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">Adj %</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">Before</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">After</th>
            <th className="text-right text-slate-600 py-0.5 font-normal">COD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const inParity = r.adjMedian >= 0.95 && r.adjMedian <= 1.05;
            const origColor = r.origMedian >= 0.95 && r.origMedian <= 1.05
              ? 'text-emerald-400' : r.origMedian >= 0.90 && r.origMedian <= 1.10
              ? 'text-amber-400' : 'text-red-400';
            return (
              <tr key={r.code} className="border-b border-slate-800/40">
                <td className="py-0.5 text-terra-cyan font-mono">{r.code}</td>
                <td className={`py-0.5 text-right font-mono font-bold ${r.totalMag >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {r.totalMag >= 0 ? '+' : ''}{r.totalMag.toFixed(1)}
                </td>
                <td className={`py-0.5 text-right font-mono ${origColor}`}>
                  {r.origMedian.toFixed(3)}
                </td>
                <td className={`py-0.5 text-right font-mono font-semibold ${inParity ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {r.adjMedian.toFixed(3)}
                  {inParity && <span className="ml-1 text-[8px]">✓</span>}
                </td>
                <td className="py-0.5 text-right font-mono text-slate-500">{r.cod.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[8px] text-slate-600 mt-1.5">
        COD/PRD invariant to uniform % · adjust non-uniformity via stratified or quintile proposals
      </p>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  Draft: 'bg-slate-700 text-slate-200',
  UnderReview: 'bg-yellow-900/60 text-yellow-300',
  PendingApproval: 'bg-blue-900/60 text-blue-300',
  Approved: 'bg-green-900/60 text-green-300',
  Applied: 'bg-cyan-900/60 text-cyan-300',
  Reverted: 'bg-red-900/60 text-red-300',
  Discarded: 'bg-slate-800 text-slate-500',
};

const KIND_LABELS: Record<AdjustmentKind, string> = {
  PercentOfAV: '% of AV',
  FlatDelta: 'Flat $',
  FeatureUnitRate: 'Feature Rate',
  TimeAdjustment: 'Time Adj',
  RemoveSale: 'Remove Sale',
  ReassignNeighborhood: 'Reassign Nbhd',
  SplitNeighborhood: 'Split Nbhd',
};

interface Props {
  taxYear: number;
  selectedNeighborhoodCode: string | null;
}

export function AdjustmentWorkbenchPanel({ taxYear, selectedNeighborhoodCode }: Props) {
  const qc = useQueryClient();
  const { userId } = useAuthContext();
  const { setSimulationDeltaMap } = useGeoForgeStore();
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [showNewProposal, setShowNewProposal] = useState(false);

  const { data: sets = [], isLoading: loadingSets } = useQuery<AdjustmentSet[]>({
    queryKey: ['adjustment-sets', taxYear],
    queryFn: () => fetch(`/api/adjustment/sets?taxYear=${taxYear}`).then(r => r.json()),
    staleTime: 30_000,
  });

  const activeSet = sets.find(s => s.id === activeSetId) ?? sets[0] ?? null;

  // Push simulation delta map to Mapbox whenever simulated proposals change
  useEffect(() => {
    if (!activeSet) { setSimulationDeltaMap(null); return; }
    const simulated = activeSet.proposals.filter(
      p => p.scope === 'Neighborhood' && p.targetNeighborhoodCode && p.simulatedParcelsAffected != null
    );
    if (simulated.length === 0) { setSimulationDeltaMap(null); return; }
    const deltaMap = Object.fromEntries(
      simulated.map(p => [p.targetNeighborhoodCode!, p.magnitude])
    );
    setSimulationDeltaMap(deltaMap);
    return () => setSimulationDeltaMap(null);
  }, [activeSet, setSimulationDeltaMap]);

  const { data: recommend } = useQuery<RecommendResult>({
    queryKey: ['adjustment-recommend', taxYear, selectedNeighborhoodCode],
    queryFn: () =>
      fetch(`/api/adjustment/recommend?taxYear=${taxYear}&neighborhoodCode=${selectedNeighborhoodCode}`)
        .then(r => r.json()),
    enabled: !!selectedNeighborhoodCode,
    staleTime: 60_000,
  });

  const createSet = useMutation({
    mutationFn: () =>
      fetch('/api/adjustment/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxYear,
          name: `${taxYear} Adjustment Set`,
          ownerUserId: userId ?? '',
        }),
      }).then(r => r.json()),
    onSuccess: (s: AdjustmentSet) => {
      qc.invalidateQueries({ queryKey: ['adjustment-sets', taxYear] });
      setActiveSetId(s.id);
    },
  });

  const simulateProposal = useMutation({
    mutationFn: (proposalId: string) =>
      fetch(`/api/adjustment/proposals/${proposalId}/simulate`, { method: 'POST' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adjustment-sets', taxYear] }),
  });

  const submitSet = useMutation({
    mutationFn: (setId: string) =>
      fetch(`/api/adjustment/sets/${setId}/submit`, { method: 'POST' }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adjustment-sets', taxYear] }),
  });

  const addRecommendedProposal = useMutation({
    mutationFn: () => {
      if (!recommend || !activeSet) return Promise.reject();
      return fetch('/api/adjustment/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxYear,
          scope: 'Neighborhood' as AdjustmentScope,
          kind: 'PercentOfAV' as AdjustmentKind,
          magnitude: recommend.recommendedAdjustmentPct,
          targetNeighborhoodCode: selectedNeighborhoodCode,
          rationale: `AI-recommended ${recommend.direction} of ${Math.abs(recommend.recommendedAdjustmentPct).toFixed(1)}% to reach parity (median ratio ${recommend.medianRatio.toFixed(3)})`,
          proposedByUserId: userId ?? '',
          adjustmentSetId: activeSet.id,
        }),
      }).then(r => r.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adjustment-sets', taxYear] }),
  });

  const totalSimDelta = activeSet?.proposals
    .filter(p => p.simulatedTotalDeltaAV != null)
    .reduce((acc, p) => acc + (p.simulatedTotalDeltaAV ?? 0), 0) ?? 0;

  const totalSimParcels = activeSet?.proposals
    .filter(p => p.simulatedParcelsAffected != null)
    .reduce((acc, p) => acc + (p.simulatedParcelsAffected ?? 0), 0) ?? 0;

  if (loadingSets) {
    return <div className="p-4 text-slate-400 text-sm">Loading workbench…</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-sm">
      {/* AI Recommendation Banner */}
      {recommend && selectedNeighborhoodCode && (
        <div className="shrink-0 m-3 p-3 rounded border border-cyan-800/60 bg-cyan-950/30">
          <div className="text-xs text-cyan-400 font-medium mb-1">AI RECOMMENDS · {selectedNeighborhoodCode}</div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-white">
              {recommend.direction === 'increase' ? '+' : ''}{recommend.recommendedAdjustmentPct.toFixed(1)}%
              <span className="ml-2 text-slate-400">(median ratio {recommend.medianRatio.toFixed(3)})</span>
            </span>
            {activeSet && (
              <Button
                size="sm"
                className="h-6 px-2 text-xs bg-cyan-700 hover:bg-cyan-600 text-white shrink-0"
                onClick={() => addRecommendedProposal.mutate()}
                disabled={addRecommendedProposal.isPending}
              >
                Add to Set
              </Button>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">n={recommend.sampleSize} qualified sales</div>
        </div>
      )}

      {/* Set Selector Header */}
      <div className="shrink-0 px-3 pb-2 border-b border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <select
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
            value={activeSetId ?? activeSet?.id ?? ''}
            onChange={e => setActiveSetId(e.target.value)}
          >
            {sets.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
            {sets.length === 0 && <option value="">No sets — create one</option>}
          </select>
          <Button
            size="sm"
            className="h-6 px-2 text-xs bg-slate-700 hover:bg-slate-600 shrink-0"
            onClick={() => createSet.mutate()}
            disabled={createSet.isPending}
          >
            + New
          </Button>
        </div>

        {activeSet && (
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[activeSet.status] ?? 'bg-slate-800 text-slate-400'}`}>
              {activeSet.status}
            </span>
            <span className="text-slate-500 text-xs">{activeSet.proposals.length} proposals</span>
            {activeSet.status === 'Draft' && activeSet.proposals.length > 0 && (
              <Button
                size="sm"
                className="h-5 px-2 text-xs bg-blue-800 hover:bg-blue-700 ml-auto shrink-0"
                onClick={() => submitSet.mutate(activeSet.id)}
                disabled={submitSet.isPending}
              >
                Submit for Approval
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Cumulative Impact */}
      {activeSet && totalSimParcels > 0 && (
        <div className="shrink-0 px-3 py-2 bg-slate-900/60 border-b border-slate-800 flex gap-4">
          <div>
            <div className="text-xs text-slate-500">Simulated Parcels</div>
            <div className="text-white font-mono">{totalSimParcels.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Net AV Delta</div>
            <div className={`font-mono ${totalSimDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalSimDelta >= 0 ? '+' : ''}${(totalSimDelta / 1_000_000).toFixed(2)}M
            </div>
          </div>
        </div>
      )}

      {/* Post-adjustment ratio preview */}
      {activeSet && <SimRatioPreview proposals={activeSet.proposals} />}

      {/* Proposals List */}
      <div className="flex-1 overflow-y-auto">
        {!activeSet && (
          <div className="p-6 text-center text-slate-500">
            <div className="mb-2">No adjustment set selected.</div>
            <Button size="sm" className="text-xs bg-slate-700" onClick={() => createSet.mutate()}>
              Create First Set
            </Button>
          </div>
        )}

        {activeSet?.proposals.length === 0 && (
          <div className="p-4 text-slate-500 text-center">
            No proposals yet.{' '}
            {recommend && selectedNeighborhoodCode
              ? 'Use AI recommendation above to add one.'
              : 'Select a neighborhood in the diagnosis panel to get recommendations.'}
          </div>
        )}

        {activeSet?.proposals.map(p => (
          <ProposalRow
            key={p.id}
            proposal={p}
            onSimulate={() => simulateProposal.mutate(p.id)}
            simulating={simulateProposal.isPending && simulateProposal.variables === p.id}
          />
        ))}
      </div>
    </div>
  );
}

function ProposalRow({
  proposal,
  onSimulate,
  simulating,
}: {
  proposal: AdjustmentProposal;
  onSimulate: () => void;
  simulating: boolean;
}) {
  const signedMag = proposal.kind === 'PercentOfAV'
    ? `${proposal.magnitude >= 0 ? '+' : ''}${proposal.magnitude.toFixed(1)}%`
    : `${proposal.magnitude >= 0 ? '+' : ''}$${proposal.magnitude.toLocaleString()}`;

  return (
    <div className="border-b border-slate-800/60 px-3 py-2 hover:bg-slate-900/40">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_BADGE[proposal.status] ?? 'bg-slate-800 text-slate-400'}`}>
              {proposal.status}
            </span>
            <span className="text-slate-300 font-mono text-xs">{KIND_LABELS[proposal.kind]}</span>
            <span className={`font-mono text-xs font-bold ${proposal.magnitude >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {signedMag}
            </span>
          </div>
          <div className="text-xs text-slate-400 truncate">
            {proposal.targetNeighborhoodCode ?? proposal.targetCityCode ?? 'All'}
            {proposal.scope !== 'Neighborhood' && ` · ${proposal.scope}`}
          </div>
          <div className="text-xs text-slate-500 truncate mt-0.5">{proposal.rationale}</div>
        </div>
        {proposal.status === 'Draft' && (
          <Button
            size="sm"
            className="h-5 px-2 text-xs bg-slate-700 hover:bg-slate-600 shrink-0 mt-0.5"
            onClick={onSimulate}
            disabled={simulating}
          >
            {simulating ? '…' : 'Sim'}
          </Button>
        )}
      </div>
      {proposal.simulatedParcelsAffected != null && (
        <div className="mt-1 flex gap-3 text-xs text-slate-500">
          <span>{proposal.simulatedParcelsAffected.toLocaleString()} parcels</span>
          <span className={proposal.simulatedTotalDeltaAV! >= 0 ? 'text-green-500' : 'text-red-500'}>
            {proposal.simulatedTotalDeltaAV! >= 0 ? '+' : ''}
            ${((proposal.simulatedTotalDeltaAV ?? 0) / 1_000_000).toFixed(2)}M
          </span>
        </div>
      )}
    </div>
  );
}
