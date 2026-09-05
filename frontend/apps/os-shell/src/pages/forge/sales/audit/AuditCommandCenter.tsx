// frontend/apps/os-shell/src/pages/forge/sales/audit/AuditCommandCenter.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesAuditApi } from '../../../../services/forge/salesAuditApi';
import { getSalesForgeCountyScope, useSalesForgeStore } from '../salesForgeStore';
import { CountyKpiBar } from './CountyKpiBar';
import { StrataList } from './StrataList';
import { SaleAuditTable } from './SaleAuditTable';
import { AuditAiPanel } from './ai-panel/AuditAiPanel';
import type { StratumSale } from '../../../../services/forge/salesAuditApi';

interface Props { taxYear: number; }

// Range of study years available in the year picker
const STUDY_YEARS = [2023, 2024, 2025, 2026];

export function AuditCommandCenter({ taxYear: propTaxYear }: Props) {
  const qc = useQueryClient();
  const { selectedStratumKey, setSelectedStratumKey, dataSource } = useSalesForgeStore();
  const countyScope = getSalesForgeCountyScope();
  const admissionSource = dataSource === 'county-readonly-sync' ? 'county-readonly-sync' : 'canonical';
  const [localSales, setLocalSales] = useState<Record<string, string>>({}); // id → decision override
  const [filterOverride, setFilterOverride] = useState<'ai-flagged' | undefined>(undefined);
  // Local year override so the assessor can explore any study year without touching the global store
  const [taxYear, setTaxYear] = useState(propTaxYear);

  const { data: strata = [], isLoading: strataLoading } = useQuery({
    queryKey: ['sales-audit-strata', taxYear],
    queryFn: () => salesAuditApi.getStrata(taxYear),
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales-audit-sales', selectedStratumKey, taxYear],
    queryFn: () =>
      selectedStratumKey
        ? salesAuditApi.getStratumSales(selectedStratumKey, taxYear)
        : Promise.resolve([] as StratumSale[]),
    enabled: !!selectedStratumKey,
  });

  const { data: diagnosis = null } = useQuery({
    queryKey: ['sales-audit-diagnosis', selectedStratumKey, taxYear],
    queryFn: () =>
      selectedStratumKey
        ? salesAuditApi.getDiagnosis(selectedStratumKey, taxYear).catch(() => null)
        : Promise.resolve(null),
    enabled: !!selectedStratumKey,
  });

  const { data: runningStats } = useQuery({
    queryKey: ['sales-forge-running-stats', taxYear, countyScope.countyId, admissionSource],
    queryFn: () =>
      fetch(
        `/api/terraforge/sale-qualification/running-stats?taxYear=${taxYear}&admissionSource=${encodeURIComponent(admissionSource)}${countyScope.countyId ? `&countyId=${encodeURIComponent(countyScope.countyId)}` : ''}`,
        { headers: countyScope.headers },
      )
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    enabled: countyScope.isolated,
    staleTime: 60_000,
  });

  const bulkDecision = useMutation({
    mutationFn: ({ ids, decision }: { ids: string[]; decision: string }) =>
      salesAuditApi.bulkDecision(ids, decision),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-audit-sales', selectedStratumKey, taxYear] });
    },
  });

  // County-wide AI diagnosis trigger — runs all strata in one shot
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagMessage, setDiagMessage] = useState<string | null>(null);

  async function handleRunDiagnosis() {
    setDiagRunning(true);
    setDiagMessage(null);
    try {
      const result = await salesAuditApi.diagnoseCounty(taxYear);
      setDiagMessage(`Diagnosed ${result.diagnosedCount} strata.`);
      await qc.invalidateQueries({ queryKey: ['sales-audit-strata', taxYear] });
      await qc.invalidateQueries({ queryKey: ['sales-audit-diagnosis', selectedStratumKey, taxYear] });
    } catch {
      setDiagMessage('Diagnosis failed — check connection.');
    } finally {
      setDiagRunning(false);
    }
  }

  function handleDecisionChange(saleId: string, decision: string) {
    setLocalSales(prev => ({ ...prev, [saleId]: decision }));
    bulkDecision.mutate({ ids: [saleId], decision });
  }

  const enrichedSales = sales.map(s => ({
    ...s,
    qualificationDecision: localSales[s.id] ?? s.qualificationDecision,
  }));

  const diagnosedCount = strata.filter(s => s.primaryDiagnosis !== null).length;
  const noneHaveDiagnosis = strata.length > 0 && diagnosedCount === 0;

  return (
    <div className="flex flex-col h-full bg-slate-950">

      {/* Top action bar: year picker + run-diagnosis button */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-800 bg-slate-900 shrink-0">
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Study Year</span>
        <select
          value={taxYear}
          onChange={e => {
            setTaxYear(Number(e.target.value));
            setSelectedStratumKey(null);
            setLocalSales({});
            setDiagMessage(null);
          }}
          className="bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 px-2 py-1"
        >
          {STUDY_YEARS.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-3">
          {diagMessage && (
            <span className="text-[11px] text-slate-400">{diagMessage}</span>
          )}
          {strata.length > 0 && (
            <span className="text-[10px] text-slate-600">
              {diagnosedCount}/{strata.length} diagnosed
            </span>
          )}
          <button
            onClick={handleRunDiagnosis}
            disabled={diagRunning || strataLoading}
            className="text-[11px] font-semibold px-3 py-1.5 rounded border border-cyan-700 text-cyan-300 bg-cyan-950 hover:bg-cyan-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {diagRunning ? 'Running…' : 'Run AI Diagnosis'}
          </button>
        </div>
      </div>

      <CountyKpiBar
        strata={strata}
        cod={runningStats?.cod ?? 0}
        medianRatio={runningStats?.medianRatio ?? 0}
        prd={runningStats?.prd ?? 0}
        qualifiedSales={runningStats?.qualifiedSaleCount ?? 0}
      />

      <div className="flex flex-1 min-h-0">
        {/* Left: strata list */}
        <div className="w-64 shrink-0 border-r border-slate-800 flex flex-col">
          {/* Empty-state prompt when we have strata but none diagnosed yet */}
          {noneHaveDiagnosis && !strataLoading && (
            <div className="px-3 py-3 bg-amber-950/40 border-b border-amber-900/50">
              <p className="text-[11px] text-amber-300 font-medium mb-1">No diagnoses yet</p>
              <p className="text-[10px] text-amber-500 mb-2">
                {strata.length} neighborhoods have {taxYear} sales but haven&apos;t been analyzed.
                Click <strong>Run AI Diagnosis</strong> to detect data problems, outlier clusters, and market shifts.
              </p>
              <button
                onClick={handleRunDiagnosis}
                disabled={diagRunning}
                className="w-full text-[11px] font-semibold px-2 py-1 rounded bg-amber-700 text-amber-100 hover:bg-amber-600 disabled:opacity-40 transition-colors"
              >
                {diagRunning ? 'Running…' : `Diagnose All ${strata.length} Strata`}
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            <StrataList
              strata={strata}
              selectedKey={selectedStratumKey}
              onSelect={key => { setSelectedStratumKey(key); setLocalSales({}); }}
              loading={strataLoading}
            />
          </div>
        </div>

        {/* Center: sale table */}
        <div className="flex-1 min-w-0 overflow-hidden border-r border-slate-800">
          {selectedStratumKey ? (
            <SaleAuditTable
              sales={enrichedSales}
              loading={salesLoading}
              filterOverride={filterOverride}
              onBulkDecision={(ids, decision) => bulkDecision.mutate({ ids, decision })}
              onDecisionChange={handleDecisionChange}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
              <span className="text-4xl">⊙</span>
              <span className="text-sm">Select a stratum to review its sales</span>
            </div>
          )}
        </div>

        {/* Right: AI panel */}
        <div className="w-72 shrink-0 overflow-hidden">
          {selectedStratumKey ? (
            <AuditAiPanel
              stratumKey={selectedStratumKey}
              taxYear={taxYear}
              diagnosis={diagnosis}
              currentSimulation={null}
              onAcceptDisqualify={ids => bulkDecision.mutate({ ids, decision: 'disqualified' })}
              onModify={() => setFilterOverride('ai-flagged')}
              onDraftCreated={() =>
                qc.invalidateQueries({ queryKey: ['sales-audit-strata', taxYear] })
              }
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-600 text-sm">
              Select a stratum
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
