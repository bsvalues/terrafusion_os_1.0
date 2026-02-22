import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  Settings,
  Notifications,
  AccountCircle,
  Apps,
  Memory,
  Speed,
  Security,
} from '@mui/icons-material';

import { useSystemHealth } from '../hooks/useSystemHealth';
import { useModules } from '../hooks/useModules';

import { ModuleLauncher } from './ModuleLauncher';
import { SystemTray } from './SystemTray';
import { WindowManager } from './WindowManager';

export const DesktopShell: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const { systemHealth } = useSystemHealth();
  const { modules, loadModule } = useModules();

  const handleModuleLaunch = async (moduleId: string) => {
    setActiveModule(moduleId);
    await loadModule(moduleId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        background: 'linear-gradient(135deg, var(--tf-network-blue) 0%, var(--tf-transcend-highlight) 50%, var(--tf-accent-success) 100%)', // Terrafusion Championship Gradient
        overflow: 'hidden',
      }}
    >
      {/* System Bar */}
      <AppBar
        position='static'
        sx={{
          background: 'hsla(var(--tf-neutral-hs) 8% / 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid hsla(var(--tf-cyan-hs) 50% / 0.2)',
        }}
      >
        <Toolbar>
          <IconButton color='inherit' onClick={() => setDrawerOpen(true)}>
            <Apps />
          </IconButton>

          <Avatar
            sx={{
              mr: 2,
              background: 'linear-gradient(135deg, var(--tf-network-blue), var(--tf-transcend-highlight))', // Terrafusion gradient
              color: 'var(--tf-bg-surface)',
              fontWeight: 'bold',
              boxShadow: '0 0 20px hsla(var(--tf-cyan-hs) 50% / 0.4)',
            }}
          >
            TF
          </Avatar>
          <Typography
            variant='h6'
            component='div'
            sx={{
              flexGrow: 1,
              background: 'linear-gradient(135deg, var(--tf-network-blue), var(--tf-transcend-highlight))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 600,
            }}
          >
            Terrafusion OS 1.0 • Government. Transcended.
          </Typography>

          {/* System Health Indicators */}
          <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
            <Chip
              icon={<Memory />}
              label={`${systemHealth.memory}MB`}
              size='small'
              color={getStatusColor(systemHealth.memoryStatus)}
            />

            <Chip
              icon={<Speed />}
              label={`${systemHealth.cpu}%`}
              size='small'
              color={getStatusColor(systemHealth.cpuStatus)}
            />
          </Box>

          <IconButton color='inherit'>
            <Badge badgeContent={systemHealth.notifications} color='error'>
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton color='inherit' onClick={() => setDrawerOpen(true)}>
            <Settings />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Desktop Area */}
      <Box
        sx={{
          height: 'calc(100vh - 64px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Desktop Background with Module Grid */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            p: 3,
          }}
        >
          <Grid container spacing={3}>
            {/* Welcome Card */}
            <Grid item xs={12} md={8}>
              <Card
                className='tf-card'
                sx={{
                  background: 'hsla(var(--tf-neutral-hs) 8% / 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid hsla(var(--tf-cyan-hs) 50% / 0.3)',
                  boxShadow: '0 20px 40px hsla(var(--tf-neutral-hs) 7% / 0.8), 0 0 60px hsla(var(--tf-cyan-hs) 50% / 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: 'var(--tf-transcend-highlight)',
                    boxShadow:
                      '0 25px 50px hsla(var(--tf-cyan-hs) 50% / 0.15), 0 0 80px hsla(var(--tf-cyan-hs) 50% / 0.4)',
                  },
                }}
              >
                <CardContent>
                  <Typography
                    variant='h4'
                    gutterBottom
                    sx={{
                      background: 'linear-gradient(135deg, var(--tf-network-blue), var(--tf-transcend-highlight))', // Terrafusion gradient text
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 600,
                    }}
                  >
                    Government AI Operating System
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{
                      color: 'hsla(var(--tf-neutral-hs) 100% / 0.9)',
                      fontWeight: 500,
                    }}
                  >
                    1,008 AI Agents • 379M× Performance • Quantum Computing • Government.
                    Transcended.
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Chip label='Benton County' color='primary' size='small' />
                    <Chip label='Cowlitz County' color='primary' size='small' />
                    <Chip label='Yakima County' color='primary' size='small' />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* System Status */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  background: 'hsla(var(--tf-neutral-hs) 100% / 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid hsla(var(--tf-neutral-hs) 100% / 0.2)',
                }}
              >
                <CardContent>
                  <Typography variant='h6' gutterBottom sx={{ color: 'white' }}>
                    System Status
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Chip
                      icon={<Apps />}
                      label={`${modules.filter((m) => m.status === 'active').length} Active Modules`}
                      color='success'
                      size='small'
                    />
                    <Chip
                      icon={<Security />}
                      label='All Systems Secure'
                      color='success'
                      size='small'
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Module Launcher */}
          <ModuleLauncher modules={modules} onModuleLaunch={handleModuleLaunch} />
        </Box>

        {/* Window Manager for Active Modules */}
        <WindowManager activeModule={activeModule} onClose={() => setActiveModule(null)} />
      </Box>

      {/* System Tray */}
      <SystemTray />

      {/* Settings Drawer */}
      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            background: 'hsla(var(--tf-neutral-hs) 0% / 0.9)',
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        <List>
          <ListItem>
            <ListItemIcon>
              <Dashboard sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary='System Dashboard' primaryTypographyProps={{ color: 'white' }} />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Apps sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary='Module Manager' primaryTypographyProps={{ color: 'white' }} />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AccountCircle sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary='User Settings' primaryTypographyProps={{ color: 'white' }} />
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
};
