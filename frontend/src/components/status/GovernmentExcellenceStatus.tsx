/**
 * TerraFusion Government Excellence Status Dashboard
 * Real-time operational status with offline-first capabilities
 * Displays API service mode and system health metrics
 */
import React from 'react';
import { terraFusionAPI } from '../../services/TerraFusionEliteAPI';

interface GovernmentExcellenceStatusProps {
  className?: string;
}

export const GovernmentExcellenceStatus: React.FC<GovernmentExcellenceStatusProps> = ({
  className = '',
}) => {
  const [status, setStatus] = React.useState({
    operationalMode: 'QUANTUM_SIMULATION' as
      | 'BACKEND_CONNECTED'
      | 'ELITE_CACHE'
      | 'QUANTUM_SIMULATION',
    cacheSize: 0,
    backendAvailable: false,
    lastHealthCheck: '',
  });

  const updateStatus = React.useCallback(async () => {
    const cacheStatus = terraFusionAPI.getCacheStatus();
    setStatus(cacheStatus);
  }, []);

  React.useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateStatus]);

  const getStatusIcon = () => {
    switch (status.operationalMode) {
      case 'BACKEND_CONNECTED':
        return '🌐';
      case 'ELITE_CACHE':
        return '⚡';
      case 'QUANTUM_SIMULATION':
        return '🚀';
      default:
        return '🔧';
    }
  };

  const getStatusColor = () => {
    switch (status.operationalMode) {
      case 'BACKEND_CONNECTED':
        return 'text-green-400';
      case 'ELITE_CACHE':
        return 'text-yellow-400';
      case 'QUANTUM_SIMULATION':
        return 'text-cyan-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusMessage = () => {
    switch (status.operationalMode) {
      case 'BACKEND_CONNECTED':
        return 'GOVERNMENT SERVICES ONLINE';
      case 'ELITE_CACHE':
        return 'ELITE CACHE ACTIVE';
      case 'QUANTUM_SIMULATION':
        return 'QUANTUM EXCELLENCE SIMULATION';
      default:
        return 'SYSTEM INITIALIZING';
    }
  };

  return (
    <div
      className={`bg-gradient-to-br from-slate-900/50 to-blue-900/30 backdrop-blur-lg
                     border border-cyan-500/20 rounded-xl p-4 shadow-lg ${className}`}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <div className='text-2xl'>{getStatusIcon()}</div>
          <div>
            <div className={`text-sm font-bold ${getStatusColor()}`}>{getStatusMessage()}</div>
            <div className='text-xs text-slate-400'>TerraFusion Elite API Service</div>
          </div>
        </div>

        <div className='text-right'>
          <div className='text-xs text-slate-400'>Cache: {status.cacheSize} entries</div>
          <div className='text-xs text-slate-400'>
            Backend: {status.backendAvailable ? '✅' : '⭕'}
          </div>
        </div>
      </div>

      <div className='mt-3 pt-3 border-t border-cyan-500/20'>
        <div className='grid grid-cols-3 gap-2 text-xs'>
          <div className='text-center'>
            <div
              className={`font-bold ${status.operationalMode === 'BACKEND_CONNECTED' ? 'text-green-400' : 'text-slate-500'}`}
            >
              BACKEND
            </div>
            <div className='text-slate-400'>
              {status.backendAvailable ? 'Connected' : 'Offline'}
            </div>
          </div>

          <div className='text-center'>
            <div
              className={`font-bold ${status.cacheSize > 0 ? 'text-yellow-400' : 'text-slate-500'}`}
            >
              CACHE
            </div>
            <div className='text-slate-400'>{status.cacheSize} items</div>
          </div>

          <div className='text-center'>
            <div className='font-bold text-cyan-400'>QUANTUM</div>
            <div className='text-slate-400'>Simulation</div>
          </div>
        </div>
      </div>

      <div className='mt-2 text-xs text-slate-500 text-center'>
        Government. Transcended. • 100% Uptime Excellence
      </div>
    </div>
  );
};
