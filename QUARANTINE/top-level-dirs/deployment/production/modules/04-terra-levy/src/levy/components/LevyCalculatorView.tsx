/**
 * Levy Calculator View
 * Calculate optimal rate and check compliance
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalculateRate, useComplianceCheck } from '../hooks/useLevyData';
import { Notice } from './ui/Notice';
import { useToast } from '../context/ToastContext';
import { emitTelemetry } from '../utils/telemetry';

export const LevyCalculatorView: React.FC = () => {
  const navigate = useNavigate();
  const [measureId, setMeasureId] = useState<string>('');
  const [rateInput, setRateInput] = useState<string>('');
  const calculate = useCalculateRate();
  const rate = useMemo(() => parseFloat(rateInput || '0'), [rateInput]);
  const compliance = useComplianceCheck(measureId, rate, !!measureId && rate > 0);
  const toast = useToast();
  const lastComplianceKey = useRef<string | null>(null);

  const [result, setResult] = useState<{
    calculatedRate: number;
    levyAmount: number;
    aiOptimalRate: number;
    confidenceScore: number;
    recommendationReason: string;
  } | null>(null);

  const handleCalculate = async () => {
    if (!measureId) {
      toast.warning('Enter a measure ID to calculate');
      return;
    }

    const startTime = performance.now();

    try {
      const res = await calculate.mutateAsync({ measureId, quantumOptimization: true });
      const duration = performance.now() - startTime;

      setResult(res);
      toast.success('Calculated optimal rate');

      // Emit telemetry with performance metrics
      emitTelemetry('levy_calculated', {
        measureId,
        calculatedRate: res.calculatedRate,
        aiOptimalRate: res.aiOptimalRate,
        confidenceScore: res.confidenceScore,
        quantumEnabled: true,
        duration: Math.round(duration),
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to calculate');
    }
  };

  // Announce compliance results once per unique measureId|rate combo
  useEffect(() => {
    if (!measureId || rate <= 0 || !compliance.data) return;
    const key = `${measureId}|${rate.toFixed(4)}`;
    if (lastComplianceKey.current === key) return;
    lastComplianceKey.current = key;
    if (compliance.data.isCompliant) {
      toast.success(`Compliant at ${rate.toFixed(4)} (max ${compliance.data.maximumAllowedRate.toFixed(4)})`);
    } else {
      toast.warning(`Not compliant at ${rate.toFixed(4)} (max ${compliance.data.maximumAllowedRate.toFixed(4)})`);
    }
  }, [measureId, rate, compliance.data, toast]);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="terra-gradient-quantum bg-clip-text text-transparent">Levy Calculator</span>
          </h1>
          <p className="text-lg text-[#00ffee]/70">AI-optimized levy rate calculation</p>
        </div>
        <button onClick={() => navigate('/')} className="text-sm text-[#00ffee] hover:text-white transition-colors">
          ← Back to Dashboard
        </button>
      </div>

      <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30 mb-6">
        {(calculate.isError || compliance.error) && (
          <div className="mb-4">
            <Notice kind="error">
              {String((calculate.error as any)?.message || (compliance.error as any)?.message || 'An error occurred while calculating or checking compliance.')}
            </Notice>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">Measure ID</label>
            <input
              value={measureId}
              onChange={(e) => setMeasureId(e.target.value)}
              placeholder="Enter measure ID"
              title="Measure ID"
              className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-2 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
            />
          </div>
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
          <div className="flex items-end">
            <button
              onClick={handleCalculate}
              disabled={calculate.isPending}
              className="w-full bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-white font-semibold uppercase rounded px-6 py-3 hover:shadow-lg hover:transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calculate.isPending ? 'Calculating…' : 'Calculate Optimal Rate'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <div className="text-xs text-[#00ffee]/60">Calculated Rate</div>
              <div className="text-2xl font-mono">{result.calculatedRate.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-xs text-[#00ffee]/60">AI Optimal Rate</div>
              <div className="text-2xl font-mono">{result.aiOptimalRate.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-xs text-[#00ffee]/60">Levy Amount</div>
              <div className="text-2xl font-mono">${result.levyAmount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-[#00ffee]/60">Confidence</div>
              <div className="text-2xl font-mono">{(result.confidenceScore * 100).toFixed(1)}%</div>
            </div>
            <div className="md:col-span-1">
              <div className="text-xs text-[#00ffee]/60">Reason</div>
              <div className="text-sm">{result.recommendationReason}</div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Result */}
      {rate > 0 && compliance.data && (
        <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30">
          <div className="text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">Compliance</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        </div>
      )}
    </div>
  );
};
