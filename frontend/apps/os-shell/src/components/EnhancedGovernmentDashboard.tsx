import React from 'react';
import { Alert, Box, Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import {
  CloudOff as CloudOffIcon,
  Dashboard as DashboardIcon,
  Shield as ShieldIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

const UNAVAILABLE_SECTIONS = [
  {
    title: 'Operations overview unavailable',
    detail:
      'Live module totals, live agent counts, and live system posture are not displayed because this surface has no governed runtime feed.',
    icon: <DashboardIcon color='warning' />,
  },
  {
    title: 'Analytics unavailable',
    detail:
      'Predictive savings, throughput, performance percentages, and dashboard-wide analytics are withheld until a signed evidence source is attached.',
    icon: <TimelineIcon color='warning' />,
  },
  {
    title: 'Security posture unavailable',
    detail:
      'Compliance state, alert posture, and security attestation cannot be claimed from this page because no governed compliance packet is loaded.',
    icon: <ShieldIcon color='warning' />,
  },
];

const EnhancedGovernmentDashboard: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', p: 4 }} data-testid='enhanced-government-dashboard-unavailable'>
      <Typography variant='h4' gutterBottom sx={{ mb: 2 }}>
        Government Operations Dashboard Guardrail
      </Typography>

      <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
        Legacy dashboard retained only so dormant routes and component imports do not imply live
        operations telemetry or attested compliance state.
      </Typography>

      <Alert severity='warning' icon={<CloudOffIcon fontSize='inherit' />} sx={{ mb: 3 }}>
        This page does not have live module counts, live AI-agent counts, live performance
        percentages, or live compliance posture. Decorative operational claims are intentionally
        removed.
      </Alert>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Chip label='Runtime unavailable' color='warning' variant='outlined' />
        <Chip label='Analytics withheld' color='warning' variant='outlined' />
        <Chip label='Attestation required' color='primary' variant='outlined' />
      </Box>

      <Grid container spacing={3}>
        {UNAVAILABLE_SECTIONS.map((section) => (
          <Grid item xs={12} md={4} key={section.title}>
            <Card variant='outlined' sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {section.icon}
                  <Typography variant='h6'>{section.title}</Typography>
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  {section.detail}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default EnhancedGovernmentDashboard;
