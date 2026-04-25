/**
 * TerraFusion government AI status.
 * Displays only backend-provided evidence.
 */
import React from 'react';
import { terraFusionAPI, type GovernmentMetrics, type APIResponse } from '../../services/TerraFusionEliteAPI';
import { DemoDataBanner } from '@/components/governance/DemoDataBanner';

interface GovernmentAIStatusProps {
  className?: string;
}

export const GovernmentAIStatus: React.FC<GovernmentAIStatusProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = React.useState<GovernmentMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [dataSource, setDataSource] = React.useState<APIResponse['source'] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadGovernmentMetrics = React.useCallback(async () => {
    try {
      const response = await terraFusionAPI.getGovernmentMetrics();
      if (response.success) {
        setMetrics(response.data ?? null);
        setDataSource(response.source);
        setError(null);
      } else {
        setMetrics(null);
        setDataSource(response.source);
        setError(response.error ?? 'Government AI metrics are unavailable.');
      }
    } catch (error) {
      setMetrics(null);
      setDataSource('QUANTUM_SIMULATION');
      setError(error instanceof Error ? error.message : 'Government AI metrics are unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadGovernmentMetrics();
    const interval = setInterval(loadGovernmentMetrics, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [loadGovernmentMetrics]);

  if (loading || !metrics) {
    return (
      <div
        className={`bg-gradient-to-br from-blue-900/30 to-cyan-900/20 backdrop-blur-lg
                       border border-cyan-500/30 rounded-xl p-6 shadow-xl ${className}`}
      >
        <div className='flex items-center space-x-3'>
          <div className='animate-spin text-2xl'>🌀</div>
          <div>
            <div className='text-cyan-400 font-bold'>Government AI status loading</div>
            <div className='text-slate-400 text-sm'>Requesting backend evidence...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div
        className={`bg-gradient-to-br from-blue-900/30 to-cyan-900/20 backdrop-blur-lg
                       border border-yellow-500/30 rounded-xl p-6 shadow-xl ${className}`}
      >
        <div className='text-yellow-400 font-bold'>Government AI evidence unavailable</div>
        <div className='text-slate-400 text-sm mt-2'>
          {error ?? 'No backend metrics returned.'}
        </div>
        <div className='text-slate-500 text-xs mt-3'>Source: {dataSource ?? 'QUANTUM_SIMULATION'}</div>
      </div>
    );
  }

  const getStatusColor = (value: number, threshold: number) => {
    return value >= threshold
      ? 'text-green-400'
      : value >= threshold * 0.8
        ? 'text-yellow-400'
        : 'text-red-400';
  };

  const sourceLabel =
    dataSource === 'ELITE_CACHE' ? 'Cached backend evidence'
    : dataSource === 'QUANTUM_SIMULATION' ? 'Simulated evidence — not authoritative'
    : 'Backend evidence';
  // Provenance disclosure: anything other than BACKEND is fixture-equivalent
  const isSimulated = dataSource !== 'BACKEND';

  return (
    <div
      className={`bg-gradient-to-br from-blue-900/40 to-cyan-900/30 backdrop-blur-lg
                     border border-cyan-500/30 rounded-xl p-6 shadow-xl ${className}`}
    >
      {isSimulated && <DemoDataBanner module="Government AI Status" />}
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center space-x-3'>
          <div className='text-3xl animate-pulse'>🧠</div>
          <div>
            <div className='text-cyan-400 font-bold text-lg'>Government AI Status</div>
            <div className='text-slate-400 text-sm'>{sourceLabel}</div>
          </div>
        </div>
        <div className='text-cyan-400 font-bold text-sm'>{dataSource}</div>
      </div>

      {/* Government Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {/* Property Assessment */}
        <div className='bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-cyan-300 font-semibold'>🏘️ Property Assessment</span>
            <span
              className={`font-bold ${getStatusColor(metrics.propertyAssessment.accuracy, 95)}`}
            >
              {metrics.propertyAssessment.accuracy.toFixed(1)}%
            </span>
          </div>
          <div className='text-sm text-slate-400'>
            <div>Response: {metrics.propertyAssessment.avgResponseTime.toFixed(0)}ms</div>
            <div>Completed: {metrics.propertyAssessment.completedAssessments.toLocaleString()}</div>
          </div>
        </div>

        {/* Citizen Services */}
        <div className='bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-cyan-300 font-semibold'>👥 Citizen Services</span>
            <span
              className={`font-bold ${getStatusColor(metrics.citizenServices.satisfactionScore, 90)}`}
            >
              {metrics.citizenServices.satisfactionScore.toFixed(1)}%
            </span>
          </div>
          <div className='text-sm text-slate-400'>
            <div>Wait Time: {metrics.citizenServices.avgWaitTime.toFixed(0)}min</div>
            <div>Completed: {metrics.citizenServices.servicesCompleted.toLocaleString()}</div>
          </div>
        </div>

        {/* Budget Analysis */}
        <div className='bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-cyan-300 font-semibold'>💰 Budget Analysis</span>
            <span
              className={`font-bold ${getStatusColor(metrics.budgetAnalysis.efficiencyScore, 90)}`}
            >
              {metrics.budgetAnalysis.efficiencyScore.toFixed(1)}%
            </span>
          </div>
          <div className='text-sm text-slate-400'>
            <div>Savings: ${(metrics.budgetAnalysis.costSavings / 1000000).toFixed(1)}M</div>
            <div>Compliance: {metrics.budgetAnalysis.budgetCompliance.toFixed(1)}%</div>
          </div>
        </div>

        {/* Compliance Reporting */}
        <div className='bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-cyan-300 font-semibold'>📋 Compliance</span>
            <span
              className={`font-bold ${getStatusColor(metrics.complianceReporting.complianceScore, 95)}`}
            >
              {metrics.complianceReporting.complianceScore.toFixed(1)}%
            </span>
          </div>
          <div className='text-sm text-slate-400'>
            <div>Reports: {metrics.complianceReporting.reportsGenerated}</div>
            <div>Audit Ready: {metrics.complianceReporting.auditReadiness.toFixed(1)}%</div>
          </div>
        </div>

        {/* Emergency Response */}
        <div className='bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-cyan-300 font-semibold'>🚨 Emergency Response</span>
            <span
              className={`font-bold ${getStatusColor(metrics.emergencyResponse.systemReadiness, 95)}`}
            >
              {metrics.emergencyResponse.systemReadiness.toFixed(1)}%
            </span>
          </div>
          <div className='text-sm text-slate-400'>
            <div>Response: {Math.floor(metrics.emergencyResponse.responseTime / 60)}min</div>
            <div>Incidents: {metrics.emergencyResponse.incidentsHandled}</div>
          </div>
        </div>

        {/* AI Evidence Status */}
        <div className='bg-gradient-to-br from-cyan-900/40 to-blue-900/40 rounded-lg p-4 border border-cyan-400/40'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-cyan-200 font-semibold'>AI Governance</span>
            <span className='font-bold text-cyan-300'>{dataSource}</span>
          </div>
          <div className='text-sm text-cyan-400'>
            <div>Agent telemetry is not inferred.</div>
            <div>Only backend-returned metrics are displayed.</div>
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <div className='mt-4 pt-4 border-t border-cyan-500/20 text-center'>
        <div className='text-xs text-slate-400'>
          Evidence source: {sourceLabel}. No AI capability claims are shown without backend data.
        </div>
      </div>
    </div>
  );
};
