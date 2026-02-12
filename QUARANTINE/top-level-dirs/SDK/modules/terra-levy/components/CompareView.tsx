/**
 * TerraLevy Compare View
 * Side-by-side comparison of scenarios with AI recommendation
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CompareResponse } from '../api/levyApiClient';

export const CompareView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const comparison = (location.state as { comparisonResult?: CompareResponse })?.comparisonResult;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="terra-gradient-quantum bg-clip-text text-transparent">Compare Scenarios</span>
          </h1>
          <p className="text-lg text-[#00ffee]/70">AI recommendation with championship metrics</p>
        </div>
  <button onClick={() => navigate('/scenarios')} className="text-sm text-[#00ffee] hover:text-white transition-colors">
          ← Back to Scenarios
        </button>
      </div>

      {!comparison ? (
        <div className="terra-glass rounded-lg p-10 text-center text-[#00ffee]/60">
          No comparison data. Select scenarios in the Scenarios view and click Compare.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Recommendation */}
          <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30">
            <div className="text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">AI Recommendation</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold">{comparison.recommendedScenario.scenarioName}</div>
                <div className="text-sm text-[#00ffee]/60">{comparison.recommendedScenario.scenarioType}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[#00ffee]/60">AI Confidence</div>
                <div className="text-2xl font-mono">{(comparison.aiConfidence * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div className="mt-3 text-sm text-[#00ffee]/60">{comparison.recommendationReason}</div>
          </div>

          {/* Comparison Table */}
          <div className="terra-glass rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#00ffee]/20 bg-[#00ffee]/5">
                  <th className="text-left p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">Scenario</th>
                  <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">Total Revenue</th>
                  <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">Avg Growth</th>
                  <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">Avg Confidence</th>
                  <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">Years</th>
                </tr>
              </thead>
              <tbody>
                {comparison.scenarios.map((s) => (
                  <tr key={s.scenarioId} className="border-b border-[#00ffee]/10 hover:bg-[#00ffee]/5 transition-colors">
                    <td className="p-4 font-semibold">{s.scenarioName}</td>
                    <td className="p-4 text-right font-mono">${s.totalProjectedRevenue.toLocaleString()}</td>
                    <td className="p-4 text-right">{(s.averageGrowthRate * 100).toFixed(2)}%</td>
                    <td className="p-4 text-right">{(s.averageConfidence * 100).toFixed(1)}%</td>
                    <td className="p-4 text-right">{s.projectionYears}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
