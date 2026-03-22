/**
 * 📊 Terrafusion OS 1.0 - Monitoring Page
 * Real-time monitoring and control interface for the AI Swarm
 */

import React from 'react';
import { Container, Typography, Grid, Paper, Box } from '@mui/material';
import AISwarmDashboard from '../components/dashboard/AISwarmDashboard';

const Monitoring: React.FC = () => {
  return (
    <Container maxWidth='xl' sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant='h3' component='h1' gutterBottom>
          🤖 Terrafusion AI Swarm Workspace Monitor
        </Typography>
        <Typography variant='h6' color='text.secondary'>
          Workspace simulation of swarm telemetry and control patterns, not live county agent telemetry
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
