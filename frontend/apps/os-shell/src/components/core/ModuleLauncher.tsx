import React from 'react';
import { Alert, Box, Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import {
  CloudOff as CloudOffIcon,
  Launch as LaunchIcon,
  Rule as RuleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const UNAVAILABLE_PANELS = [
  {
    title: 'Module registry unavailable',
    detail:
      'This legacy launcher is not connected to a governed module registry, so it cannot list launchable applications.',
    icon: <CloudOffIcon color='warning' />,
  },
  {
    title: 'Launch actions blocked',
    detail:
      'This surface does not have a governed launch runner or Pilot evidence path. Module launches are intentionally disabled here.',
    icon: <LaunchIcon color='warning' />,
  },
  {
    title: 'Telemetry unavailable',
    detail:
      'Response times, throughput, and optimization metrics are not displayed because no signed runtime telemetry feed is attached.',
    icon: <RuleIcon color='warning' />,
  },
];

export const ModuleLauncher: React.FC = () => {
  return (
    <Box sx={{ p: 3 }} data-testid='core-module-launcher-unavailable'>
      <Typography variant='h4' gutterBottom sx={{ mb: 2 }}>
        Terrafusion Module Launcher
      </Typography>

      <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
        Legacy launcher surface retained only to prevent fake module catalog and fake launch claims.
      </Typography>

      <Alert severity='warning' icon={<WarningIcon fontSize='inherit' />} sx={{ mb: 3 }}>
        Use the governed desktop shell registry and Pilot-backed launch workflow for real module
        execution. This page is read-only and unavailable until those dependencies are attached.
      </Alert>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Chip label='Registry disconnected' color='warning' variant='outlined' />
        <Chip label='Pilot evidence required' color='primary' variant='outlined' />
        <Chip label='Launch path unavailable' color='warning' variant='outlined' />
      </Box>

      <Grid container spacing={3}>
        {UNAVAILABLE_PANELS.map((panel) => (
          <Grid item xs={12} md={4} key={panel.title}>
            <Card variant='outlined' sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {panel.icon}
                  <Typography variant='h6'>{panel.title}</Typography>
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  {panel.detail}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ModuleLauncher;
