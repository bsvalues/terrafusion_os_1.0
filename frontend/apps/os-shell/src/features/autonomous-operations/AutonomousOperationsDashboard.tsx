import React, { useEffect, useState } from 'react';
import {
  AutonomousOperationReport,
  AutonomousOperationsService,
  AutonomousSystemStatus,
} from '../../services/AutonomousOperationsService';

export const AutonomousOperationsDashboard: React.FC = () => {
  const [status, setStatus] = useState<AutonomousSystemStatus | null>(null);
  const [lastReport, setLastReport] = useState<AutonomousOperationReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    const data = await AutonomousOperationsService.getStatus();
    setStatus(data);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleTriggerHealing = async () => {
    setLoading(true);
    try {
      const report = await AutonomousOperationsService.triggerHealingCycle();
      setLastReport(report);
      await fetchStatus(); // Refresh status after healing
    } catch (error) {
      console.error('Healing failed', error);
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return <div className='p-4 text-white'>Loading Autonomous Systems...</div>;
  }

  return (
    <div className='p-6 bg-gray-900 text-white min-h-screen'>
      <h1 className='text-3xl font-bold mb-6 text-cyan-400'>Autonomous Operations Center</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <StatusCard
          title='System Health'
          value={`${status.systemHealthScore}%`}
          color={status.systemHealthScore > 90 ? 'text-green-400' : 'text-yellow-400'}
        />
        <StatusCard title='Operational Mode' value={status.operationalMode} color='text-blue-400' />
        <StatusCard
          title='Issues Resolved (24h)'
          value={status.issuesResolvedLast24Hours.toString()}
          color='text-purple-400'
        />
        <StatusCard
          title='Last Cycle'
          value={new Date(status.lastCycleTime).toLocaleTimeString()}
          color='text-gray-400'
        />
      </div>

      <div className='bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-semibold'>Self-Healing Engine</h2>
          <button
            onClick={handleTriggerHealing}
            disabled={loading}
            className={`px-4 py-2 rounded font-bold ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500'} transition-colors`}
          >
            {loading ? 'Healing...' : 'Trigger Manual Cycle'}
          </button>
        </div>

        {lastReport && (
          <div className='mt-4 p-4 bg-gray-900 rounded border border-gray-700'>
            <h3 className='text-lg font-medium mb-2'>Last Cycle Report</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='text-gray-400 text-sm'>Issues Detected:</p>
                <ul className='list-disc list-inside text-yellow-300'>
                  {lastReport.issuesDetected.length > 0 ? (
                    lastReport.issuesDetected.map((issue, i) => <li key={i}>{issue}</li>)
                  ) : (
                    <li>None</li>
                  )}
                </ul>
              </div>
              <div>
                <p className='text-gray-400 text-sm'>Actions Taken:</p>
                <ul className='list-disc list-inside text-green-300'>
                  {lastReport.actionsTaken.length > 0 ? (
                    lastReport.actionsTaken.map((action, i) => <li key={i}>{action}</li>)
                  ) : (
                    <li>None</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-gray-800 rounded-lg p-6 border border-gray-700'>
          <h2 className='text-xl font-semibold mb-4'>Predictive Maintenance</h2>
          <p className='text-gray-400'>AI Models are analyzing system telemetry...</p>
          {/* Placeholder for charts */}
          <div className='h-48 bg-gray-900 mt-4 rounded flex items-center justify-center text-gray-600'>
            [Prediction Chart Placeholder]
          </div>
        </div>
        <div className='bg-gray-800 rounded-lg p-6 border border-gray-700'>
          <h2 className='text-xl font-semibold mb-4'>Resource Optimization</h2>
          <p className='text-gray-400'>Auto-scaling metrics...</p>
          {/* Placeholder for charts */}
          <div className='h-48 bg-gray-900 mt-4 rounded flex items-center justify-center text-gray-600'>
            [Resource Usage Chart Placeholder]
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusCard: React.FC<{ title: string; value: string; color: string }> = ({
  title,
  value,
  color,
}) => (
  <div className='bg-gray-800 p-4 rounded-lg border border-gray-700'>
    <h3 className='text-gray-400 text-sm uppercase tracking-wider'>{title}</h3>
    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
  </div>
);
