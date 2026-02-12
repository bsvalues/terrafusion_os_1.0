/**
 * TerraLevy Dashboard - Main landing page
 * Government. Transcended. - Championship-level levy management interface
 * Combines BCBSLevy metrics with TerraFusion quantum optimization
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllLevyScenarios, useLevyHealth, useLevyMeasures } from '../hooks/useLevyData';
import { useDashboardStats, useTaxCodes, useTaxDistricts } from '../hooks/useTaxData';
import { Notice } from './ui/Notice';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: 'success' | 'warning' | 'error';
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  status = 'success',
  className = '',
}) => {
  const statusColors = {
    success: 'border-[#00ffaa]',
    warning: 'border-[#ffaa00]',
    error: 'border-[#ff0055]',
  };

  return (
    <div
      className={`terra-glass rounded-lg p-6 border-2 ${statusColors[status]} hover-quantum transition-all ${className}`}
    >
      <div className="text-sm uppercase tracking-wide text-[#00ffee]/70 mb-2">{title}</div>
      <div className="text-3xl font-bold terra-gradient-quantum bg-clip-text text-transparent mb-1">
        {value}
      </div>
      {subtitle && <div className="text-xs text-[#00ffee]/50">{subtitle}</div>}
    </div>
  );
};

export const LevyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: health } = useLevyHealth();
  const {
    data: measures,
    isLoading: measuresLoading,
    error: measuresError,
  } = useLevyMeasures(undefined, 10, 0);
  const {
    data: scenarios,
    isLoading: scenariosLoading,
    error: scenariosError,
  } = useAllLevyScenarios(10, 0);

  // BCBSLevy-style stats
  const { data: stats, isLoading: statsLoading } = useDashboardStats(2024);
  const { data: districts } = useTaxDistricts(2024);
  const { data: taxCodes } = useTaxCodes(2024);

  // Calculate dashboard metrics
  const activeMeasures =
    measures?.items?.filter(m => (m.status || '').toUpperCase() === 'ACTIVE').length || 0;
  const totalRevenue = measures?.items?.reduce((sum, m) => sum + (m.targetAmount || 0), 0) || 0;
  const averageConfidence = measures?.items?.length
    ? measures.items.reduce((sum, m) => sum + (m.aiConfidenceScore || 0), 0) / measures.items.length
    : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold mb-3">
          <span className="terra-gradient-quantum bg-clip-text text-transparent">TerraLevy</span>
        </h1>
        <p className="text-xl text-[#00ffee]/70">Infrastructure Intelligence, Infinite Scale</p>
        <div className="text-sm text-[#00ffee]/50 mt-2">
          Quantum Optimization: Factor 949 • Target Accuracy: 99.5%
        </div>
      </div>

      {/* System Health Status */}
      {health && (
        <div className="mb-8 terra-glass rounded-lg p-4 border border-[#00ffee]/30">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${health.status === 'healthy' ? 'bg-[#00ffaa] quantum-pulse' : health.status === 'degraded' ? 'bg-[#ffaa00]' : 'bg-[#ff0055]'}`}
            />
            <span className="text-sm uppercase tracking-wide">System Status: {health.status}</span>
            <span className="text-xs text-[#00ffee]/50 ml-auto">
              {new Date(health.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      )}
      {(measuresError || scenariosError) && (
        <div className="mb-6">
          <Notice kind="error">
            {String(
              (measuresError as any)?.message ||
                (scenariosError as any)?.message ||
                'Failed to load dashboard data.'
            )}
          </Notice>
        </div>
      )}

      {/* BCBSLevy-Style Key Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-[#00ffee]/80">Benton County Tax Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Tax Districts"
            value={stats?.taxDistrictCount || districts?.count || 0}
            subtitle="Active levying authorities"
            status="success"
          />
          <MetricCard
            title="Tax Codes"
            value={stats?.taxCodeCount || taxCodes?.count || 0}
            subtitle="Geographic rate areas"
            status="success"
          />
          <MetricCard
            title="Properties"
            value={(stats?.propertyCount || 0).toLocaleString()}
            subtitle="Assessed parcels"
            status="success"
          />
          <MetricCard
            title="Assessed Value"
            value={`$${((stats?.totalAssessedValue || 0) / 1_000_000_000).toFixed(2)}B`}
            subtitle="Total taxable value"
            status="success"
          />
          <MetricCard
            title="Annual Levy"
            value={`$${((stats?.totalLevyAmount || 0) / 1_000_000).toFixed(2)}M`}
            subtitle="Total levy amount"
            status="success"
          />
          <MetricCard
            title="Avg Rate"
            value={`$${(stats?.averageLevyRate || 0).toFixed(2)}/1000`}
            subtitle="Combined levy rate"
            status="success"
          />
        </div>
      </div>

      {/* Metrics Grid (Original) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Active Measures"
          value={activeMeasures}
          subtitle={`${measures?.count || 0} total measures`}
          status="success"
        />
        <MetricCard
          title="Total Target Revenue"
          value={`$${(totalRevenue / 1_000_000).toFixed(2)}M`}
          subtitle="Quantum-optimized"
          status="success"
        />
        <MetricCard
          title="AI Confidence"
          value={`${(averageConfidence * 100).toFixed(1)}%`}
          subtitle="Average across scenarios"
          status={averageConfidence >= 0.95 ? 'success' : 'warning'}
        />
        <MetricCard
          title="Quantum Factor"
          value="949"
          subtitle="Championship optimization"
          status="success"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-[#00ffee]">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <button
            onClick={() => navigate('/tax-calculator')}
            className="terra-glass rounded-lg p-5 border-2 border-[#00ffaa] hover:border-[#00ffee] transition-all hover:transform hover:-translate-y-1 text-left"
          >
            <div className="text-lg font-semibold mb-2 text-[#00ffaa]">Tax Calculator</div>
            <div className="text-xs text-[#00ffee]/70">
              Calculate property taxes per $1,000 assessed value
            </div>
          </button>
          <button
            onClick={() => navigate('/impact')}
            className="terra-glass rounded-lg p-5 border-2 border-[#ffaa00] hover:border-[#00ffee] transition-all hover:transform hover:-translate-y-1 text-left"
          >
            <div className="text-lg font-semibold mb-2 text-[#ffaa00]">Bill Impact</div>
            <div className="text-xs text-[#00ffee]/70">
              Compare tax bills across years or rate scenarios
            </div>
          </button>
          <button
            onClick={() => navigate('/historical')}
            className="terra-glass rounded-lg p-5 border-2 border-[#ff66aa] hover:border-[#00ffee] transition-all hover:transform hover:-translate-y-1 text-left"
          >
            <div className="text-lg font-semibold mb-2 text-[#ff66aa]">Historical Analysis</div>
            <div className="text-xs text-[#00ffee]/70">AI-enhanced rate forecasting and trends</div>
          </button>
          <button
            onClick={() => navigate('/calculate')}
            className="terra-glass rounded-lg p-5 border-2 border-[#0099ff] hover:border-[#00ffee] transition-all hover:transform hover:-translate-y-1 text-left"
          >
            <div className="text-lg font-semibold mb-2">Optimal Rate</div>
            <div className="text-xs text-[#00ffee]/70">AI-powered levy rate optimization</div>
          </button>
          <button
            onClick={() => navigate('/scenarios')}
            className="terra-glass rounded-lg p-5 border-2 border-[#0099ff] hover:border-[#00ffee] transition-all hover:transform hover:-translate-y-1 text-left"
          >
            <div className="text-lg font-semibold mb-2">Scenarios</div>
            <div className="text-xs text-[#00ffee]/70">Compare multiple levy scenarios</div>
          </button>
          <button
            onClick={() => navigate('/projections')}
            className="terra-glass rounded-lg p-5 border-2 border-[#0099ff] hover:border-[#00ffee] transition-all hover:transform hover:-translate-y-1 text-left"
          >
            <div className="text-lg font-semibold mb-2">Projections</div>
            <div className="text-xs text-[#00ffee]/70">Multi-year revenue forecasting</div>
          </button>
        </div>
      </div>

      {/* Recent Measures */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#00ffee]">Recent Measures</h2>
          <button
            onClick={() => navigate('/measures')}
            className="text-sm text-[#00ffee] hover:text-white transition-colors"
          >
            View All →
          </button>
        </div>

        {measuresLoading ? (
          <div className="terra-glass rounded-lg p-8 text-center">
            <div className="quantum-pulse inline-block">Loading measures...</div>
          </div>
        ) : measures?.items && measures.items.length > 0 ? (
          <div className="terra-glass rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#00ffee]/20">
                  <th className="text-left p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">
                    Measure
                  </th>
                  <th className="text-left p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">
                    Levy Year
                  </th>
                  <th className="text-left p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">
                    Type
                  </th>
                  <th className="text-left p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">
                    Status
                  </th>
                  <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">
                    Target Revenue
                  </th>
                  <th className="text-right p-4 text-sm uppercase tracking-wide text-[#00ffee]/70">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {measures.items.slice(0, 5).map(measure => (
                  <tr
                    key={measure.id}
                    className="border-b border-[#00ffee]/10 hover:bg-[#00ffee]/5 transition-colors"
                  >
                    <td className="p-4 font-medium">{measure.name}</td>
                    <td className="p-4 text-[#00ffee]/70">{measure.levyYear}</td>
                    <td className="p-4 text-[#00ffee]/70">{measure.levyType}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs uppercase ${
                          measure.status === 'Active'
                            ? 'bg-[#00ffaa]/20 text-[#00ffaa]'
                            : 'bg-[#00ffee]/20 text-[#00ffee]'
                        }`}
                      >
                        {measure.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono">
                      ${measure.targetAmount?.toLocaleString() || '0'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/measures/${measure.id}`)}
                        className="text-sm text-[#00ffee] hover:text-white transition-colors"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="terra-glass rounded-lg p-8 text-center text-[#00ffee]/50">
            No measures found. Create your first levy measure to get started.
          </div>
        )}
      </div>

      {/* Recent Scenarios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#00ffee]">Recent Scenarios</h2>
          <button
            onClick={() => navigate('/levy/scenarios')}
            className="text-sm text-[#00ffee] hover:text-white transition-colors"
          >
            View All →
          </button>
        </div>

        {scenariosLoading ? (
          <div className="terra-glass rounded-lg p-8 text-center">
            <div className="quantum-pulse inline-block">Loading scenarios...</div>
          </div>
        ) : scenarios?.items && scenarios.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.items.slice(0, 3).map(scenario => (
              <div
                key={scenario.id}
                className="terra-glass rounded-lg p-6 border border-[#00ffee]/20 hover:border-[#00ffee]/50 transition-all hover:transform hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate(`/levy/scenarios`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-lg font-semibold">{scenario.name}</div>
                  <span
                    className={`text-xs px-2 py-1 rounded uppercase ${scenario.isActive ? 'bg-[#00ffaa]/20 text-[#00ffaa]' : 'bg-[#00ffee]/20 text-[#00ffee]'}`}
                  >
                    {scenario.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div className="text-sm text-[#00ffee]/70 mb-4">{scenario.scenarioType}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#00ffee]/50">AI Confidence</span>
                  <span className="font-mono text-[#00ffee]">
                    {((scenario.confidenceScore || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="terra-glass rounded-lg p-8 text-center text-[#00ffee]/50">
            No scenarios found. Analyze levy scenarios to see AI-powered insights.
          </div>
        )}
      </div>
    </div>
  );
};
