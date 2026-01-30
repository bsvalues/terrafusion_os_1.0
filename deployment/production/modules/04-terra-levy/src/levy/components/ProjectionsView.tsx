/**
 * TerraLevy Projections View
 * Generate and visualize revenue projections for a scenario
 */

import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRevenueProjections, useGenerateProjections } from '../hooks/useLevyData';
import { ProjectionsChart, type ProjectionPoint } from './ProjectionsChart';
import { Notice } from './ui/Notice';
import { useToast } from '../context/ToastContext';
import { emitTelemetry } from '../utils/telemetry';

export const ProjectionsView: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialScenarioId = params.get('scenarioId') || '';
  const [scenarioId, setScenarioId] = useState<string>(initialScenarioId);
  const [years, setYears] = useState<number>(5);

  const { data: projectionsData, isLoading, error } = useRevenueProjections(scenarioId || undefined, 200, 0);
  const generateProjections = useGenerateProjections();
  const toast = useToast();

  const handleGenerate = async () => {
    if (!scenarioId) {
      toast.warning('Enter a scenario ID to generate projections');
      return;
    }

    const startTime = performance.now();

    try {
      await generateProjections.mutateAsync({ scenarioId, years, quantumForecasting: true });
      const duration = performance.now() - startTime;

      toast.success('Projections generated successfully');

      // Emit telemetry with performance metrics
      emitTelemetry('projections_generated', {
        scenarioId,
        years,
        quantumEnabled: true,
        duration: Math.round(duration),
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate projections');
    }
  };

  const chartPoints = useMemo<ProjectionPoint[]>(() => {
    const items = projectionsData?.items || [];
    return items
      .slice()
      .sort((a, b) => a.fiscalYear - b.fiscalYear)
      .map((p) => ({
        year: p.fiscalYear,
        net: p.projectedNetRevenue,
        levy: p.projectedLevyAmount,
      }));
  }, [projectionsData]);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="terra-gradient-quantum bg-clip-text text-transparent">Revenue Projections</span>
          </h1>
          <p className="text-lg text-[#00ffee]/70">Quantum-enhanced multi-year forecasting</p>
        </div>
  <button onClick={() => navigate('/')} className="text-sm text-[#00ffee] hover:text-white transition-colors">
          ← Back to Dashboard
        </button>
      </div>

      {/* Controls */}
      <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30 mb-6">
        {(error || generateProjections.isError) && (
          <div className="mb-4">
            <Notice kind="error">
              {String((error as any)?.message || (generateProjections.error as any)?.message || 'An error occurred while loading or generating projections.')}
            </Notice>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">Scenario ID</label>
            <input
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              placeholder="Enter scenario ID"
              title="Scenario ID"
              className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-2 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">Years</label>
            <input
              type="number"
              min={1}
              max={20}
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value || '1', 10))}
              title="Projection years"
              className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-2 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generateProjections.isPending}
              className="w-full bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-white font-semibold uppercase rounded px-6 py-3 hover:shadow-lg hover:transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generateProjections.isPending ? 'Generating…' : 'Generate Projections'}
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30">
        {isLoading ? (
          <div className="text-center">Loading projections…</div>
        ) : chartPoints.length > 0 ? (
          <div>
            <div className="text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">Projection Summary</div>
            <div className="overflow-x-auto">
              <ProjectionsChart points={chartPoints} width={900} height={320} descriptionId="projection-summary" />
            </div>
            <ul id="projection-summary" className="space-y-1 text-[#00ffee]/80 font-mono" aria-label="Projection summary list">
              {chartPoints.slice(0, 10).map((p) => (
                <li key={p.year} className="flex justify-between">
                  <span>FY {p.year}</span>
                  <span>Net ${p.net.toLocaleString()} | Levy ${p.levy.toLocaleString()}</span>
                </li>
              ))}
            </ul>
            {chartPoints.length > 10 && (
              <div className="text-xs text-[#00ffee]/50 mt-2">+{chartPoints.length - 10} more years…</div>
            )}
          </div>
        ) : (
          <div className="text-[#00ffee]/60">Enter a scenario ID and click Generate to view projections.</div>
        )}
      </div>
    </div>
  );
};
