/**
 * TerraFusion cOS 2.0 - Dashboard Overview Page
 * System metrics and status overview
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface SystemMetrics {
  ai_agents: {
    total: number;
    active: number;
    processing: number;
    efficiency: number;
  };
  data_sync: {
    records_per_second: number;
    latency_ms: number;
    active_connections: number;
    sync_health: string;
  };
  compliance: {
    fisma_score: number;
    nist_coverage: number;
    last_audit: string;
    violations: number;
  };
  vendors: {
    total: number;
    active: number;
    api_calls_today: number;
    revenue_mtd: number;
  };
}

const DashboardPage: React.FC = () => {
  // Fetch system metrics
  const { data: metrics, isLoading } = useQuery<SystemMetrics>({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      // In production, this would fetch from the API
      // For now, return mock data
      return {
        ai_agents: {
          total: 50000,
          active: 48779,
          processing: 12453,
          efficiency: 94.5
        },
        data_sync: {
          records_per_second: 125000,
          latency_ms: 47,
          active_connections: 342,
          sync_health: 'optimal'
        },
        compliance: {
          fisma_score: 98.5,
          nist_coverage: 96.2,
          last_audit: '2024-01-15',
          violations: 0
        },
        vendors: {
          total: 12,
          active: 8,
          api_calls_today: 2453000,
          revenue_mtd: 8750000
        }
      };
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const metricCards = [
    {
      title: 'AI Agents',
      icon: '🤖',
      metrics: [
        { label: 'Total Agents', value: metrics?.ai_agents.total.toLocaleString() || '-', trend: 'stable' },
        { label: 'Active Now', value: metrics?.ai_agents.active.toLocaleString() || '-', trend: 'up' },
        { label: 'Processing', value: metrics?.ai_agents.processing.toLocaleString() || '-', trend: 'up' },
        { label: 'Efficiency', value: `${metrics?.ai_agents.efficiency || 0}%`, trend: 'up' }
      ]
    },
    {
      title: 'Data Sync',
      icon: '🔄',
      metrics: [
        { label: 'Records/sec', value: metrics?.data_sync.records_per_second.toLocaleString() || '-', trend: 'up' },
        { label: 'Latency', value: `${metrics?.data_sync.latency_ms || 0}ms`, trend: 'down' },
        { label: 'Connections', value: metrics?.data_sync.active_connections || '-', trend: 'stable' },
        { label: 'Health', value: metrics?.data_sync.sync_health || '-', status: 'success' }
      ]
    },
    {
      title: 'Compliance',
      icon: '🛡️',
      metrics: [
        { label: 'FISMA Score', value: `${metrics?.compliance.fisma_score || 0}%`, trend: 'up' },
        { label: 'NIST Coverage', value: `${metrics?.compliance.nist_coverage || 0}%`, trend: 'stable' },
        { label: 'Last Audit', value: metrics?.compliance.last_audit || '-', status: 'info' },
        { label: 'Violations', value: metrics?.compliance.violations || '0', status: 'success' }
      ]
    },
    {
      title: 'Vendors',
      icon: '🏢',
      metrics: [
        { label: 'Total Vendors', value: metrics?.vendors.total || '-', trend: 'up' },
        { label: 'Active Today', value: metrics?.vendors.active || '-', trend: 'stable' },
        { label: 'API Calls', value: `${(metrics?.vendors.api_calls_today / 1000000).toFixed(1)}M` || '-', trend: 'up' },
        { label: 'Revenue MTD', value: `$${(metrics?.vendors.revenue_mtd / 1000000).toFixed(1)}M` || '-', trend: 'up' }
      ]
    }
  ];

  const recentActivity = [
    { time: '2 min ago', event: 'Harris PACS sync completed', type: 'success' },
    { time: '5 min ago', event: 'AI Swarm optimization cycle', type: 'info' },
    { time: '12 min ago', event: 'Tyler integration health check', type: 'success' },
    { time: '18 min ago', event: 'Compliance scan completed', type: 'success' },
    { time: '25 min ago', event: 'New vendor API key generated', type: 'info' },
  ];

  if (isLoading) {
    return (
      <div className="tf-loading">
        <div className="tf-skeleton" style={{ height: '200px', marginBottom: '24px' }} />
        <div className="tf-skeleton" style={{ height: '400px' }} />
      </div>
    );
  }

  return (
    <div className="tf-dashboard">
      <div className="tf-page-header">
        <h1 className="tf-h1">System Overview</h1>
        <p className="tf-text-muted">Real-time metrics and system health</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="tf-dashboard-grid">
        {metricCards.map((card, index) => (
          <motion.div
            key={card.title}
            className="tf-metric-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="tf-metric-header">
              <span className="tf-metric-icon">{card.icon}</span>
              <h3 className="tf-h3">{card.title}</h3>
            </div>
            
            <div className="tf-metric-grid">
              {card.metrics.map((metric) => (
                <div key={metric.label} className="tf-metric-item">
                  <div className="tf-metric-value">
                    {metric.value}
                    {metric.trend && (
                      <span className={`tf-metric-trend ${metric.trend}`}>
                        {metric.trend === 'up' && '↑'}
                        {metric.trend === 'down' && '↓'}
                        {metric.trend === 'stable' && '→'}
                      </span>
                    )}
                  </div>
                  <div className="tf-metric-label">{metric.label}</div>
                  {metric.status && (
                    <div className={`tf-status ${metric.status} tf-mt-1`}>
                      <span className="tf-status-dot"></span>
                      {metric.status}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity Feed and Charts */}
      <div className="tf-dashboard-row">
        <motion.div
          className="tf-card tf-flex-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h3 className="tf-h3 tf-mb-4">System Performance</h3>
          <div className="tf-chart-placeholder">
            {/* In production, this would be a real chart */}
            <div className="tf-chart-demo">
              <svg viewBox="0 0 400 200" style={{ width: '100%', height: '200px' }}>
                <defs>
                  <linearGradient id="perf-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00ffee" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00ffee" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,150 Q 100,100 200,120 T 400,80"
                  fill="none"
                  stroke="#00ffee"
                  strokeWidth="2"
                />
                <path
                  d="M 0,150 Q 100,100 200,120 T 400,80 L 400,200 L 0,200 Z"
                  fill="url(#perf-gradient)"
                />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="tf-card"
          style={{ width: '400px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <h3 className="tf-h3 tf-mb-4">Recent Activity</h3>
          <div className="tf-activity-feed">
            {recentActivity.map((activity, index) => (
              <div key={index} className="tf-activity-item">
                <div className="tf-activity-time">{activity.time}</div>
                <div className="tf-activity-event">{activity.event}</div>
                <div className={`tf-badge tf-badge-${activity.type === 'success' ? 'success' : 'trust'}`}>
                  {activity.type}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Add page-specific styles */}
      <style jsx>{`
        .tf-dashboard {
          max-width: 1400px;
          margin: 0 auto;
        }

        .tf-page-header {
          margin-bottom: var(--tf-space-6);
        }

        .tf-metric-header {
          display: flex;
          align-items: center;
          gap: var(--tf-space-2);
          margin-bottom: var(--tf-space-4);
        }

        .tf-metric-icon {
          font-size: 32px;
        }

        .tf-metric-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--tf-space-3);
        }

        .tf-metric-item {
          text-align: center;
        }

        .tf-metric-trend {
          margin-left: var(--tf-space-1);
          font-size: var(--tf-small);
        }

        .tf-metric-trend.up {
          color: var(--tf-success-green);
        }

        .tf-metric-trend.down {
          color: var(--tf-alert-red);
        }

        .tf-metric-trend.stable {
          color: var(--tf-caution-amber);
        }

        .tf-dashboard-row {
          display: flex;
          gap: var(--tf-space-4);
          margin-top: var(--tf-space-6);
        }

        .tf-chart-placeholder {
          background: rgba(0, 153, 255, 0.05);
          border: 1px solid rgba(0, 153, 255, 0.2);
          border-radius: var(--tf-radius-lg);
          padding: var(--tf-space-4);
        }

        .tf-activity-feed {
          display: flex;
          flex-direction: column;
          gap: var(--tf-space-3);
        }

        .tf-activity-item {
          display: flex;
          align-items: center;
          gap: var(--tf-space-3);
          padding: var(--tf-space-2) 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .tf-activity-item:last-child {
          border-bottom: none;
        }

        .tf-activity-time {
          font-size: var(--tf-small);
          color: var(--tf-gray-500);
          min-width: 80px;
        }

        .tf-activity-event {
          flex: 1;
          font-size: var(--tf-body);
        }

        @media (max-width: 1024px) {
          .tf-dashboard-row {
            flex-direction: column;
          }

          .tf-card {
            width: 100% !important;
          }
        }

        @media (max-width: 768px) {
          .tf-metric-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
