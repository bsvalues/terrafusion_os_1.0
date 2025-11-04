import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Launch as LaunchIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  status: 'active' | 'inactive' | 'loading' | 'error';
  icon: string;
  launchUrl?: string;
  permissions: string[];
  lastUsed?: Date;
  performance: {
    responseTime: number;
    throughput: number;
    optimization: string;
  };
}

const SAMPLE_MODULES: Module[] = [
  {
    id: 'terra-agent',
    name: 'Terra Agent',
    description: 'AI-powered property assessment agent with quantum processing',
    version: '1.0.0',
    category: 'AI Assistant',
    status: 'active',
    icon: '🤖',
    permissions: ['property.read', 'assessment.write'],
    performance: {
      responseTime: 0.47,
      throughput: 1000000,
      optimization: '379M× faster',
    },
  },
  {
    id: 'terra-flow',
    name: 'Terra Flow',
    description: 'Workflow automation and process management',
    version: '1.2.1',
    category: 'Automation',
    status: 'active',
    icon: '⚡',
    permissions: ['workflow.admin'],
    performance: {
      responseTime: 1.2,
      throughput: 500000,
      optimization: '150M× faster',
    },
  },
  {
    id: 'costforge-ai',
    name: 'CostForge AI',
    description: 'Advanced property valuation with ML algorithms',
    version: '2.0.0',
    category: 'Property Management',
    status: 'active',
    icon: '💰',
    permissions: ['valuation.read', 'valuation.write'],
    performance: {
      responseTime: 0.25,
      throughput: 2000000,
      optimization: '500M× faster',
    },
  },
  {
    id: 'terra-levy',
    name: 'Terra Levy',
    description: 'Tax calculation and levy management system',
    version: '1.1.0',
    category: 'Financial',
    status: 'active',
    icon: '📊',
    permissions: ['tax.calculate', 'levy.manage'],
    performance: {
      responseTime: 0.8,
      throughput: 750000,
      optimization: '200M× faster',
    },
  },
  {
    id: 'gispro',
    name: 'GIS Pro',
    description: 'Geographic Information System with AI enhancement',
    version: '3.0.0',
    category: 'Geographic',
    status: 'active',
    icon: '🗺️',
    permissions: ['gis.view', 'map.edit'],
    performance: {
      responseTime: 1.5,
      throughput: 300000,
      optimization: '100M× faster',
    },
  },
  {
    id: 'web-audit-tracker',
    name: 'Web Audit Tracker',
    description: 'Comprehensive audit and compliance tracking',
    version: '1.0.5',
    category: 'Compliance',
    status: 'active',
    icon: '🔍',
    permissions: ['audit.read', 'compliance.track'],
    performance: {
      responseTime: 0.6,
      throughput: 400000,
      optimization: '80M× faster',
    },
  },
];

export const ModuleLauncher: React.FC = () => {
  const [modules, setModules] = useState<Module[]>(SAMPLE_MODULES);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [launchingModule, setLaunchingModule] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleLaunchModule = async (module: Module) => {
    setLaunchingModule(module.id);

    try {
      // Update module status
      setModules((prev) => prev.map((m) => (m.id === module.id ? { ...m, status: 'loading' } : m)));

      // Simulate API call to launch Tauri module
      const response = await fetch('/api/launch-tauri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: module.id }),
      });

      if (response.ok) {
        // Update last used time
        setModules((prev) =>
          prev.map((m) =>
            m.id === module.id
              ? {
                  ...m,
                  status: 'active',
                  lastUsed: new Date(),
                }
              : m
          )
        );
      } else {
        throw new Error('Failed to launch module');
      }
    } catch (error) {
      console.error('Error launching module:', error);
      setModules((prev) => prev.map((m) => (m.id === module.id ? { ...m, status: 'error' } : m)));
    } finally {
      setLaunchingModule(null);
    }
  };

  const openModuleDetails = (module: Module) => {
    setSelectedModule(module);
    setDetailsOpen(true);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'AI Assistant': '#1976d2',
      Automation: '#9c27b0',
      'Property Management': '#2e7d32',
      Financial: '#ed6c02',
      Geographic: '#0288d1',
      Compliance: '#d32f2f',
    };
    return colors[category] || '#757575';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'loading':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom sx={{ mb: 3 }}>
        Terrafusion Module Launcher
      </Typography>

      <Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
        Launch and manage your government AI modules with quantum-grade performance
      </Typography>

      <Grid container spacing={3}>
        {modules.map((module) => (
          <Grid item xs={12} sm={6} md={4} key={module.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: getCategoryColor(module.category) }}>
                    {module.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant='h6' component='div'>
                      {module.name}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      v{module.version}
                    </Typography>
                  </Box>

                  <Chip
                    label={module.status}
                    color={getStatusColor(module.status) as any}
                    size='small'
                  />
                </Box>

                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                  {module.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={module.category}
                    size='small'
                    sx={{
                      bgcolor: getCategoryColor(module.category),
                      color: 'white',
                      mr: 1,
                      mb: 1,
                    }}
                  />

                  <Chip
                    icon={<SpeedIcon />}
                    label={module.performance.optimization}
                    size='small'
                    variant='outlined'
                    sx={{ mb: 1 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {module.permissions.slice(0, 2).map((permission) => (
                    <Chip
                      key={permission}
                      label={permission}
                      size='small'
                      variant='outlined'
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))}
                  {module.permissions.length > 2 && (
                    <Chip
                      label={`+${module.permissions.length - 2} more`}
                      size='small'
                      variant='outlined'
                      sx={{ fontSize: '0.7rem' }}
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                  <Button
                    variant='contained'
                    startIcon={
                      launchingModule === module.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <LaunchIcon />
                      )
                    }
                    onClick={() => handleLaunchModule(module)}
                    disabled={launchingModule === module.id || module.status === 'error'}
                    sx={{ flexGrow: 1 }}
                  >
                    {launchingModule === module.id ? 'Launching...' : 'Launch'}
                  </Button>

                  <Tooltip title='Module Details'>
                    <Button
                      variant='outlined'
                      onClick={() => openModuleDetails(module)}
                      sx={{ minWidth: 'auto', p: 1 }}
                    >
                      <InfoIcon />
                    </Button>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Module Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: getCategoryColor(selectedModule?.category || '') }}>
            {selectedModule?.icon}
          </Avatar>
          <Box>
            <Typography variant='h6'>{selectedModule?.name}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Version {selectedModule?.version} • {selectedModule?.category}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography paragraph>{selectedModule?.description}</Typography>

          <Typography variant='h6' gutterBottom sx={{ mt: 3 }}>
            Performance Metrics
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Card variant='outlined'>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant='h4' color='primary'>
                    {selectedModule?.performance.responseTime}ms
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Response Time
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card variant='outlined'>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant='h4' color='primary'>
                    {selectedModule?.performance.throughput.toLocaleString()}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Requests/sec
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card variant='outlined'>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant='h4' color='primary'>
                    {selectedModule?.performance.optimization}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Optimization
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant='h6' gutterBottom>
            Required Permissions
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {selectedModule?.permissions.map((permission) => (
              <Chip
                key={permission}
                label={permission}
                icon={<SecurityIcon />}
                variant='outlined'
              />
            ))}
          </Box>

          {selectedModule?.lastUsed && (
            <Alert severity='info' sx={{ mt: 2 }}>
              Last used: {selectedModule.lastUsed.toLocaleString()}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button
            variant='contained'
            startIcon={<LaunchIcon />}
            onClick={() => {
              if (selectedModule) {
                handleLaunchModule(selectedModule);
              }
              setDetailsOpen(false);
            }}
          >
            Launch Module
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
