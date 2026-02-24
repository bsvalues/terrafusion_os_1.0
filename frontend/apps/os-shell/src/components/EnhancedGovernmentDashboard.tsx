import React, { useState } from 'react';
import {
  Grid,
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Security,
  Analytics,
  Notifications,
  AccountCircle,
  Memory,
  Speed,
  CloudQueue,
  Group,
} from '@mui/icons-material';

const EnhancedGovernmentDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'analytics' | 'security'>('overview');

  const renderSystemOverview = () => (
    <Grid container spacing={3}>
      {/* System Status Cards */}
      <Grid item xs={12} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, hsl(var(--tf-info) / 0.1) 0%, hsl(var(--tf-success) / 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid hsl(var(--tf-info) / 0.2)',
          }}
        >
          <CardContent>
            <Box display='flex' alignItems='center' gap={2}>
              <Memory color='primary' />
              <Box>
                <Typography variant='h6' color='primary'>
                  39
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  Active Modules
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, hsl(var(--tf-success) / 0.1) 0%, hsl(var(--tf-warning) / 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid hsl(var(--tf-success) / 0.2)',
          }}
        >
          <CardContent>
            <Box display='flex' alignItems='center' gap={2}>
              <Group color='secondary' />
              <Box>
                <Typography variant='h6' color='secondary'>
                  1,008
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  AI Agents
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, hsl(var(--tf-warning) / 0.1) 0%, hsl(var(--tf-error) / 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid hsl(var(--tf-warning) / 0.2)',
          }}
        >
          <CardContent>
            <Box display='flex' alignItems='center' gap={2}>
              <Speed color='warning' />
              <Box>
                <Typography variant='h6' color='warning.main'>
                  97.2%
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  Performance
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card
          sx={{
            background:
              'linear-gradient(135deg, hsl(var(--tf-success) / 0.1) 0%, hsl(var(--tf-success) / 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid hsl(var(--tf-success) / 0.2)',
          }}
        >
          <CardContent>
            <Box display='flex' alignItems='center' gap={2}>
              <CloudQueue color='success' />
              <Box>
                <Typography variant='h6' color='success.main'>
                  Operational
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  System Status
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Government Services Dashboard */}
      <Grid item xs={12}>
        <Card
          sx={{
            background:
              'linear-gradient(135deg, hsl(var(--tf-text) / 0.05) 0%, hsl(var(--tf-info) / 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid hsl(var(--tf-text) / 0.1)',
            minHeight: '400px',
          }}
        >
          <CardContent>
            <Typography
              variant='h5'
              gutterBottom
              sx={{ color: 'primary.main', fontWeight: 'bold' }}
            >
              🏛️ Government Services Command Center
            </Typography>
            <Typography variant='body1' color='textSecondary' paragraph>
              Real-time monitoring and management of all government services across departments.
            </Typography>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Typography variant='h6' color='primary'>
                  📊 Department Analytics
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  • Tax Collection: 98.7% efficiency
                  <br />
                  • Public Safety: 45 active units
                  <br />
                  • Infrastructure: 12 projects monitored
                  <br />• Social Services: 1,247 active cases
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='h6' color='secondary'>
                  🔒 Security & Compliance
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  • Security Alerts: 0 critical
                  <br />
                  • Compliance Score: 99.2%
                  <br />
                  • Data Protection: Active
                  <br />• Audit Status: Current
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAnalytics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card
          sx={{
            background:
              'linear-gradient(135deg, hsl(var(--tf-accent-2) / 0.1) 0%, hsl(var(--tf-accent) / 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid hsl(var(--tf-accent-2) / 0.2)',
            minHeight: '500px',
          }}
        >
          <CardContent>
            <Typography
              variant='h5'
              gutterBottom
              sx={{ color: 'primary.main', fontWeight: 'bold' }}
            >
              🧠 AI Analytics Command Center
            </Typography>
            <Typography variant='body1' color='textSecondary' paragraph>
              Advanced analytics powered by 1,008 AI agents providing real-time insights.
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Typography variant='h6' color='primary'>
                  🎯 Predictive Insights
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  • Budget Optimization: $2.3M savings identified
                  <br />
                  • Service Demand: 18% increase predicted
                  <br />
                  • Resource Allocation: 94% optimized
                  <br />• Citizen Satisfaction: 97.8% projected
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant='h6' color='secondary'>
                  ⚡ Real-time Processing
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  • Data Throughput: 15.7GB/s
                  <br />
                  • API Requests: 847,291 today
                  <br />
                  • Response Time: 12ms average
                  <br />• Uptime: 99.97%
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant='h6' color='warning.main'>
                  🚀 Performance Metrics
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  • Neural Network Efficiency: 98.1%
                  <br />
                  • Quantum Coherence: 97.2%
                  <br />
                  • AI Agent Coordination: 99.4%
                  <br />• System Load: 34% capacity
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'analytics':
        return renderAnalytics();
      case 'overview':
      default:
        return renderSystemOverview();
    }
  };

  return (
    <Container maxWidth={false} sx={{ height: '100vh', p: 0 }}>
      {/* Enhanced Government Header */}
      <AppBar
        position='static'
        sx={{
          background: 'linear-gradient(135deg, hsl(var(--tf-info) / 0.95) 0%, hsl(var(--tf-success) / 0.95) 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar>
          <Typography variant='h6' component='div' sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            🚀 Terrafusion OS - Government. Transcended. • Benton County, Washington
          </Typography>

          {/* Navigation Pills */}
          <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
            <IconButton
              color={currentView === 'overview' ? 'secondary' : 'inherit'}
              onClick={() => setCurrentView('overview')}
              title='System Overview'
            >
              <DashboardIcon />
            </IconButton>
            <IconButton
              color={currentView === 'analytics' ? 'secondary' : 'inherit'}
              onClick={() => setCurrentView('analytics')}
              title='AI Analytics'
            >
              <Analytics />
            </IconButton>
            <IconButton
              color={currentView === 'security' ? 'secondary' : 'inherit'}
              onClick={() => setCurrentView('security')}
              title='Security Dashboard'
            >
              <Security />
            </IconButton>
          </Box>

          {/* Status Indicators */}
          <IconButton color='inherit'>
            <Badge badgeContent={0} color='success'>
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton color='inherit'>
            <AccountCircle />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Enhanced Government Content */}
      <Box
        sx={{
          flexGrow: 1,
          background: 'linear-gradient(135deg, hsl(var(--tf-bg) / 0.95) 0%, hsl(var(--tf-bg) / 0.95) 100%)',
          minHeight: 'calc(100vh - 64px)',
          p: 3,
          color: 'white',
        }}
      >
        {renderCurrentView()}
      </Box>
    </Container>
  );
};

export default EnhancedGovernmentDashboard;
