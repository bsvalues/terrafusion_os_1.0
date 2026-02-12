/**
 * TerraLevy Scenarios List View
 * Championship-level scenario management with filtering and comparison
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLevyScenarios, useLevyMeasures, useCompareScenarios } from '../hooks/useLevyData';
import { Notice } from './ui/Notice';
import { useToast } from '../context/ToastContext';
import { emitTelemetry } from '../utils/telemetry';

export const ScenariosListView: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | undefined>(undefined);
  const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set());
  const toast = useToast();

  const { data: measures, error: measuresError } = useLevyMeasures(undefined, 100, 0);
  const { data: scenarios, isLoading, error: scenariosError, refetch } = useLevyScenarios(selectedMeasureId, 100, 0);
  const compareScenarios = useCompareScenarios();

  const handleToggleScenario = (scenarioId: string) => {
    setSelectedScenarios((prev) => {
      const next = new Set(prev);
      if (next.has(scenarioId)) {
        next.delete(scenarioId);
      } else {
        next.add(scenarioId);
      }
      return next;
    });
  };

  const handleCompareScenarios = async () => {
    if (selectedScenarios.size < 2) {
      toast.warning('Select at least 2 scenarios to compare');
      return;
    }

    const startTime = performance.now();
    const scenarioIds = Array.from(selectedScenarios);

    try {
      const result = await compareScenarios.mutateAsync({
        scenarioIds,
        projectionYears: 5, // Default 5-year projection
      });

      const duration = performance.now() - startTime;

      // Navigate to compare view with results
      navigate('/scenarios/compare', { state: { comparisonResult: result } });
      toast.success('Comparison ready');

      // Emit telemetry with performance metrics
      emitTelemetry('scenarios_compared', {
        scenarioCount: selectedScenarios.size,
        scenarioIds,
        recommendedScenarioId: result.recommendedScenario.scenarioId,
        aiConfidence: result.aiConfidence,
        duration: Math.round(duration),
      });
    } catch (error) {
      console.error('Failed to compare scenarios:', error);
      toast.error('Failed to compare scenarios');
    }
  };

  const handleClearSelection = () => {
    setSelectedScenarios(new Set());
    toast.info('Selection cleared');
  };

  // Map confidence score (0-1) to a discrete Tailwind width class to avoid inline styles
  const confidenceWidthClass = (score?: number) => {
    const pct = Math.max(0, Math.min(100, Math.round(((score ?? 0) * 100))));
    if (pct >= 88) return 'w-full';
    if (pct >= 63) return 'w-3/4';
    if (pct >= 38) return 'w-1/2';
    if (pct >= 13) return 'w-1/4';
    return 'w-0';
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="terra-gradient-quantum bg-clip-text text-transparent">Levy Scenarios</span>
            </h1>
            <p className="text-lg text-[#00ffee]/70">
              AI-powered scenario analysis with quantum optimization
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-[#00ffee] hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 terra-glass rounded-lg p-6 border border-[#00ffee]/30">
        {(measuresError || scenariosError || compareScenarios.isError) && (
          <div className="mb-4">
            <Notice kind="error">
              {String((measuresError as any)?.message || (scenariosError as any)?.message || (compareScenarios.error as any)?.message || 'An error occurred while loading data.')}
            </Notice>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Measure Filter */}
          <div>
            <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">
              Filter by Measure
            </label>
            <select
              title="Filter scenarios by levy measure"
              value={selectedMeasureId || ''}
              onChange={(e) => setSelectedMeasureId(e.target.value || undefined)}
              className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-2 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
            >
              <option value="">All Measures</option>
              {measures?.items?.map((measure) => (
                <option key={measure.id} value={measure.id}>
                  {measure.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selection Info */}
          <div className="flex items-end gap-2">
            {selectedScenarios.size > 0 && (
              <>
                <div className="flex-1 bg-[#0099ff]/20 border border-[#0099ff]/50 rounded px-4 py-2">
                  <span className="text-sm text-[#00ffee]/70">Selected: </span>
                  <span className="font-semibold text-[#00ffee]">{selectedScenarios.size} scenarios</span>
                </div>
                <button
                  onClick={handleClearSelection}
                  className="px-4 py-2 bg-[#ff0055]/20 border border-[#ff0055]/50 rounded text-sm hover:bg-[#ff0055]/30 transition-colors"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Compare Button */}
        {selectedScenarios.size >= 2 && (
          <button
            onClick={handleCompareScenarios}
            disabled={compareScenarios.isPending}
            className="w-full bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-white font-semibold uppercase rounded px-6 py-3 hover:shadow-lg hover:transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {compareScenarios.isPending ? 'Comparing with Quantum AI...' : `Compare ${selectedScenarios.size} Scenarios`}
          </button>
        )}
      </div>

      {/* Scenarios Table */}
      {isLoading ? (
        <div className="terra-glass rounded-lg p-12 text-center">
          <div className="quantum-pulse inline-block text-xl">
            Loading scenarios with quantum optimization...
          </div>
        </div>
      ) : scenarios?.items && scenarios.items.length > 0 ? (
        <div className="terra-glass rounded-lg overflow-hidden">
          <table className="w-full" aria-label="Levy scenarios table">
            <thead>
              <tr className="border-b border-[#00ffee]/20 bg-[#00ffee]/5">
                <th className="text-left p-4 w-12" aria-label="Select scenarios" scope="col">
                  <input
                    type="checkbox"
                    title="Select all scenarios"
                    checked={selectedScenarios.size === scenarios.items.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedScenarios(new Set(scenarios.items.map((s) => s.id)));
                      } else {
                        setSelectedScenarios(new Set());
                      }
                    }}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="text-left p-4 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Scenario Name</th>
                <th className="text-left p-4 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Type</th>
                <th className="text-left p-4 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Status</th>
                <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Rate</th>
                <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">Revenue</th>
                <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70" scope="col">AI Confidence</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.items.map((scenario) => (
                <tr
                  key={scenario.id}
                  tabIndex={0}
                  className={`border-b border-[#00ffee]/10 hover:bg-[#00ffee]/5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00ffee]/50 ${
                    selectedScenarios.has(scenario.id) ? 'bg-[#0099ff]/10' : ''
                  }`}
                  onClick={() => handleToggleScenario(scenario.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleScenario(scenario.id);
                    }
                  }}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      title="Select scenario"
                      checked={selectedScenarios.has(scenario.id)}
                      onChange={() => handleToggleScenario(scenario.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="p-4 font-semibold">{scenario.name}</td>
                  <td className="p-4 text-[#00ffee]/70 text-sm">
                    {scenario.scenarioType}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-3 py-1 rounded text-xs font-semibold uppercase ${
                        scenario.isActive
                          ? 'bg-[#00ffaa]/20 text-[#00ffaa] border border-[#00ffaa]/50'
                          : 'bg-[#00ffee]/20 text-[#00ffee] border border-[#00ffee]/50'
                      }`}
                    >
                      {scenario.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono">
                    ${scenario.levyRate?.toFixed(4) || '0.0000'}
                  </td>
                  <td className="p-4 text-right font-mono">
                    ${scenario.projectedRevenue?.toLocaleString() || '0'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 bg-[#00ffee]/10 rounded-full h-2">
                        <div className={`bg-gradient-to-r from-[#0099ff] to-[#00ffaa] h-2 rounded-full quantum-pulse ${confidenceWidthClass(scenario.confidenceScore)}`} />
                      </div>
                      <span className="font-mono text-sm text-[#00ffee]">
                        {((scenario.confidenceScore || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Info */}
          <div className="p-4 border-t border-[#00ffee]/20 text-center text-sm text-[#00ffee]/50">
            Showing {scenarios.items.length} of {scenarios.count} scenarios
          </div>
        </div>
      ) : (
        <div className="terra-glass rounded-lg p-12 text-center">
          <div className="text-xl text-[#00ffee]/50 mb-4">No scenarios found</div>
          <p className="text-sm text-[#00ffee]/30 mb-6">
            {selectedMeasureId
              ? 'No scenarios exist for the selected measure.'
              : 'Create your first levy scenario to see AI-powered analysis.'}
          </p>
          <button
            onClick={() => navigate('/calculate')}
            className="bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-white font-semibold uppercase rounded px-6 py-3 hover:shadow-lg hover:transform hover:-translate-y-1 transition-all"
          >
            Calculate Optimal Rate
          </button>
        </div>
      )}
    </div>
  );
};
