/**
 * Property Tax Calculator
 * Calculate property taxes based on assessed value and levy rates
 * Based on BCBSLevy levy_calculator functionality
 *
 * Formula: Tax Amount = (Assessed Value ÷ 1,000) × Levy Rate
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notice } from './ui/Notice';

interface TaxCalculationResult {
  taxCode: string;
  taxCodeDescription: string;
  assessedValue: number;
  levyRate: number;
  year: number;
  taxAmount: number;
  monthlyAmount: number;
  exemptions: string[];
  effectiveRate: number;
}

interface TaxDistrict {
  name: string;
  rate: number;
  levyAmount: number;
}

export const PropertyTaxCalculator: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [selectedTaxCode, setSelectedTaxCode] = useState<string>('');
  const [assessedValue, setAssessedValue] = useState<string>('300000');
  const [year, setYear] = useState<string>('2024');
  const [applyExemptions, setApplyExemptions] = useState<boolean>(false);
  const [homesteadExemption, setHomesteadExemption] = useState<boolean>(false);
  const [seniorExemption, setSeniorExemption] = useState<boolean>(false);

  // Result state
  const [result, setResult] = useState<TaxCalculationResult | null>(null);
  const [districtBreakdown, setDistrictBreakdown] = useState<TaxDistrict[]>([]);
  const [error, setError] = useState<string>('');

  // Mock tax codes with combined rates
  const mockTaxCodes = [
    { id: '1', taxCode: 'TC-001', description: 'Benton County - Richland Area', totalRate: 12.45 },
    {
      id: '2',
      taxCode: 'TC-002',
      description: 'Benton County - Kennewick Urban',
      totalRate: 13.22,
    },
    { id: '3', taxCode: 'TC-003', description: 'Benton County - West Richland', totalRate: 11.85 },
    { id: '4', taxCode: 'TC-004', description: 'Benton County - Prosser', totalRate: 10.92 },
    { id: '5', taxCode: 'TC-005', description: 'Benton County - Rural', totalRate: 9.78 },
    { id: '6', taxCode: 'TC-006', description: 'Benton County - Industrial', totalRate: 14.35 },
  ];

  // Mock rate breakdown by district
  const mockDistrictBreakdown: Record<string, TaxDistrict[]> = {
    'TC-001': [
      { name: 'Benton County General', rate: 1.45, levyAmount: 0 },
      { name: 'Richland School District #400', rate: 5.82, levyAmount: 0 },
      { name: 'Benton County Roads', rate: 1.25, levyAmount: 0 },
      { name: 'Fire District #4', rate: 1.35, levyAmount: 0 },
      { name: 'Port of Benton', rate: 0.42, levyAmount: 0 },
      { name: 'Library District', rate: 0.48, levyAmount: 0 },
      { name: 'Hospital District #1', rate: 0.68, levyAmount: 0 },
      { name: 'EMS District', rate: 0.5, levyAmount: 0 },
      { name: 'State Schools', rate: 0.5, levyAmount: 0 },
    ],
    'TC-002': [
      { name: 'Benton County General', rate: 1.45, levyAmount: 0 },
      { name: 'Kennewick School District #17', rate: 6.12, levyAmount: 0 },
      { name: 'Benton County Roads', rate: 1.25, levyAmount: 0 },
      { name: 'City of Kennewick', rate: 1.85, levyAmount: 0 },
      { name: 'Fire District #1', rate: 1.15, levyAmount: 0 },
      { name: 'Library District', rate: 0.48, levyAmount: 0 },
      { name: 'Hospital District #1', rate: 0.42, levyAmount: 0 },
      { name: 'State Schools', rate: 0.5, levyAmount: 0 },
    ],
    'TC-003': [
      { name: 'Benton County General', rate: 1.45, levyAmount: 0 },
      { name: 'Richland School District #400', rate: 5.82, levyAmount: 0 },
      { name: 'Benton County Roads', rate: 1.25, levyAmount: 0 },
      { name: 'City of West Richland', rate: 1.25, levyAmount: 0 },
      { name: 'Fire District #4', rate: 0.98, levyAmount: 0 },
      { name: 'Library District', rate: 0.48, levyAmount: 0 },
      { name: 'State Schools', rate: 0.62, levyAmount: 0 },
    ],
  };

  // Available years
  const availableYears = ['2020', '2021', '2022', '2023', '2024', '2025'];

  const calculateTax = () => {
    setError('');
    setResult(null);
    setDistrictBreakdown([]);

    if (!selectedTaxCode) {
      setError('Please select a tax code');
      return;
    }

    const value = parseFloat(assessedValue);
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid assessed value');
      return;
    }

    const taxCodeData = mockTaxCodes.find(tc => tc.taxCode === selectedTaxCode);
    if (!taxCodeData) {
      setError('Tax code not found');
      return;
    }

    // Calculate exemptions
    let exemptionValue = 0;
    const appliedExemptions: string[] = [];

    if (applyExemptions) {
      if (homesteadExemption) {
        exemptionValue += 75000; // Washington state homestead exemption
        appliedExemptions.push('Homestead ($75,000)');
      }
      if (seniorExemption) {
        exemptionValue += 100000; // Senior citizen exemption
        appliedExemptions.push('Senior Citizen ($100,000)');
      }
    }

    const taxableValue = Math.max(0, value - exemptionValue);
    const taxAmount = (taxableValue / 1000) * taxCodeData.totalRate;
    const effectiveRate = value > 0 ? (taxAmount / value) * 1000 : 0;

    // Calculate district breakdown
    const districts = mockDistrictBreakdown[selectedTaxCode] || mockDistrictBreakdown['TC-001'];
    const breakdown = districts.map(d => ({
      ...d,
      levyAmount: Math.round((taxableValue / 1000) * d.rate * 100) / 100,
    }));

    setDistrictBreakdown(breakdown);

    setResult({
      taxCode: selectedTaxCode,
      taxCodeDescription: taxCodeData.description,
      assessedValue: value,
      levyRate: taxCodeData.totalRate,
      year: parseInt(year),
      taxAmount: Math.round(taxAmount * 100) / 100,
      monthlyAmount: Math.round((taxAmount / 12) * 100) / 100,
      exemptions: appliedExemptions,
      effectiveRate: Math.round(effectiveRate * 10000) / 10000,
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="terra-gradient-quantum bg-clip-text text-transparent">
              Property Tax Calculator
            </span>
          </h1>
          <p className="text-lg text-[#00ffee]/70">
            Calculate property taxes based on assessed value and levy rates
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
        <h2 className="text-xl font-semibold mb-4 text-[#00ffee]">Calculate Property Tax</h2>

        {error && (
          <div className="mb-4">
            <Notice kind="warning">{error}</Notice>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Tax Code Selection */}
          <div>
            <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">
              Tax Code Area
            </label>
            <select
              value={selectedTaxCode}
              onChange={e => setSelectedTaxCode(e.target.value)}
              className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-3 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
            >
              <option value="">Select a tax code...</option>
              {mockTaxCodes.map(tc => (
                <option key={tc.id} value={tc.taxCode}>
                  {tc.taxCode} - {tc.description} (${tc.totalRate.toFixed(2)}/1000)
                </option>
              ))}
            </select>
          </div>

          {/* Assessed Value */}
          <div>
            <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">
              Assessed Value ($)
            </label>
            <input
              type="number"
              value={assessedValue}
              onChange={e => setAssessedValue(e.target.value)}
              placeholder="300000"
              className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-3 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
            />
          </div>

          {/* Tax Year */}
          <div>
            <label className="block text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">
              Tax Year
            </label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full bg-[#1E293B]/50 border border-[#00ffee]/30 rounded px-4 py-3 text-white focus:outline-none focus:border-[#00ffee] transition-colors"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Exemptions */}
        <div className="mb-6 p-4 bg-[#1E293B]/30 rounded-lg border border-[#00ffee]/10">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={applyExemptions}
              onChange={e => setApplyExemptions(e.target.checked)}
              className="w-4 h-4 accent-[#00ffee]"
            />
            <span className="text-sm font-medium text-[#00ffee]">Apply Exemptions</span>
          </label>

          {applyExemptions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={homesteadExemption}
                  onChange={e => setHomesteadExemption(e.target.checked)}
                  className="w-4 h-4 accent-[#00ffee]"
                />
                <span className="text-sm text-[#00ffee]/80">Homestead Exemption ($75,000)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seniorExemption}
                  onChange={e => setSeniorExemption(e.target.checked)}
                  className="w-4 h-4 accent-[#00ffee]"
                />
                <span className="text-sm text-[#00ffee]/80">
                  Senior/Disabled Exemption ($100,000)
                </span>
              </label>
            </div>
          )}
        </div>

        <button
          onClick={calculateTax}
          className="w-full md:w-auto bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-[#0A0E1A] font-bold uppercase rounded px-8 py-3 hover:shadow-lg hover:shadow-[#00ffee]/30 hover:transform hover:-translate-y-1 transition-all"
        >
          Calculate Tax
        </button>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="terra-glass rounded-lg p-5 border-2 border-[#00ffaa]">
              <div className="text-sm text-[#00ffee]/60 mb-1">Annual Tax</div>
              <div className="text-3xl font-bold font-mono terra-gradient-quantum bg-clip-text text-transparent">
                ${result.taxAmount.toLocaleString()}
              </div>
            </div>
            <div className="terra-glass rounded-lg p-5 border border-[#00ffee]/30">
              <div className="text-sm text-[#00ffee]/60 mb-1">Monthly</div>
              <div className="text-2xl font-bold font-mono text-white">
                ${result.monthlyAmount.toLocaleString()}
              </div>
            </div>
            <div className="terra-glass rounded-lg p-5 border border-[#00ffee]/30">
              <div className="text-sm text-[#00ffee]/60 mb-1">Combined Rate</div>
              <div className="text-2xl font-bold font-mono text-white">
                ${result.levyRate.toFixed(4)}/1000
              </div>
            </div>
            <div className="terra-glass rounded-lg p-5 border border-[#00ffee]/30">
              <div className="text-sm text-[#00ffee]/60 mb-1">Effective Rate</div>
              <div className="text-2xl font-bold font-mono text-white">
                ${result.effectiveRate.toFixed(4)}/1000
              </div>
            </div>
          </div>

          {/* Exemptions Applied */}
          {result.exemptions.length > 0 && (
            <div className="terra-glass rounded-lg p-4 border border-[#00ffaa]/30 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-[#00ffaa]">✓</span>
                <span className="text-[#00ffee]/80">
                  Exemptions Applied: {result.exemptions.join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* District Breakdown */}
          <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/30 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-[#00ffee]">
              Levy Breakdown by District
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#00ffee]/20">
                    <th className="text-left p-3 text-sm uppercase tracking-wide text-[#00ffee]/70">
                      Taxing District
                    </th>
                    <th className="text-right p-3 text-sm uppercase tracking-wide text-[#00ffee]/70">
                      Rate (per $1,000)
                    </th>
                    <th className="text-right p-3 text-sm uppercase tracking-wide text-[#00ffee]/70">
                      Levy Amount
                    </th>
                    <th className="text-right p-3 text-sm uppercase tracking-wide text-[#00ffee]/70">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {districtBreakdown.map((district, i) => (
                    <tr key={i} className="border-b border-[#00ffee]/10 hover:bg-[#00ffee]/5">
                      <td className="p-3 font-medium">{district.name}</td>
                      <td className="p-3 text-right font-mono">${district.rate.toFixed(4)}</td>
                      <td className="p-3 text-right font-mono">
                        ${district.levyAmount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-[#00ffee]/60">
                        {((district.levyAmount / result.taxAmount) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#00ffee]/30 bg-[#00ffee]/5">
                    <td className="p-3 font-bold">Total</td>
                    <td className="p-3 text-right font-mono font-bold">
                      ${result.levyRate.toFixed(4)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      ${result.taxAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Calculation Details */}
          <div className="terra-glass rounded-lg p-6 border border-[#00ffee]/20">
            <h3 className="text-lg font-semibold mb-4 text-[#00ffee]">Calculation Formula</h3>
            <div className="bg-[#1E293B]/30 rounded-lg p-4 font-mono text-sm">
              <div className="text-[#00ffee]/60 mb-2">
                Tax Amount = (Assessed Value ÷ 1,000) × Levy Rate
              </div>
              <div className="text-white">
                ${result.taxAmount.toLocaleString()} = (${result.assessedValue.toLocaleString()} ÷
                1,000) × ${result.levyRate.toFixed(4)}
              </div>
            </div>
            <p className="text-sm text-[#00ffee]/60 mt-4">
              In Washington State, property taxes are calculated per $1,000 of assessed value. The
              combined levy rate represents all taxing districts that apply to your property's
              location.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
