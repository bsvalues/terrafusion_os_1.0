/**
 * SystemHealthPanel — Home-screen sidebar health summary.
 *
 * Compact card showing CPU, memory, module counts, and uptime.
 * Accepts the flat SystemHealth shape from useSystemHealth.
 *
 * NOTE: This is NOT the detailed tray panel at shell/desktop/SystemHealthPanel.
 *       That component uses the richer SystemHealthStatus interface.
 *
 * @module components/SystemHealthPanel
 */

import React from 'react';
import { Activity, Cpu, HardDrive, RefreshCw } from 'lucide-react';

interface SystemHealth {
  memory: number;
  memoryStatus: 'healthy' | 'warning' | 'error';
  cpu: number;
  cpuStatus: 'healthy' | 'warning' | 'error';
  notifications: number;
  uptime: number;
  activeModules: number;
  totalModules: number;
  lastUpdated: string;
}

export interface SystemHealthPanelProps {
  health: SystemHealth;
  loading: boolean;
  onRefresh: () => void;
}

const statusColor = (s: 'healthy' | 'warning' | 'error'): string => {
  switch (s) {
    case 'healthy':
      return 'hsl(var(--tf-accent-success))';
    case 'warning':
      return 'hsl(var(--tf-accent-warning))';
    case 'error':
      return 'hsl(var(--tf-accent-danger))';
  }
};

const formatUptime = (seconds: number): string => {
  if (seconds <= 0) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({
  health,
  loading,
  onRefresh,
}) => (
  <div style={{ fontSize: '0.75rem', display: 'grid', gap: '0.35rem' }}>
    {/* Header */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span
        style={{
          fontWeight: 600,
          color: 'hsl(var(--tf-foreground))',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}
      >
        <Activity size={12} /> System Health
      </span>
      <button
        onClick={() => onRefresh()}
        disabled={loading}
        aria-label="Refresh system health"
        style={{
          background: 'none',
          border: 'none',
          cursor: loading ? 'wait' : 'pointer',
          color: 'hsl(var(--tf-muted-foreground))',
          padding: '0.15rem',
          borderRadius: '0.2rem',
          display: 'flex',
        }}
      >
        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>

    {/* Metrics row */}
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* CPU */}
      <span
        style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
        title={`CPU: ${health.cpu}%`}
      >
        <Cpu size={11} style={{ color: statusColor(health.cpuStatus) }} />
        <span style={{ color: statusColor(health.cpuStatus) }}>{health.cpu}%</span>
      </span>

      {/* Memory */}
      <span
        style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
        title={`Memory: ${health.memory}%`}
      >
        <HardDrive size={11} style={{ color: statusColor(health.memoryStatus) }} />
        <span style={{ color: statusColor(health.memoryStatus) }}>{health.memory}%</span>
      </span>

      {/* Modules */}
      <span
        style={{ color: 'hsl(var(--tf-muted-foreground))' }}
        title={`${health.activeModules} of ${health.totalModules} modules active`}
      >
        {health.activeModules}/{health.totalModules} modules
      </span>
    </div>

    {/* Uptime */}
    <span style={{ color: 'hsl(var(--tf-muted-foreground))' }}>
      Uptime: {formatUptime(health.uptime)}
    </span>
  </div>
);
