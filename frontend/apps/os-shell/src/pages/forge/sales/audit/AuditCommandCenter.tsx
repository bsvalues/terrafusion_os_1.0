// frontend/apps/os-shell/src/pages/forge/sales/audit/AuditCommandCenter.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesAuditApi } from '../../../../services/forge/salesAuditApi';
import { useSalesForgeStore } from '../salesForgeStore';
import { CountyKpiBar } from './CountyKpiBar';
import { StrataList } from './StrataList';
import { SaleAuditTable } from './SaleAuditTable';
import { AuditAiPanel } from './ai-panel/AuditAiPanel';
import type { StratumSale } from '../../../../services/forge/salesAuditApi';

interface Props { taxYear: number; }

export function AuditCommandCenter({ taxYear }: Props) {
  const qc = useQueryClient();
  const { selectedStratumKey, setSelectedStratumKey } = useSalesForgeStore();
  const [localSales, setLocalSales] = useState<Record<string, string>>({}); // id → decision override

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
        ? salesAuditApi.getDiagnosis(selectedStratumKey, taxYear)
        : Promise.resolve(null),
    enabled: !!selectedStratumKey,
  });

  const bulkDecision = useMutation({
    mutationFn: ({ ids, decision }: { ids: string[]; decision: string }) =>
      salesAuditApi.bulkDecision(ids, decision),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-audit-sales', selectedStratumKey, taxYear] });
    },
  });

  function handleDecisionChange(saleId: string, decision: string) {
    setLocalSales(prev => ({ ...prev, [saleId]: decision }));
    salesAuditApi.bulkDecision([saleId], decision).then(() =>
      qc.invalidateQueries({ queryKey: ['sales-audit-sales', selectedStratumKey, taxYear] })
    );
  }

  const enrichedSales = sales.map(s => ({
    ...s,
    qualificationDecision: localSales[s.id] ?? s.qualificationDecision,
  }));

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <CountyKpiBar strata={strata} />

      <div className="flex flex-1 min-h-0">
        {/* Left: strata list */}
        <div className="w-64 shrink-0 border-r border-slate-800 overflow-y-auto">
          <StrataList
            strata={strata}
            selectedKey={selectedStratumKey}
            onSelect={key => { setSelectedStratumKey(key); setLocalSales({}); }}
            loading={strataLoading}
          />
        </div>

        {/* Center: sale table */}
        <div className="flex-1 min-w-0 overflow-hidden border-r border-slate-800">
          {selectedStratumKey ? (
            <SaleAuditTable
              sales={enrichedSales}
              loading={salesLoading}
              onBulkDecision={(ids, decision) => bulkDecision.mutate({ ids, decision })}
              onDecisionChange={handleDecisionChange}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-600 text-sm">
              Select a stratum to begin
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
              onModify={() => {/* filter to AI flagged sales */}}
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
