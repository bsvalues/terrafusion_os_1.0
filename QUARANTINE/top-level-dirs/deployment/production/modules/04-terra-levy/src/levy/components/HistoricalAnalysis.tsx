/**
 * Historical Rate Analysis & AI Forecasting
 * Based on BCBSLevy routes_forecasting.py functionality
 * Provides trend analysis, statistical modeling, and AI-enhanced predictions
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notice } from './ui/Notice';

interface ForecastResult {
  taxCode: string;
  historicalYears: number[];
  historicalRates: number[];
  forecastYears: number[];
  forecastRates: number[];
  confidenceIntervals: Array<{ lower: number; upper: number }>;
  modelName: string;
  anomalies: number[];
  aiExplanation?: string;
  recommendations?: string[];
}

export const HistoricalAnalysis: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [selectedTaxCode, setSelectedTaxCode] = useState<string>('');
  const [yearsToForecast, setYearsToForecast] = useState<number>(3);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95);
  const [scenario, setScenario] = useState<'baseline' | 'optimistic' | 'pessimistic'>('baseline');
  const [includeAiExplanation, setIncludeAiExplanation] = useState<boolean>(true);

  // Result state
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Mock tax codes with historical data
  const mockTaxCodes = [
    { id: '1', taxCode: 'TC-001', description: 'Benton County General', historyCount: 5 },
    { id: '2', taxCode: 'TC-002', description: 'Richland School District #400', historyCount: 5 },
    { id: '3', taxCode: 'TC-003', description: 'Kennewick School District #17', historyCount: 5 },
    { id: '4', taxCode: 'TC-004', description: 'West Richland Fire District', historyCount: 5 },
    { id: '5', taxCode: 'TC-005', description: 'Benton County Roads', historyCount: 4 },
    { id: '6', taxCode: 'TC-006', description: 'Port of Benton', historyCount: 5 },
  ];

  // Mock historical data
  const mockHistoricalData: Record<string, { years: number[]; rates: number[] }> = {
    'TC-001': { years: [2020, 2021, 2022, 2023, 2024], rates: [5.25, 5.35, 5.42, 5.55, 5.68] },
    'TC-002': { years: [2020, 2021, 2022, 2023, 2024], rates: [8.12, 8.25, 8.38, 8.52, 8.67] },
    'TC-003': { years: [2020, 2021, 2022, 2023, 2024], rates: [7.85, 7.98, 8.1, 8.22, 8.35] },
    'TC-004': { years: [2020, 2021, 2022, 2023, 2024], rates: [1.25, 1.28, 1.3, 1.32, 1.35] },
    'TC-005': { years: [2021, 2022, 2023, 2024], rates: [2.18, 2.22, 2.25, 2.28] },
    'TC-006': { years: [2020, 2021, 2022, 2023, 2024], rates: [0.45, 0.46, 0.47, 0.48, 0.49] },
  };

  const generateForecast = () => {
    setError('');
    setResult(null);

    if (!selectedTaxCode) {
      setError('Please select a tax code');
      return;
    }

    const historicalData = mockHistoricalData[selectedTaxCode];
    if (!historicalData || historicalData.years.length < 3) {
      setError('Insufficient historical data. At least 3 years required.');
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const { years, rates } = historicalData;
      const lastYear = years[years.length - 1];

      // Simple linear regression for forecast
      const n = rates.length;
      const sumX = years.reduce((a, b) => a + b, 0);
      const sumY = rates.reduce((a, b) => a + b, 0);
      const sumXY = years.reduce((sum, x, i) => sum + x * rates[i], 0);
      const sumXX = years.reduce((sum, x) => sum + x * x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Scenario adjustments
      const scenarioMultiplier =
        scenario === 'optimistic' ? 0.85 : scenario === 'pessimistic' ? 1.15 : 1.0;

      // Generate forecast years and rates
      const forecastYears: number[] = [];
      const forecastRates: number[] = [];
      const confidenceIntervals: Array<{ lower: number; upper: number }> = [];

      const historicalStd = Math.sqrt(
        rates.reduce((sum, r) => sum + Math.pow(r - sumY / n, 2), 0) / n
      );
      const zScore = confidenceLevel === 0.99 ? 2.576 : confidenceLevel === 0.95 ? 1.96 : 1.645;

      for (let i = 1; i <= yearsToForecast; i++) {
        const year = lastYear + i;
        let predictedRate = (intercept + slope * year) * scenarioMultiplier;
        predictedRate = Math.max(0, predictedRate); // Ensure non-negative

        forecastYears.push(year);
        forecastRates.push(Math.round(predictedRate * 10000) / 10000);

        // Widen confidence interval for further predictions
        const margin = zScore * historicalStd * (1 + i * 0.1);
        confidenceIntervals.push({
          lower: Math.max(0, Math.round((predictedRate - margin) * 10000) / 10000),
          upper: Math.round((predictedRate + margin) * 10000) / 10000,
        });
      }

      // Detect anomalies (rates more than 2 std from mean)
      const mean = sumY / n;
      const anomalies = years.filter((_, i) => Math.abs(rates[i] - mean) > 2 * historicalStd);

      // Generate AI explanation
      const aiExplanation = includeAiExplanation
        ? `Based on analysis of ${years.length} years of historical data for tax code ${selectedTaxCode}, ` +
          `the levy rate shows a ${slope > 0 ? 'positive' : 'negative'} trend with an average annual change of ` +
          `${Math.abs(slope * 100).toFixed(2)}%. The ${scenario} scenario projection accounts for ` +
          `${scenario === 'optimistic' ? 'favorable economic conditions reducing rate pressure' : scenario === 'pessimistic' ? 'challenging fiscal conditions increasing rate pressure' : 'continuation of current trends'}. ` +
          `Statistical confidence interval is ${(confidenceLevel * 100).toFixed(0)}%.`
        : undefined;

      const recommendations = includeAiExplanation
        ? [
            `Monitor annual rate changes to stay within the projected ${confidenceLevel * 100}% confidence band`,
            slope > 0.05
              ? 'Consider implementing rate stabilization measures given accelerating growth trend'
              : 'Current rate trajectory appears sustainable',
            anomalies.length > 0
              ? `Review historical anomalies in years ${anomalies.join(', ')} for planning insights`
              : 'Historical data shows consistent patterns with no significant anomalies',
          ]
        : undefined;

      setResult({
        taxCode: selectedTaxCode,
        historicalYears: years,
        historicalRates: rates,
        forecastYears,
        forecastRates,
        confidenceIntervals,
        modelName: 'Linear Regression with Confidence Intervals',
        anomalies,
        aiExplanation,
        recommendations,
      });

      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="terra-gradient-quantum bg-clip-text text-transparent">
              Historical Analysis
            </span>
          </h1>
          <p className="text-lg text-[#00ffee]/70">
            AI-Enhanced Levy Rate Forecasting & Trend Analysis
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-[#00ffee] hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Configuration Form */}
      <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-[#00ffee]">Forecast Configuration</h2>

        {error && (
          <div className="mb-4">
            <Notice kind="warning">{error}</Notice>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Tax Code Selection */}
          <div>
            <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">
              Tax Code
            </label>
            <select
              value={selectedTaxCode}
              onChange={e => setSelectedTaxCode(e.target.value)}
              className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-3 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
            >
              <option value="">Select a tax code...</option>
              {mockTaxCodes.map(tc => (
                <option key={tc.id} value={tc.taxCode}>
                  {tc.taxCode} - {tc.description} ({tc.historyCount} years)
                </option>
              ))}
            </select>
          </div>

          {/* Years to Forecast */}
          <div>
            <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">
              Years to Forecast
            </label>
            <select
              value={yearsToForecast}
              onChange={e => setYearsToForecast(parseInt(e.target.value))}
              className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-3 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(y => (
                <option key={y} value={y}>
                  {y} year{y > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Confidence Level */}
          <div>
            <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">
              Confidence Level
            </label>
            <select
              value={confidenceLevel}
              onChange={e => setConfidenceLevel(parseFloat(e.target.value))}
              className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-3 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
            >
              <option value="0.90">90%</option>
              <option value="0.95">95%</option>
              <option value="0.99">99%</option>
            </select>
          </div>

          {/* Scenario */}
          <div>
            <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">
              Scenario
            </label>
            <select
              value={scenario}
              onChange={e =>
                setScenario(e.target.value as 'baseline' | 'optimistic' | 'pessimistic')
              }
              className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-3 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
            >
              <option value="baseline">Baseline (Current Trend)</option>
              <option value="optimistic">Optimistic (-15%)</option>
              <option value="pessimistic">Pessimistic (+15%)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAiExplanation}
              onChange={e => setIncludeAiExplanation(e.target.checked)}
              className="w-4 h-4 accent-[#00ffee]"
            />
            <span className="text-sm text-[#00ffee]/80">Include AI-Enhanced Explanation</span>
          </label>

          <button
            onClick={generateForecast}
            disabled={isLoading}
            className="bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-[#0A0E1A] font-bold uppercase rounded px-8 py-3 hover:shadow-lg hover:shadow-[#00ffee]/30 hover:transform hover:-translate-y-1 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate Forecast'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Chart Visualization */}
          <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/50 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-[#00ffee]">
              Rate Trend: {result.taxCode}
            </h2>
            <p className="text-sm text-[#00ffee]/60 mb-4">Model: {result.modelName}</p>

            {/* Simple ASCII-style chart representation */}
            <div className="bg-[#1E293B]/30 rounded-lg p-6 mb-4">
              <div className="flex items-end justify-between gap-2 h-48">
                {/* Historical bars */}
                {result.historicalYears.map((year, i) => {
                  const rate = result.historicalRates[i];
                  const maxRate = Math.max(...result.historicalRates, ...result.forecastRates);
                  const heightPercent = (rate / maxRate) * 100;
                  return (
                    <div key={year} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full bg-gradient-to-t from-[#0099ff] to-[#00ffee] rounded-t"
                        style={{ height: `${heightPercent}%` }}
                        title={`${year}: $${rate.toFixed(4)}`}
                      />
                      <div className="text-xs text-[#00ffee]/60 mt-2">{year}</div>
                      <div className="text-xs font-mono text-white">${rate.toFixed(2)}</div>
                    </div>
                  );
                })}

                {/* Forecast bars */}
                {result.forecastYears.map((year, i) => {
                  const rate = result.forecastRates[i];
                  const ci = result.confidenceIntervals[i];
                  const maxRate = Math.max(...result.historicalRates, ...result.forecastRates);
                  const heightPercent = (rate / maxRate) * 100;
                  return (
                    <div key={year} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full bg-gradient-to-t from-[#00ffaa]/60 to-[#00ffee]/60 rounded-t border-2 border-dashed border-[#00ffaa]"
                        style={{ height: `${heightPercent}%` }}
                        title={`${year}: $${rate.toFixed(4)} (${ci.lower.toFixed(4)} - ${ci.upper.toFixed(4)})`}
                      />
                      <div className="text-xs text-[#00ffaa] mt-2">{year}</div>
                      <div className="text-xs font-mono text-[#00ffaa]">${rate.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-[#0099ff] to-[#00ffee] rounded" />
                  <span className="text-xs text-[#00ffee]/60">Historical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#00ffaa]/60 border border-dashed border-[#00ffaa] rounded" />
                  <span className="text-xs text-[#00ffee]/60">Forecast</span>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#00ffee]/20">
                    <th className="text-left p-3 text-sm uppercase tracking-wide text-[#00ffee]/70">
                      Year
                    </th>
                    <th className="text-right p-3 text-sm uppercase tracking-wide text-[#00ffee]/70">
                      Rate
                    </th>
                    <th className="text-right p-3 text-sm uppercase tracking-wide text-[#00ffee]/70">
                      Lower Bound
                    </th>
                    <th className="text-right p-3 text-sm uppercase tracking-wide text-[#00ffee]/70">
                      Upper Bound
                    </th>
                    <th className="text-center p-3 text-sm uppercase tracking-wide text-[#00ffee]/70">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.historicalYears.map((year, i) => (
                    <tr key={year} className="border-b border-[#00ffee]/10">
                      <td className="p-3 font-medium">{year}</td>
                      <td className="p-3 text-right font-mono">
                        ${result.historicalRates[i].toFixed(4)}
                      </td>
                      <td className="p-3 text-right text-[#00ffee]/50">—</td>
                      <td className="p-3 text-right text-[#00ffee]/50">—</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 text-xs rounded bg-[#0099ff]/20 text-[#00ffee]">
                          Historical
                        </span>
                      </td>
                    </tr>
                  ))}
                  {result.forecastYears.map((year, i) => (
                    <tr key={year} className="border-b border-[#00ffee]/10 bg-[#00ffaa]/5">
                      <td className="p-3 font-medium text-[#00ffaa]">{year}</td>
                      <td className="p-3 text-right font-mono text-[#00ffaa]">
                        ${result.forecastRates[i].toFixed(4)}
                      </td>
                      <td className="p-3 text-right font-mono text-[#00ffee]/60">
                        ${result.confidenceIntervals[i].lower.toFixed(4)}
                      </td>
                      <td className="p-3 text-right font-mono text-[#00ffee]/60">
                        ${result.confidenceIntervals[i].upper.toFixed(4)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 text-xs rounded bg-[#00ffaa]/20 text-[#00ffaa]">
                          Forecast
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Explanation */}
          {result.aiExplanation && (
            <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-[#00ffee] flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#00ffee] quantum-pulse" />
                AI Analysis
              </h2>
              <p className="text-[#00ffee]/80 leading-relaxed">{result.aiExplanation}</p>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="terra-glass rounded-lg p-6 border border-[#00ffaa]/30">
              <h2 className="text-xl font-semibold mb-4 text-[#00ffaa]">Recommendations</h2>
              <ul className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[#00ffaa] mt-1">•</span>
                    <span className="text-[#00ffee]/80">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};
