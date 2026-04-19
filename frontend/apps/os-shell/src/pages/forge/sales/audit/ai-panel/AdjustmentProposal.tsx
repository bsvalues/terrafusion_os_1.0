// .../audit/ai-panel/AdjustmentProposal.tsx
import React, { useState } from 'react';
import type { SimulationResult } from '../../../../../services/forge/salesAuditApi';
import { SimulationSection } from './SimulationSection';

interface Props {
  stratumKey: string;
  taxYear: number;
  recommendedFactor: number | null;
  currentSimulation: SimulationResult | null;
  onSimulate: (factor: number) => Promise<SimulationResult>;
  onPropose: (factor: number, projected: SimulationResult) => Promise<void>;
  onCancel: () => void;
}

export function AdjustmentProposal({
  recommendedFactor, currentSimulation, onSimulate, onPropose, onCancel,
}: Props) {
  const [factor, setFactor] = useState(recommendedFactor ?? 1.0);
  const [projected, setProjected] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [proposing, setProposing] = useState(false);

  async function handleFactorChange(val: number) {
    setFactor(val);
    setSimulating(true);
    try {
      const result = await onSimulate(val);
      setProjected(result);
    } finally {
      setSimulating(false);
    }
  }

  async function handlePropose() {
    if (!projected) return;
    setProposing(true);
    try {
      await onPropose(factor, projected);
    } finally {
      setProposing(false);
    }
  }

  return (
    <div className="mt-3 border border-purple-800 rounded bg-purple-950/30 p-3">
      <div className="text-[9px] font-bold tracking-widest uppercase text-purple-400 mb-3">
        Adjustment Proposal
      </div>
      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs text-slate-400 flex-1">Factor</label>
        <input
          type="number"
          step="0.001"
          min="0.5"
          max="2.0"
          value={factor}
          onChange={e => { void handleFactorChange(Number(e.target.value)); }}
          className="w-20 text-right bg-slate-900 border border-purple-700 rounded px-2 py-1 text-sm font-mono text-purple-300 focus:outline-none focus:border-purple-500"
        />
        <span className="text-xs text-slate-500">×</span>
      </div>
      {simulating && <div className="text-xs text-slate-500 mb-2">Simulating…</div>}
      <SimulationSection current={currentSimulation} projected={projected} />
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => { void handlePropose(); }}
          disabled={!projected || proposing}
          className="flex-1 text-xs font-semibold py-2 px-3 rounded bg-purple-800 text-purple-200 hover:bg-purple-700 disabled:opacity-40"
        >
          {proposing ? 'Sending…' : 'Send to CostForge Draft'}
        </button>
        <button
          onClick={onCancel}
          className="text-xs font-semibold py-2 px-3 rounded bg-slate-800 text-slate-400 hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
