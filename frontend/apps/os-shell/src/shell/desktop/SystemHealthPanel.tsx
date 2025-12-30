/**
 * TerraFusion OS System Health Panel
 * 
 * System tray component showing system health metrics.
 * Click to open detailed panel with CPU, Memory, Network, Storage.
 * 
 * @module shell/desktop/SystemHealthPanel
 * @see SUCCESS CRITERIA Phase 7: System Tray
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

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
  if (percentage < 50) return 'bg-[#00ffaa]';
  if (percentage < 80) return 'bg-[#ffaa00]';
  return 'bg-[#ff4444]';
};

const getStatusColor = (status: 'healthy' | 'warning' | 'critical'): string => {
  switch (status) {
    case 'healthy':
      return 'bg-[#00ffaa]';
    case 'warning':
      return 'bg-[#ffaa00]';
    case 'critical':
      return 'bg-[#ff4444]';
    default:
      return 'bg-[#888888]';
  }
};

const getStatusText = (status: 'healthy' | 'warning' | 'critical'): string => {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'warning':
      return 'Warning';
    case 'critical':
      return 'Critical';
    default:
      return 'Unknown';
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
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'h-full rounded-full transition-all duration-500',
        getUsageColor(percentage)
      )}
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
  const panelRef = useRef<HTMLDivElement>(null);

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
      data-testid="system-health-panel"
      role="dialog"
      aria-label="System Health"
      className={cn(
        'absolute bottom-full right-0 mb-2',
        'w-72 rounded-lg overflow-hidden',
        'bg-[#0a0e1a]/95 backdrop-blur-xl',
        'border border-[#00ffee]/20',
        'shadow-[0_-8px_30px_rgba(0,0,0,0.5),0_0_40px_rgba(0,255,238,0.1)]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">💚</span>
          <h3 className="text-sm font-semibold text-white">System Health</h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Metrics */}
      <div className="p-3 space-y-4">
        {/* CPU */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-white/70">CPU</span>
            <span className="text-sm font-medium text-white">{status.cpu.usage}%</span>
          </div>
          <ProgressBar percentage={status.cpu.usage} testId="cpu-progress-bar" />
          <div className="text-xs text-white/50 mt-0.5">{status.cpu.cores} cores</div>
        </div>

        {/* Memory */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-white/70">Memory</span>
            <span className="text-sm font-medium text-white">
              {status.memory.used} / {status.memory.total} GB
            </span>
          </div>
          <ProgressBar percentage={status.memory.percentage} testId="memory-progress-bar" />
        </div>

        {/* Network */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Network</span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  status.network.status === 'connected' && 'bg-[#00ffaa]',
                  status.network.status === 'limited' && 'bg-[#ffaa00]',
                  status.network.status === 'disconnected' && 'bg-[#ff4444]'
                )}
              />
              <span className="text-sm text-white capitalize">{status.network.status}</span>
              <span className="text-xs text-white/50">{status.network.latency}ms</span>
            </div>
          </div>
        </div>

        {/* Storage */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-white/70">Storage</span>
            <span className="text-sm font-medium text-white">
              {status.storage.used} / {status.storage.total} GB
            </span>
          </div>
          <ProgressBar percentage={status.storage.percentage} testId="storage-progress-bar" />
        </div>
      </div>

      {/* Footer - Uptime */}
      <div className="px-3 py-2 bg-[#00ffee]/5 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">Uptime</span>
          <span className="text-white/70">{status.uptime}</span>
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
  const [isOpen, setIsOpen] = useState(false);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <button
        data-testid="system-health-indicator"
        onClick={togglePanel}
        aria-label="System Health - Click to view details"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md',
          'hover:bg-white/10 cursor-pointer',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffee]',
          isOpen && 'bg-white/10'
        )}
      >
        <span
          data-testid="health-status-dot"
          className={cn(
            'w-2 h-2 rounded-full',
            'shadow-[0_0_6px_currentColor]',
            getStatusColor(status.overallStatus)
          )}
        />
        <span className="text-xs text-white/70">{getStatusText(status.overallStatus)}</span>
      </button>

      {/* Panel */}
      {isOpen && <SystemHealthPanel status={status} onClose={closePanel} />}
    </div>
  );
};

export default SystemHealthIndicator;
