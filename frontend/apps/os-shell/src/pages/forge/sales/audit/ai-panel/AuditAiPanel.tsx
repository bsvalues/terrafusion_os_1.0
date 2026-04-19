// .../audit/ai-panel/AuditAiPanel.tsx
import React, { useState, useEffect } from 'react';
import type { SaleAuditDiagnosis, SimulationResult } from '../../../../../services/forge/salesAuditApi';
import { salesAuditApi } from '../../../../../services/forge/salesAuditApi';
import { DiagnosisSection } from './DiagnosisSection';
import { EvidenceSection } from './EvidenceSection';
import { SimulationSection } from './SimulationSection';
import { DataActionSection } from './DataActionSection';
import { AdjustmentProposal } from './AdjustmentProposal';
import type { DiagnosisFinding } from '../../../../../services/forge/salesAuditApi';

interface Props {
  stratumKey: string;
  taxYear: number;
  diagnosis: SaleAuditDiagnosis | null;
  currentSimulation: SimulationResult | null;
  onAcceptDisqualify: (ids: string[]) => void;
  onModify: () => void;
  onDraftCreated: () => void;
}

export function AuditAiPanel({
  stratumKey, taxYear, diagnosis, currentSimulation,
  onAcceptDisqualify, onModify, onDraftCreated,
}: Props) {
  const [showProposal, setShowProposal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { setShowProposal(false); }, [stratumKey]);

  if (!diagnosis) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-600 text-sm gap-2">
        <div>No diagnosis yet</div>
      </div>
    );
  }

  let findings: DiagnosisFinding[] = [];
  let recommendedIds: string[] = [];
  try { findings = JSON.parse(diagnosis.findingsJson ?? '[]'); } catch { /* ignore */ }
  try { recommendedIds = JSON.parse(diagnosis.recommendedSaleIdsJson ?? '[]'); } catch { /* ignore */ }

  async function handleSimulate(factor: number): Promise<SimulationResult> {
    return salesAuditApi.simulate(stratumKey, taxYear, factor);
  }

  async function handlePropose(factor: number, projected: SimulationResult) {
    await salesAuditApi.proposeAdjustment(
      stratumKey, taxYear, factor,
      projected.cod, projected.medianRatio, projected.prd,
    );
    setShowProposal(false);
    setToast('Draft created in CostForge');
    setTimeout(() => setToast(null), 4000);
    onDraftCreated();
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3">
      <DiagnosisSection diagnosis={diagnosis.primaryDiagnosis} confidence={diagnosis.confidence} />
      <EvidenceSection findings={findings} />
      <SimulationSection current={currentSimulation} projected={null} />

      {diagnosis.primaryDiagnosis === 'DATA_PROBLEM' && !showProposal && (
        <DataActionSection
          recommendedSaleIds={recommendedIds}
          onAccept={onAcceptDisqualify}
          onModify={onModify}
        />
      )}

      {diagnosis.primaryDiagnosis === 'MODEL_DRIFT' && !showProposal && (
        <div className="mt-3">
          <button
            onClick={() => setShowProposal(true)}
            className="w-full text-sm font-semibold py-2 px-3 rounded bg-purple-900 text-purple-300 hover:bg-purple-800"
          >
            Propose Adjustment
          </button>
        </div>
      )}

      {showProposal && (
        <AdjustmentProposal
          stratumKey={stratumKey}
          taxYear={taxYear}
          recommendedFactor={diagnosis.recommendedFactor}
          currentSimulation={currentSimulation}
          onSimulate={handleSimulate}
          onPropose={handlePropose}
          onCancel={() => setShowProposal(false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-emerald-900 text-emerald-300 text-sm px-4 py-2 rounded shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
