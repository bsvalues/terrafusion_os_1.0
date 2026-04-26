import React from 'react';
import { Alert, Box, Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  CloudOff as CloudOffIcon,
  Rule as RuleIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';

const UNAVAILABLE_SECTIONS = [
  {
    title: 'Experiment registry unavailable',
    detail:
      'This legacy surface has no governed experiment catalog, no variant ownership model, and no operator-approved rollout source.',
    icon: <ScienceIcon color='warning' />,
  },
  {
    title: 'Analytics feed unavailable',
    detail:
      'Engagement metrics, conversion metrics, and county-specific outcome summaries are not shown because no signed analytics feed is attached.',
    icon: <AnalyticsIcon color='warning' />,
  },
  {
    title: 'Execution boundary',
    detail:
      'Variant switching, CTA execution, and rollout actions are blocked until they can produce governed evidence and rollback paths.',
    icon: <RuleIcon color='warning' />,
  },
];

const ABTestingFramework: React.FC = () => {
  return (
    <Box sx={{ p: 4 }} data-testid='ab-testing-framework-unavailable'>
      <Typography variant='h4' gutterBottom sx={{ mb: 2 }}>
        Experiment Framework Guardrail
      </Typography>

      <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
        This legacy experimentation surface is preserved only to prevent seeded county persuasion
        metrics and fabricated A/B outcomes from appearing as production truth.
      </Typography>

      <Alert severity='warning' icon={<CloudOffIcon fontSize='inherit' />} sx={{ mb: 3 }}>
        No governed experiment registry or analytics pipeline is connected. County-specific
        uplift, savings, efficiency, and testimonial claims are intentionally removed.
      </Alert>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Chip label='Experiment registry unavailable' color='warning' variant='outlined' />
        <Chip label='Metrics withheld' color='warning' variant='outlined' />
        <Chip label='Governed rollout required' color='primary' variant='outlined' />
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

export default ABTestingFramework;
