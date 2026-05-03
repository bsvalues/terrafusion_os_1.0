import React from 'react';
import { Alert, Box, Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import {
  Assessment as AssessmentIcon,
  CloudOff as CloudOffIcon,
  Gavel as GavelIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

const UNAVAILABLE_SECTIONS = [
  {
    title: 'Assessment inventory unavailable',
    detail:
      'This legacy dashboard is not connected to a governed parcel assessment inventory, so property counts and assessment queues are intentionally withheld.',
    icon: <AssessmentIcon color='warning' />,
  },
  {
    title: 'Trend analytics unavailable',
    detail:
      'No governed valuation trend series or assessment distribution feed is attached to this surface. Charts and performance summaries are not rendered.',
    icon: <TimelineIcon color='warning' />,
  },
  {
    title: 'Governed action boundary',
    detail:
      'Appeal handling, review workflow, and operator actions must run through governed TerraFusion workflows with evidence and audit trace.',
    icon: <GavelIcon color='warning' />,
  },
];

export const PropertyAssessmentDashboard: React.FC = () => {
  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Typography variant='h4' gutterBottom sx={{ mb: 2 }}>
        Property Assessment Dashboard
      </Typography>

      <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
        Legacy assessment surface retained only as an honesty guardrail while governed parcel
        assessment feeds are wired into the active operator workbench.
      </Typography>

      <Alert severity='warning' icon={<CloudOffIcon fontSize='inherit' />} sx={{ mb: 3 }}>
        This page does not have live county parcel counts, live assessment queues, live appeal
        totals, or live AI performance telemetry. Synthetic assessment claims are intentionally
        removed.
      </Alert>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Chip label='Assessment feed unavailable' color='warning' variant='outlined' />
        <Chip label='Charts withheld' color='warning' variant='outlined' />
        <Chip label='Governed workflow required' color='primary' variant='outlined' />
      </Box>

      <Grid container spacing={3} data-testid='property-assessment-dashboard-unavailable'>
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

export default PropertyAssessmentDashboard;
