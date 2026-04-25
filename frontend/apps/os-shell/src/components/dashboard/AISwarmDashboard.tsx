/**
 * @deprecated Phase 8: replaced by SwarmStatusCard inside MorningBriefingStrip.
 * This legacy route is retained only as an honest guardrail while old links are
 * removed. It must not report agent counts, charts, or controls without a
 * governed telemetry source.
 */

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Dashboard as DashboardIcon,
  Memory as MemoryIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
  Stop as StopIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

type DashboardView = 'overview' | 'agents' | 'performance' | 'tasks' | 'governance';

const VIEWS: { key: DashboardView; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <DashboardIcon /> },
  { key: 'agents', label: 'Agents', icon: <MemoryIcon /> },
  { key: 'performance', label: 'Performance', icon: <SpeedIcon /> },
  { key: 'tasks', label: 'Tasks', icon: <AnalyticsIcon /> },
  { key: 'governance', label: 'Governance', icon: <SecurityIcon /> },
];

const GOVERNED_ACTION_MESSAGE =
  'This legacy dashboard cannot execute swarm actions. Use the governed Pilot workflow with correlation evidence before changing agent state.';

export const AISwarmDashboard: React.FC = () => {
  const [selectedView, setSelectedView] = useState<DashboardView>('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [operatorMessage, setOperatorMessage] = useState<string | null>(null);

  const handleGovernedAction = () => {
    setOperatorMessage(GOVERNED_ACTION_MESSAGE);
  };

  const renderUnavailablePanel = (title: string, detail: string) => (
    <Card elevation={3}>
      <CardContent>
        <Box display='flex' alignItems='center' gap={1} mb={2}>
          <WarningIcon color='warning' />
          <Typography variant='h6'>{title}</Typography>
        </Box>
        <Typography variant='body2' color='text.secondary'>
          {detail}
        </Typography>
      </CardContent>
    </Card>
  );

  const settingsDialog = (
    <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth='sm' fullWidth>
      <DialogTitle>Swarm Dashboard Settings</DialogTitle>
      <DialogContent>
        <Alert severity='warning' sx={{ mt: 2 }}>
          No live swarm telemetry source is configured for this legacy page. Refresh cadence,
          agent limits, and control actions are unavailable here.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={() => setShowSettings(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 3, backgroundColor: 'var(--gray-50)', minHeight: '100vh' }}>
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
        <Box>
          <Typography variant='h4' component='h1' fontWeight='bold'>
            AI Swarm Telemetry Guardrail
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Deprecated surface retained only to prevent false operational claims.
          </Typography>
        </Box>
        <Box display='flex' gap={2} alignItems='center'>
          <Chip icon={<WarningIcon />} label='Telemetry disconnected' color='warning' variant='outlined' />
          <Chip icon={<SecurityIcon />} label='Pilot required' color='primary' variant='outlined' />
          <Button variant='outlined' startIcon={<SettingsIcon />} onClick={() => setShowSettings(true)}>
            Settings
          </Button>
        </Box>
      </Box>

      <Alert severity='warning' sx={{ mb: 3 }}>
        This page does not have governed agent telemetry, task telemetry, or execution authority.
        It will not show generated counts, generated charts, or unverified health scores.
      </Alert>

      {operatorMessage && (
        <Alert severity='info' sx={{ mb: 3 }}>
          {operatorMessage}
        </Alert>
      )}

      <Box mb={3}>
        <Grid container spacing={1}>
          {VIEWS.map((tab) => (
            <Grid item key={tab.key}>
              <Button
                variant={selectedView === tab.key ? 'contained' : 'outlined'}
                startIcon={tab.icon}
                onClick={() => setSelectedView(tab.key)}
              >
                {tab.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          {renderUnavailablePanel(
            'Agent Inventory',
            'No governed inventory feed is connected to this legacy dashboard. Agent totals and status tables are intentionally suppressed.'
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderUnavailablePanel(
            'Performance History',
            'No signed performance time series is available here. Use the active Morning Briefing swarm card or Pilot traces for evidence.'
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderUnavailablePanel(
            'Task Outcomes',
            'No governed task outcome stream is attached to this page. Success rates and throughput remain unavailable.'
          )}
        </Grid>

        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <TimelineIcon color='primary' />
                <Typography variant='h6'>Governed Action Boundary</Typography>
              </Box>
              <Typography variant='body2' color='text.secondary' mb={2}>
                Actions from this route are blocked because they do not produce a Pilot
                correlation record. Use governed tools before changing swarm state.
              </Typography>
              <Box display='flex' flexWrap='wrap' gap={2}>
                <Button variant='outlined' startIcon={<RefreshIcon />} onClick={handleGovernedAction}>
                  Refresh Evidence
                </Button>
                <Button variant='outlined' color='warning' startIcon={<SecurityIcon />} onClick={handleGovernedAction}>
                  Request Governance Review
                </Button>
                <Button variant='outlined' color='error' startIcon={<StopIcon />} onClick={handleGovernedAction}>
                  Emergency Stop
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {settingsDialog}
    </Box>
  );
};

export default AISwarmDashboard;
