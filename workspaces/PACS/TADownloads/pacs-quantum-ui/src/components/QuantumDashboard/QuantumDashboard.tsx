/**
 * Quantum Analytics Dashboard
 * Elite Power User - Immersive Analytics Experience
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import type { LiveMetrics } from '../../types/pacs';
import { MetricCard } from './MetricCard';
import { StatisticalBreakdown } from './StatisticalBreakdown';
import CorrelationMatrix from './CorrelationMatrix';
import { LiveChart } from './LiveChart';
import { useSignalR } from '../../hooks/useSignalR';
import { DashboardSkeleton } from '../LoadingSkeleton/LoadingSkeleton';

interface QuantumDashboardProps {
  refreshInterval?: number;
  realTimeEnabled?: boolean;
}

export const QuantumDashboard: React.FC<QuantumDashboardProps> = ({
  refreshInterval = 5000,
  realTimeEnabled = true,
}) => {
  const theme = useTheme();
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Real-time SignalR connection
  const { connection, isConnected } = useSignalR('/signalr/metrics', {
    autoStart: realTimeEnabled,
  });

  // Fetch live metrics
  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, this would call an actual API
      // For now, simulate with mock data
      const mockMetrics: LiveMetrics = {
        timestamp: new Date(),
        metrics: {
          totalAccounts: 12543,
          totalProperties: 9821,
          totalPayments: 4567890.12,
          activeWorkflows: 23,
        },
        trends: {
          totalAccounts: {
            current: 12543,
            previous: 12321,
            change: 222,
            changePercent: 1.8,
            direction: 'up',
            confidence: 0.95,
          },
          totalProperties: {
            current: 9821,
            previous: 9789,
            change: 32,
            changePercent: 0.33,
            direction: 'up',
            confidence: 0.92,
          },
          totalPayments: {
            current: 4567890.12,
            previous: 4532100.45,
            change: 35789.67,
            changePercent: 0.79,
            direction: 'up',
            confidence: 0.88,
          },
        },
        alerts: [],
      };

      setLiveMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up SignalR listener
  useEffect(() => {
    if (connection && realTimeEnabled && isConnected) {
      connection.on('MetricsUpdated', (metrics: LiveMetrics) => {
        setLiveMetrics(metrics);
      });

      return () => {
        connection.off('MetricsUpdated');
      };
    }
  }, [connection, realTimeEnabled, isConnected]);

  // Set up polling if real-time is disabled
  useEffect(() => {
    if (!realTimeEnabled) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled, refreshInterval, fetchMetrics]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleMetricClick = (metricId: string) => {
    setExpandedMetric(expandedMetric === metricId ? null : metricId);
  };

  const handleRefresh = () => {
    fetchMetrics();
  };

  if (!liveMetrics && isLoading) {
    return <DashboardSkeleton />;
  }

  if (!liveMetrics) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Failed to load dashboard metrics
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Quantum Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {liveMetrics.timestamp.toLocaleTimeString()} •{' '}
            {isConnected ? (
              <Chip label="Real-time" color="success" size="small" />
            ) : (
              <Chip label="Polling" color="default" size="small" />
            )}
          </Typography>
        </Box>
        <Box>
          <IconButton onClick={handleRefresh} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
          <IconButton>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Live Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {Object.entries(liveMetrics.metrics).map(([key, value]) => {
          const trend = liveMetrics.trends[key];
          // trend is used in MetricCard component below

          return (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <MetricCard
                title={key.replace(/([A-Z])/g, ' $1').trim()}
                value={value}
                trend={trend}
                onClick={() => handleMetricClick(key)}
                isExpanded={expandedMetric === key}
              />
            </Grid>
          );
        })}
      </Grid>

      {/* Expanded Statistical Breakdown */}
      {expandedMetric && liveMetrics.metrics[expandedMetric] && (
        <Box sx={{ mb: 3 }}>
          <StatisticalBreakdown
            metricId={expandedMetric}
            metricValue={liveMetrics.metrics[expandedMetric]}
            onClose={() => setExpandedMetric(null)}
          />
        </Box>
      )}

      {/* Live Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Real-time Trends
            </Typography>
            <LiveChart metrics={liveMetrics} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Correlation Matrix
            </Typography>
            <CorrelationMatrix metrics={liveMetrics} />
          </Paper>
        </Grid>
      </Grid>

      {/* Alerts */}
      {liveMetrics.alerts.length > 0 && (
        <Paper sx={{ p: 2, backgroundColor: theme.palette.warning.light }}>
          <Typography variant="h6" gutterBottom>
            Alerts
          </Typography>
          {liveMetrics.alerts.map((alert) => (
            <Chip
              key={alert.id}
              label={alert.message}
              color={alert.type === 'error' ? 'error' : alert.type === 'warning' ? 'warning' : 'info'}
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Paper>
      )}
    </Box>
  );
};
