/**
 * Bill Impact Calculator
 * Compare tax bill impacts across different years or custom rate scenarios
 * Based on BCBSLevy bill_impact_calculator functionality
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notice } from './ui/Notice';

interface ImpactResult {
  taxCode: string;
  propertyValue: number;
  baseYear: string;
  comparisonYear: string;
  baseRate: number;
  comparisonRate: number;
  baseAmount: number;
  comparisonAmount: number;
  difference: number;
  percentChange: number;
}

export const BillImpactCalculator: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [selectedTaxCode, setSelectedTaxCode] = useState<string>('');
  const [propertyValue, setPropertyValue] = useState<string>('300000');
  const [baseYear, setBaseYear] = useState<string>('2023');
  const [comparisonYear, setComparisonYear] = useState<string>('2024');
  const [calculationType, setCalculationType] = useState<'historical' | 'custom'>('historical');
  const [customRate, setCustomRate] = useState<string>('');

  // Result state
  const [result, setResult] = useState<ImpactResult | null>(null);
  const [error, setError] = useState<string>('');

  // Mock tax codes for demonstration
  const mockTaxCodes = [
    { id: '1', taxCode: 'TC-001', description: 'Benton County General' },
    { id: '2', taxCode: 'TC-002', description: 'Richland School District #400' },
    { id: '3', taxCode: 'TC-003', description: 'Kennewick School District #17' },
    { id: '4', taxCode: 'TC-004', description: 'West Richland Fire District' },
    { id: '5', taxCode: 'TC-005', description: 'Benton County Roads' },
    { id: '6', taxCode: 'TC-006', description: 'Port of Benton' },
  ];

  // Mock historical rates
  const mockRates: Record<string, Record<string, number>> = {
    'TC-001': { '2020': 5.25, '2021': 5.35, '2022': 5.42, '2023': 5.55, '2024': 5.68 },
    'TC-002': { '2020': 8.12, '2021': 8.25, '2022': 8.38, '2023': 8.52, '2024': 8.67 },
    'TC-003': { '2020': 7.85, '2021': 7.98, '2022': 8.1, '2023': 8.22, '2024': 8.35 },
    'TC-004': { '2020': 1.25, '2021': 1.28, '2022': 1.3, '2023': 1.32, '2024': 1.35 },
    'TC-005': { '2020': 2.15, '2021': 2.18, '2022': 2.22, '2023': 2.25, '2024': 2.28 },
    'TC-006': { '2020': 0.45, '2021': 0.46, '2022': 0.47, '2023': 0.48, '2024': 0.49 },
  };

  const availableYears = ['2020', '2021', '2022', '2023', '2024', '2025'];

  const calculateImpact = () => {
    setError('');
    setResult(null);

    if (!selectedTaxCode) {
      setError('Please select a tax code');
      return;
    }

    const propVal = parseFloat(propertyValue);
    if (isNaN(propVal) || propVal <= 0) {
      setError('Please enter a valid property value');
      return;
    }

    let baseRate: number;
    let compRate: number;
    let baseYearLabel = baseYear;
    let compYearLabel = comparisonYear;

    if (calculationType === 'historical') {
      const taxCodeRates = mockRates[selectedTaxCode];
      if (!taxCodeRates) {
        setError('No rate data found for selected tax code');
        return;
      }

      baseRate = taxCodeRates[baseYear];
      compRate = taxCodeRates[comparisonYear];

      if (baseRate === undefined) {
        setError(`No rate found for ${baseYear}`);
        return;
      }
      if (compRate === undefined) {
        setError(`No rate found for ${comparisonYear}`);
        return;
      }
    } else {
      // Custom rate comparison
      const taxCodeRates = mockRates[selectedTaxCode];
      baseRate = taxCodeRates?.['2024'] || 5.0;
      baseYearLabel = 'Current (2024)';
      compYearLabel = 'Custom';

      compRate = parseFloat(customRate);
      if (isNaN(compRate) || compRate <= 0) {
        setError('Please enter a valid custom rate');
        return;
      }
    }

    // Calculate tax amounts: (property_value / 1000) * levy_rate
    const baseAmount = (propVal / 1000) * baseRate;
    const compAmount = (propVal / 1000) * compRate;
    const difference = compAmount - baseAmount;
    const percentChange = baseAmount > 0 ? (difference / baseAmount) * 100 : 0;

    setResult({
      taxCode: selectedTaxCode,
      propertyValue: propVal,
      baseYear: baseYearLabel,
      comparisonYear: compYearLabel,
      baseRate,
      comparisonRate: compRate,
      baseAmount: Math.round(baseAmount * 100) / 100,
      comparisonAmount: Math.round(compAmount * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      percentChange: Math.round(percentChange * 100) / 100,
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="terra-gradient-quantum bg-clip-text text-transparent">
              Bill Impact Calculator
            </span>
          </h1>
          <p className="text-lg text-[#00ffee]/70">
            Compare property tax impact across years or custom scenarios
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-[#00ffee] hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Calculator Form */}
      <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-[#00ffee]">Calculate Tax Bill Impact</h2>

        {error && (
          <div className="mb-4">
            <Notice kind="warning">{error}</Notice>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
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
                  {tc.taxCode} - {tc.description}
                </option>
              ))}
            </select>
          </div>

          {/* Property Value */}
          <div>
            <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">
              Property Assessed Value ($)
            </label>
            <input
              type="number"
              value={propertyValue}
              onChange={e => setPropertyValue(e.target.value)}
              placeholder="300000"
              className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-3 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
            />
          </div>

          {/* Calculation Type */}
          <div>
            <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">
              Comparison Type
            </label>
            <select
              value={calculationType}
              onChange={e => setCalculationType(e.target.value as 'historical' | 'custom')}
              className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-3 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
            >
              <option value="historical">Historical Year Comparison</option>
              <option value="custom">Custom Rate Scenario</option>
            </select>
          </div>
        </div>

        {calculationType === 'historical' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">
                Base Year
              </label>
              <select
                value={baseYear}
                onChange={e => setBaseYear(e.target.value)}
                className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-3 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">
                Comparison Year
              </label>
              <select
                value={comparisonYear}
                onChange={e => setComparisonYear(e.target.value)}
                className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-3 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">
                Custom Comparison Rate (per $1,000)
              </label>
              <input
                type="number"
                step="0.01"
                value={customRate}
                onChange={e => setCustomRate(e.target.value)}
                placeholder="e.g., 6.25"
                className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-3 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
              />
            </div>
          </div>
        )}

        <button
          onClick={calculateImpact}
          className="w-full md:w-auto bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-[#0A0E1A] font-bold uppercase rounded px-8 py-3 hover:shadow-lg hover:shadow-[#00ffee]/30 hover:transform hover:-translate-y-1 transition-all"
        >
          Calculate Impact
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/50 mb-6">
          <h2 className="text-xl font-semibold mb-6 text-[#00ffee]">Impact Analysis Results</h2>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#1E293B]/50 rounded-lg p-4 border border-[#00ffee]/20">
              <div className="text-sm text-[#00ffee]/60 mb-1">Property Value</div>
              <div className="text-2xl font-bold font-mono text-white">
                ${result.propertyValue.toLocaleString()}
              </div>
            </div>
            <div className="bg-[#1E293B]/50 rounded-lg p-4 border border-[#00ffee]/20">
              <div className="text-sm text-[#00ffee]/60 mb-1">Tax Code</div>
              <div className="text-2xl font-bold text-white">{result.taxCode}</div>
            </div>
            <div
              className={`bg-[#1E293B]/50 rounded-lg p-4 border ${result.difference >= 0 ? 'border-[#ff5555]/50' : 'border-[#00ffaa]/50'}`}
            >
              <div className="text-sm text-[#00ffee]/60 mb-1">Annual Difference</div>
              <div
                className={`text-2xl font-bold font-mono ${result.difference >= 0 ? 'text-[#ff5555]' : 'text-[#00ffaa]'}`}
              >
                {result.difference >= 0 ? '+' : ''}
                {result.difference.toLocaleString()}
              </div>
              <div
                className={`text-sm ${result.percentChange >= 0 ? 'text-[#ff5555]' : 'text-[#00ffaa]'}`}
              >
                ({result.percentChange >= 0 ? '+' : ''}
                {result.percentChange.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Detailed Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#00ffee]/20">
                  <th className="text-left p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">
                    Metric
                  </th>
                  <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">
                    {result.baseYear}
                  </th>
                  <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">
                    {result.comparisonYear}
                  </th>
                  <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#00ffee]/10">
                  <td className="p-4 font-medium">Levy Rate (per $1,000)</td>
                  <td className="p-4 text-right font-mono">${result.baseRate.toFixed(4)}</td>
                  <td className="p-4 text-right font-mono">${result.comparisonRate.toFixed(4)}</td>
                  <td
                    className={`p-4 text-right font-mono ${result.comparisonRate - result.baseRate >= 0 ? 'text-[#ff5555]' : 'text-[#00ffaa]'}`}
                  >
                    {result.comparisonRate - result.baseRate >= 0 ? '+' : ''}
                    {(result.comparisonRate - result.baseRate).toFixed(4)}
                  </td>
                </tr>
                <tr className="border-b border-[#00ffee]/10">
                  <td className="p-4 font-medium">Annual Tax Amount</td>
                  <td className="p-4 text-right font-mono">
                    ${result.baseAmount.toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-mono">
                    ${result.comparisonAmount.toLocaleString()}
                  </td>
                  <td
                    className={`p-4 text-right font-mono ${result.difference >= 0 ? 'text-[#ff5555]' : 'text-[#00ffaa]'}`}
                  >
                    {result.difference >= 0 ? '+' : ''}${result.difference.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-[#00ffee]/10">
                  <td className="p-4 font-medium">Monthly Impact</td>
                  <td className="p-4 text-right font-mono">
                    ${(result.baseAmount / 12).toFixed(2)}
                  </td>
                  <td className="p-4 text-right font-mono">
                    ${(result.comparisonAmount / 12).toFixed(2)}
                  </td>
                  <td
                    className={`p-4 text-right font-mono ${result.difference >= 0 ? 'text-[#ff5555]' : 'text-[#00ffaa]'}`}
                  >
                    {result.difference >= 0 ? '+' : ''}${(result.difference / 12).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculation Formula */}
          <div className="mt-6 p-4 bg-[#1E293B]/30 rounded-lg border border-[#00ffee]/10">
            <div className="text-sm text-[#00ffee]/60 mb-2">Calculation Formula</div>
            <div className="font-mono text-sm text-[#00ffee]/80">
              Tax Amount = (Assessed Value ÷ 1,000) × Levy Rate
            </div>
            <div className="font-mono text-sm mt-2 text-[#00ffee]/60">
              ${result.propertyValue.toLocaleString()} ÷ 1,000 × ${result.comparisonRate.toFixed(4)}{' '}
              = ${result.comparisonAmount.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Information */}
      <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/20">
        <h3 className="text-lg font-semibold mb-3 text-[#00ffee]">About Bill Impact Calculator</h3>
        <p className="text-[#00ffee]/70 text-sm leading-relaxed">
          This calculator estimates the effect of levy rate changes on property taxes. In Washington
          State, property tax is calculated per $1,000 of assessed value. Use this tool to compare
          taxes between years or model custom rate scenarios to understand potential budget impacts.
        </p>
      </div>
    </div>
  );
};
