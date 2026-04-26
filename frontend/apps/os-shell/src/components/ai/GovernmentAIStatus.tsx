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

  if (loading) {
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
        <div className='bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-cyan-300 font-semibold'>🏘️ Property Assessment</span>
            <span className='font-bold text-green-400'>{metrics.propertyAssessment.status}</span>
          </div>
          <div className='text-sm text-slate-400'>
            <div>Parcels: {metrics.propertyAssessment.totalParcels.toLocaleString()}</div>
            <div>Source: {metrics.propertyAssessment.dataSource}</div>
            <div className='mt-2 text-slate-500'>{metrics.propertyAssessment.note}</div>
          </div>
        </div>

        <div className='bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-cyan-300 font-semibold'>🔄 TerraSync</span>
            <span
              className={`font-bold ${metrics.externalSystems.terrasync.status === 'AVAILABLE' ? 'text-green-400' : 'text-yellow-400'}`}
            >
              {metrics.externalSystems.terrasync.status}
            </span>
          </div>
          <div className='text-sm text-slate-400'>
            <div>Endpoint: {metrics.externalSystems.terrasync.endpoint}</div>
            <div className='mt-2 text-slate-500'>{metrics.externalSystems.terrasync.note}</div>
          </div>
        </div>

        <div className='bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-cyan-300 font-semibold'>🧾 Operator Posture</span>
            <span className='font-bold text-yellow-400'>{metrics.operatorPosture.governedActions}</span>
          </div>
          <div className='text-sm text-slate-400'>
            <div>AI swarm: {metrics.operatorPosture.aiSwarmStatus}</div>
            <div>Compliance: {metrics.operatorPosture.complianceStatus}</div>
          </div>
        </div>

        <div className='bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-cyan-300 font-semibold'>🏛️ County</span>
            <span className='font-bold text-cyan-300'>{metrics.county.fips}</span>
          </div>
          <div className='text-sm text-slate-400'>
            <div>{metrics.county.name}, {metrics.county.state}</div>
            <div>Total parcels: {metrics.county.totalParcels.toLocaleString()}</div>
          </div>
        </div>

        <div className='bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-cyan-300 font-semibold'>🗃️ Legacy System</span>
            <span className='font-bold text-slate-300'>{metrics.externalSystems.legacyAssessmentSystem.status}</span>
          </div>
          <div className='text-sm text-slate-400'>
            <div>System: {metrics.externalSystems.legacyAssessmentSystem.system}</div>
            <div className='mt-2 text-slate-500'>{metrics.externalSystems.legacyAssessmentSystem.note}</div>
          </div>
        </div>

        <div className='bg-gradient-to-br from-cyan-900/40 to-blue-900/40 rounded-lg p-4 border border-cyan-400/40'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-cyan-200 font-semibold'>Warnings</span>
            <span className='font-bold text-cyan-300'>{metrics.operatorPosture.warnings.length}</span>
          </div>
          <div className='text-sm text-slate-400'>
            {metrics.operatorPosture.warnings.map((warning) => (
              <div key={warning} className='mb-1'>
                {warning}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <div className='mt-4 pt-4 border-t border-cyan-500/20 text-center'>
        <div className='text-xs text-slate-400'>
          Evidence source: {sourceLabel}. This panel reports live parcel totals and explicit unavailable states instead of inferred operational claims.
        </div>
      </div>
    </div>
  );
};
