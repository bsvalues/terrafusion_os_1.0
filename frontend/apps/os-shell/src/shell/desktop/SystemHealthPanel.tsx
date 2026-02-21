/**
 * TerraFusion OS System Health Panel
 *
 * System tray component showing system health metrics.
 * Click to open detailed panel with CPU, Memory, Network, Storage.
 *
 * @module shell/desktop/SystemHealthPanel
 * @see SUCCESS CRITERIA Phase 7: System Tray
 */

import { cn } from '@/lib/utils';
import { type TFunction } from 'i18next';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNetworkStore } from '../../stores/networkStore';

// ============================================================================
// Types
// ============================================================================

export interface SystemHealthStatus {
  cpu: { usage: number; cores: number };
  memory: { used: number; total: number; percentage: number };
  network: { status: 'connected' | 'disconnected' | 'limited'; latency: number };
  storage: { used: number; total: number; percentage: number };
  uptime: string;
  overallStatus: 'healthy' | 'warning' | 'critical';
}

export interface SystemHealthIndicatorProps {
  status: SystemHealthStatus;
  className?: string;
}

export interface SystemHealthPanelProps {
  status: SystemHealthStatus;
  onClose: () => void;
  className?: string;
}

// ============================================================================
// Default Status (for demo/fallback)
// ============================================================================

export const defaultHealthStatus: SystemHealthStatus = {
  cpu: { usage: 45, cores: 8 },
  memory: { used: 12.4, total: 32, percentage: 39 },
  network: { status: 'connected', latency: 12 },
  storage: { used: 256, total: 512, percentage: 50 },
  uptime: '14 days, 3 hours',
  overallStatus: 'healthy',
};

// ============================================================================
// Helper: Get color based on usage percentage
// ============================================================================

const getUsageColor = (percentage: number): string => {
  if (percentage < 50) return 'bg-[var(--tf-accent-success)]';
  if (percentage < 80) return 'bg-[var(--warning-amber)]';
  return 'bg-[var(--error-red)]';
};

const getStatusColor = (status: 'healthy' | 'warning' | 'critical'): string => {
  switch (status) {
    case 'healthy':
      return 'bg-[var(--tf-accent-success)]';
    case 'warning':
      return 'bg-[var(--warning-amber)]';
    case 'critical':
      return 'bg-[var(--error-red)]';
    default:
      return 'bg-[var(--gray-400)]';
  }
};

const getStatusText = (status: 'healthy' | 'warning' | 'critical', t: TFunction): string => {
  switch (status) {
    case 'healthy':
      return t('systemHealth.status.healthy');
    case 'warning':
      return t('systemHealth.status.warning');
    case 'critical':
      return t('systemHealth.status.critical');
    default:
      return t('systemHealth.status.unknown');
  }
};

// ============================================================================
// ProgressBar Component
// ============================================================================

interface ProgressBarProps {
  percentage: number;
  testId?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, testId, className }) => (
  <div className={cn('h-1.5 bg-white/10 rounded-full overflow-hidden', className)}>
    <div
      data-testid={testId || 'progress-bar'}
      role='progressbar'
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-full rounded-full transition-all duration-500', getUsageColor(percentage))}
      style={{ width: `${Math.min(100, percentage)}%` }}
    />
  </div>
);

// ============================================================================
// SystemHealthPanel Component
// ============================================================================

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({
  status,
  onClose,
  className,
}) => {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const isOnline = useNetworkStore((state) => state.isOnline);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      data-testid='system-health-panel'
      role='dialog'
      aria-label={t('systemHealth.title')}
      className={cn(
        'absolute bottom-full right-0 mb-2',
        'w-72 rounded-lg overflow-hidden',
        'bg-[var(--tf-void-black)]/95 backdrop-blur-xl',
        'border border-[var(--tf-transcend-highlight)]/20',
        'shadow-[0_-8px_30px_hsl(var(--tf-bg)/0.5),0_0_40px_hsl(var(--tf-accent)/0.1)]',
        className
      )}
    >
      {/* Header */}
      <div className='flex items-center justify-between p-3 border-b border-white/10'>
        <div className='flex items-center gap-2'>
          <span className='text-lg'>💚</span>
          <h3 className='text-sm font-semibold text-white'>{t('systemHealth.title')}</h3>
        </div>
        <button
          onClick={onClose}
          aria-label={t('systemHealth.closePanel')}
          className='w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors'
        >
          ✕
        </button>
      </div>

      {/* Metrics */}
      <div className='p-3 space-y-4'>
        {/* CPU */}
        <div>
          <div className='flex items-center justify-between mb-1'>
            <span className='text-sm text-white/70'>{t('systemHealth.cpu')}</span>
            <span className='text-sm font-medium text-white'>{status.cpu.usage}%</span>
          </div>
          <ProgressBar percentage={status.cpu.usage} testId='cpu-progress-bar' />
          <div className='text-xs text-white/50 mt-0.5'>
            {status.cpu.cores} {t('systemHealth.cores')}
          </div>
        </div>

        {/* Memory */}
        <div>
          <div className='flex items-center justify-between mb-1'>
            <span className='text-sm text-white/70'>{t('systemHealth.memory')}</span>
            <span className='text-sm font-medium text-white'>
              {status.memory.used} / {status.memory.total} GB
            </span>
          </div>
          <ProgressBar percentage={status.memory.percentage} testId='memory-progress-bar' />
        </div>

        {/* Network */}
        <div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-white/70'>{t('systemHealth.network')}</span>
            <div className='flex items-center gap-2'>
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  isOnline ? 'bg-[var(--tf-accent-success)]' : 'bg-[var(--error-red)]'
                )}
              />
              <span className='text-sm text-white capitalize'>
                {isOnline ? t('systemHealth.status.connected') : t('systemHealth.status.offline')}
              </span>
              <span className='text-xs text-white/50'>
                {isOnline ? `${status.network.latency}ms` : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Storage */}
        <div>
          <div className='flex items-center justify-between mb-1'>
            <span className='text-sm text-white/70'>{t('systemHealth.storage')}</span>
            <span className='text-sm font-medium text-white'>
              {status.storage.used} / {status.storage.total} GB
            </span>
          </div>
          <ProgressBar percentage={status.storage.percentage} testId='storage-progress-bar' />
        </div>
      </div>

      {/* Footer - Uptime */}
      <div className='px-3 py-2 bg-[var(--tf-transcend-highlight)]/5 border-t border-white/10'>
        <div className='flex items-center justify-between text-xs'>
          <span className='text-white/50'>{t('systemHealth.uptime')}</span>
          <span className='text-white/70'>{status.uptime}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SystemHealthIndicator Component
// ============================================================================

export const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({
  status,
  className,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const isOnline = useNetworkStore((state) => state.isOnline);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <button
        data-testid='system-health-indicator'
        onClick={togglePanel}
        aria-label={t('systemHealth.ariaLabel')}
        aria-expanded={isOpen}
        aria-haspopup='dialog'
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md',
          'hover:bg-white/10 cursor-pointer',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-transcend-highlight)]',
          isOpen && 'bg-white/10'
        )}
      >
        <span
          data-testid='health-status-dot'
          className={cn(
            'w-2 h-2 rounded-full',
            'shadow-[0_0_6px_currentColor]',
            getStatusColor(isOnline ? status.overallStatus : 'critical')
          )}
        />
        <span className='text-xs text-white/70'>
          {isOnline ? getStatusText(status.overallStatus, t) : t('systemHealth.status.offline')}
        </span>
      </button>

      {/* Panel */}
      {isOpen && <SystemHealthPanel status={status} onClose={closePanel} />}
    </div>
  );
};

export default SystemHealthIndicator;
