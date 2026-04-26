import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import SecurityIcon from '@mui/icons-material/Security';

const GOVERNED_AGENT_MESSAGE =
  'AI agent telemetry and controls require a governed backend stream with correlation evidence. This legacy dashboard will not generate agent state in the browser.';

const AIAgentMonitoringDashboard: React.FC = () => {
  const [operatorMessage, setOperatorMessage] = useState<string | null>(null);

  const handleGovernedAction = () => {
    setOperatorMessage(GOVERNED_AGENT_MESSAGE);
  };

  const renderEvidenceCard = (
    title: string,
    detail: string,
    icon: React.ReactNode,
  ) => (
    <Card className='tf-card'>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          {icon}
          <Typography variant='h6' className='tf-heading-3'>
            {title}
          </Typography>
        </Box>
        <Typography variant='body2' color='textSecondary'>
          {detail}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box className='tf-glass-light' sx={{ p: 3, minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant='h4' className='tf-heading-display tf-text-gradient'>
            AI Agent Monitoring Guardrail
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Legacy dashboard retained only to block unevidenced agent metrics.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip label='Telemetry disconnected' color='warning' variant='outlined' />
          <Chip label='Pilot required' color='primary' variant='outlined' />
        </Box>
      </Box>

      <Alert severity='warning' sx={{ mb: 3 }}>
        No governed agent inventory, task stream, performance history, or control channel is connected
        to this page. Agent counts, health scores, and optimization charts are intentionally suppressed.
      </Alert>

      {operatorMessage && (
        <Alert severity='info' sx={{ mb: 3 }}>
          {operatorMessage}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          {renderEvidenceCard(
            'Agent Inventory',
            'Unavailable until a signed agent registry is connected.',
            <SmartToyIcon color='primary' />,
          )}
        </Grid>
        <Grid item xs={12} md={3}>
          {renderEvidenceCard(
            'Collective Intelligence',
            'No governed scoring feed is attached to this legacy surface.',
            <PsychologyIcon color='success' />,
          )}
        </Grid>
        <Grid item xs={12} md={3}>
          {renderEvidenceCard(
            'Task Throughput',
            'No task telemetry is returned here, so throughput is not reported.',
            <SpeedIcon color='warning' />,
          )}
        </Grid>
        <Grid item xs={12} md={3}>
          {renderEvidenceCard(
            'Exception Rate',
            'No verified exception stream is connected.',
            <WarningIcon color='error' />,
          )}
        </Grid>
      </Grid>

      <Card className='tf-card'>
        <CardContent>
          <Typography variant='h6' className='tf-heading-3' sx={{ mb: 2 }}>
            Governed Action Boundary
          </Typography>
          <Typography variant='body2' color='textSecondary' sx={{ mb: 2 }}>
            Refresh, restart, optimization, and agent-control actions must route through Pilot so
            the operator receives a correlation record and traceable result.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button variant='outlined' startIcon={<RefreshIcon />} onClick={handleGovernedAction}>
              Refresh Evidence
            </Button>
            <Button variant='outlined' color='warning' startIcon={<SecurityIcon />} onClick={handleGovernedAction}>
              Request Governance Review
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AIAgentMonitoringDashboard;
