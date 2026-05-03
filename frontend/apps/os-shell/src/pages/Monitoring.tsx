/**
 * Monitoring route guardrail.
 * This page remains mounted so legacy links do not imply live swarm telemetry.
 */

import React from 'react';
import { Alert, Container, Typography, Grid, Paper, Box } from '@mui/material';
import AISwarmDashboard from '../components/dashboard/AISwarmDashboard';

const Monitoring: React.FC = () => {
  return (
    <Container maxWidth='xl' sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }} data-testid='monitoring-governed-unavailable'>
        <Typography variant='h3' component='h1' gutterBottom>
          AI Swarm Telemetry Guardrail
        </Typography>
        <Typography variant='h6' color='text.secondary'>
          No governed county agent telemetry feed is attached to this route.
        </Typography>
        <Alert severity='warning' sx={{ mt: 2 }}>
          This legacy monitoring page is retained only as a guardrail. It does not display live
          county agent counts, live task throughput, or live health telemetry.
        </Alert>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant='subtitle1' color='text.secondary'>
          Governed telemetry unavailable
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, minHeight: '80vh' }}>
            <AISwarmDashboard />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Monitoring;
