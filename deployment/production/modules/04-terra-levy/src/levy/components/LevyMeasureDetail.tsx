/**
 * Levy Measure Detail View
 * Shows a measure with its scenarios and compliance tools
 */

import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLevyMeasureWithDetails, useComplianceCheck } from '../hooks/useLevyData';
import { Notice } from './ui/Notice';

export const LevyMeasureDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const { measure, scenarios, isLoading, error } = useLevyMeasureWithDetails(id);

  const [rateInput, setRateInput] = useState<string>('');
  const rate = useMemo(() => parseFloat(rateInput || '0'), [rateInput]);
  const compliance = useComplianceCheck(id, rate, !!id && rate > 0);

  const firstScenario = scenarios[0];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="terra-gradient-quantum bg-clip-text text-transparent">{measure?.name || 'Measure'}</span>
          </h1>
          <p className="text-lg text-[#00ffee]/70">Year {measure?.levyYear} • {measure?.levyType}</p>
        </div>
        <button onClick={() => navigate('/measures')} className="text-sm text-[#00ffee] hover:text-white transition-colors">
          ← Back to Measures
        </button>
      </div>

      {/* Summary */}
      {error && (
        <div className="mb-4">
          <Notice kind="error">{String((error as any)?.message || 'Failed to load measure details.')}</Notice>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30">
          <div className="text-sm text-[#00ffee]/60">Status</div>
          <div className="text-2xl font-semibold">{measure?.status}</div>
        </div>
        <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30">
          <div className="text-sm text-[#00ffee]/60">Target Amount</div>
          <div className="text-2xl font-mono">${measure?.targetAmount.toLocaleString()}</div>
        </div>
        <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30">
          <div className="text-sm text-[#00ffee]/60">Calculated Rate</div>
          <div className="text-2xl font-mono">{measure?.calculatedRate?.toFixed(4)}</div>
        </div>
      </div>

      {/* Compliance Check */}
      <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30 mb-6">
        <div className="text-sm uppercase tracking-wide text-[#00ffee]/70 mb-3">Compliance Check</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">Proposed Rate</label>
            <input
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              placeholder="e.g. 1.2345"
              title="Proposed rate"
              className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-2 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
            />
          </div>
          <div className="md:col-span-2">
            {rate > 0 && compliance.data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-[#00ffee]/60">Compliant</div>
                  <div className={`text-lg font-semibold ${compliance.data.isCompliant ? 'text-[#00ffaa]' : 'text-[#ff0055]'}`}>
                    {compliance.data.isCompliant ? 'YES' : 'NO'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#00ffee]/60">Max Allowed</div>
                  <div className="font-mono">{compliance.data.maximumAllowedRate.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-[#00ffee]/60">Statutory Limit</div>
                  <div className="font-mono">{compliance.data.statutoryLimit.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-[#00ffee]/60">Level</div>
                  <div>{compliance.data.complianceLevel}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm uppercase tracking-wide text-[#00ffee]/70">Scenarios</div>
          {firstScenario && (
            <button
              onClick={() => navigate(`/projections?scenarioId=${firstScenario.id}`)}
              className="text-sm text-[#00ffee] hover:text-white transition-colors"
            >
              View Projections →
            </button>
          )}
        </div>

        {isLoading ? (
          <div>Loading…</div>
        ) : scenarios.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full" aria-label="Measure scenarios table">
              <thead>
                <tr className="border-b border-[#00ffee]/20 bg-[#00ffee]/5">
                  <th className="text-left p-3 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Name</th>
                  <th className="text-left p-3 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Type</th>
                  <th className="text-right p-3 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Rate</th>
                  <th className="text-right p-3 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Revenue</th>
                  <th className="text-right p-3 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => (
                  <tr key={s.id} className="border-b border-[#00ffee]/10">
                    <td className="p-3">{s.name}</td>
                    <td className="p-3">{s.scenarioType}</td>
                    <td className="p-3 text-right font-mono">{s.levyRate.toFixed(4)}</td>
                    <td className="p-3 text-right font-mono">${s.projectedRevenue.toLocaleString()}</td>
                    <td className="p-3 text-right">{(s.confidenceScore * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-[#00ffee]/60">No scenarios found for this measure.</div>
        )}
      </div>
    </div>
  );
};
