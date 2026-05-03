import React from 'react';
import { Alert, Box, Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import {
  CloudOff as CloudOffIcon,
  Hub as HubIcon,
  Lan as LanIcon,
  Map as MapIcon,
} from '@mui/icons-material';

const UNAVAILABLE_SECTIONS = [
  {
    title: 'County registry not connected',
    detail:
      'This module is not wired to the governed Washington county acquisition registry, so county readiness tables and adapter-family coverage are not rendered here.',
    icon: <HubIcon color='warning' />,
  },
  {
    title: 'Readiness metrics withheld',
    detail:
      'Parcel totals, budget totals, integration percentages, and source-system classifications are suppressed until the canonical county control plane is attached.',
    icon: <LanIcon color='warning' />,
  },
  {
    title: 'Migration actions blocked',
    detail:
      'County migration initiation and drilldown actions remain unavailable because this surface has no governed execution path or evidence trail.',
    icon: <MapIcon color='warning' />,
  },
];

const CountiesHub: React.FC = () => {
  return (
    <Box sx={{ p: 4 }} data-testid='counties-hub-unavailable'>
      <Typography variant='h4' gutterBottom sx={{ mb: 2 }}>
        Washington County Integration Hub
      </Typography>

      <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
        This surface is retained as a county-control-plane guardrail until the live Washington
        county registry is bound into the operator shell.
      </Typography>

      <Alert severity='warning' icon={<CloudOffIcon fontSize='inherit' />} sx={{ mb: 3 }}>
        Counties Hub does not display seeded county readiness counts, seeded parcel totals, or
        seeded migration claims. The governed county registry is not connected to this module.
      </Alert>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Chip label='Registry unavailable' color='warning' variant='outlined' />
        <Chip label='Readiness scores withheld' color='warning' variant='outlined' />
        <Chip label='Governed execution required' color='primary' variant='outlined' />
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

export default CountiesHub;
