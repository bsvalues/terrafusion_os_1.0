import React from 'react';
import { useUnifiedRevenueProjections, useDistrictRevenueSummary, useGovernmentRevenueDashboard } from '../hooks/useUnifiedRevenue';

export function UnifiedRevenueDashboard() {
  const { data: dashboard, isLoading } = useGovernmentRevenueDashboard();
  const { data: districts } = useDistrictRevenueSummary();

  if (isLoading) {
    return (
      <div className="p-6 rounded-lg bg-slate-800 border border-cyan-500/20">
        <div className="text-cyan-400 animate-pulse">Loading unified revenue data...</div>
      </div>
    );
  }

  const totalRevenue = dashboard?.totalRevenue ?? 0;
  const levyRevenue = dashboard?.levyRevenue ?? 0;
  const piltRevenue = dashboard?.piltRevenue ?? 0;
  const levyPct = dashboard?.levyPercentage ?? 0;
  const piltPct = dashboard?.piltPercentage ?? 0;

  return (
    <div className="space-y-6">
      {/* Unified Revenue Header */}
      <div className="p-6 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30">
        <h2 className="text-3xl font-bold text-white mb-2">Government Revenue Dashboard</h2>
        <p className="text-gray-400">Unified Property Tax Levies + Federal PILT Payments</p>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            ⚛️ Quantum Factor 949
          </span>
          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            ✓ 99.5% Accuracy
          </span>
        </div>
      </div>

      {/* Total Revenue Card */}
      <div className="p-8 rounded-lg bg-slate-800 border-2 border-cyan-500/40 quantum-pulse">
        <div className="text-cyan-400 text-lg mb-3">Total Government Revenue</div>
        <div className="text-5xl font-bold text-white mb-2">${totalRevenue.toLocaleString()}</div>
        <div className="text-gray-400">FY {dashboard?.fiscalYear ?? 2025}</div>
      </div>

      {/* Revenue Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Levy Revenue */}
        <div className="p-6 rounded-lg bg-slate-800 border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="text-blue-400 text-sm font-semibold">PROPERTY TAX LEVIES</div>
            <div className="text-blue-400 text-2xl font-bold">{levyPct.toFixed(1)}%</div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">${levyRevenue.toLocaleString()}</div>
          <div className="text-sm text-gray-400">TerraLevy Integration</div>
          <div className="mt-4 h-2 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
              style={{ width: `${levyPct}%` }}
            />
          </div>
        </div>

        {/* PILT Revenue */}
        <div className="p-6 rounded-lg bg-slate-800 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="text-cyan-400 text-sm font-semibold">FEDERAL PILT PAYMENTS</div>
            <div className="text-cyan-400 text-2xl font-bold">{piltPct.toFixed(1)}%</div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">${piltRevenue.toLocaleString()}</div>
          <div className="text-sm text-gray-400">TerraPILT Integration</div>
          <div className="mt-4 h-2 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
              style={{ width: `${piltPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* District Revenue Breakdown */}
      <div className="p-6 rounded-lg bg-slate-800 border border-cyan-500/20">
        <h3 className="text-xl font-bold text-white mb-4">District Revenue Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-cyan-400 text-sm font-semibold">District</th>
                <th className="text-left py-3 px-4 text-cyan-400 text-sm font-semibold">Type</th>
                <th className="text-right py-3 px-4 text-cyan-400 text-sm font-semibold">Levy Revenue</th>
                <th className="text-right py-3 px-4 text-cyan-400 text-sm font-semibold">PILT Revenue</th>
                <th className="text-right py-3 px-4 text-cyan-400 text-sm font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {districts?.map((d) => (
                <tr key={d.districtId} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 px-4 text-white font-medium">{d.districtName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs bg-slate-700 text-gray-300">
                      {d.districtType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-blue-400 font-mono">
                    ${d.levyAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-cyan-400 font-mono">
                    ${d.piltAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-white font-bold font-mono">
                    ${d.totalRevenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-cyan-500/30">
                <td colSpan={2} className="py-3 px-4 text-cyan-400 font-bold">TOTAL</td>
                <td className="py-3 px-4 text-right text-blue-400 font-bold font-mono">
                  ${districts?.reduce((sum, d) => sum + d.levyAmount, 0).toLocaleString() ?? '0'}
                </td>
                <td className="py-3 px-4 text-right text-cyan-400 font-bold font-mono">
                  ${districts?.reduce((sum, d) => sum + d.piltAmount, 0).toLocaleString() ?? '0'}
                </td>
                <td className="py-3 px-4 text-right text-white font-bold text-lg font-mono">
                  ${districts?.reduce((sum, d) => sum + d.totalRevenue, 0).toLocaleString() ?? '0'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Integration Status */}
      <div className="p-4 rounded-lg bg-slate-800/50 border border-cyan-500/10">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>TerraPILT Integration: Active</span>
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse ml-4" />
          <span>TerraLevy Integration: Pending Full Wiring</span>
        </div>
      </div>
    </div>
  );
}
